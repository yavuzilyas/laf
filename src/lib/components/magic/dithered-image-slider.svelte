<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { cn } from "$lib/utils";
	import DitheredImage from "$lib/motion-core/dithered-image/DitheredImage.svelte";
	import { getCurrentTheme } from "$lib/utils/theme";

	interface DitheredImageSliderProps {
		images: string[];
		class?: string;
		interval?: number;
		size?: number;
	}

	let { images, class: className }: DitheredImageSliderProps = $props();

	let currentIndex = $state(0);
	let theme = $state<"light" | "dark">("light");
	let intervalId: ReturnType<typeof setInterval> | null = null;

	// Mobil pan
	let isMobile = $state(false);
	const MOBILE_INTERVAL = 20000; // 20 saniye
	const DESKTOP_INTERVAL = 4000; // 6 saniye
	let interval = $derived(isMobile ? MOBILE_INTERVAL : DESKTOP_INTERVAL);
	let panProgress = $state(0); // 0 (en sol) → 1 (en sağ)
	let animFrameId: number | null = null;
	let panStartTime: number | null = null;

	// Her resmin aspect ratio'su: src → w/h
	let aspectRatios = $state<Record<string, number>>({});

	/** Fisher-Yates shuffle algoritması ile array karıştır */
	const shuffleArray = <T>(array: T[]): T[] => {
		const shuffled = [...array];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled;
	};

	// Karıştırılmış resimler
	let shuffledImages = $state<string[]>([]);

	// images değiştiğinde karıştır
	$effect(() => {
		shuffledImages = shuffleArray(images);
	});

	const updateTheme = () => {
		theme = getCurrentTheme();
	};

	const checkMobile = () => {
		isMobile = window.innerWidth < 640;
	};

	/** Tüm resimlerin boyutlarını arka planda önceden yükle */
	const preloadAspectRatios = () => {
		for (const src of shuffledImages) {
			if (aspectRatios[src]) continue;
			const img = new Image();
			img.onload = () => {
				aspectRatios = { ...aspectRatios, [src]: img.naturalWidth / img.naturalHeight };
			};
			img.src = src;
		}
	};

	/** Pan animasyonunu en soldan başlat */
	const startPan = () => {
		panProgress = 0;
		panStartTime = null;
		if (animFrameId) cancelAnimationFrame(animFrameId);

		const animate = (timestamp: number) => {
			if (panStartTime === null) panStartTime = timestamp;
			panProgress = Math.min((timestamp - panStartTime) / interval, 1);
			if (panProgress < 1) animFrameId = requestAnimationFrame(animate);
		};

		animFrameId = requestAnimationFrame(animate);
	};

	const nextImage = () => {
		currentIndex = (currentIndex + 1) % shuffledImages.length;
		if (isMobile) startPan();
	};

	onMount(() => {
		updateTheme();
		checkMobile();
		preloadAspectRatios();

		window.addEventListener("resize", checkMobile);

		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		mediaQuery.addEventListener("change", updateTheme);

		const observer = new MutationObserver(updateTheme);
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"],
		});

		if (isMobile) startPan();

		return () => {
			mediaQuery.removeEventListener("change", updateTheme);
			observer.disconnect();
			window.removeEventListener("resize", checkMobile);
		};
	});

	onDestroy(() => {
		if (intervalId) clearInterval(intervalId);
		if (animFrameId) cancelAnimationFrame(animFrameId);
	});
$effect(() => {
		if (intervalId) clearInterval(intervalId);
		intervalId = setInterval(nextImage, interval);
	});
	const color = "#ffffff";
	const backgroundColor = "#111113";

	// Mevcut resmin aspect ratio'su (yüklenene kadar 16/9 fallback)
	const currentAspect = $derived(aspectRatios[shuffledImages[currentIndex]] ?? 16 / 9);

	/**
	 * Pan style:
	 *   imgWidth  = 100vh × aspect
	 *   translateX = -panProgress × max(0px, imgWidth - 100vw)
	 *   panProgress=0 → en sol, panProgress=1 → en sağ
	 */
	const panStyle = $derived(
		isMobile
			? [
					`width: calc(100vh * ${currentAspect})`,
					`transform: translateX(calc(-1 * ${panProgress} * max(0px, 100vh * ${currentAspect} - 100vw)))`,
					`will-change: transform`,
				].join("; ")
			: ""
	);
</script>

<div
	class={cn(
		"relative flex items-center w-full h-full justify-start overflow-hidden",
		className
	)}
>
	{#if shuffledImages.length > 0}
		{#if isMobile}
			<div class="h-full flex-shrink-0" style={panStyle}>
				<DitheredImage
					src={shuffledImages[currentIndex]}
					{color}
					{backgroundColor}
					ditherMap="bayer8x8"
					pixelSize={2}
					threshold={0.05}
				/>
			</div>
		{:else}
			<div class="w-full h-full">
				<DitheredImage
					src={shuffledImages[currentIndex]}
					{color}
					{backgroundColor}
					ditherMap="bayer8x8"
					pixelSize={2}
					threshold={0.05}
				/>
			</div>
		{/if}
	{/if}
</div>