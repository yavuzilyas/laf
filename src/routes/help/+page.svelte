<script lang="ts">
	import Navbar from "$lib/Navbar.svelte";
	import Footer from "$lib/Footer.svelte";
	import * as Card from '$lib/components/ui/card';
	import * as Accordion from '$lib/components/ui/accordion';
	import { FileText, Send } from '@lucide/svelte';
	import ContactForm from '$lib/components/ContactForm.svelte';
	import { t } from '$lib/stores/i18n.svelte.js';

	const faqItems = $derived([
		{
			question: t('help.faq.createAccount.question'),
			answer: t('help.faq.createAccount.answer')
		},
		{
			question: t('help.faq.forgotPassword.question'),
			answer: t('help.faq.forgotPassword.answer')
		},
		{
			question: t('help.faq.editProfile.question'),
			answer: t('help.faq.editProfile.answer')
		},
		{
			question: t('help.faq.twoFactor.question'),
			answer: t('help.faq.twoFactor.answer')
		},
		{
			question: t('help.faq.createContent.question'),
			answer: t('help.faq.createContent.answer')
		},
		{
			question: t('help.faq.collaborate.question'),
			answer: t('help.faq.collaborate.answer')
		}
	]);
</script>

<svelte:head>
	<title>{t('help.title')}</title>
	<meta name="description" content={t('help.description')} />
</svelte:head>

<Navbar />

<div class="container mx-auto px-4 py-8 max-w-6xl pt-24">
	<!-- FAQ Accordion -->
	<section class="mb-12">
		<h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
			<FileText class="w-6 h-6" />
			{t('help.faqTitle')}
		</h2>
		<Card.Root>
			<Card.Content class="p-6">
				<Accordion.Root class="w-full" type="single" collapsible>
					{#each faqItems as item, index}
						<Accordion.Item value={`item-${index}`}>
							<Accordion.Trigger class="text-left hover:no-underline">
								<span class="font-medium">{item.question}</span>
							</Accordion.Trigger>
							<Accordion.Content class="text-muted-foreground">
								{item.answer}
							</Accordion.Content>
						</Accordion.Item>
					{/each}
				</Accordion.Root>
			</Card.Content>
		</Card.Root>
	</section>

	<!-- Contact Form -->
	<section class="mb-12">
		<h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
			<Send class="w-6 h-6" />
			{t('help.contactTitle')}
		</h2>
		<ContactForm />
	</section>
</div>

<Footer />