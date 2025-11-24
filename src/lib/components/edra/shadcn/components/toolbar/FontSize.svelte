<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Editor } from '@tiptap/core';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import { cn } from '$lib/utils.js';
	import EdraToolTip from '../EdraToolTip.svelte';
  import { t } from '$lib/stores/i18n.svelte.js';
	interface Props {
		class?: string;
		editor: Editor;
	}

	const { class: className = '', editor }: Props = $props();

	const FONT_SIZE = [
		{ label: 'tiny', value: '0.7rem' },
		{ label: 'smaller', value: '0.75rem' },
		{ label: 'small', value: '0.9rem' },
		{ label: 'default', value: '' },
		{ label: 'large', value: '1.25rem' },
		{ label: 'extraLarge', value: '1.5rem' }
	];

	let currentSize = $derived.by(() => editor.getAttributes('textStyle').fontSize || '');

	const currentLabel = $derived.by(() => {
		const l = FONT_SIZE.find((f) => f.value === currentSize);
		if (l) return t(`editor.toolbar.fontSize.${l.label}`);
		return t('editor.toolbar.fontSize.medium');
	});
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		<EdraToolTip tooltip={t('editor.toolbar.fontSize.title')}>
			<Button variant="ghost" class={cn('gap-0.5 !px-2', className)}>
				<span>{currentLabel}</span>
				<ChevronDown class="text-muted-foreground !size-2" />
			</Button>
		</EdraToolTip>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
		{#each FONT_SIZE as fontSize (fontSize)}
			<DropdownMenu.Item
				onclick={() => {
					editor.chain().focus().setFontSize(fontSize.value).run();
				}}
				class="flex items-center px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground"
				style={`font-size: ${fontSize.value}`}>
				{t(`editor.toolbar.fontSize.${fontSize.label}`)}
			</DropdownMenu.Item>
		{/each}
	</DropdownMenu.Content>
</DropdownMenu.Root>
