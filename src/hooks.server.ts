import { start_pg, query } from '$db/pg';
import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

start_pg().then(() : void => { } ).catch( (err) : void => { } );

// Supported locales
const localeModules = import.meta.glob('/src/lib/locales/*.json');
const SUPPORTED_LOCALES = Object.keys(localeModules).map(path => {
	const match = path.match(/\/([^/]+)\.json$/);
	return match ? match[1] : '';
}).filter(Boolean);

// Fallback just in case
if (SUPPORTED_LOCALES.length === 0) {
	SUPPORTED_LOCALES.push('tr', 'en');
}

const DEFAULT_LOCALE = 'tr';

function getLocaleFromRequest(event: any): string {
	const request = event.request;
	const url = new URL(request.url);
	const pathLocale = url.pathname.split('/')[1];
	
	// 1. Check URL path first (/tr/ or /en/)
	if (SUPPORTED_LOCALES.includes(pathLocale)) {
		return pathLocale;
	}
	
	// 2. Check cookie
	const cookie = request.headers.get('cookie');
	if (cookie) {
		const localeMatch = cookie.match(/locale=([^;]+)/);
		if (localeMatch) {
			const cookieLocale = localeMatch[1];
			if (SUPPORTED_LOCALES.includes(cookieLocale)) {
				return cookieLocale;
			}
		}
	}
	
	// 3. Check Accept-Language header
	const acceptLanguage = request.headers.get('accept-language');
	if (acceptLanguage) {
		const preferred = acceptLanguage
			.split(',')
			.map(lang => lang.split(';')[0].trim().toLowerCase().slice(0, 2));
		
		for (const lang of preferred) {
			if (SUPPORTED_LOCALES.includes(lang)) {
				return lang;
			}
		}
	}
	
	// 4. Default
	return DEFAULT_LOCALE;
}

export const handle: Handle = async ({ event, resolve }) => {
	const url = new URL(event.request.url);

	// Redirect www to non-www with 301 (SEO best practice)
	if (url.hostname.startsWith('www.')) {
		const newUrl = new URL(url);
		newUrl.hostname = url.hostname.replace(/^www\./, '');
		throw redirect(301, newUrl.toString());
	}

	// Check if URL has lang prefix
	const pathParts = url.pathname.split('/').filter(Boolean);
	const firstSegment = pathParts[0];
	
	// Skip API routes, static files, and uploads
	const isApiRoute = url.pathname.startsWith('/api/');
	const isStaticFile = url.pathname.includes('.') && !url.pathname.endsWith('.html');
	const isUploadRoute = url.pathname.startsWith('/uploads/');
	
	// If no lang prefix and not API/static, redirect to locale-prefixed URL
	// Skip POST requests (login/register form submissions)
	const isPostRequest = event.request.method === 'POST';
	if (!isApiRoute && !isStaticFile && !isUploadRoute && !isPostRequest && firstSegment && !SUPPORTED_LOCALES.includes(firstSegment)) {
		const locale = getLocaleFromRequest(event);
		const newUrl = `/${locale}${url.pathname}${url.search}`;
		throw redirect(302, newUrl);
	}
	
	// Set locale in locals for this request
	event.locals.locale = getLocaleFromRequest(event);
	
	const session = event.cookies.get("session");

  if (session) {
    try {
      const users = await query('SELECT * FROM users WHERE id = $1', [session]);
      const user = users.rows[0];
      if (user) {
        if (user.is_banned) {
          event.cookies.delete('session', { path: '/' });
          return new Response('Hesabınız banlandı', { status: 403 });
        }
        event.locals.user = {
          id: user.id,
          email: user.email,
          username: user.username,
          nickname: user.nickname ?? user.username,
          avatar: user.avatar_url ?? null,
          role: user.role ?? 'user'
        } as any;
      }
    } catch (err) {
    }
  }

  return resolve(event, {
    bodySizeLimit: 4 * 1024 * 1024, // 4MB
    transformPageChunk: ({ html }) => {
      const locale = event.locals.locale || DEFAULT_LOCALE;
      const rtlLocales = ['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'yi'];
      const dir = rtlLocales.includes(locale) ? 'rtl' : 'ltr';
      return html
        .replace(/%lang%/g, locale)
        .replace(/%dir%/g, dir);
    }
  });
};
