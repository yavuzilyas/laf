<script lang="ts">
	import MediaPlaceHolder from '../../components/MediaPlaceHolder.svelte';
	import type { NodeViewProps } from '@tiptap/core';
	import { getContext } from 'svelte';
	import { t } from '$lib/stores/i18n.svelte';
	import { getFileSizeLimit, isFileSizeValid, getFileSizeError } from '../../config/file-limits.js';
	import { articleEditor } from '$lib/stores/article-editor.svelte.js';

	const { editor }: NodeViewProps = $props();
	import Video from '@lucide/svelte/icons/video';
	import { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import Button from '$lib/components/ui/button/button.svelte';

	// Get commentId from context (if in comment editing mode)
	const getCommentId = getContext<() => string | null>('edraCommentId');
	const commentId = getCommentId?.() ?? null;

	let fileInput: HTMLInputElement;
	let dialogOpen = $state(false);
	let url = $state('');

	function handleClick() {
		dialogOpen = true;
	}

	async function uploadFile(file: File) {
		if (!isFileSizeValid(file, 'video')) {
			throw new Error(getFileSizeError(file, 'video'));
		}

		const fd = new FormData();
		fd.append('file', file);
		fd.append('folder', 'videos');
		
		// If commentId exists (in comment editing mode), use it
		// Otherwise use articleId from articleEditor
		if (commentId) {
			fd.append('commentId', commentId);
			fd.append('type', 'videos');
		} else {
			const articleId = await articleEditor.ensureArticleId();
			if (articleId) {
				fd.append('articleId', articleId);
				fd.append('type', 'videos');
			}
		}

		// Add article status to prevent deletion of previous files when in draft mode
		const articleStatus = articleEditor.articleData?.status;
		if (articleStatus) {
			fd.append('articleStatus', articleStatus);
		}

		const res = await fetch('/api/upload', { method: 'POST', body: fd });
		const data = await res.json();
		if (!res.ok) {
			throw new Error(data?.error || 'Upload failed');
		}
		return data.url as string;
	}

	function onFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		(async () => {
			try {
				const urlFromServer = await uploadFile(file);
				if (!urlFromServer) throw new Error('No URL received');
				editor.chain().focus().setVideo(urlFromServer).run();
				dialogOpen = false;
			} catch (err) {
				alert(err instanceof Error ? err.message : 'Upload failed');
			} finally {
				input.value = '';
			}
		})();
	}

	function insertFromUrl() {
		if (!url) return;
		editor.chain().focus().setVideo(url).run();
		url = '';
		dialogOpen = false;
	}
</script>

<MediaPlaceHolder
	class={buttonVariants({ variant: 'secondary', class: 'my-2 w-full justify-start p-6' })}
	icon={Video}
	title={t('editor.media.insertVideo')}
	onClick={handleClick}
>
	<AlertDialog.Root bind:open={dialogOpen}>
		<Button variant="ghost" onclick={(e) => { e.stopPropagation(); dialogOpen = true; }}>{t('editor.media.addMedia')}</Button>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>{t('editor.media.addVideo')}</AlertDialog.Title>
				<AlertDialog.Description>{t('editor.media.urlOrFile')}</AlertDialog.Description>
			</AlertDialog.Header>
			<div class="space-y-3">
				<div class="flex gap-2">
					<input type="url" bind:value={url} placeholder="https://..." class="w-full border rounded px-3 py-2" />
					<Button onclick={(e) => { e.stopPropagation(); insertFromUrl(); }} disabled={!url}>{t('editor.media.insertFromUrl')}</Button>
				</div>

				<div class="flex items-center gap-3">
					<input
						placeholder={t('editor.media.insertFromFile')}
						type="file"
						accept="video/*"
						onclick={(e) => e.stopPropagation()}
						onchange={onFileChange}
						class="block w-full text-sm text-muted-foreground file:mr-3 file:rounded file:border file:bg-secondary file:px-3 file:py-2 file:text-foreground file:hover:bg-secondary/80"
					/>
				</div>
			</div>
			<AlertDialog.Footer>
				<AlertDialog.Cancel>
					<Button variant="ghost">{t('Close')}</Button>
				</AlertDialog.Cancel>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>
</MediaPlaceHolder>
