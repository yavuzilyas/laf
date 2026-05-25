<script lang="ts">
	import { onMount } from 'svelte';
	import type { Editor } from '@tiptap/core';
	import Hash from '@lucide/svelte/icons/hash';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { cn } from '$lib/utils.js';
	import EdraToolTip from '../EdraToolTip.svelte';
	import { t } from '$lib/stores/i18n.svelte.js';
	import Heading1 from '@lucide/svelte/icons/heading-1';
	import Heading2 from '@lucide/svelte/icons/heading-2';
	import Heading3 from '@lucide/svelte/icons/heading-3';

	interface Props {
		editor: Editor | null;
	}

	const { editor = null }: Props = $props();

	let selectedHeading = $state<{ text: string; level: number; pos: number } | null>(null);
	let isOpen = $state(false);

	interface Heading {
		text: string;
		level: number;
		pos: number;
	}

	let headings = $state<Heading[]>([]);

	// Get all h1, h2, h3 headings from the editor
	const getHeadings = (editor: Editor): Heading[] => {
		const headings: Heading[] = [];
		const doc = editor.state.doc;

		doc.descendants((node, pos) => {
			if (node.type.name === 'heading') {
				const level = node.attrs.level;
				if (level >= 1 && level <= 3) {
					headings.push({
						text: node.textContent.trim(),
						level,
						pos
					});
				}
			}
			return true;
		});

		return headings;
	};

	const setScrollLink = () => {
		if (!editor || !selectedHeading) return;

		const href = `#heading-${selectedHeading.pos}`;
		const linkText = selectedHeading.text;

		editor
			.chain()
			.focus()
			.insertContent(
				`<a href="${href}" class="scroll-to-heading-link" data-pos="${selectedHeading.pos}" target="_self">${linkText}</a>`
			)
			.run();

		isOpen = false;
		selectedHeading = null;
	};

	const handleOpenChange = (open: boolean) => {
		isOpen = open;
		if (open) {
			if (editor && !editor.isDestroyed) {
				headings = getHeadings(editor);
			} else {
				headings = [];
			}
		} else {
			selectedHeading = null;
		}
	};

	const getHeadingIcon = (level: number) => {
		switch (level) {
			case 1:
				return Heading1;
			case 2:
				return Heading2;
			case 3:
				return Heading3;
			default:
				return Heading1;
		}
	};
</script>

<AlertDialog.Root open={isOpen} onOpenChange={handleOpenChange}>
	<AlertDialog.Trigger>
		<EdraToolTip tooltip={t('editor.toolbar.scrollToHeading.title')}>
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
	<AlertDialog.Content class="sm:max-w-[500px] max-h-[80vh] overflow-hidden flex flex-col">
		<AlertDialog.Header>
			<AlertDialog.Title>{t('editor.toolbar.scrollToHeading.title')}</AlertDialog.Title>
			<AlertDialog.Description
				>{t('editor.toolbar.scrollToHeading.description')}</AlertDialog.Description
			>
		</AlertDialog.Header>
		<div class="flex-1 overflow-y-auto py-4">
			{#if headings.length === 0}
				<p class="text-sm text-muted-foreground text-center py-8">
					{t('editor.toolbar.scrollToHeading.noHeadings')}
				</p>
			{:else}
				<div class="space-y-1">
					{#each headings as heading (heading.pos)}
						{@const Icon = getHeadingIcon(heading.level)}
						<button
							class={cn(
								'w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors',
								selectedHeading?.pos === heading.pos
									? 'bg-primary text-primary-foreground'
									: 'hover:bg-accent hover:text-accent-foreground'
							)}
							onclick={() => (selectedHeading = heading)}
						>
							<Icon class="h-4 w-4 flex-shrink-0" />
							<span class="truncate"
								>{heading.text || t('editor.toolbar.scrollToHeading.untitled')}</span
							>
						</button>
					{/each}
				</div>
			{/if}
		</div>
		<AlertDialog.Footer>
			<AlertDialog.Cancel class={buttonVariants({ variant: 'outline' })}>
				{t('common.cancel')}
			</AlertDialog.Cancel>
			<AlertDialog.Action
				class={buttonVariants({ variant: 'default' })}
				onclick={setScrollLink}
				disabled={!selectedHeading}
			>
				{t('common.save')}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
