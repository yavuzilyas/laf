import type { RequestHandler } from '@sveltejs/kit';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { env } from '$env/dynamic/private';
import { randomUUID } from 'crypto';

// Rate limiting: max 30 requests per minute per token
const downloadAttempts = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_ATTEMPTS = 12;
const TOKEN_COOKIE_NAME = 'download_token';

function isRateLimited(token: string): boolean {
	const now = Date.now();
	const attempts = downloadAttempts.get(token) || [];

	// Clean old attempts outside the window
	const validAttempts = attempts.filter(time => now - time < RATE_LIMIT_WINDOW_MS);

	if (validAttempts.length >= RATE_LIMIT_MAX_ATTEMPTS) {
		downloadAttempts.set(token, validAttempts);
		return true;
	}

	validAttempts.push(now);
	downloadAttempts.set(token, validAttempts);
	return false;
}

function getCookieHeader(token: string, isNew: boolean): Record<string, string> {
	if (!isNew) return {};
	const cookieValue = `${TOKEN_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;
	return { 'Set-Cookie': cookieValue };
}

export const GET: RequestHandler = async ({ params, cookies }) => {
	// Get or create download token
	let token = cookies.get(TOKEN_COOKIE_NAME);
	let isNewToken = false;
	if (!token) {
		token = randomUUID();
		isNewToken = true;
	}

	// Rate limit check
	if (isRateLimited(token)) {
		return new Response('Too many requests. Please try again later.', {
			status: 429,
			headers: getCookieHeader(token, isNewToken)
		});
	}
  try {
    const UPLOAD_BASE_DIR = env.UPLOAD_DIR || '/app/uploads';
    const path = params.path as string;
    // Security: prevent directory traversal
    if (path.includes('..') || path.startsWith('/')) {
      return new Response('Forbidden', {
        status: 403,
        headers: getCookieHeader(token, isNewToken)
      });
    }
    
    const filePath = resolve(UPLOAD_BASE_DIR, path);
    const baseDir = resolve(UPLOAD_BASE_DIR);
    
    // Ensure the requested file is within the uploads directory
    if (!filePath.startsWith(baseDir)) {
      return new Response('Forbidden', {
        status: 403,
        headers: getCookieHeader(token, isNewToken)
      });
    }
    
    const file = await readFile(filePath);
    
    // Determine content type based on extension
    const ext = path.split('.').pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'webp': 'image/webp',
      'gif': 'image/gif',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'pdf': 'application/pdf'
    };
    
    const contentType = contentTypes[ext || ''] || 'application/octet-stream';
    
    return new Response(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        ...getCookieHeader(token, isNewToken)
      }
    });
  } catch (error) {
    return new Response('Not Found', {
      status: 404,
      headers: getCookieHeader(token, isNewToken)
    });
  }
};