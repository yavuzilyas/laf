import { SvelteNodeViewRenderer } from 'svelte-tiptap';
import type { Component } from 'svelte';
import { Node, mergeAttributes, type CommandProps, type NodeViewProps } from '@tiptap/core';

export interface FileAttachmentOptions {
	HTMLAttributes: Record<string, object>;
}

export interface FileAttachmentAttributes {
	url: string;
	filename: string;
	size: string;
	type: string;
}

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		fileAttachment: {
			/**
			 * Inserts a file attachment
			 */
			insertFileAttachment: (attrs: FileAttachmentAttributes) => ReturnType;
		};
	}
}

export const FileExtended = (component: Component<NodeViewProps>): Node<FileAttachmentOptions, unknown> => {
	return Node.create<FileAttachmentOptions>({
		name: 'fileAttachment',
		group: 'block',
		draggable: true,
		atom: true,
		isolating: true,

		addAttributes() {
			return {
				url: {
					default: null
				},
				filename: {
					default: null
				},
				size: {
					default: null
				},
				type: {
					default: null
				}
			};
		},

		parseHTML() {
			return [
				{
					tag: 'div[data-type="file-attachment"]'
				}
			];
		},

		renderHTML({ HTMLAttributes }) {
			return ['div', mergeAttributes({ 'data-type': 'file-attachment' }, HTMLAttributes)];
		},

		addCommands() {
			return {
				insertFileAttachment: (attrs: FileAttachmentAttributes) => (props: CommandProps) => {
					return props.commands.insertContent({
						type: 'fileAttachment',
						attrs
					});
				}
			};
		},

		addNodeView() {
			return SvelteNodeViewRenderer(component);
		}
	});
};
