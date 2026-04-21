<script lang="ts">
	import type { Editor } from '@tiptap/core';
	import { cn } from '$lib/utils.js';
	import commands from '../commands/toolbar-commands.js';
	import type { EdraToolbarProps } from '../types.js';
	import Alignment from './components/toolbar/Alignment.svelte';
	import FontSize from './components/toolbar/FontSize.svelte';
	import Headings from './components/toolbar/Headings.svelte';
	import QuickColors from './components/toolbar/QuickColors.svelte';
	import SearchAndReplace from './components/toolbar/SearchAndReplace.svelte';
	import ToolBarIcon from './components/ToolBarIcon.svelte';
	import LinkDialog from './components/toolbar/LinkDialog.svelte';
	import ScrollToLineDialog from './components/toolbar/ScrollToLineDialog.svelte';

	interface Props {
		editor: Editor | null;
		articleId?: string | null;
		commentId?: string | null;
		class?: string;
		excludedCommands?: string[];
		children?: any;
	}

	const { editor = null, articleId = null, commentId = null, class: className = '', excludedCommands = [], children }: Props = $props();

	const toolbarCommands = Object.keys(commands).filter((key) => !excludedCommands?.includes(key));
</script>
<div class={cn('edra-toolbar flex flex-nowrap overflow-x-auto overflow-y-hidden gap-1 p-2 items-center', className)}>
	{#if children}
		{@render children()}
	{:else if editor}
		{#each toolbarCommands as cmd (cmd)}
			{#if cmd === 'headings'}
				<Headings {editor} />
			{:else if cmd === 'alignment'}
				<Alignment {editor} />
			{:else}
				{@const commandGroup = commands[cmd]}
				{#each commandGroup as command (command)}
					{#if command.name === 'link'}
						<LinkDialog editor={editor} />
					{:else if command.name === 'image-placeholder'}
						<ToolBarIcon {editor} {command} />
					{:else}
						<ToolBarIcon {editor} {command} />
					{/if}
				{/each}
			{/if}
		{/each}
				<ScrollToLineDialog editor={editor} />

		<FontSize {editor} />
		<QuickColors {editor} />
		<SearchAndReplace {editor} />
	{/if}
</div>

<style>
	:global(.compact-toolbar .lucide-icon),
	:global(.compact-toolbar svg[class*="lucide"]) {
		width: 14px;
		height: 14px;
	}
	:global(.compact-toolbar button) {
		height: 28px;
		width: 28px;
		min-height: 28px;
		min-width: 28px;
		padding: 0;
	}
</style>
