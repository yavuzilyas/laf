import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createContactMessage } from '$db/queries';

// In-memory rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_HOUR = 5;

interface ContactFormData {
  name: string;
  subject: string;
  message: string;
  honeypot?: string;
}

// Rate limiting function
function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new entry
    rateLimitStore.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return { allowed: true, remaining: MAX_REQUESTS_PER_HOUR - 1 };
  }

  if (userLimit.count >= MAX_REQUESTS_PER_HOUR) {
    return { allowed: false, remaining: 0 };
  }

  userLimit.count++;
  return { allowed: true, remaining: MAX_REQUESTS_PER_HOUR - userLimit.count };
}

export const POST: RequestHandler = async ({ request, locals, getClientAddress }) => {
  const user = (locals as any)?.user;

  // Check authentication
  if (!user) {
    return json({ error: 'Bu işlem için giriş yapmalısınız' }, { status: 401 });
  }

  try {
    const data: ContactFormData = await request.json();
    const { name, subject, message, honeypot } = data;

    // Honeypot check - if filled, it's likely a bot
    if (honeypot && honeypot.trim() !== '') {
      // Silently reject but return success to not alert bots
      return json({ 
        success: true, 
        message: 'Mesajınız alındı' 
      });
    }

    // Validate required fields
    if (!name?.trim() || !subject?.trim() || !message?.trim()) {
      return json({ error: 'Lütfen tüm alanları doldurun' }, { status: 400 });
    }

    // Validate field lengths
    if (name.trim().length > 100) {
      return json({ error: 'İsim çok uzun (max 100 karakter)' }, { status: 400 });
    }

    if (message.trim().length > 2000) {
      return json({ error: 'Mesaj çok uzun (max 2000 karakter)' }, { status: 400 });
    }

    // Validate subject is one of allowed values
    const allowedSubjects = ['general', 'feedback', 'collaboration', 'report', 'other'];
    if (!allowedSubjects.includes(subject)) {
      return json({ error: 'Geçersiz konu' }, { status: 400 });
    }

    // Rate limiting check
    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      return json({ 
        error: 'Çok fazla mesaj gönderdiniz. Lütfen 1 saat sonra tekrar deneyin.' 
      }, { status: 429 });
    }

    // Save to database
    const contactMessage = await createContactMessage({
      userId: user.id,
      name: name.trim(),
      subject,
      message: message.trim(),
      ipAddress: getClientAddress(),
      userAgent: request.headers.get('user-agent') || undefined,
      honeypot
    });

    return json({ 
      success: true, 
      message: 'Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.',
      remaining: rateLimit.remaining,
      contactMessage
    });

  } catch (error) {
    return json({ error: 'Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin.' }, { status: 500 });
  }
};

// Get user's contact message history
export const GET: RequestHandler = async ({ locals }) => {
  const user = (locals as any)?.user;

  if (!user) {
    return json({ error: 'Giriş yapmalısınız' }, { status: 401 });
  }

  try {
    // For now, return empty array
    return json({
      messages: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      }
    });

  } catch (error) {
    return json({ error: 'Mesaj geçmişi yüklenemedi' }, { status: 500 });
  }
};
