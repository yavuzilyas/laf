<script lang="ts">
	import type { NodeViewProps } from '@tiptap/core';
	import MediaExtended from './MediaExtended.svelte';

	const { ...rest }: NodeViewProps = $props();

	let mediaRef = $state<HTMLElement>();
	import Lens from '$lib/components/Lens.svelte';
</script>

<MediaExtended bind:mediaRef {...rest}>
	{@const node = rest.node}
	<Lens>
	<img
		bind:this={mediaRef}
		src={node.attrs.src}
		alt={node.attrs.alt}
		title={node.attrs.title}
		class="m-0 object-cover"
	/> </Lens>
</MediaExtended>
