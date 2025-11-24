<script lang="ts">
	import type { NodeViewProps } from '@tiptap/core';
	import MediaExtended from './MediaExtended.svelte';
	import Lens from '$lib/components/Lens.svelte';

	const { ...rest }: NodeViewProps = $props();

	let mediaRef = $state<HTMLElement>();

	// Bazı ortamlarda editor doğrudan props içinde olmayabilir
	let isEditable = $state(true);

	$effect(() => {
		const maybeEditor = rest.editor || rest.extension?.options?.editor;
		isEditable = maybeEditor?.isEditable ?? true;
	});
</script>


<MediaExtended bind:mediaRef {...rest}>
	{@const node = rest.node}

	{#if isEditable}
		<img
				bind:this={mediaRef}
				src={node.attrs.src}
				alt={node.attrs.alt}
				title={node.attrs.title}
				class="m-0 object-cover"
			/>

	{:else}
<Lens>	
		<img
			bind:this={mediaRef}
			src={node.attrs.src}
			alt={node.attrs.alt}
			title={node.attrs.title}
			class="m-0 w-full object-cover"
		/>
				</Lens>
	{/if}
</MediaExtended>
