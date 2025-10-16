<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		value = $bindable(""),
		class: className,
		onValueChange, // 🔥 Yeni prop
		...restProps
	}: TabsPrimitive.RootProps & { onValueChange?: (value: string) => void } = $props();
</script>

<TabsPrimitive.Root
	bind:ref
	bind:value
	data-slot="tabs"
	class={cn("flex flex-col gap-2", className)}
	on:valueChange={onValueChange}
	{...restProps}
/>