<script lang="ts">
	import MediaPlaceHolder from '../../components/MediaPlaceHolder.svelte';
	import type { NodeViewProps } from '@tiptap/core';
	import { t } from '$lib/stores/i18n.svelte';

	const { editor }: NodeViewProps = $props();
	import Audio from '@lucide/svelte/icons/audio-lines';
	import { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import Button from '$lib/components/ui/button/button.svelte';

	let fileInput: HTMLInputElement;
	let dialogOpen = $state(false);
	let url = $state('');

	function handleClick() {
		dialogOpen = true;
	}

	function onFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		(async () => {
			try {
				const fd = new FormData();
				fd.append('file', file);
				fd.append('folder', 'audio');
				const res = await fetch('/api/upload', { method: 'POST', body: fd });
				const data = await res.json();
				if (!res.ok) throw new Error(data?.error || 'Upload failed');
				const urlFromServer = data.url as string;
				if (!urlFromServer) throw new Error('No URL received');
				editor.chain().focus().setAudio(urlFromServer).run();
				dialogOpen = false;
			} catch (err) {
				console.error('Audio upload error', err);
			} finally {
				input.value = '';
			}
		})();
	}

	function insertFromUrl() {
		if (!url) return;
		editor.chain().focus().setAudio(url).run();
		url = '';
		dialogOpen = false;
	}
</script>

<MediaPlaceHolder
	class={buttonVariants({ variant: 'secondary', class: 'my-2 w-full justify-start p-6' })}
	icon={Audio}
	title={t('editor.media.insertAudio')}
	onClick={handleClick}
>
	<AlertDialog.Root bind:open={dialogOpen}>
		<Button variant="default" on:click={(e) => { e.stopPropagation(); dialogOpen = true; }}>{t('editor.media.addMedia')}</Button>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>{t('editor.media.addAudio')}</AlertDialog.Title>
				<AlertDialog.Description>{t('editor.media.urlOrFile')}</AlertDialog.Description>
			</AlertDialog.Header>
			<div class="space-y-3">
				<div class="flex gap-2">
					<input type="url" bind:value={url} placeholder="https://..." class="w-full border rounded px-3 py-2" />
					<Button on:click={(e) => { e.stopPropagation(); insertFromUrl(); }} disabled={!url}>{t('editor.media.insertFromUrl')}</Button>
				</div>
				<div class="flex items-center gap-3">
					<input
						type="file"
						accept="audio/*"
						on:click={(e) => e.stopPropagation()}
						on:change={onFileChange}
						class="block w-full text-sm text-muted-foreground file:mr-3 file:rounded file:border file:bg-secondary file:px-3 file:py-2 file:text-foreground file:hover:bg-secondary/80"
					/>
					<span class="text-sm text-muted-foreground">{t('editor.common.or')}</span>
				</div>
			</div>
			<AlertDialog.Footer>
				<AlertDialog.Cancel asChild>
					<Button variant="ghost">{t('editor.common.close')}</Button>
				</AlertDialog.Cancel>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>
	<!-- off-screen input no longer needed when using visible input in dialog -->
</MediaPlaceHolder>
