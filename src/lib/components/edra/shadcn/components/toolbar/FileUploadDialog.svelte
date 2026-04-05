<script lang="ts">
	import type { Editor } from '@tiptap/core';
	import Upload from '@lucide/svelte/icons/upload';
	import Image from '@lucide/svelte/icons/image';
	import Audio from '@lucide/svelte/icons/audio-lines';
	import Video from '@lucide/svelte/icons/video';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { cn } from '$lib/utils.js';
	import EdraToolTip from '../EdraToolTip.svelte';
	import { t } from '$lib/stores/i18n.svelte.js';

	interface Props {
		editor: Editor | null;
		articleId?: string | null;
	}

	const { editor = null, articleId = null }: Props = $props();

	let isOpen = $state(false);
	let isUploading = $state(false);
	let selectedFile: File | null = $state(null);
	let fileInputRef: HTMLInputElement;
	let uploadError = $state('');
	let uploadProgress = $state(0);

	const fileTypes = [
		{ type: 'image', icon: Image, label: t('editor.toolbar.upload.image'), accept: 'image/*' },
		{ type: 'audio', icon: Audio, label: t('editor.toolbar.upload.audio'), accept: 'audio/*' },
		{ type: 'video', icon: Video, label: t('editor.toolbar.upload.video'), accept: 'video/*' }
	];

	let selectedType = $state('image');

	const handleFileSelect = (event: Event) => {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			selectedFile = input.files[0];
			uploadError = '';
		}
	};

	const handleUpload = async () => {
		if (!selectedFile || !editor) return;

		isUploading = true;
		uploadError = '';
		uploadProgress = 0;

		try {
			const formData = new FormData();
			formData.append('file', selectedFile);
			formData.append('folder', selectedType);
			if (articleId) {
				formData.append('articleId', articleId);
				formData.append('type', selectedType === 'image' ? 'photos' : selectedType === 'audio' ? 'sounds' : 'videos');
			}

			const response = await fetch('/api/upload', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Upload failed');
			}

			const { url } = await response.json();

			// Insert the file into editor based on type
			if (selectedType === 'image') {
				editor.chain().focus().setImage({ src: url }).run();
			} else if (selectedType === 'audio') {
				editor.chain().focus().insertAudio({ src: url }).run();
			} else if (selectedType === 'video') {
				editor.chain().focus().insertVideo({ src: url }).run();
			}

			isOpen = false;
			selectedFile = null;
			if (fileInputRef) {
				fileInputRef.value = '';
			}
		} catch (error: any) {
			uploadError = error.message || 'Upload failed';
		} finally {
			isUploading = false;
		}
	};

	const handleOpenChange = (open: boolean) => {
		isOpen = open;
		if (!open) {
			selectedFile = null;
			uploadError = '';
			uploadProgress = 0;
			if (fileInputRef) {
				fileInputRef.value = '';
			}
		}
	};

	const getCurrentTypeAccept = () => {
		const type = fileTypes.find(t => t.type === selectedType);
		return type?.accept || '*';
	};
</script>

<AlertDialog.Root open={isOpen} onOpenChange={handleOpenChange}>
	<AlertDialog.Trigger>
		<EdraToolTip tooltip={t('editor.toolbar.upload.tooltip')}>
			<div
				class={cn(
					buttonVariants({
						variant: 'ghost',
						size: 'icon'
					})
				)}
			>
				<Upload class="h-4 w-4" />
			</div>
		</EdraToolTip>
	</AlertDialog.Trigger>
	<AlertDialog.Content class="sm:max-w-[425px]">
		<AlertDialog.Header>
			<AlertDialog.Title>{t('editor.toolbar.upload.title')}</AlertDialog.Title>
			<AlertDialog.Description>{t('editor.toolbar.upload.description')}</AlertDialog.Description>
		</AlertDialog.Header>
		<div class="grid gap-4 py-4">
			<!-- File Type Selection -->
			<div class="flex gap-2">
				{#each fileTypes as { type, icon: Icon, label }}
					<button
						class={cn(
							'flex flex-col items-center gap-1 p-3 rounded-md border transition-colors',
							selectedType === type
								? 'border-primary bg-primary/10'
								: 'border-border hover:bg-muted'
						)}
						on:click={() => selectedType = type}
						type="button"
					>
						<Icon class="h-5 w-5" />
						<span class="text-xs">{label}</span>
					</button>
				{/each}
			</div>

			<!-- File Input -->
			<div class="grid gap-2">
				<label class="text-sm font-medium">{t('editor.toolbar.upload.selectFile')}</label>
				<input
					bind:this={fileInputRef}
					type="file"
					accept={getCurrentTypeAccept()}
					on:change={handleFileSelect}
					class="col-span-4 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
				/>
			</div>

			<!-- Selected File Info -->
			{#if selectedFile}
				<div class="text-sm text-muted-foreground">
					{t('editor.toolbar.upload.selected')}: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
				</div>
			{/if}

			<!-- Error Message -->
			{#if uploadError}
				<div class="text-sm text-destructive">
					{uploadError}
				</div>
			{/if}

			<!-- Progress -->
			{#if isUploading}
				<div class="w-full bg-muted rounded-full h-2">
					<div
						class="bg-primary h-2 rounded-full transition-all"
						style="width: {uploadProgress}%"
					></div>
				</div>
			{/if}
		</div>
		<AlertDialog.Footer>
			<AlertDialog.Cancel class={buttonVariants({ variant: 'outline' })}>
				{t('common.cancel')}
			</AlertDialog.Cancel>
			<AlertDialog.Action
				class={buttonVariants({ variant: 'default' })}
				on:click={handleUpload}
				disabled={!selectedFile || isUploading}
			>
				{isUploading ? t('editor.toolbar.upload.uploading') : t('editor.toolbar.upload.upload')}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
