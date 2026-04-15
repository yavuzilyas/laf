import type { RequestHandler } from "@sveltejs/kit";
import { getUserByIdentifier, updateUserAuthFields } from "$db/queries";
import pkg from "argon2";
const { verify } = pkg;

// 5 minute expiration for verification tokens
const VERIFICATION_TOKEN_EXPIRY = 5 * 60 * 1000;

// Rate limiting configuration
  // const MAX_ATTEMPTS = 3;
  const MAX_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

function safeCompare(a: string, b: string): boolean {
  const aBuffer = new TextEncoder().encode(a);
  const bBuffer = new TextEncoder().encode(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < aBuffer.length; i++) {
    result |= aBuffer[i] ^ bBuffer[i];
  }
  return result === 0;
}

export const POST: RequestHandler = async ({ request, cookies }) => {
  const { identifier, password, mnemonicPhrase, verificationToken } = await request.json();

  if (!identifier || !password) {
    return new Response(JSON.stringify({ errorKey: "auth.errors.missingFields" }), { status: 400 });
  }

  const user = await getUserByIdentifier(identifier);
  if (!user) {
    return new Response(JSON.stringify({ errorKeys: ["Account", "NotFound"] }), { status: 400 });
  }

  const ok = await verify(user.password_hash, password);
  if (!ok) {
    return new Response(JSON.stringify({ errorKey: "auth.errors.wrongPassword" }), { status: 400 });
  }

  if (!user.mnemonic_hash || typeof user.mnemonic_hash !== 'string') {
    return new Response(JSON.stringify({ errorKey: "auth.errors.mnemonicRequired" }), { status: 400 });
  }

  const now = new Date();

  // DB-backed rate limiting
  const lastAttempt = user.last_mnemonic_attempt ? new Date(user.last_mnemonic_attempt) : null;
  const attemptWindow = lastAttempt ? now.getTime() - lastAttempt.getTime() : RATE_LIMIT_WINDOW + 1;
  
  // Reset attempts if time window has passed
  if ((user.mnemonic_attempts || 0) >= MAX_ATTEMPTS && attemptWindow >= RATE_LIMIT_WINDOW) {
    await updateUserAuthFields(user.id, {
      last_mnemonic_attempt: null,
      mnemonic_attempts: 0
    });
    user.mnemonic_attempts = 0;
  }
  
  if ((user.mnemonic_attempts || 0) >= MAX_ATTEMPTS && attemptWindow < RATE_LIMIT_WINDOW) {
    return new Response(JSON.stringify({
      errorKey: "auth.errors.maxAttemptsReached",
      resetMnemonic: true
    }), { status: 429 });
  }

  // Step 2: verify full mnemonic phrase with token
  if (mnemonicPhrase !== undefined || verificationToken !== undefined) {
    if (!mnemonicPhrase || typeof mnemonicPhrase !== 'string') {
      return new Response(JSON.stringify({ errorKey: "auth.errors.invalidMnemonic" }), { status: 400 });
    }

    if (!verificationToken || typeof verificationToken !== 'string') {
      return new Response(JSON.stringify({ errorKey: "auth.errors.invalidVerificationToken" }), { status: 400 });
    }

    if (!user.verification_token || user.verification_token !== verificationToken) {
      await updateUserAuthFields(user.id, {
        last_mnemonic_attempt: now,
        mnemonic_attempts: (user.mnemonic_attempts || 0) + 1
      });

      const remainingAttempts = Math.max(0, MAX_ATTEMPTS - (user.mnemonic_attempts || 0) - 1);
      return new Response(JSON.stringify({
        errorKey: remainingAttempts > 0 ? "auth.errors.wrongMnemonic" : "auth.errors.maxAttemptsReached",
        requiresMnemonic: remainingAttempts > 0,
        resetMnemonic: remainingAttempts <= 0,
        attemptCount: MAX_ATTEMPTS - remainingAttempts,
        maxAttempts: MAX_ATTEMPTS
      }), { status: 400 });
    }

    if (user.verification_token_expires_at && new Date(user.verification_token_expires_at).getTime() < now.getTime()) {
      await updateUserAuthFields(user.id, {
        verification_token: null,
        verification_token_expires_at: null,
        last_mnemonic_attempt: now,
        mnemonic_attempts: (user.mnemonic_attempts || 0) + 1
      });
      return new Response(JSON.stringify({
        errorKey: "auth.errors.verificationTokenExpired",
        resetMnemonic: true
      }), { status: 400 });
    }

    const normalizedMnemonic = mnemonicPhrase.trim().toLowerCase().split(/\s+/).filter(Boolean).join(' ');
    const words = normalizedMnemonic ? normalizedMnemonic.split(' ') : [];
    if (words.length !== 12) {
      return new Response(JSON.stringify({ errorKey: "auth.errors.invalidMnemonic" }), { status: 400 });
    }

    const isMatch = await verify(user.mnemonic_hash, normalizedMnemonic);
    if (!isMatch) {
      await updateUserAuthFields(user.id, {
        last_mnemonic_attempt: now,
        mnemonic_attempts: (user.mnemonic_attempts || 0) + 1
      });

      const remainingAttempts = Math.max(0, MAX_ATTEMPTS - (user.mnemonic_attempts || 0) - 1);
      return new Response(JSON.stringify({
        errorKey: remainingAttempts > 0 ? "auth.errors.wrongMnemonic" : "auth.errors.maxAttemptsReached",
        requiresMnemonic: remainingAttempts > 0,
        resetMnemonic: remainingAttempts <= 0,
        attemptCount: MAX_ATTEMPTS - remainingAttempts,
        maxAttempts: MAX_ATTEMPTS
      }), { status: 400 });
    }
  } else {
    // Step 1: password correct -> issue challenge token
    const newVerificationToken = crypto.randomUUID();
    const tokenExpiry = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY);

    await updateUserAuthFields(user.id, {
      verification_token: newVerificationToken,
      verification_token_expires_at: tokenExpiry,
      last_mnemonic_attempt: now,
      mnemonic_attempts: (user.mnemonic_attempts || 0) + 1
    });

    return new Response(JSON.stringify({
      success: true,
      requiresMnemonic: true,
      attemptCount: 0,
      maxAttempts: MAX_ATTEMPTS,
      verificationToken: newVerificationToken,
      expiresIn: VERIFICATION_TOKEN_EXPIRY / 1000,
      infoKey: "auth.success.passwordCorrect"
    }), { status: 200 });
  }

  // Tüm doğrulamalar başarılı, giriş yap
  cookies.set("session", user.id, {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    secure: false,
    maxAge: 60 * 60 * 24 * 7
  });

  // reset auth fields on success
  await updateUserAuthFields(user.id, {
    verification_token: null,
    verification_token_expires_at: null,
    last_mnemonic_attempt: null,
    mnemonic_attempts: 0
  });

  return new Response(JSON.stringify({ success: true, successKey: "auth.success.loginSuccess" }));
};