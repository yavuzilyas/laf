<script lang="ts">
	import { onMount } from 'svelte';
	import type { Editor } from '@tiptap/core';
	import Link from '@lucide/svelte/icons/link-2';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { cn } from '$lib/utils.js';
	import EdraToolTip from '../EdraToolTip.svelte';
	import { t } from '$lib/stores/i18n.svelte.js';

	interface Props {
		editor: Editor | null;
	}

	const { editor = null }: Props = $props();

	let url = '';
	let isOpen = $state(false);
	let inputRef: HTMLInputElement;

	const setLink = () => {
		if (!editor) return;

		// Empty string removes the link
		if (url === '') {
			editor.chain().focus().extendMarkRange('link').unsetLink().run();
			return;
		}

		// Add protocol if missing
		let finalUrl = url;
		if (!/^https?:\/\//i.test(url)) {
			finalUrl = 'https://' + url;
		}

		editor
			.chain()
			.focus()
			.extendMarkRange('link')
			.setLink({ href: finalUrl })
			.run();

		isOpen = false;
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			setLink();
		}
	};

	const handleOpenChange = (open: boolean) => {
		isOpen = open;
		if (open) {
			// Get the current link if any
			const currentLink = editor?.getAttributes('link').href || '';
			url = currentLink;
			// Focus the input after a small delay to ensure it's rendered
			setTimeout(() => {
				inputRef?.focus();
				inputRef?.select();
			}, 10);
		}
	};
</script>

<AlertDialog.Root open={isOpen} onOpenChange={handleOpenChange} role="dialog1">
	<AlertDialog.Trigger>
		<EdraToolTip tooltip={t('editor.toolbar.link.add')}>
			<div
				class={cn(
					buttonVariants({
						variant: 'ghost',
						size: 'icon'
					}),
					editor?.isActive('link') ? 'bg-muted' : ''
				)}
			>
				<Link class="h-4 w-4" />
			</div>
		</EdraToolTip>
	</AlertDialog.Trigger>
	<AlertDialog.Content class="sm:max-w-[425px]">
		<AlertDialog.Header>
			<AlertDialog.Title>{editor.isActive('link') ? t('editor.toolbar.link.edit') : t('editor.toolbar.link.add')}</AlertDialog.Title>
			<AlertDialog.Description>{t('editor.toolbar.link.enterUrl')}</AlertDialog.Description>
		</AlertDialog.Header>
		<div class="grid gap-4 py-4">
			<div class="grid grid-cols-4 items-center gap-4">
				<input
					id="link"
					type="url"
					class="col-span-4 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
					bind:this={inputRef}
					bind:value={url}
					on:keydown={handleKeyDown}
					placeholder={t('editor.toolbar.link.urlPlaceholder')}
				/>
			</div>
		</div>
		<AlertDialog.Footer>
			<AlertDialog.Cancel class={buttonVariants({ variant: 'outline' })}>
				{t('common.cancel')}
			</AlertDialog.Cancel>
			<AlertDialog.Action
				class={buttonVariants({ variant: 'default' })}
				on:click={setLink}
			>
				{t('common.save')}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
