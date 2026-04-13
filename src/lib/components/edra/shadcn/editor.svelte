<script lang="ts">
	import { onDestroy, onMount, setContext } from 'svelte';
	import { nanoid } from 'nanoid';
	import DragHandle from '../components/DragHandle.svelte';
	import type { EdraEditorProps } from '../types.js';
	import initEditor from '../editor.js';
	import { focusEditor } from '../utils.js';
	import { cn } from '$lib/utils.js';
	import '../editor.css';
	import './style.css';
	import '../onedark.css';
	import { ImagePlaceholder } from '../extensions/image/ImagePlaceholder.js';
	import ImagePlaceholderComp from './components/ImagePlaceholder.svelte';
	import { ImageExtended } from '../extensions/image/ImageExtended.js';
	import ImageExtendedComp from './components/ImageExtended.svelte';
	import { VideoPlaceholder } from '../extensions/video/VideoPlaceholder.js';
	import VideoPlaceHolderComp from './components/VideoPlaceholder.svelte';
	import { VideoExtended } from '../extensions/video/VideoExtended.js';
	import VideoExtendedComp from './components/VideoExtended.svelte';
	import { AudioPlaceholder } from '../extensions/audio/AudioPlaceholder.js';
	import { AudioExtended } from '../extensions/audio/AudiExtended.js';
	import AudioPlaceHolderComp from './components/AudioPlaceHolder.svelte';
	import AudioExtendedComp from './components/AudioExtended.svelte';
	import { FilePlaceholder } from '../extensions/file-attachment/FilePlaceholder.js';
	import { FileExtended } from '../extensions/file-attachment/FileExtended.js';
	import FilePlaceholderComp from './components/FilePlaceholder.svelte';
	import FileAttachmentComp from './components/FileAttachment.svelte';
	import { IFramePlaceholder } from '../extensions/iframe/IFramePlaceholder.js';
	import { IFrameExtended } from '../extensions/iframe/IFrameExtended.js';
	import IFramePlaceHolderComp from './components/IFramePlaceHolder.svelte';
	import IFrameExtendedComp from './components/IFrameExtended.svelte';
	import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
	import { all, createLowlight } from 'lowlight';
	import { SvelteNodeViewRenderer } from 'svelte-tiptap';
	import CodeBlock from './components/CodeBlock.svelte';
	import TableCol from './menus/TableCol.svelte';
	import TableRow from './menus/TableRow.svelte';
	import Link from './menus/Link.svelte';
	import slashcommand from '../extensions/slash-command/slashcommand.js';
	import SlashCommandList from './components/SlashCommandList.svelte';
	import { i18n } from '$lib/stores/i18n.svelte.js';

	const lowlight = createLowlight(all);

	/**
	 * Bind the element to the editor
	 */
	let element = $state<HTMLElement>();
	const editorId = `editor-${nanoid(8)}`;
	
	let {
		editor = $bindable(),
		editable = true,
		content,
		onUpdate,
		autofocus = false,
		class: className,
		id = editorId,
		commentId = null,
		dir = null
	}: EdraEditorProps & { id?: string; commentId?: string | null; dir?: 'rtl' | 'ltr' | null } = $props();

	const effectiveDir = $derived(dir || i18n.dir);

	// Provide commentId to child components via context and editor storage
	setContext('edraCommentId', () => commentId);

	// Reactively update editor attributes when direction changes
	$effect(() => {
		if (editor && !editor.isDestroyed) {
			editor.setOptions({
				editorProps: {
					attributes: {
						dir: effectiveDir
					}
				}
			});
		}
	});

	// Reactively update editor.storage when commentId changes
	$effect(() => {
		if (editor && commentId) {
			editor.storage.commentId = commentId;
			console.log('[EdraEditor] commentId updated in editor.storage:', commentId);
		}
	});

	onMount(() => {
		// Clean up any existing editor with the same ID
		if (editor && !editor.isDestroyed) {
			try {
				editor.destroy();
			} catch (e) {
			}
		}

		try {
			editor = initEditor(
				element,
				content,
				[
					CodeBlockLowlight.configure({
						lowlight
					}).extend({
						addNodeView() {
							return SvelteNodeViewRenderer(CodeBlock);
						}
					}),
					ImagePlaceholder(ImagePlaceholderComp),
					ImageExtended(ImageExtendedComp),
					VideoPlaceholder(VideoPlaceHolderComp),
					VideoExtended(VideoExtendedComp),
					AudioPlaceholder(AudioPlaceHolderComp),
					AudioExtended(AudioExtendedComp),
					FilePlaceholder(FilePlaceholderComp),
					FileExtended(FileAttachmentComp),
					IFramePlaceholder(IFramePlaceHolderComp),
					IFrameExtended(IFrameExtendedComp),
					slashcommand(SlashCommandList)
				],
				{
					...(onUpdate && { onUpdate }),
					editable,
					autofocus,
					editorProps: {
						attributes: {
							'data-editor-id': id,
							class: `edra-editor tiptap ${id}`,
							dir: effectiveDir
						}
					}
				}
			);

			// Store commentId in editor.storage for node views to access
			if (editor && commentId) {
				editor.storage.commentId = commentId;
				console.log('[EdraEditor] onMount: commentId stored in editor.storage:', commentId);
			}

			// Store the editor instance in a weak map for cleanup
			if (typeof window !== 'undefined') {
				if (!window.__edraEditors) {
					window.__edraEditors = new WeakMap();
				}
				window.__edraEditors.set(element, editor);
			}
		} catch (e) {
		}
	});

	onDestroy(() => {
		if (editor && !editor.isDestroyed) {
			try {
				editor.destroy();
			} catch (e) {
			}
		}

		// Clean up from window reference if it exists
		if (typeof window !== 'undefined' && window.__edraEditors && element) {
			window.__edraEditors.delete(element);
		}
	});
</script>

{#if editor && !editor.isDestroyed}
	<Link {editor} {id} />
	<TableCol {editor} {id} />
	<TableRow {editor} {id} />
	<DragHandle {editor} {id} class="drag-handle-component" />
{/if}
<div
	bind:this={element}
	role="button"
	tabindex="0"
	data-editor-instance={id}
	on:click|stopPropagation={(event) => focusEditor(editor, event)}
	on:keydown|stopPropagation={(event) => {
		if (event.key === 'Enter' || event.key === ' ') {
			focusEditor(editor, event);
		}
	}}
	dir={effectiveDir}
	class={cn('edra-editor selection:bg-primary selection:text-primary-foreground h-full w-full cursor-auto *:outline-none', className)}
></div>
