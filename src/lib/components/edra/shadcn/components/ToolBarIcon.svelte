<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import type { EdraToolBarCommands } from '../../commands/types.js';
	import type { Editor } from '@tiptap/core';
	import EdraToolTip from './EdraToolTip.svelte';
	import { cn } from '$lib/utils.js';
	import { t } from '$lib/stores/i18n.svelte.js';

	interface Props {
		editor: Editor | undefined | null;
		command: EdraToolBarCommands;
	}

	const { editor, command }: Props = $props();
</script>

<EdraToolTip tooltip={t(`editor.toolbar.${command.name}`)} shortCut={command.shortCut ?? ''}>
	<Button
		variant="ghost"
		size="icon"
		class={cn(editor && command.isActive?.(editor) && 'bg-muted')}
		onclick={() => editor && command.onClick?.(editor)}
		disabled={!editor || (command.clickable ? !command.clickable(editor) : false)}
	>
		{@const Icon = command.icon}
		<Icon />
	</Button>
</EdraToolTip>
