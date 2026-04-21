<script lang="ts">
	import MediaPlaceHolder from '../../components/MediaPlaceHolder.svelte';
	import type { NodeViewProps } from '@tiptap/core';

	const { editor }: NodeViewProps = $props();
	import Image from '@lucide/svelte/icons/image';
	import { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
    import { t } from '$lib/stores/i18n.svelte';
	import { getFileSizeLimit, isFileSizeValid, getFileSizeError } from '../../config/file-limits.js';
	import { articleEditor } from '$lib/stores/article-editor.svelte.js';
	import { showToast } from '$lib/hooks/toast.js';

	let fileInput: HTMLInputElement;
	let dialogOpen = $state(false);
	let url = $state('');
	let baseUploadsUrl = $state<string | null>(null);

	function handleClick() {
		console.log('[ImagePlaceholder] handleClick called, dialog opening');
		console.log('[ImagePlaceholder] editor:', editor);
		console.log('[ImagePlaceholder] editor?.storage:', editor?.storage);
		dialogOpen = true;
	}

	async function uploadFile(file: File) {
		console.log('[ImagePlaceholder] uploadFile started');
		console.log('[ImagePlaceholder] editor exists:', !!editor);
		console.log('[ImagePlaceholder] editor.storage:', editor?.storage);

		if (!isFileSizeValid(file, 'image')) {
			throw new Error(getFileSizeError(file, 'image'));
		}

		const fd = new FormData();
		fd.append('file', file);
		fd.append('folder', 'photos');

		// Get context IDs from editor.storage (for comment/QA uploads)
		// Priority: qaId > commentId > articleId
		const currentQaId = (editor?.storage as any)?.qaId ?? null;
		const currentCommentId = (editor?.storage as any)?.commentId ?? null;
		console.log('[ImagePlaceholder] currentQaId:', currentQaId);
		console.log('[ImagePlaceholder] currentCommentId:', currentCommentId);

		if (currentQaId) {
			fd.append('qaId', currentQaId);
			fd.append('type', 'photos');
			console.log('[ImagePlaceholder] Using qaId for upload:', currentQaId);
		} else if (currentCommentId) {
			fd.append('commentId', currentCommentId);
			fd.append('type', 'photos');
			console.log('[ImagePlaceholder] Using commentId for upload:', currentCommentId);
		} else {
			console.log('[ImagePlaceholder] No qaId/commentId, trying articleEditor');
			const articleId = await articleEditor.ensureArticleId();
			console.log('[ImagePlaceholder] articleId:', articleId);
			if (articleId) {
				fd.append('articleId', articleId);
				fd.append('type', 'photos');
			}
		}

		if (baseUploadsUrl) {
			fd.append('previousUrl', baseUploadsUrl);
		}

		// Add article status to prevent deletion of previous files when in draft mode
		const articleStatus = articleEditor.articleData?.status;
		if (articleStatus) {
			fd.append('articleStatus', articleStatus);
		}

		console.log('[ImagePlaceholder] Sending upload request...');
		const res = await fetch('/api/upload', { method: 'POST', body: fd });
		const data = await res.json();
		console.log('[ImagePlaceholder] Upload response:', res.status, data);
		
		if (!res.ok) {
			throw new Error(data?.error || 'Upload failed');
		}
		return data.url as string;
	}

	function onFileChange(e: Event) {
		console.log('[ImagePlaceholder] onFileChange called');
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		console.log('[ImagePlaceholder] selected file:', file?.name, file?.size);
		if (!file) return;
		(async () => {
			try {
				const urlFromServer = await uploadFile(file);
				if (!urlFromServer) throw new Error('No URL received');
				editor.chain().focus().setImage({ src: urlFromServer }).run();
				dialogOpen = false;
				baseUploadsUrl = urlFromServer;
			} catch (err) {
				console.error('[ImagePlaceholder] Upload error:', err);
				showToast(err instanceof Error ? err.message : 'Upload failed', 'error');
			} finally {
				input.value = '';
			}
		})();
	}

	function insertFromUrl() {
		if (!url) return;
		editor.chain().focus().setImage({ src: url }).run();
		url = '';
		dialogOpen = false;
	}
</script>

<MediaPlaceHolder
	class={buttonVariants({ variant: 'secondary', class: 'my-2 w-full justify-start p-6' })}
	icon={Image}
	title={t('editor.media.insertImage')}
	onclick={handleClick}
>
	<AlertDialog.Root bind:open={dialogOpen}>
		<Button variant="ghost" onclick={(e) => { e.stopPropagation(); dialogOpen = true; }}>{t('editor.media.addMedia')}</Button>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>{t('editor.media.addImage')}</AlertDialog.Title>
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
						accept="image/*"
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
	<!-- off-screen input no longer needed when using visible input in dialog -->
</MediaPlaceHolder>
