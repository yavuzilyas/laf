<script lang="ts">
	import { onMount } from 'svelte';
	import type { Editor } from '@tiptap/core';
	import Hash from '@lucide/svelte/icons/hash';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { cn } from '$lib/utils.js';
	import EdraToolTip from '../EdraToolTip.svelte';
	import { t } from '$lib/stores/i18n.svelte.js';

	interface Props {
		editor: Editor | null;
	}

	const { editor = null }: Props = $props();

	let lineNumber = $state(1);
	let isOpen = $state(false);
	let inputRef: HTMLInputElement;

	// Get text content from a specific line in the editor
	const getTextAtLine = (editor: Editor, lineNum: number): string => {
		const doc = editor.state.doc;
		let currentLine = 1;
		let text = '';

		doc.descendants((node, pos) => {
			if (currentLine === lineNum) {
				if (node.isTextblock) {
					text = node.textContent.trim();
					return false; // Stop traversal
				}
			}
			if (node.isBlock) {
				currentLine++;
			}
			return true;
		});

		return text || `Satır ${lineNum}`;
	};

	const setScrollLink = () => {
		if (!editor) return;

		const href = `#line-${lineNumber}`;
		const linkText = getTextAtLine(editor, lineNumber);

		editor
			.chain()
			.focus()
			.insertContent(`<a href="${href}" class="scroll-to-line-link" data-line="${lineNumber}" target="_self" onclick="event.preventDefault(); window.location.hash='${href}'; return false;">${linkText}</a>`)
			.run();

		isOpen = false;
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			setScrollLink();
		}
	};

	const handleOpenChange = (open: boolean) => {
		isOpen = open;
		if (open) {
			lineNumber = 1;
			// Focus the input after a small delay to ensure it's rendered
			setTimeout(() => {
				inputRef?.focus();
				inputRef?.select();
			}, 10);
		}
	};
</script>

<AlertDialog.Root open={isOpen} onOpenChange={handleOpenChange}>
	<AlertDialog.Trigger>
		<EdraToolTip tooltip="Satıra Git Linki Ekle">
			<div
				class={cn(
					buttonVariants({
						variant: 'ghost',
						size: 'icon'
					})
				)}
			>
				<Hash class="h-4 w-4" />
			</div>
		</EdraToolTip>
	</AlertDialog.Trigger>
	<AlertDialog.Content class="sm:max-w-[425px]">
		<AlertDialog.Header>
			<AlertDialog.Title>Satıra Git Linki Ekle</AlertDialog.Title>
			<AlertDialog.Description>Hangi satıra atlamak istediğinizi girin. O satırda yazılan yazı link metni olacaktır.</AlertDialog.Description>
		</AlertDialog.Header>
		<div class="grid gap-4 py-4">
			<div class="grid grid-cols-4 items-center gap-4">
				<label for="lineNumber" class="col-span-4 text-sm font-medium">
					Satır Numarası
				</label>
				<input
					id="lineNumber"
					type="number"
					min="1"
					class="col-span-4 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
					bind:this={inputRef}
					bind:value={lineNumber}
					onkeydown={handleKeyDown}
					placeholder="1"
				/>
			</div>
		</div>
		<AlertDialog.Footer>
			<AlertDialog.Cancel class={buttonVariants({ variant: 'outline' })}>
				{t('common.cancel')}
			</AlertDialog.Cancel>
			<AlertDialog.Action
				class={buttonVariants({ variant: 'default' })}
				onclick={setScrollLink}
			>
				{t('common.save')}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
