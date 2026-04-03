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
	const siteName = 'LAF - Libertarian Anarchist Foundation';
	const siteUrl = 'https://laf.international'; // Production URL
	const defaultImage = '/og-default.png'; // Fallback OG image

	const url = props.canonical || (browser ? window.location.href : '');
	const ogImage = props.image || `${siteUrl}${defaultImage}`;

	return {
		// Basic Meta
		title: `${props.title} | ${siteName}`,
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
export function getPageSEO(page: 'home' | 'articles' | 'profile' | 'article') {
	const seoContent: Record<string, { title: string; description: string }> = {
		home: {
			title: 'Liberteryen Anarşist Faaliyet',
			description: 'Anarşist, liberteryen eylem ve entelektüel bilgi paylaşım platformu. Özgürlük, bireysel haklar ve anarko-kapitalizm üzerine makaleler ve analizler.'
		},
		articles: {
			title: 'Makaleler',
			description: 'Liberter anarşizm, özgürlük ve bireysel haklar üzerine makalelerimizi keşfedin. Felsefe, iktisat, devlet teorisi ve daha fazlası.'
		},
		article: {
			title: 'Makale',
			description: 'LAF platformunda yayınlanan makaleyi okuyun.'
		},
		profile: {
			title: 'Profil',
			description: 'LAF kullanıcı profili ve makaleleri.'
		}
	};

	return seoContent[page];
}
