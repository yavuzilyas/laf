import { browser } from '$app/environment';

export interface SEOProps {
	title: string;
	description: string;
	canonical?: string;
	image?: string;
	imageAlt?: string;
	author?: string;
	publishedAt?: string;
	modifiedAt?: string;
	tags?: string[];
	type?: 'website' | 'article' | 'profile';
	noIndex?: boolean;
	noFollow?: boolean;
}

/**
 * Generate full SEO meta tags for any page
 */
export function generateSEOMeta(props: SEOProps) {
	const siteName = 'LAF - Liberteryen Anarşist Faaliyet';
	const siteUrl = 'https://laf.international'; // Production URL
	const defaultImage = '/lafpp.png'; // Fallback OG image
	const siteSuffix = ' - LAF';

	const url = props.canonical || (browser ? window.location.href : '');
	const ogImage = props.image || `${siteUrl}${defaultImage}`;

	// If title already includes site name, don't add it again
	const hasSiteName = props.title.toLowerCase().includes('laf');
	const finalTitle = hasSiteName ? props.title : `${props.title}${siteSuffix}`;

	return {
		// Basic Meta
		title: finalTitle,
		description: props.description,
		canonical: url,

		// Open Graph
		og: {
			title: props.title,
			description: props.description,
			type: props.type || 'website',
			url: url,
			site_name: siteName,
			image: ogImage,
			image_alt: props.imageAlt || props.title,
			...(props.publishedAt && { article_published_time: props.publishedAt }),
			...(props.modifiedAt && { article_modified_time: props.modifiedAt }),
			...(props.author && { article_author: props.author }),
			...(props.tags && { article_tag: props.tags.join(', ') })
		},

		// Twitter Cards
		twitter: {
			card: 'summary_large_image',
			site: '@lafoundation',
			title: props.title,
			description: props.description,
			image: ogImage,
			image_alt: props.imageAlt || props.title
		},

		// Robots
		robots: props.noIndex ? 'noindex, nofollow' : props.noFollow ? 'index, nofollow' : 'index, follow',

		// Structured Data
		structuredData: generateStructuredData(props, siteUrl, siteName)
	};
}

/**
 * Generate Schema.org JSON-LD structured data
 */
function generateStructuredData(props: SEOProps, siteUrl: string, siteName: string) {
	const baseSchema = {
		'@context': 'https://schema.org',
		'@type': props.type === 'article' ? 'Article' : props.type === 'profile' ? 'ProfilePage' : 'WebPage',
		name: props.title,
		description: props.description,
		url: props.canonical || `${siteUrl}${browser ? window.location.pathname : ''}`,
		...(props.image && { image: props.image })
	};

	if (props.type === 'article') {
		return {
			...baseSchema,
			headline: props.title,
			author: {
				'@type': 'Person',
				name: props.author || 'LAF'
			},
			publisher: {
				'@type': 'Organization',
				name: siteName,
				logo: {
					'@type': 'ImageObject',
					url: `${siteUrl}/logo.png`
				}
			},
			...(props.publishedAt && { datePublished: props.publishedAt }),
			...(props.modifiedAt && { dateModified: props.modifiedAt }),
			...(props.tags && { keywords: props.tags.join(', ') })
		};
	}

	if (props.type === 'profile' && props.author) {
		return {
			...baseSchema,
			'@type': 'ProfilePage',
			mainEntity: {
				'@type': 'Person',
				name: props.author,
				...(props.image && { image: props.image }),
				description: props.description
			}
		};
	}

	// Default WebPage schema
	return {
		...baseSchema,
		isPartOf: {
			'@type': 'WebSite',
			name: siteName,
			url: siteUrl
		}
	};
}

/**
 * Clean description for meta tags (truncate and sanitize)
 */
export function cleanDescription(text: string, maxLength: number = 160): string {
	if (!text) return '';

	// Remove HTML tags
	const clean = text.replace(/<[^>]*>/g, ' ');

	// Normalize whitespace
	const normalized = clean.replace(/\s+/g, ' ').trim();

	// Truncate
	if (normalized.length <= maxLength) return normalized;

	// Smart truncate at word boundary
	const truncated = normalized.substring(0, maxLength);
	const lastSpace = truncated.lastIndexOf(' ');

	if (lastSpace > maxLength * 0.8) {
		return truncated.substring(0, lastSpace) + '...';
	}

	return truncated + '...';
}

/**
 * Generate breadcrumbs structured data
 */
export function generateBreadcrumbs(items: { name: string; url: string }[]) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.name,
			item: item.url
		}))
	};
}

/**
 * Get page-specific SEO content
 */
export function getPageSEO(page: 'home' | 'articles' | 'profile' | 'article' | 'events' | 'help' | 'login' | 'register' | 'forgot' | 'links' | 'write' | 'qa' | 'moderation') {
	const seoContent: Record<string, { title: string; description: string; keywords?: string; noindex?: boolean }> = {
		home: {
			title: 'Liberteryen Anarşist Faaliyet',
			description: 'Anarşist, liberteryen eylem ve entelektüel bilgi paylaşım platformu. Özgürlük, bireysel haklar ve anarko-kapitalizm üzerine makaleler ve analizler.',
			keywords: 'anarşizm, liberteryen, özgürlük, bireysel haklar'
		},
		articles: {
			title: 'Makaleler',
			description: 'Liberter anarşizm, özgürlük ve bireysel haklar üzerine makalelerimizi keşfedin. Felsefe, iktisat, devlet teorisi ve daha fazlası.',
			keywords: 'makaleler, anarşizm, liberteryen, felsefe, iktisat'
		},
		article: {
			title: 'Makale',
			description: 'LAF platformunda yayınlanan makaleyi okuyun.',
			keywords: 'makale, anarşizm, liberteryen, özgürlük'
		},
		profile: {
			title: 'Profil',
			description: 'LAF kullanıcı profili ve makaleleri.',
			keywords: 'profil, kullanıcı, yazar'
		},
		events: {
			title: 'Faaliyetler ve Duyurular',
			description: 'LAF etkinlikleri, seminerleri ve duyuruları. Türkiye haritasından şehirleri seçerek yaklaşan ve geçmiş etkinlikleri görüntüleyin.',
			keywords: 'etkinlik, seminer, duyuru, anarşist etkinlikler, liberteryen buluşma'
		},
		help: {
			title: 'Yardım Merkezi',
			description: 'LAF platformu kullanımı hakkında sıkça sorulan sorular ve yardım dokümanları.',
			keywords: 'yardım, sıkça sorulan sorular, nasıl kullanılır, rehber'
		},
		login: {
			title: 'Giriş Yap',
			description: 'LAF hesabınıza giriş yapın. Bireysel hakları savunan liberteryen anarşist topluluğumuza katılın.',
			keywords: 'giriş, üye girişi, hesap erişimi',
			noindex: true
		},
		register: {
			title: 'Kayıt Ol',
			description: "LAF'a üye olun ve liberteryen anarşist topluluğumuza katılın. Bireysel özgürlükleri savunan bağımsız platformumuzda yerinizi alın.",
			keywords: 'kayıt, üye ol, hesap oluştur',
			noindex: true
		},
		forgot: {
			title: 'Şifremi Unuttum',
			description: 'LAF hesap şifrenizi sıfırlayın. Mnemonic kelimelerinizle güvenli şekilde şifre yenileyin.',
			keywords: 'şifre sıfırlama, hesap kurtarma',
			noindex: true
		},
		links: {
			title: 'Bağlantılar',
			description: 'LAF sosyal medya hesapları ve iletişim bağlantıları. Telegram, Discord ve diğer platformlarda bizi takip edin.',
			keywords: 'sosyal medya, telegram, discord, iletişim'
		},
		write: {
			title: 'Makale Yaz',
			description: 'LAF platformunda makale yazın ve yayınlayın. Özgürlük, anarşizm ve liberteryenizm hakkında düşüncelerinizi paylaşın.',
			keywords: 'makale yaz, içerik oluştur, blog yaz',
			noindex: true
		},
		qa: {
			title: 'Soru & Cevap',
			description: 'LAF Soru & Cevap platformunda anarşizm, liberteryenizm ve özgürlük hakkında sorular sorun, moderatörlerimizden cevap alın.',
			keywords: 'soru cevap, anarşizm soruları, liberteryenizm, özgürlük'
		},
		moderation: {
			title: 'Moderasyon Paneli',
			description: 'LAF platformu moderasyon yönetim paneli.',
			keywords: 'moderasyon, içerik yönetimi, admin',
			noindex: true
		}
	};

	return seoContent[page];
}
