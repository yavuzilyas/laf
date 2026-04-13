import type { RequestHandler } from "@sveltejs/kit";
import { getUserByIdentifier, createUser } from "$db/queries";
import pkg from "argon2";
const { verify, hash } = pkg;

export const POST: RequestHandler = async ({ request }) => {
    const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });

  // OPTIONS isteği için
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ errorKey: "auth.errors.invalidRequest" }), { status: 400 });
  }

  const nickname = typeof body?.nickname === 'string' ? body.nickname.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const name = typeof body?.name === 'string' ? body.name.trim() : null;
  const surname = typeof body?.surname === 'string' ? body.surname.trim() : null;
  const email = typeof body?.email === 'string' ? body.email.trim() : null;
  const phoneNumber = typeof body?.phoneNumber === 'string' ? body.phoneNumber.trim() : null;
  const location = typeof body?.location === 'string' ? body.location.trim() : null;
  const mnemonicPhrase = typeof body?.mnemonicPhrase === 'string' ? body.mnemonicPhrase : (typeof body?.mnemonic === 'string' ? body.mnemonic : '');
  const validateOnly = Boolean(body?.validateOnly);

  if (!nickname || !password) {
    return new Response(JSON.stringify({ errorKey: "auth.errors.usernameRequired" }), { status: 400 });
  }

  // Check for nickname conflict
  const existingNickname = await getUserByIdentifier(nickname);
  if (existingNickname && existingNickname.username === nickname) {
    return new Response(JSON.stringify({ errorKey: "auth.errors.usernameExists" }), { status: 400 });
  }

  // Check for email conflict (only if email is provided)
  if (email) {
    const existingEmail = await getUserByIdentifier(email);
    if (existingEmail && existingEmail.email === email) {
      return new Response(JSON.stringify({ errorKey: "auth.errors.emailExists" }), { status: 400 });
    }
  }

  // If this is just validation, return success
  if (validateOnly) {
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }

  const normalizedMnemonic = (mnemonicPhrase || '').trim().toLowerCase().split(/\s+/).filter(Boolean).join(' ');
  const words = normalizedMnemonic ? normalizedMnemonic.split(' ') : [];
  if (words.length !== 12) {
    return new Response(JSON.stringify({ errorKey: "auth.errors.mnemonicRequired" }), { status: 400 });
  }

  const mnemonicHash = await hash(normalizedMnemonic, {
    type: 2, // argon2id
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
    hashLength: 32,
  });

  const hashedPassword = await hash(password, {
    type: 2, // argon2id
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
    hashLength: 32,
  });

  await createUser({ 
    username: nickname, 
    email,
    name,
    surname,
    password_hash: hashedPassword, 
    mnemonic_hash: mnemonicHash,
    phone_number: phoneNumber,
    location,
    matrix_username: typeof body?.matrix_username === 'string' ? body.matrix_username.trim() : null,
    preferences: {
      phoneNumberVisible: false, // Phone hidden by default
      emailVisible: false // Email hidden by default
    }
  });

  return new Response(JSON.stringify({ success: true, successKey: "auth.success.registerSuccess" }), { status: 201 });
};