import type { RequestHandler } from "@sveltejs/kit";
import { getUsersCollection } from "$db/mongo";
import bcrypt from "bcrypt";

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
  const { nickname, password, name, surname, email, mnemonicHashes, validateOnly } = await request.json();

  if (!nickname || !password) {
    return new Response(JSON.stringify({ error: "Kullanıcı adı ve şifre gerekli" }), { status: 400 });
  }

  const users = await getUsersCollection();

  // Check for nickname conflict
  const existingNickname = await users.findOne({ nickname });
  if (existingNickname) {
    return new Response(JSON.stringify({ error: "Bu kullanıcı adı zaten kayıtlı" }), { status: 400 });
  }

  // Check for email conflict (only if email is provided)
  if (email) {
    const existingEmail = await users.findOne({ email });
    if (existingEmail) {
      return new Response(JSON.stringify({ error: "Bu e-posta adresi zaten kayıtlı" }), { status: 400 });
    }
  }

  // If this is just validation, return success
  if (validateOnly) {
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await users.insertOne({ 
    nickname, 
    email: email || null, 
    name: name || null,
    surname: surname || null,
    password: hashedPassword, 
    mnemonicHashes, // Hashlenmiş mnemonic'i kaydet
    createdAt: new Date() 
  });

  return new Response(JSON.stringify({ success: true }), { status: 201 });
};