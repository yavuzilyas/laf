<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";

	export const badgeVariants = tv({
		base: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-full border px-2 py-1 text-xs font-medium transition-[color,box-shadow,transform] focus-visible:ring-[3px] [&>svg]:pointer-events-none [&>svg]:size-3",
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground [a&]:hover:bg-primary/90 border-transparent",
				secondary:
					"bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90 border-transparent",
				destructive:
					"bg-destructive [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/70 border-transparent text-white",
				outline: "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
				// Donation badge variants
				pioneer:
					"border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-700/50 dark:bg-yellow-900/30 dark:text-yellow-300",
				rebel:
					"border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-700/50 dark:bg-purple-900/30 dark:text-purple-300",
				sponsor:
					"border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-700/50 dark:bg-blue-900/30 dark:text-blue-300",
				amount:
				"text-sm px-2.5 pb-0.5 gap-1.5 rounded-xs border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-700/50 dark:bg-orange-900/30 dark:text-orange-300",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];
</script>

<script lang="ts">
	import type { HTMLAnchorAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		href,
		class: className,
		variant = "default",
		children,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & {
		variant?: BadgeVariant;
	} = $props();
</script>

<svelte:element
	this={href ? "a" : "span"}
	bind:this={ref}
	data-slot="badge"
	{href}
	class={cn(badgeVariants({ variant }), className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
