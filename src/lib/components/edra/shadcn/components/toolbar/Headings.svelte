<script lang="ts">
	import { onMount } from 'svelte';
	import type { Editor } from '@tiptap/core';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import Heading from '@lucide/svelte/icons/heading';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Paragraph from '@lucide/svelte/icons/pilcrow';
	import Heading1 from '@lucide/svelte/icons/heading-1';
	import Heading2 from '@lucide/svelte/icons/heading-2';
	import Heading3 from '@lucide/svelte/icons/heading-3';
	import Heading4 from '@lucide/svelte/icons/heading-4';
	import commands from '../../../commands/toolbar-commands.js';
	import { cn } from '$lib/utils.js';
	import EdraToolTip from '../EdraToolTip.svelte';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
  import { t } from '$lib/stores/i18n.svelte.js';

	interface Props {
		editor?: Editor | null;
	}

	const { editor }: Props = $props();

	// Initialize with empty array if commands not loaded
	let headings = $state<Array<{
		icon?: any;
		name: string;
		tooltip: string;
		shortCut?: string;
		onClick?: (editor: Editor) => void;
		clickable?: (editor: Editor) => boolean;
		isActive?: (editor: Editor) => boolean;
	}>>([]);

	// Initialize headings when component mounts or editor changes
	$effect(() => {
		if (!editor || editor.isDestroyed) {
			headings = [];
			return;
		}

		try {
			// Ensure commands are loaded and have the headings property
			if (commands && 'headings' in commands && Array.isArray(commands.headings)) {
				headings = commands.headings.filter(h => 
					h && 
					typeof h.isActive === 'function' && 
					typeof h.onClick === 'function'
				);
			}
		} catch (e) {
			console.error('Error initializing headings:', e);
			headings = [];
		}
	});

	const isActive = $derived.by(() => {
		if (!editor || editor.isDestroyed || !headings.length) return false;
		try {
			return headings.some(h => h?.isActive?.(editor));
		} catch (e) {
			console.warn('Error checking active heading:', e);
			return false;
		}
	});

	const HeadingIcon = $derived.by(() => {
		if (!editor || editor.isDestroyed || !headings.length) return Heading;
		try {
			const activeHeading = headings.find(h => h?.isActive?.(editor));
			return activeHeading?.icon || Heading;
		} catch (e) {
			console.warn('Error getting heading icon:', e);
			return Heading;
		}
	});
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		<EdraToolTip tooltip={t('editor.toolbar.headings')}>
			<div
				class={buttonVariants({
					variant: 'ghost',
					size: 'icon',
					class: cn('gap-0')
				})}
				class:bg-muted={isActive}
			>
				<HeadingIcon />
				<ChevronDown class="text-muted-foreground !size-2" />
			</div>
		</EdraToolTip>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md" align="start">
		<DropdownMenu.Item 
			onclick={() => {
				try {
					editor?.chain().focus().setParagraph().run();
				} catch (e) {
					console.error('Error setting paragraph:', e);
				}
			}}
			class="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
		>
			<Paragraph class="mr-2 h-4 w-4" />
			<span>{t('editor.toolbar.misc.paragraph')}</span>
		</DropdownMenu.Item>
		{#each headings as heading (heading)}
			{@const Icon = heading.icon}
			<DropdownMenu.Item
				onclick={() => {
					try {
						const headingCommand = headings.find((h) => h.name === heading.name);
						if (headingCommand?.onClick && editor && !editor.isDestroyed) {
							headingCommand.onClick(editor);
						}
					} catch (e) {
						console.error('Error setting heading:', e);
					}
				}}
				class="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
			>
				{#if heading.name === 'h1'}
					<svelte:component this={Heading1} class="h-4 w-4" />
				{:else if heading.name === 'h2'}
					<svelte:component this={Heading2} class="h-4 w-4" />
				{:else if heading.name === 'h3'}
					<svelte:component this={Heading3} class="h-4 w-4" />
				{:else if heading.name === 'h4'}
					<svelte:component this={Heading4} class="h-4 w-4" />
				{:else}
					<svelte:component this={Heading1} class="h-4 w-4" />
				{/if}
				<span>Heading {heading.name.toUpperCase()}</span>
			</DropdownMenu.Item>
		{/each}
	</DropdownMenu.Content>
</DropdownMenu.Root>
