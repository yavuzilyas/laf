<script lang="ts">
	import MediaPlaceHolder from '../../components/MediaPlaceHolder.svelte';
	import type { NodeViewProps } from '@tiptap/core';

	const { editor }: NodeViewProps = $props();
	import FileIcon from '@lucide/svelte/icons/file';
	import { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
    import { t } from '$lib/stores/i18n.svelte';
	import { getFileSizeLimit, isFileSizeValid, getFileSizeError } from '../../config/file-limits.js';
	import { articleEditor } from '$lib/stores/article-editor.svelte.js';
	import { showToast } from '$lib/hooks/toast.js';

	let fileInput: HTMLInputElement;
	let dialogOpen = $state(false);
	let baseUploadsUrl = $state<string | null>(null);

	function handleClick() {
		dialogOpen = true;
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	async function uploadFile(file: File) {
		// Check file size with special 12MB limit for PDF/EPUB files
		const ext = file.name.split('.').pop()?.toLowerCase() || '';
		const isLargeAttachment = ext === 'pdf' || ext === 'epub';
		const maxSize = isLargeAttachment ? 12 * 1024 * 1024 : getFileSizeLimit('file');

		if (file.size > maxSize) {
			const limitMB = isLargeAttachment ? 12 : Math.round(getFileSizeLimit('file') / (1024 * 1024));
			throw new Error(`File too large. Max ${limitMB}MB`);
		}

		const fd = new FormData();
		fd.append('file', file);
		fd.append('folder', 'files');
		fd.append('fileType', 'attachment');

		// Get context IDs from editor.storage (for comment/QA uploads)
		// Priority: qaId > commentId > articleId
		const currentQaId = (editor?.storage as any)?.qaId ?? null;
		const currentCommentId = (editor?.storage as any)?.commentId ?? null;

		if (currentQaId) {
			fd.append('qaId', currentQaId);
			fd.append('type', 'files');
		} else if (currentCommentId) {
			fd.append('commentId', currentCommentId);
			fd.append('type', 'files');
		} else {
			const articleId = await articleEditor.ensureArticleId();
			if (articleId) {
				fd.append('articleId', articleId);
				fd.append('type', 'files');
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

		const res = await fetch('/api/upload', { method: 'POST', body: fd });
		const data = await res.json();
		if (!res.ok) {
			throw new Error(data?.error || 'Upload failed');
		}
		return {
			url: data.url as string,
			filename: file.name,
			size: formatFileSize(file.size),
			type: file.name.split('.').pop() || 'file'
		};
	}

	function onFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		(async () => {
			try {
				const result = await uploadFile(file);
				if (!result.url) throw new Error('No URL received');
				editor.chain().focus().insertFileAttachment({
					url: result.url,
					filename: result.filename,
					size: result.size,
					type: result.type
				}).run();
				dialogOpen = false;
				baseUploadsUrl = result.url;
			} catch (err) {
				showToast(err instanceof Error ? err.message : 'Upload failed', 'error');
			} finally {
				input.value = '';
			}
		})();
	}
</script>

<MediaPlaceHolder
	class={buttonVariants({ variant: 'secondary', class: 'my-2 w-full justify-start p-6' })}
	icon={FileIcon}
	title={t('editor.media.insertFile')}
	onClick={handleClick}
>
	<AlertDialog.Root bind:open={dialogOpen}>
		<Button variant="ghost" onclick={(e) => { e.stopPropagation(); dialogOpen = true; }}>{t('editor.media.addFile')}</Button>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>{t('editor.media.addFile')}</AlertDialog.Title>
				<AlertDialog.Description>{t('editor.media.selectFile')}</AlertDialog.Description>
			</AlertDialog.Header>
			<div class="space-y-3">
				<div class="flex items-center gap-3">
					<input
						placeholder={t('editor.media.selectFile')}
						type="file"
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
