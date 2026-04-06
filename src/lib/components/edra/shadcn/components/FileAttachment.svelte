<script lang="ts">
	import { NodeViewWrapper } from 'svelte-tiptap';
	import type { NodeViewProps } from '@tiptap/core';
	import File from '@lucide/svelte/icons/file';
	import Download from '@lucide/svelte/icons/download';
	import Button from '$lib/components/ui/button/button.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';

	const { node }: NodeViewProps = $props();

	const url = node.attrs.url as string;
	const filename = node.attrs.filename as string;
	const size = node.attrs.size as string;
	const type = node.attrs.type as string;

	function downloadFile() {
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
</script>

<NodeViewWrapper as="div" class="file-attachment-wrapper" style="margin: 4px 0;">
	<div class="file-attachment flex flex-row gap-2 justify-center p-2 bg-background rounded-md border w-fit" data-url={url} data-filename={filename} data-size={size} data-type={type}>
		<div class="flex flex-row gap-2 justify-center items-center">
			<File class="text-primary" />
			<span class="text-secondary-foreground text-xs">{filename.slice(0, 15) + (filename.length > 15 ? '...' : '')}</span>
			{#if type}
				<Badge variant="secondary" style="text-transform: uppercase; flex-shrink: 0;">{type}</Badge>
			{/if}
			<span class="text-muted-foreground text-xs">{size}</span>
		</div>
		<Button 
			size="icon"
			onclick={downloadFile}
		>
			<Download style="width: 16px; height: 16px;" />
		</Button>
	</div>
</NodeViewWrapper>
