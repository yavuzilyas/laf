import type { RequestHandler } from '@sveltejs/kit';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const UPLOAD_BASE_DIR = env.UPLOAD_DIR || '/app/uploads';
    const path = params.path as string;
    // Security: prevent directory traversal
    if (path.includes('..') || path.startsWith('/')) {
      return new Response('Forbidden', { status: 403 });
    }
    
    const filePath = resolve(UPLOAD_BASE_DIR, path);
    const baseDir = resolve(UPLOAD_BASE_DIR);
    
    // Ensure the requested file is within the uploads directory
    if (!filePath.startsWith(baseDir)) {
      return new Response('Forbidden', { status: 403 });
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
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    return new Response('Not Found', { status: 404 });
  }
};