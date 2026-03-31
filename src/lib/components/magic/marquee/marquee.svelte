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
		...rest
	}: MarqueeProps = $props();
</script>

<div
	{...rest}
	class={cn(
		"marquee-container flex gap-(--gap) overflow-hidden p-2 [--duration:40s] [--gap:1rem]",
		{
			"flex-row": !vertical,
			"flex-col": vertical,
		},
		className
	)}
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
