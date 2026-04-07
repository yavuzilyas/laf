<script lang="ts">
	import { NodeViewWrapper } from 'svelte-tiptap';
	import type { NodeViewProps } from '@tiptap/core';
	import { onDestroy } from 'svelte';
	import File from '@lucide/svelte/icons/file';
	import Download from '@lucide/svelte/icons/download';
	import Button from '$lib/components/ui/button/button.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { articleEditor } from '$lib/stores/article-editor.svelte.js';

	const { node }: NodeViewProps = $props();

	const url = node.attrs.url as string;
	const filename = node.attrs.filename as string;
	const size = node.attrs.size as string;
	const type = node.attrs.type as string;

	// Keep the initial URL to identify uploaded files for cleanup
	const initialUrl: string | undefined = url;

	async function deleteFromServer(fileUrl?: string) {
		try {
			if (!fileUrl || typeof fileUrl !== 'string') return;
			if (!fileUrl.startsWith('/uploads/')) return; // only our uploads
			await fetch('/api/upload', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url: fileUrl })
			});
		} catch (e) {
			// Silently handle errors - don't block editor if delete fails
		}
	}

	function downloadFile() {
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	onDestroy(() => {
		// Delete file from server when node is destroyed (e.g., keyboard deletion)
		// But only if we're in article editor context AND the article wasn't just published
		const isArticleEditorContext = !!articleEditor.articleId;
		if (isArticleEditorContext && !articleEditor.isPublished) {
			deleteFromServer(initialUrl);
		}
	});
</script>

<NodeViewWrapper as="div" class="file-attachment-wrapper" style="margin: 4px 0;">
	<div class="file-attachment flex flex-row gap-2 justify-center p-2 bg-background rounded-md border w-fit" data-url={url} data-filename={filename} data-size={size} data-type={type}>
		<div class="flex flex-row gap-2 justify-center items-center">
			<File class="text-primary" />
			<div class="marquee-container">
				<div class="marquee-content">
					<span class="marquee-text">{filename}</span>
					<span class="marquee-text">{filename}</span>
				</div>
			</div>
			{#if type}
				<Badge variant="secondary" style="text-transform: uppercase; flex-shrink: 0;">{type}</Badge>
			{/if}
			<span class="text-muted-foreground text-xs">{size}</span>
		</div>
		<Button
		variant="outline"
			size="icon"
			onclick={downloadFile}
		>
			<Download />
		</Button>
	</div>
</NodeViewWrapper>

<style>
	.marquee-container {
		width: 120px;
		overflow: hidden;
		position: relative;
	}

	.marquee-content {
		display: inline-flex;
		animation: marquee 8s linear infinite;
	}

	.marquee-text {
		white-space: nowrap;
		font-size: 0.75rem;
		color: hsl(var(--secondary-foreground));
		padding-right: 1rem;
	}

	@keyframes marquee {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(-50%);
		}
	}
</style>
