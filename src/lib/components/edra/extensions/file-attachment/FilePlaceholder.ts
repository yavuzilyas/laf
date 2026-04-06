import { Editor, Node, mergeAttributes, type CommandProps, type NodeViewProps } from '@tiptap/core';
import type { Component } from 'svelte';
import { SvelteNodeViewRenderer } from 'svelte-tiptap';
import { getFileSizeLimit } from '../../config/file-limits';

export interface FilePlaceholderOptions {
	HTMLAttributes: Record<string, object>;
	onDrop: (files: File[], editor: Editor) => void;
	onDropRejected?: (files: File[], editor: Editor) => void;
	onEmbed: (url: string, editor: Editor) => void;
	allowedMimeTypes?: Record<string, string[]>;
	maxFiles?: number;
	maxSize?: number;
}

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		filePlaceholder: {
			/**
			 * Inserts a file placeholder
			 */
			insertFilePlaceholder: () => ReturnType;
		};
	}
}

export const FilePlaceholder = (
	component: Component<NodeViewProps>
): Node<FilePlaceholderOptions> =>
	Node.create<FilePlaceholderOptions>({
		name: 'file-placeholder',
		addOptions() {
			return {
				HTMLAttributes: {},
				onDrop: () => {},
				onDropRejected: () => {},
				onEmbed: () => {},
				maxSize: getFileSizeLimit('file')
			};
		},
		parseHTML() {
			return [{ tag: `div[data-type="${this.name}"]` }];
		},

		renderHTML({ HTMLAttributes }) {
			return ['div', mergeAttributes(HTMLAttributes)];
		},
		group: 'block',
		draggable: true,
		atom: true,
		content: 'inline*',
		isolating: true,

		addNodeView() {
			return SvelteNodeViewRenderer(component);
		},
		addCommands() {
			return {
				insertFilePlaceholder: () => (props: CommandProps) => {
					return props.commands.insertContent({
						type: 'file-placeholder'
					});
				}
			};
		}
	});
