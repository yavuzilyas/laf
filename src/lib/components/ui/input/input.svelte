<script lang="ts">
	import type { HTMLInputAttributes, HTMLInputTypeAttribute } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import { playSound } from "$lib/stores/sound";
	function handlePopClick(e: MouseEvent) {
		playSound("pop");
	}
	type InputType = Exclude<HTMLInputTypeAttribute, "file">;
	type InputSize = "default" | "xs";

	type Props = WithElementRef<
		Omit<HTMLInputAttributes, "type" | "size"> &
			({ type: "file"; files?: FileList } | { type?: InputType; files?: undefined }) & {
				size?: InputSize;
			}
	>;

	let {
		ref = $bindable(null),
		value = $bindable(),
		type,
		files = $bindable(),
		size = "default",
		class: className,
		...restProps
	}: Props = $props();
</script>

{#if type === "file"}
	<input
		bind:this={ref}
		data-slot="input"
		class={cn(
			"cursor-auto dark:bg-input/30 selection:bg-primary selection:text-primary-foreground border-input ring-offset-background placeholder:text-muted-foreground shadow-xs flex w-full min-w-0 rounded-md border bg-transparent font-medium outline-none transition-[color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50",
			"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
			"aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
			size === "xs" && "h-7 px-2.5 py-1 text-xs",
			size === "default" && "h-9 px-3 pt-1.5 text-sm md:text-sm",
			className
		)}
		onclick={handlePopClick}
		type="file"
		bind:files
		bind:value
		{...restProps}
	/>
{:else}
	<input
		bind:this={ref}
		data-slot="input"
		class={cn(
			"border-input bg-background selection:bg-primary dark:bg-input/30 selection:text-primary-foreground ring-offset-background placeholder:text-muted-foreground shadow-xs flex w-full min-w-0 rounded-md border outline-none transition-[color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50",
			"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
			"aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
			size === "xs" && "h-7 px-2.5 py-0.5 text-xs",
			size === "default" && "h-9 px-3 py-1 text-base md:text-sm",
			className
		)}
		{type}
		bind:value
		{...restProps}
		onclick={handlePopClick}
	/>
{/if}
