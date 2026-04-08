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

	// Rate limiting for download button
	let isDownloading = $state(false);
	const DOWNLOAD_COOLDOWN_MS = 30000; // 3 seconds cooldown

	function downloadFile() {
		if (isDownloading) return;

		isDownloading = true;
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		// Re-enable button after cooldown
		setTimeout(() => {
			isDownloading = false;
		}, DOWNLOAD_COOLDOWN_MS);
	}

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
	<div class="file-attachment flex flex-row gap-2 justify-center p-2 bg-background rounded-md  border-dashed border-2 w-fit" data-url={url} data-filename={filename} data-size={size} data-type={type}>
		<div class="flex flex-row gap-1 justify-center items-center">
		<div class="relative w-8 h-8">
			<File strokeWidth={1.25} size={32} class="text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
						
				<Badge variant="secondary" class="p-0 bg-transparent text-[7px] drop-shadow  absolute top-2/3 left-1/2 -translate-x-1/2 -translate-y-1/2">.{type}</Badge>
			
</div>
			<div class="marquee-container">
				<span class="marquee-text-placeholder">{filename}</span>
				<div class="marquee-content">
					<span class="marquee-text">{filename}</span>
					<span class="marquee-text">{filename}</span>
					<span class="marquee-text">{filename}</span>
				</div>
			</div>

			<span class="text-muted-foreground text-xs">{size}</span>
		</div>
		<Button
			variant="outline"
			size="icon"
			onclick={downloadFile}
			disabled={isDownloading}
		>
			<Download />
		</Button>
	</div>
</NodeViewWrapper>

<style>
	.marquee-container {
		position: relative;
		width: fit-content;
		max-width: 133px;
		overflow: hidden;
		margin-top: 7px;
		mask-image: linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%);
		-webkit-mask-image: linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%);
	}

	.marquee-text-placeholder {
		visibility: hidden;
		white-space: nowrap;
		font-size: 0.75rem;
		padding-right: 0.5rem;
	}

	.marquee-content {
		display: inline-flex;
		position: absolute;
		top: 0;
		left: 0;
		animation: marquee 15s linear infinite;
	}

	.marquee-text {
		white-space: nowrap;
		font-size: 0.75rem;
		color: hsl(var(--secondary-foreground));
		padding-right: 0.5rem;
	}

	@keyframes marquee {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(-66.666%);
		}
	}
</style>
