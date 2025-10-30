<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { ShouldShowProps } from '../../types.js';
	import BubbleMenu from '../../components/BubbleMenu.svelte';
	import type { Editor } from '@tiptap/core';
	import { Button } from '$lib/components/ui/button/index.js';
	import Copy from '@lucide/svelte/icons/copy';
	import Trash from '@lucide/svelte/icons/trash';

	export interface LinkMenuProps {
		editor: Editor;
		editorId?: string;
	}

	const { editor, editorId = 'default' }: LinkMenuProps = $props();

	let link = $derived.by(() => editor?.getAttributes('link').href || '');
	let isMounted = $state(false);

	onMount(() => {
		isMounted = true;
		return () => {
			isMounted = false;
		};
	});

	// Ensure we don't try to access editor after it's destroyed
	const safeEditorCall = (fn: (editor: Editor) => void) => {
		if (isMounted && editor && !editor.isDestroyed) {
			try {
				fn(editor);
			} catch (e) {
				console.warn('Editor operation failed:', e);
			}
		}
	};

	const removeLink = () => {
		safeEditorCall(e => e.chain().focus().extendMarkRange('link').unsetLink().run());
	};

	const copyLink = () => {
		if (link) {
			navigator.clipboard.writeText(link).catch(console.error);
		}
	};
</script>

{#if isMounted && editor && !editor.isDestroyed}
	<BubbleMenu
		editor={editor}
		editorId={editorId}
		pluginKey="link-bubble-menu"
		shouldShow={(props: ShouldShowProps) => {
			if (!props.editor?.isEditable) return false;
			return props.editor.isActive('link');
		}}
		options={{
			strategy: 'fixed'
		}}
		class="bg-popover flex h-fit w-fit items-center gap-1 rounded border p-1 shadow-lg"
	>
		<Button 
			variant="link" 
			href={link} 
			class="max-w-80 p-1" 
			target="_blank"
			on:click={(e) => {
				e.stopPropagation();
				e.preventDefault();
			}}
		>
			<span class="w-full overflow-hidden text-ellipsis">
				{link}
			</span>
		</Button>
		<Button
			variant="ghost"
			title="Copy Link"
			size="icon"
			class="z-50"
			on:click={(e) => {
				e.stopPropagation();
				copyLink();
			}}
		>
			<Copy class="h-4 w-4" />
		</Button>
		<Button
			variant="ghost"
			title="Remove Link"
			size="icon"
			on:click={(e) => {
				e.stopPropagation();
				removeLink();
			}}
		>
			<Trash class="h-4 w-4" />
		</Button>
	</BubbleMenu>
{/if}
