<script lang="ts">
	import { onMount } from 'svelte';
	import { nanoid } from 'nanoid';
	import type { Editor } from '@tiptap/core';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import { DragHandlePlugin } from '../extensions/drag-handle/index.js';

	export interface DragHandleProps {
		editor: Editor;
		editorId?: string;
	}

	const { editor, editorId = `drag-handle-${nanoid(8)}` }: DragHandleProps = $props();

	// Generate a unique selector for this instance
	const dragHandleSelector = `.drag-handle[data-editor-id="${editorId}"]`;

	onMount(() => {
		if (!editor || editor.isDestroyed) return;

		// Unregister any existing plugin with the same key
		try {
			editor.unregisterPlugin(editorId);
		} catch (e) {
			// Ignore if plugin wasn't registered
		}

		const plugin = DragHandlePlugin({
			pluginKey: editorId,
			dragHandleWidth: 20,
			scrollTreshold: 100,
			dragHandleSelector: dragHandleSelector,
			excludedTags: ['pre', 'code', 'table p'],
			customNodes: []
		});

		editor.registerPlugin(plugin);

		return () => {
			try {
				if (editor && !editor.isDestroyed) {
					editor.unregisterPlugin(editorId);
				}
			} catch (e) {
				console.warn('Error unregistering drag handle plugin:', e);
			}
		};
	});

	// Handle editor changes
	$effect(() => {
		if (editor && !editor.isDestroyed) {
			// Force update the drag handle when editor content changes
			const updateDragHandle = () => {
				const dragHandle = document.querySelector(dragHandleSelector);
				if (dragHandle) {
					dragHandle.setAttribute('data-editor-ready', 'true');
				}
			};

			editor.on('update', updateDragHandle);
			editor.on('selectionUpdate', updateDragHandle);

			return () => {
				editor.off('update', updateDragHandle);
				editor.off('selectionUpdate', updateDragHandle);
			};
		}
	});
</script>

<div 
	class="drag-handle" 
	data-editor-id={editorId}
	on:mousedown|stopPropagation
	on:touchstart|stopPropagation
>
	<GripVertical class="h-4 w-4 opacity-50 hover:opacity-100 transition-opacity" />
</div>
