// src/routes/api/upload/+server.ts
import { json } from '@sveltejs/kit';
import { writeFile, mkdir, rm } from 'fs/promises';
import { extname, resolve } from 'path';
import { slugify } from '$lib/utils/slugify';

export async function POST({ request, locals }) {
  const user = (locals as any)?.user;
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  const form = await request.formData();
  const file = form.get('file') as File | null;
  const folder = (form.get('folder') as string) || 'image';
  const articleIdRaw = form.get('articleId') as string | null;
  const uploadType = (form.get('type') as string | null) || undefined;
  const previousUrl = (form.get('previousUrl') as string | null) || undefined;

  if (!file) return json({ error: 'No file' }, { status: 400 });

  // Validate type (image, audio or video) and size (<= 4MB)
  const type = (file as any)?.type as string | undefined;
  const allowedPrefixes = ['image/', 'audio/', 'video/'];
  if (!type || !allowedPrefixes.some((prefix) => type.startsWith(prefix))) {
    return json({ error: 'Only image, audio or video uploads are allowed' }, { status: 400 });
  }

  // In environments where File.size is available, enforce 4MB here as well
  const maxBytes = 4 * 1024 * 1024; // 4MB
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
  const safeArticleId = articleIdRaw ? articleIdRaw.replace(/[^a-zA-Z0-9-_]/g, '') : null;

  const baseUploadsDir = resolve('static', 'uploads');
  let dir: string;
  let publicBase: string;

  if (safeArticleId) {
    const section = (() => {
      if (uploadType) {
        switch (uploadType) {
          case 'thumbnail':
            return 'thumbnail';
          case 'sounds':
            return 'sounds';
          case 'videos':
            return 'videos';
          case 'files':
            return 'files';
          case 'photos':
          default:
            return 'photos';
        }
      }

      if (type.startsWith('audio/')) return 'sounds';
      if (type.startsWith('video/')) return 'videos';
      return 'photos';
    })();
    const articleBaseDir = resolve(baseUploadsDir, 'articles', safeArticleId);
    await Promise.all([
      mkdir(resolve(articleBaseDir, 'thumbnail'), { recursive: true }),
      mkdir(resolve(articleBaseDir, 'sounds'), { recursive: true }),
      mkdir(resolve(articleBaseDir, 'photos'), { recursive: true }),
      mkdir(resolve(articleBaseDir, 'videos'), { recursive: true }),
      mkdir(resolve(articleBaseDir, 'files'), { recursive: true })
    ]);
    dir = resolve(articleBaseDir, section);
    publicBase = `/uploads/articles/${safeArticleId}/${section}`;
  } else {
    const rawNickname = typeof user.nickname === 'string' && user.nickname.trim().length
      ? user.nickname
      : (user.id?.toString?.() ?? 'user');
    const safeUserId = slugify(rawNickname) || 'user';
    const safeFolder = folder.replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase() || 'misc';
    dir = resolve(baseUploadsDir, 'users', safeUserId, safeFolder);
    publicBase = `/uploads/users/${safeUserId}/${safeFolder}`;
  }

  await mkdir(dir, { recursive: true });
  const filePath = resolve(dir, fileName);
  await writeFile(filePath, buffer);

  // Public URL under /uploads/
  const url = `${publicBase}/${fileName}`;

  if (previousUrl && previousUrl !== url) {
    try {
      const normalizedPrevious = previousUrl.startsWith('/') ? previousUrl : `/${previousUrl}`;
      const previousFsPath = resolve('static', normalizedPrevious.replace(/^\//, ''));
      if (previousFsPath.startsWith(baseUploadsDir)) {
        await rm(previousFsPath, { force: true });
      }
    } catch (error) {
      console.error('Failed to remove previous upload', error);
    }
  }

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
    const baseUploadsDir = resolve('static', 'uploads');
    const normalized = url.replace(/^\//, '');
    const fsPath = resolve('static', normalized);
    // Only allow deletion within static/uploads
    if (!fsPath.startsWith(baseUploadsDir)) {
      return json({ error: 'Forbidden' }, { status: 403 });
    }
    await rm(fsPath, { force: true });
    return json({ ok: true });
  } catch (e) {
    return json({ error: 'Bad Request' }, { status: 400 });
  }
}
