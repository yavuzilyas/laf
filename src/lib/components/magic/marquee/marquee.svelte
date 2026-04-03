<script lang="ts">
	import { cn } from "$lib/utils";
	import type { Snippet } from "svelte";

	interface MarqueeProps {
		children: Snippet;
		class?: string;
		reverse?: boolean;
		pauseOnHover?: boolean;
		vertical?: boolean;
		repeat?: number;
		[key: string]: any;
	}

	let {
		children,
		class: className = "",
		reverse = false,
		pauseOnHover = false,
		vertical = false,
		repeat = 4,
		duration = 40,
		...rest
	}: MarqueeProps & { duration?: number } = $props();
</script>

<div
	{...rest}
	class={cn(
		"marquee-container flex gap-(--gap) overflow-hidden p-2 [--gap:1rem]",
		className
	)}
	style="--duration: {duration}s"
>
	{#each Array(repeat).fill(0) as _, i (i)}
		<div
			class={cn("marquee-content flex shrink-0 justify-around gap-(--gap)", {
				"animate-marquee flex-row": !vertical,
				"animate-marquee-vertical flex-col": vertical,
			})}
			style:animation-direction={reverse ? "reverse" : "normal"}
		>
			{@render children?.()}
		</div>
	{/each}
</div>

<style>
	.marquee-container:hover .marquee-content {
		animation-play-state: paused;
	}
</style>
