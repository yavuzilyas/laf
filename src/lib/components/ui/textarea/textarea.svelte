<script lang="ts">
	import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils.js";
	import type { HTMLTextareaAttributes } from "svelte/elements";
	import { playSound } from "$lib/stores/sound";

	function handlePopClick(e: MouseEvent) {
		playSound("pop");
	}

	function handleInput(event: Event) {
		const textarea = event.target as HTMLTextAreaElement;

		let currentValue = textarea.value;

		// Karakter limiti
		if (maxCharacters !== undefined && currentValue.length > maxCharacters) {
			currentValue = currentValue.slice(0, maxCharacters);
		}

		// Satır limiti
		if (maxLines !== undefined) {
			const lines = currentValue.split("\n");
			if (lines.length > maxLines) {
				currentValue = lines.slice(0, maxLines).join("\n");
			}
		}

		textarea.value = currentValue;
		value = currentValue;
	}

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		maxLines,
		maxCharacters,
		...restProps
	}: WithoutChildren<WithElementRef<HTMLTextareaAttributes> & {
		maxLines?: number;
		maxCharacters?: number;
	}> = $props();
</script>

<textarea
	bind:this={ref}
	data-slot="textarea"
	class={cn(
		"border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 field-sizing-content shadow-xs flex min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
		className
	)}
	bind:value
	oninput={handleInput}
	onclick={handlePopClick}
	{...restProps}
/>
