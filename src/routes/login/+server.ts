import type { RequestHandler } from "@sveltejs/kit";
import { getUsersCollection } from "$db/mongo";
import bcrypt from "bcrypt";

export const POST: RequestHandler = async ({ request, cookies }) => {
  const { identifier, password, mnemonicIndex, mnemonicAnswer, attemptCount = 0 } = await request.json();

  if (!identifier || !password) {
    return new Response(JSON.stringify({ errorKey: "auth.errors.missingFields" }), { status: 400 });
  }

  const users = await getUsersCollection();
  const user = await users.findOne({ $or: [{ email: identifier }, { nickname: identifier }] });
  if (!user) {
    return new Response(JSON.stringify({ errorKeys: ["Account", "NotFound"] }), { status: 400 });
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return new Response(JSON.stringify({ errorKey: "auth.errors.wrongPassword" }), { status: 400 });
  }

  // İki adımlı doğrulama - mnemonic kontrolü
  if (mnemonicIndex !== undefined && mnemonicAnswer !== undefined) {
    if (mnemonicIndex < 0 || mnemonicIndex >= user.mnemonicHashes.length) {
      return new Response(JSON.stringify({ errorKey: "auth.errors.invalidMnemonicIndex" }), { status: 400 });
    }

    // Girdiği kelimenin hash'ini hesapla
    const encoder = new TextEncoder();
    const inputBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(mnemonicAnswer.trim().toLowerCase()));
    const inputHashArray = Array.from(new Uint8Array(inputBuffer));
    const inputHashHex = inputHashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    // Hash'leri karşılaştır
    if (inputHashHex !== user.mnemonicHashes[mnemonicIndex]) {
      const remainingAttempts = 2 - attemptCount;
      
      if (remainingAttempts > 0) {
        return new Response(JSON.stringify({ 
          errorKey: "auth.errors.wrongMnemonic",
          requiresMnemonic: true,
          mnemonicIndex: mnemonicIndex,
          attemptCount: attemptCount + 1
        }), { status: 400 });
      } else {
        return new Response(JSON.stringify({ 
          errorKey: "auth.errors.maxAttemptsReached",
          resetMnemonic: true
        }), { status: 400 });
      }
    }
  } else {
    // İlk adım başarılı, mnemonic index döndür
    const randomIndex = Math.floor(Math.random() * user.mnemonicHashes.length);
    return new Response(JSON.stringify({ 
      success: true, 
      requiresMnemonic: true, 
      mnemonicIndex: randomIndex,
      attemptCount: 0,
      infoKey: "auth.success.passwordCorrect"
    }), { status: 200 });
  }

  // Tüm doğrulamalar başarılı, giriş yap
  cookies.set("session", user._id.toString(), {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    secure: false,
    maxAge: 60 * 60 * 24 * 7
  });

  return new Response(JSON.stringify({ success: true, successKey: "auth.success.loginSuccess" }));
};