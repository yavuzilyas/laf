<script lang="ts">
	import { onMount, onDestroy, type Snippet } from 'svelte';
	import { BubbleMenuPlugin, type BubbleMenuPluginProps } from '@tiptap/extension-bubble-menu';
	import type { Editor } from '@tiptap/core';

	// Add global type for editor instances
	declare global {
		interface Window {
			__edraBubbleMenus?: Map<string, any>;
		}
	}

	type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

	export interface BubbleMenuProps
		extends Optional<Omit<Optional<BubbleMenuPluginProps, 'pluginKey'>, 'element'>, 'editor'> {
		editor?: Editor;
		editorId?: string;
		children?: Snippet<[]>;
		class?: string;
		style?: string;
		pluginKey?: string;
		updateDelay?: number;
		resizeDelay?: number;
	}

	let {
		editor,
		editorId = 'default',
		shouldShow = null,
		class: className = '',
		style = '',
		children,
		updateDelay,
		resizeDelay,
		pluginKey = 'bubbleMenu',
		options = {},
		...restProps
	} = $props<BubbleMenuProps>();

	let element: HTMLElement | null = null;
	let bubbleMenuInstance: any = null;

	// Initialize window.edraBubbleMenus if it doesn't exist
	if (typeof window !== 'undefined' && !window.__edraBubbleMenus) {
		window.__edraBubbleMenus = new Map();
	}

	onMount(() => {
		if (!element) return;

		element.style.position = 'absolute';
		element.style.visibility = 'hidden';

		if (!editor || editor.isDestroyed) {
			console.warn('BubbleMenu component does not have editor prop or editor is destroyed.');
			return;
		}

		// Clean up any existing bubble menu for this editor instance
		const instanceKey = `${editorId}-${pluginKey}`;
		const existingInstance = window.__edraBubbleMenus?.get(instanceKey);
		
		if (existingInstance) {
			try {
				editor.view.dom.removeEventListener('blur', existingInstance.handleBlur);
				existingInstance.destroy();
			} catch (e) {
				console.warn('Error cleaning up existing bubble menu:', e);
			}
		}

		try {
			bubbleMenuInstance = BubbleMenuPlugin({
				pluginKey: instanceKey,
				editor,
				element,
				shouldShow: (props: any) => {
					if (!editor.isEditable) return false;
					return shouldShow ? shouldShow(props) : true;
				},
				updateDelay,
				resizeDelay,
				...options
			});

			// Store the instance for cleanup
			if (window.__edraBubbleMenus) {
				const handleBlur = () => {
					// Hide the bubble menu when editor loses focus
					if (element) {
						element.style.visibility = 'hidden';
					}
				};

				window.__edraBubbleMenus.set(instanceKey, {
					...bubbleMenuInstance,
					handleBlur
				});

				// Add blur handler to hide menu when editor loses focus
				editor.view.dom.addEventListener('blur', handleBlur);
			}

		} catch (e) {
			console.error('Error initializing bubble menu:', e);
		}

		return () => {
			if (bubbleMenuInstance && !bubbleMenuInstance.destroyed) {
				try {
					const instanceKey = `${editorId}-${pluginKey}`;
					const instance = window.__edraBubbleMenus?.get(instanceKey);
					
					if (instance?.handleBlur) {
						editor.view.dom.removeEventListener('blur', instance.handleBlur);
					}
					
					bubbleMenuInstance.destroy();
				} catch (e) {
					console.warn('Error cleaning up bubble menu:', e);
				}
			}
			
			if (window.__edraBubbleMenus) {
				window.__edraBubbleMenus.delete(`${editorId}-${pluginKey}`);
			}
		};
	});

	onDestroy(() => {
		if (!editor || !bubbleMenuInstance) return;

		const instanceKey = `${editorId}-${pluginKey}`;
		
		try {
			const instance = window.__edraBubbleMenus?.get(instanceKey);
			
			if (instance?.handleBlur) {
				editor.view.dom.removeEventListener('blur', instance.handleBlur);
			}
			
			if (bubbleMenuInstance && !bubbleMenuInstance.destroyed) {
				bubbleMenuInstance.destroy();
			}
		} catch (e) {
			console.warn('Error in bubble menu cleanup:', e);
		}

		if (window.__edraBubbleMenus) {
			window.__edraBubbleMenus.delete(instanceKey);
		}
	});
</script>

<div bind:this={element} class={`bubble-menu-wrapper ${className}`} {style} {...restProps}>
	{@render children?.()}
</div>
