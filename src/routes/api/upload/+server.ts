// src/routes/api/upload/+server.ts
import { json } from '@sveltejs/kit';
import { writeFile, mkdir, rm } from 'fs/promises';
import { extname } from 'path';

export async function POST({ request, locals }) {
  const user = (locals as any)?.user;
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  const form = await request.formData();
  const file = form.get('file') as File | null;
  const folder = (form.get('folder') as string) || 'image';

  if (!file) return json({ error: 'No file' }, { status: 400 });

  // Validate type (image or audio) and size (<= 8MB)
  const type = (file as any)?.type as string | undefined;
  if (!type || !(type.startsWith('image/') || type.startsWith('audio/'))) {
    return json({ error: 'Only image or audio uploads are allowed' }, { status: 400 });
  }

  // In environments where File.size is available, enforce 4MB here as well
  const maxBytes = 8 * 1024 * 1024; // 8MB
  const declaredSize = (file as any)?.size as number | undefined;
  if (typeof declaredSize === 'number' && declaredSize > maxBytes) {
    return json({ error: 'File too large. Max 4MB' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.byteLength > maxBytes) {
    return json({ error: 'File too large. Max 4MB' }, { status: 400 });
  }

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

export async function DELETE({ request, locals }) {
  const user = (locals as any)?.user;
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { url } = await request.json();
    if (typeof url !== 'string' || !url.startsWith('/uploads/')) {
      return json({ error: 'Invalid url' }, { status: 400 });
    }
    // Map public URL to filesystem path under static
    const fsPath = `static${url}`;
    // Only allow deletion within static/uploads
    if (!fsPath.startsWith('static/uploads/')) {
      return json({ error: 'Forbidden' }, { status: 403 });
    }
    await rm(fsPath, { force: true });
    return json({ ok: true });
  } catch (e) {
    return json({ error: 'Bad Request' }, { status: 400 });
  }
}
