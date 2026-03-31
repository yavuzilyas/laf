<script lang="ts">
	import { motion, useScroll } from "motion-sv";
	import { cn } from "$lib/utils";

	interface ScrollProgressProps {
		class?: string;
	}

	let { class: className }: ScrollProgressProps = $props();

	let scroll = $derived(useScroll());
</script>

<motion.div
	class={cn(
		"fixed inset-x-0 top-8 sm:top-5.5 z-50 h-[1px] origin-top-left bg-linear-to-r from-transparent via-yellow/33 to-yellow-400",
		className
	)}
	style={{
		scaleX: scroll.scrollYProgress,
	}}
/>
