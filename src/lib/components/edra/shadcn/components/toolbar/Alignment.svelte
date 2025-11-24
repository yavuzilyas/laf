<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import commands from '../../../commands/toolbar-commands.js';
	import type { Editor } from '@tiptap/core';
	import AlignLeft from '@lucide/svelte/icons/align-left';
	import EdraToolTip from '../EdraToolTip.svelte';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import { t } from '$lib/stores/i18n.svelte.js';

	interface Props {
		editor: Editor;
	}
	const { editor }: Props = $props();

	const alignments = commands['alignment'];

	const isActive = $derived.by(() => {
		return alignments.find((alignment) => alignment.isActive?.(editor)) !== undefined;
	});

	const AlignMentIcon = $derived.by(() => {
		const a = alignments.find((alignment) => alignment.isActive?.(editor));
		if (a) return a.icon;
		else return AlignLeft;
	});
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		<EdraToolTip tooltip={t('editor.toolbar.alignment')}>
			<div
				class={buttonVariants({
					variant: 'ghost',
					size: 'icon',
					class: cn('gap-0')
				})}
				class:bg-muted={isActive}
			>
				<AlignMentIcon />
				<ChevronDown class="text-muted-foreground !size-2" />
			</div>
		</EdraToolTip>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
		{#each alignments as alignment (alignment)}
			{@const Icon = alignment.icon}
			<DropdownMenu.Item onclick={() => alignment.onClick?.(editor)}>
				<Icon class="mr-2 h-4 w-4" />
				<span>{t(`editor.toolbar.alignments.${alignment.name.toLowerCase()}`)}</span>
				<DropdownMenu.Shortcut>
					{alignment.shortCut}
				</DropdownMenu.Shortcut>
			</DropdownMenu.Item>
		{/each}
	</DropdownMenu.Content>
</DropdownMenu.Root>
