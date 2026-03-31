<script lang="ts">
	import { motion, useMotionTemplate, useMotionValue } from "motion-sv";
	import { cn } from "$lib/utils";
	import { theme } from "$lib/stores/theme";
	import type { Snippet } from "svelte";

	interface MagicCardProps {
		/** Card content */
		children?: Snippet;
		/** Additional CSS classes */
		class?: string;
		/** Size of the gradient circle */
		gradientSize?: number;
		/** Color of the gradient overlay */
		gradientColor?: string;
		/** Opacity of the gradient overlay */
		gradientOpacity?: number;
		/** Starting color of the border gradient */
		gradientFrom?: string;
		/** Ending color of the border gradient */
		gradientTo?: string;
	}

	let {
		children,
		class: className,
		gradientSize = 200,
		gradientColor = "#392E15",
		gradientOpacity = 0.8,
		gradientFrom = "#926A0E",
		gradientTo = "#eab308",
	}: MagicCardProps = $props();

	let mouseX = $derived(useMotionValue(-gradientSize));
	let mouseY = $derived(useMotionValue(-gradientSize));

	let borderGradient = $derived(
		useMotionTemplate`radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, ${gradientFrom}, ${gradientTo}, var(--border) 100%)`
	);
	let overlayGradient = $derived(
		useMotionTemplate`radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, ${gradientColor}, transparent 100%)`
	);

	const reset = () => {
		mouseX.set(-gradientSize);
		mouseY.set(-gradientSize);
	};

	const handlePointerMove = (e: PointerEvent) => {
		const target = e.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		mouseX.set(e.clientX - rect.left);
		mouseY.set(e.clientY - rect.top);
	};

	// Reset on mount
	$effect(() => {
		reset();
	});

	// Global event listeners
	$effect(() => {
		const handleGlobalPointerOut = (e: PointerEvent) => {
			if (!e.relatedTarget) {
				reset();
			}
		};

		const handleVisibility = () => {
			if (document.visibilityState !== "visible") {
				reset();
			}
		};

		window.addEventListener("pointerout", handleGlobalPointerOut);
		window.addEventListener("blur", reset);
		document.addEventListener("visibilitychange", handleVisibility);

		return () => {
			window.removeEventListener("pointerout", handleGlobalPointerOut);
			window.removeEventListener("blur", reset);
			document.removeEventListener("visibilitychange", handleVisibility);
		};
	});
</script>

<div
	class={cn("group relative rounded-[inherit]", className)}
	onpointermove={$theme === 'dark' ? handlePointerMove : undefined}
	onpointerleave={$theme === 'dark' ? reset : undefined}
	onpointerenter={$theme === 'dark' ? reset : undefined}
	role="region"
>
	{#if $theme === 'dark'}
		<motion.div
			class="bg-border pointer-events-none absolute inset-0 rounded-[inherit] duration-300 group-hover:opacity-100"
			style={{ background: borderGradient }}
		/>
		<div class="bg-background absolute inset-px rounded-[inherit]"></div>
		<motion.div
			class="pointer-events-none absolute inset-px rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
			style={{ background: overlayGradient, opacity: gradientOpacity }}
		/>
	{:else}
		<div class="bg-border absolute inset-0 rounded-[inherit]"></div>
		<div class="bg-background absolute inset-px rounded-[inherit]"></div>
	{/if}
	<div class="relative">
		{#if children}
			{@render children()}
		{/if}
	</div>
</div>
