<script lang="ts">
	import GalleryVerticalEndIcon from "@lucide/svelte/icons/gallery-vertical-end";
	import AuthForm from "$lib/components/AuthForm.svelte";
	import logo from "$lib/assets/laf1.svg";
  import { i18n, t, getCurrentLocale } from '$lib/stores/i18n.svelte.js';
  import Loader from '$lib/components/load.svelte';

  const siteUrl = 'https://laf.international';
  const currentLocale = getCurrentLocale() || 'tr';
  const seoTitle = $derived(`${t('seo.register.title')} | LAF`);
  const seoDescription = $derived(t('seo.register.description') || 'LAF\'a üye olun ve liberteryen anarşist topluluğumuza katılın.');
  const canonicalUrl = $derived(typeof window !== 'undefined' ? window.location.href : `${siteUrl}/${currentLocale}/register`);
</script>

<Loader />
<svelte:head>
  <title>{seoTitle}</title>
  <meta name="description" content={seoDescription} />
  <meta name="keywords" content={t('seo.register.keywords') || 'kayıt, üye ol, hesap oluştur'} />
  <meta name="robots" content="noindex, nofollow" />
  <link rel="canonical" href={canonicalUrl} />

  <!-- Open Graph -->
  <meta property="og:title" content={seoTitle} />
  <meta property="og:description" content={seoDescription} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:site_name" content={t('seo.siteName') || 'LAF'} />
  <meta property="og:image" content={`${siteUrl}/lafpp.png`} />

  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:site" content="@lafoundation" />
  <meta name="twitter:title" content={seoTitle} />
  <meta name="twitter:description" content={seoDescription} />
</svelte:head>

<div class="max-h-screen max-w-screen md:w-auto md:h-auto text-xs grid  ">
	<div class="flex flex-col gap-4 p-6 md:p-10">
		<div class="flex text-secondary-foreground justify-center gap-2 md:justify-start">
			<a href="/" class="flex text-base items-center gap-2 font-bold">
				<div
					class="bg-secondary text-primary-foreground flex p-1 items-center justify-center rounded-md"
				>
					<img src="{logo}" alt="LAF" class="h-11 w-11" />
					
				</div>
								Liberteryen Anarşist Faaliyet

			</a>
		</div>
		<div class="flex flex-1 items-start justify-center">
			<div class="w-full max-w-[22rem]">
				<AuthForm mode="register" />
			</div>
		</div>
	</div>
</div>
