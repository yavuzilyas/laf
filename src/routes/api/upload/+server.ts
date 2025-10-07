// src/routes/api/upload/+server.ts
import { json } from '@sveltejs/kit';
import { writeFile, mkdir } from 'fs/promises';
import { extname } from 'path';

export async function POST({ request, locals }) {
  const user = (locals as any)?.user;
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  const form = await request.formData();
  const file = form.get('file') as File | null;
  const folder = (form.get('folder') as string) || 'image';

  if (!file) return json({ error: 'No file' }, { status: 400 });

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const ext = extname(file.name) || '.bin';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const dir = `static/uploads/${folder}`;
  const path = `${dir}/${fileName}`;

  await mkdir(dir, { recursive: true });
  await writeFile(path, buffer);

  // Public URL under /uploads/
  const url = `/uploads/${folder}/${fileName}`;
  return json({ url });
}
