// src/routes/api/upload/+server.ts
import { json } from '@sveltejs/kit';
import { writeFile, mkdir, rm } from 'fs/promises';
import { extname, resolve } from 'path';
import { slugify } from '$lib/utils/slugify';
import { env } from '$env/dynamic/private';

// Get upload directory from environment variable or fallback to static/uploads
const UPLOAD_BASE_DIR = env.UPLOAD_DIR || 'uploads';
const PUBLIC_BASE_PATH = '/uploads';

// Simple rate limiting: max 10 uploads per 5 minutes per user
const uploadAttempts = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 10;

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const attempts = uploadAttempts.get(userId) || [];
  
  // Clean old attempts outside the window
  const validAttempts = attempts.filter(time => now - time < RATE_LIMIT_WINDOW_MS);
  
  if (validAttempts.length >= RATE_LIMIT_MAX_ATTEMPTS) {
    uploadAttempts.set(userId, validAttempts);
    return true;
  }
  
  validAttempts.push(now);
  uploadAttempts.set(userId, validAttempts);
  return false;
}

export async function POST({ request, locals }) {
  const user = (locals as any)?.user;
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  // Rate limit check
  const userId = user.id?.toString();
  if (!userId) return json({ error: 'Invalid user' }, { status: 400 });
  
  if (isRateLimited(userId)) {
    return json({ error: 'Too many uploads. Please wait a few minutes.' }, { status: 429 });
  }

  const form = await request.formData();
  const file = form.get('file') as File | null;
  const folder = (form.get('folder') as string) || 'image';
  const articleIdRaw = form.get('articleId') as string | null;
  const commentIdRaw = form.get('commentId') as string | null;
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
  const maxBytes = 8 * 1024 * 1024; // 4MB
  const declaredSize = (file as any)?.size as number | undefined;
  if (typeof declaredSize === 'number' && declaredSize > maxBytes) {
    return json({ error: 'File too large. Max 8MB' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.byteLength > maxBytes) {
    return json({ error: 'File too large. Max 8MB' }, { status: 400 });
  }

  const ext = extname(file.name) || '.bin';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const safeArticleId = articleIdRaw ? articleIdRaw.replace(/[^a-zA-Z0-9-_]/g, '') : null;
  const safeCommentId = commentIdRaw ? commentIdRaw.replace(/[^a-zA-Z0-9-_]/g, '') : null;

  const rawNickname = typeof user.nickname === 'string' && user.nickname.trim().length
    ? user.nickname
    : (user.id?.toString?.() ?? 'user');
  const safeUserId = slugify(rawNickname) || 'user';

  const baseUploadsDir = resolve(UPLOAD_BASE_DIR);
  let dir: string;
  let publicBase: string;

  if (safeArticleId) {
    // Article uploads go to user's article folder: /uploads/users/{userId}/articles/{articleId}/{type}/
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
    const articleBaseDir = resolve(baseUploadsDir, 'users', safeUserId, 'articles', safeArticleId);
    // Only create the folder for the actual file type being uploaded
    dir = resolve(articleBaseDir, section);
    publicBase = `/uploads/users/${safeUserId}/articles/${safeArticleId}/${section}`;
  } else if (safeCommentId) {
    // Comment uploads go to user's comment folder: /uploads/users/{userId}/comments/{commentId}/{type}/
    const section = (() => {
      if (type.startsWith('audio/')) return 'sounds';
      if (type.startsWith('video/')) return 'videos';
      return 'photos';
    })();
    dir = resolve(baseUploadsDir, 'users', safeUserId, 'comments', safeCommentId, section);
    publicBase = `/uploads/users/${safeUserId}/comments/${safeCommentId}/${section}`;
  } else {
    // Generic uploads (e.g., comments) go to user's comments folder: /uploads/users/{userId}/comments/{type}/
    // Profile avatars and banners go to dedicated folders: /uploads/users/{userId}/avatars/ or /uploads/users/{userId}/banners/
    const isProfileUpload = folder === 'avatars' || folder === 'banners';
    
    if (isProfileUpload) {
      // Profile uploads: avatars or banners
      dir = resolve(baseUploadsDir, 'users', safeUserId, folder);
      publicBase = `/uploads/users/${safeUserId}/${folder}`;
    } else {
      const section = (() => {
        if (type.startsWith('audio/')) return 'sounds';
        if (type.startsWith('video/')) return 'videos';
        return 'photos';
      })();
      dir = resolve(baseUploadsDir, 'users', safeUserId, 'comments', section);
      publicBase = `/uploads/users/${safeUserId}/comments/${section}`;
    }
  }

  await mkdir(dir, { recursive: true });
  const filePath = resolve(dir, fileName);
  await writeFile(filePath, buffer);

  // Public URL under /uploads/
  const url = `${publicBase}/${fileName}`;

  if (previousUrl && previousUrl !== url) {
    try {
      const normalizedPrevious = previousUrl.startsWith('/') ? previousUrl : `/${previousUrl}`;
      const previousFsPath = resolve(UPLOAD_BASE_DIR, normalizedPrevious.replace(/^\//, '').replace(/^uploads\//, ''));
      if (previousFsPath.startsWith(resolve(UPLOAD_BASE_DIR))) {
        await rm(previousFsPath, { force: true });
      }
    } catch (error) {
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
    // Map public URL to filesystem path under UPLOAD_BASE_DIR
    const baseUploadsDir = resolve(UPLOAD_BASE_DIR);
    const normalized = url.replace(/^\//, '').replace(/^uploads\//, '');
    const fsPath = resolve(UPLOAD_BASE_DIR, normalized);
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
