import type { EdraToolBarCommands } from './types.js';
import { isMac } from '../utils.js';
import Undo from '@lucide/svelte/icons/undo-2';
import Redo from '@lucide/svelte/icons/redo-2';
import Heading1 from '@lucide/svelte/icons/heading-1';
import Heading2 from '@lucide/svelte/icons/heading-2';
import Heading3 from '@lucide/svelte/icons/heading-3';
import Heading4 from '@lucide/svelte/icons/heading-4';
import Link from '@lucide/svelte/icons/link-2';
import Bold from '@lucide/svelte/icons/bold';
import Italic from '@lucide/svelte/icons/italic';
import Underline from '@lucide/svelte/icons/underline';
import StrikeThrough from '@lucide/svelte/icons/strikethrough';
import Quote from '@lucide/svelte/icons/quote';
import Code from '@lucide/svelte/icons/code';
import Superscript from '@lucide/svelte/icons/superscript';
import Subscript from '@lucide/svelte/icons/subscript';
import AlignLeft from '@lucide/svelte/icons/align-left';
import AlignCenter from '@lucide/svelte/icons/align-center';
import AlignRight from '@lucide/svelte/icons/align-right';
import AlighJustify from '@lucide/svelte/icons/align-justify';
import List from '@lucide/svelte/icons/list';
import ListOrdered from '@lucide/svelte/icons/list-ordered';
import ListChecks from '@lucide/svelte/icons/list-checks';
import Image from '@lucide/svelte/icons/image';
import Video from '@lucide/svelte/icons/video';
import Audio from '@lucide/svelte/icons/audio-lines';
import IFrame from '@lucide/svelte/icons/code-xml';
import Table from '@lucide/svelte/icons/table';

const commands: Record<string, EdraToolBarCommands[]> = {
	'undo-redo': [
		{
			icon: Undo,
			name: 'undo',
			tooltip: 'Undo',
			shortCut: `${isMac ? '⌘' : 'Ctrl+'}Z`,
			onClick: (editor) => {
				try {
					editor?.chain()?.focus()?.undo()?.run();
				} catch {
					// Silent fail
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.undo?.() ?? false;
				} catch {
					return false;
				}
			}
		},
		{
			icon: Redo,
			name: 'redo',
			tooltip: 'Redo',
			shortCut: `${isMac ? '⌘' : 'Ctrl+'}Y`,
			onClick: (editor) => {
				try {
					editor?.chain()?.focus()?.redo()?.run();
				} catch {
					// Silent fail
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.redo?.() ?? false;
				} catch {
					return false;
				}
			}
		}
	],
	headings: [
		{
			icon: Heading1,
			name: 'h1',
			tooltip: 'Heading 1',
			shortCut: `${isMac ? '⌘⌥' : 'Ctrl+Alt+'}1`,
			onClick: (editor) => {
				try {
					editor?.chain()?.focus()?.toggleHeading({ level: 1 })?.run();
				} catch {
					// Silent fail
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.toggleHeading?.({ level: 1 }) ?? false;
				} catch {
					return false;
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('heading', { level: 1 }) ?? false;
				} catch {
					return false;
				}
			}
		},
		{
			icon: Heading2,
			name: 'h2',
			tooltip: 'Heading 2',
			shortCut: `${isMac ? '⌘⌥' : 'Ctrl+Alt+'}2`,
			onClick: (editor) => {
				try {
					editor?.chain()?.focus()?.toggleHeading({ level: 2 })?.run();
				} catch {
					// Silent fail
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.toggleHeading?.({ level: 2 }) ?? false;
				} catch {
					return false;
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('heading', { level: 2 }) ?? false;
				} catch {
					return false;
				}
			}
		},
		{
			icon: Heading3,
			name: 'h3',
			tooltip: 'Heading 3',
			shortCut: `${isMac ? '⌘⌥' : 'Ctrl+Alt+'}3`,
			onClick: (editor) => {
				try {
					editor?.chain()?.focus()?.toggleHeading({ level: 3 })?.run();
				} catch {
					// Silent fail
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.toggleHeading?.({ level: 3 }) ?? false;
				} catch {
					return false;
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('heading', { level: 3 }) ?? false;
				} catch {
					return false;
				}
			}
		},
		{
			icon: Heading4,
			name: 'h4',
			tooltip: 'Heading 4',
			shortCut: `${isMac ? '⌘⌥' : 'Ctrl+Alt+'}4`,
			onClick: (editor) => {
				try {
					editor?.chain()?.focus()?.toggleHeading({ level: 4 })?.run();
				} catch {
					// Silent fail
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.toggleHeading?.({ level: 4 }) ?? false;
				} catch {
					return false;
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('heading', { level: 4 }) ?? false;
				} catch {
					return false;
				}
			}
		}
	],
	'text-formatting': [
		{
			icon: Link,
			name: 'link',
			tooltip: 'Link',
			onClick: (editor) => {
				try {
					if (!editor) return;
					if (editor.isActive('link')) {
						editor.chain().focus().unsetLink().run();
					} else {
						const url = window.prompt('Enter the URL of the link:');
						if (url) {
							editor.chain().focus().toggleLink({ href: url }).run();
						}
					}
				} catch {
					// Silent fail
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('link') ?? false;
				} catch {
					return false;
				}
			}
		},
		{
			icon: Bold,
			name: 'bold',
			tooltip: 'Bold',
			shortCut: `${isMac ? '⌘' : 'Ctrl+'}B`,
			onClick: (editor) => {
				try {
					editor?.chain()?.focus()?.toggleBold()?.run();
				} catch {
					// Silent fail
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.toggleBold?.() ?? false;
				} catch {
					return false;
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('bold') ?? false;
				} catch {
					return false;
				}
			}
		},
		{
			icon: Italic,
			name: 'italic',
			tooltip: 'Italic',
			shortCut: `${isMac ? '⌘' : 'Ctrl+'}I`,
			onClick: (editor) => {
				try {
					editor?.chain()?.focus()?.toggleItalic()?.run();
				} catch {
					// Silent fail
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.toggleItalic?.() ?? false;
				} catch {
					return false;
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('italic') ?? false;
				} catch {
					return false;
				}
			}
		},
		{
			icon: Underline,
			name: 'underline',
			tooltip: 'Underline',
			shortCut: `${isMac ? '⌘' : 'Ctrl+'}U`,
			onClick: (editor) => {
				try {
					editor?.chain()?.focus()?.toggleUnderline()?.run();
				} catch {
					// Silent fail
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.toggleUnderline?.() ?? false;
				} catch {
					return false;
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('underline') ?? false;
				} catch {
					return false;
				}
			}
		},
		{
			icon: StrikeThrough,
			name: 'strikethrough',
			tooltip: 'Strikethrough',
			shortCut: `${isMac ? '⌘⇧' : 'Ctrl+Shift+'}S`,
			onClick: (editor) => {
				try {
					editor?.chain()?.focus()?.toggleStrike()?.run();
				} catch {
					// Silent fail
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.toggleStrike?.() ?? false;
				} catch {
					return false;
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('strike') ?? false;
				} catch {
					return false;
				}
			}
		},
		{
			icon: Quote,
			name: 'blockquote',
			tooltip: 'Blockquote',
			shortCut: `${isMac ? '⌘⇧' : 'Ctrl+Shift+'}B`,
			onClick: (editor) => {
				try {
					editor?.chain()?.focus()?.toggleBlockquote()?.run();
				} catch {
					// Silent fail
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.toggleBlockquote?.() ?? false;
				} catch {
					return false;
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('blockquote') ?? false;
				} catch {
					return false;
				}
			}
		},
		{
			icon: Code,
			name: 'code',
			tooltip: 'Inline Code',
			shortCut: `${isMac ? '⌘' : 'Ctrl+'}E`,
			onClick: (editor) => {
				try {
					editor?.chain()?.focus()?.toggleCode()?.run();
				} catch {
					// Silent fail
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.toggleCode?.() ?? false;
				} catch {
					return false;
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('code') ?? false;
				} catch {
					return false;
				}
			}
		},
		{
			icon: Superscript,
			name: 'superscript',
			tooltip: 'Superscript',
			shortCut: `${isMac ? '⌘' : 'Ctrl+'}.`,
			onClick: (editor) => {
				try {
					editor?.chain()?.focus()?.toggleSuperscript()?.run();
				} catch {
					// Silent fail
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.toggleSuperscript?.() ?? false;
				} catch {
					return false;
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('superscript') ?? false;
				} catch {
					return false;
				}
			}
		},
		{
			icon: Subscript,
			name: 'subscript',
			tooltip: 'Subscript',
			shortCut: `${isMac ? '⌘' : 'Ctrl+'},`,
			onClick: (editor) => {
				try {
					editor?.chain()?.focus()?.toggleSubscript()?.run();
				} catch {
					// Silent fail
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.toggleSubscript?.() ?? false;
				} catch {
					return false;
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('subscript') ?? false;
				} catch {
					return false;
				}
			}
		}
	],
	alignment: [
		{
			icon: AlignLeft,
			name: 'align-left',
			tooltip: 'Align Left',
			shortCut: `${isMac ? '⌘⇧' : 'Ctrl+Shift+'}L`,
			onClick: (editor) => {
				try {
					editor?.chain()?.focus()?.setTextAlign('left')?.run();
				} catch {
					// Silent fail
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.setTextAlign?.('left') ?? false;
				} catch {
					return false;
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.({ textAlign: 'left' }) ?? false;
				} catch {
					return false;
				}
			}
		},
		{
			icon: AlignCenter,
			name: 'align-center',
			tooltip: 'Align Center',
			shortCut: `${isMac ? '⌘⇧' : 'Ctrl+Shift+'}E`,
			onClick: (editor) => {
				try {
					editor?.chain()?.focus()?.setTextAlign('center')?.run();
				} catch {
					// Silent fail
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.setTextAlign?.('center') ?? false;
				} catch {
					return false;
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.({ textAlign: 'center' }) ?? false;
				} catch {
					return false;
				}
			}
		},
		{
			icon: AlignRight,
			name: 'align-right',
			tooltip: 'Align Right',
			shortCut: `${isMac ? '⌘⇧' : 'Ctrl+Shift+'}R`,
			onClick: (editor) => {
				try {
					editor?.chain()?.focus()?.setTextAlign('right')?.run();
				} catch {
					// Silent fail
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.setTextAlign?.('right') ?? false;
				} catch {
					return false;
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.({ textAlign: 'right' }) ?? false;
				} catch {
					return false;
				}
			}
		},
		{
			icon: AlighJustify,
			name: 'align-justify',
			tooltip: 'Align Justify',
			shortCut: `${isMac ? '⌘⇧' : 'Ctrl+Shift+'}J`,
			onClick: (editor) => {
				try {
					editor?.chain()?.focus()?.setTextAlign('justify')?.run();
				} catch {
					// Silent fail
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.setTextAlign?.('justify') ?? false;
				} catch {
					return false;
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.({ textAlign: 'justify' }) ?? false;
				} catch {
					return false;
				}
			}
		}
	],
	lists: [
		{
			icon: List,
			name: 'bulletList',
			tooltip: 'Bullet List',
			shortCut: `${isMac ? '⌘⇧' : 'Ctrl+Shift+'}8`,
			onClick: (editor) => {
				try {
					editor?.chain()?.focus()?.toggleBulletList()?.run();
				} catch {
					// Silent fail
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('bulletList') ?? false;
				} catch {
					return false;
				}
			}
		},
		{
			icon: ListOrdered,
			name: 'orderedList',
			tooltip: 'Ordered List',
			shortCut: `${isMac ? '⌘⇧' : 'Ctrl+Shift+'}7`,
			onClick: (editor) => {
				try {
					editor?.chain()?.focus()?.toggleOrderedList()?.run();
				} catch {
					// Silent fail
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('orderedList') ?? false;
				} catch {
					return false;
				}
			}
		},
		{
			icon: ListChecks,
			name: 'taskList',
			tooltip: 'Task List',
			shortCut: `${isMac ? '⌘⇧' : 'Ctrl+Shift+'}9`,
			onClick: (editor) => {
				try {
					editor?.chain()?.focus()?.toggleTaskList()?.run();
				} catch {
					// Silent fail
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('taskList') ?? false;
				} catch {
					return false;
				}
			}
		}
	],
	media: [
		{
			icon: Image,
			name: 'image-placeholder',
			tooltip: 'Image Placeholder',
			onClick: (editor) => {
				try {
					editor?.chain()?.focus()?.insertImagePlaceholder()?.run();
				} catch {
					// Silent fail
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('image-placeholder') ?? false;
				} catch {
					return false;
				}
			}
		},
		{
			icon: Video,
			name: 'video-placeholder',
			tooltip: 'Video Placeholder',
			onClick: (editor) => {
				try {
					editor?.chain()?.focus()?.insertVideoPlaceholder()?.run();
				} catch {
					// Silent fail
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('video-placeholder') ?? false;
				} catch {
					return false;
				}
			}
		},
		{
			icon: Audio,
			name: 'audio-placeholder',
			tooltip: 'Audio Placeholder',
			onClick: (editor) => {
				try {
					editor?.chain()?.focus()?.insertAudioPlaceholder()?.run();
				} catch {
					// Silent fail
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('audio-placeholder') ?? false;
				} catch {
					return false;
				}
			}
		},
		{
			icon: IFrame,
			name: 'iframe-placeholder',
			tooltip: 'IFrame Placeholder',
			onClick: (editor) => {
				try {
					editor?.chain()?.focus()?.insertIFramePlaceholder()?.run();
				} catch {
					// Silent fail
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('iframe-placeholder') ?? false;
				} catch {
					return false;
				}
			}
		}
	],
	table: [
		{
			icon: Table,
			name: 'table',
			tooltip: 'Table',
			onClick: (editor) => {
				try {
					if (editor?.isActive?.('table')) {
						const del = confirm('Do you really want to delete this table?');
						if (del) {
							editor.chain().focus().deleteTable().run();
						}
						return;
					}
					editor?.chain()?.focus()?.insertTable({ cols: 3, rows: 3, withHeaderRow: false })?.run();
				} catch {
					// Silent fail
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('table') ?? false;
				} catch {
					return false;
				}
			}
		}
	]
};

export default commands;