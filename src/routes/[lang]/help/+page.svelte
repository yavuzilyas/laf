<script lang="ts">
	import Navbar from "$lib/Navbar.svelte";
	import Footer from "$lib/Footer.svelte";
	import * as Card from '$lib/components/ui/card';
	import * as Accordion from '$lib/components/ui/accordion';
	import { CircleHelp } from '@lucide/svelte';
	import { t, getCurrentLocale } from '$lib/stores/i18n.svelte.js';

  // SEO
  const siteUrl = 'https://laf.international';
  const currentLocale = getCurrentLocale() || 'tr';
  const seoTitle = $derived(`${t('seo.help.title')} | LAF`);
  const seoDescription = $derived(t('seo.help.description') || t('help.description'));
  const canonicalUrl = $derived(typeof window !== 'undefined' ? window.location.href : `${siteUrl}/${currentLocale}/help`);

	const faqItems = $derived([
		{
			question: t('help.faq.register.question'),
			answer: t('help.faq.register.answer')
		},
		{
			question: t('help.faq.login.question'),
			answer: t('help.faq.login.answer')
		},
		{
			question: t('help.faq.forgotPassword.question'),
			answer: t('help.faq.forgotPassword.answer')
		},
		{
			question: t('help.faq.resetPasswordWhileLoggedIn.question'),
			answer: t('help.faq.resetPasswordWhileLoggedIn.answer')
		},
		{
			question: t('help.faq.lostMnemonic.question'),
			answer: t('help.faq.lostMnemonic.answer')
		},
		{
			question: t('help.faq.compromisedMnemonic.question'),
			answer: t('help.faq.compromisedMnemonic.answer')
		},
		{
			question: t('help.faq.contact.question'),
			answer: t('help.faq.contact.answer')
		},
		{
			question: t('help.faq.platformLinks.question'),
			answer: t('help.faq.platformLinks.answer')
		},
		{
			question: t('help.faq.deleteAccount.question'),
			answer: t('help.faq.deleteAccount.answer')
		},
		{
			question: t('help.faq.accountBanned.question'),
			answer: t('help.faq.accountBanned.answer')
		},
		{
			question: t('help.faq.writeArticle.question'),
			answer: t('help.faq.writeArticle.answer')
		},
		{
			question: t('help.faq.addTranslation.question'),
			answer: t('help.faq.addTranslation.answer')
		},
		{
			question: t('help.faq.donate.question'),
			answer: t('help.faq.donate.answer')
		},
		{
			question: t('help.faq.joinEvents.question'),
			answer: t('help.faq.joinEvents.answer')
		},
		{
			question: t('help.faq.findAnarchists.question'),
			answer: t('help.faq.findAnarchists.answer')
		},
		{
			question: t('help.faq.accessDesigns.question'),
			answer: t('help.faq.accessDesigns.answer')
		}
	]);
</script>

<svelte:head>
	<title>{seoTitle}</title>
	<meta name="description" content={seoDescription} />
	<meta name="keywords" content={t('seo.help.keywords') || 'yardım, sıkça sorulan sorular, nasıl kullanılır, rehber'} />
	<link rel="canonical" href={canonicalUrl} />

	<!-- Open Graph -->
	<meta property="og:title" content={seoTitle} />
	<meta property="og:description" content={seoDescription} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:site_name" content={t('seo.siteName') || 'LAF'} />
	<meta property="og:image" content={`${siteUrl}/og-help.png`} />

	<!-- Twitter Cards -->
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:site" content="@lafoundation" />
	<meta name="twitter:title" content={seoTitle} />
	<meta name="twitter:description" content={seoDescription} />

	<!-- Structured Data for FAQ -->
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		name: seoTitle,
		description: seoDescription,
		url: canonicalUrl,
		mainEntity: faqItems.map(item => ({
			'@type': 'Question',
			name: item.question,
			acceptedAnswer: {
				'@type': 'Answer',
				text: item.answer.replace(/<[^>]*>/g, ' ')
			}
		}))
	})}</script>`}
</svelte:head>

<Navbar />

<div class="container  mx-auto px-4 py-8 max-w-xl pt-16">
	<!-- FAQ Accordion -->
	<section class="mb-12">
		<h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
			<CircleHelp class="text-primary w-6 h-6" />
			{t('help.faqTitle')}
		</h2>
		<Card.Root class="bg-background">
			<Card.Content >
				<Accordion.Root class="w-full" type="single" collapsible>
					{#each faqItems as item, index}
						<Accordion.Item value={`item-${index}`}>
							<Accordion.Trigger class="text-left hover:no-underline">
								<span class="font-medium">{item.question}</span>
							</Accordion.Trigger>
							<Accordion.Content class="text-muted-foreground">
								{@html item.answer}
							</Accordion.Content>
						</Accordion.Item>
					{/each}
				</Accordion.Root>
			</Card.Content>
		</Card.Root>
	</section>
</div>

<Footer />