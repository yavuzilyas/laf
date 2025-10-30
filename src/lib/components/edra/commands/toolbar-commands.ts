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
				} catch (e) {
					console.error('Error undoing action:', e);
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.undo?.() ?? false;
				} catch (e) {
					console.error('Error checking if undo is available:', e);
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
				} catch (e) {
					console.error('Error redoing action:', e);
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.redo?.() ?? false;
				} catch (e) {
					console.error('Error checking if redo is available:', e);
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
				} catch (e) {
					console.error('Error toggling heading 1:', e);
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.toggleHeading?.({ level: 1 }) ?? false;
				} catch (e) {
					console.error('Error checking if heading 1 is clickable:', e);
					return false;
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('heading', { level: 1 }) ?? false;
				} catch (e) {
					console.error('Error checking heading 1 active state:', e);
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
				} catch (e) {
					console.error('Error toggling heading 2:', e);
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.toggleHeading?.({ level: 2 }) ?? false;
				} catch (e) {
					console.error('Error checking if heading 2 is clickable:', e);
					return false;
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('heading', { level: 2 }) ?? false;
				} catch (e) {
					console.error('Error checking heading 2 active state:', e);
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
				} catch (e) {
					console.error('Error toggling heading 3:', e);
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.toggleHeading?.({ level: 3 }) ?? false;
				} catch (e) {
					console.error('Error checking if heading 3 is clickable:', e);
					return false;
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('heading', { level: 3 }) ?? false;
				} catch (e) {
					console.error('Error checking heading 3 active state:', e);
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
				} catch (e) {
					console.error('Error toggling heading 4:', e);
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.toggleHeading?.({ level: 4 }) ?? false;
				} catch (e) {
					console.error('Error checking if heading 4 is clickable:', e);
					return false;
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('heading', { level: 4 }) ?? false;
				} catch (e) {
					console.error('Error checking heading 4 active state:', e);
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
				} catch (e) {
					console.error('Error handling link:', e);
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('link') ?? false;
				} catch (e) {
					console.error('Error checking link active state:', e);
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
				} catch (e) {
					console.error('Error toggling bold:', e);
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.toggleBold?.() ?? false;
				} catch (e) {
					console.error('Error checking if bold is clickable:', e);
					return false;
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('bold') ?? false;
				} catch (e) {
					console.error('Error checking bold active state:', e);
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
				} catch (e) {
					console.error('Error toggling italic:', e);
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.toggleItalic?.() ?? false;
				} catch (e) {
					console.error('Error checking if italic is clickable:', e);
					return false;
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('italic') ?? false;
				} catch (e) {
					console.error('Error checking italic active state:', e);
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
				} catch (e) {
					console.error('Error toggling underline:', e);
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.toggleUnderline?.() ?? false;
				} catch (e) {
					console.error('Error checking if underline is clickable:', e);
					return false;
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('underline') ?? false;
				} catch (e) {
					console.error('Error checking underline active state:', e);
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
				} catch (e) {
					console.error('Error toggling strikethrough:', e);
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.toggleStrike?.() ?? false;
				} catch (e) {
					console.error('Error checking if strikethrough is clickable:', e);
					return false;
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('strike') ?? false;
				} catch (e) {
					console.error('Error checking strikethrough active state:', e);
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
				} catch (e) {
					console.error('Error toggling blockquote:', e);
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.toggleBlockquote?.() ?? false;
				} catch (e) {
					console.error('Error checking if blockquote is clickable:', e);
					return false;
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('blockquote') ?? false;
				} catch (e) {
					console.error('Error checking blockquote active state:', e);
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
				} catch (e) {
					console.error('Error toggling code:', e);
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.toggleCode?.() ?? false;
				} catch (e) {
					console.error('Error checking if code is clickable:', e);
					return false;
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('code') ?? false;
				} catch (e) {
					console.error('Error checking code active state:', e);
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
				} catch (e) {
					console.error('Error toggling superscript:', e);
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.toggleSuperscript?.() ?? false;
				} catch (e) {
					console.error('Error checking if superscript is clickable:', e);
					return false;
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('superscript') ?? false;
				} catch (e) {
					console.error('Error checking superscript active state:', e);
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
				} catch (e) {
					console.error('Error toggling subscript:', e);
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.toggleSubscript?.() ?? false;
				} catch (e) {
					console.error('Error checking if subscript is clickable:', e);
					return false;
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('subscript') ?? false;
				} catch (e) {
					console.error('Error checking subscript active state:', e);
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
				} catch (e) {
					console.error('Error setting text align left:', e);
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.setTextAlign?.('left') ?? false;
				} catch (e) {
					console.error('Error checking if align left is clickable:', e);
					return false;
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.({ textAlign: 'left' }) ?? false;
				} catch (e) {
					console.error('Error checking align left active state:', e);
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
				} catch (e) {
					console.error('Error setting text align center:', e);
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.setTextAlign?.('center') ?? false;
				} catch (e) {
					console.error('Error checking if align center is clickable:', e);
					return false;
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.({ textAlign: 'center' }) ?? false;
				} catch (e) {
					console.error('Error checking align center active state:', e);
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
				} catch (e) {
					console.error('Error setting text align right:', e);
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.setTextAlign?.('right') ?? false;
				} catch (e) {
					console.error('Error checking if align right is clickable:', e);
					return false;
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.({ textAlign: 'right' }) ?? false;
				} catch (e) {
					console.error('Error checking align right active state:', e);
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
				} catch (e) {
					console.error('Error setting text align justify:', e);
				}
			},
			clickable: (editor) => {
				try {
					return editor?.can?.()?.setTextAlign?.('justify') ?? false;
				} catch (e) {
					console.error('Error checking if align justify is clickable:', e);
					return false;
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.({ textAlign: 'justify' }) ?? false;
				} catch (e) {
					console.error('Error checking align justify active state:', e);
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
				} catch (e) {
					console.error('Error toggling bullet list:', e);
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('bulletList') ?? false;
				} catch (e) {
					console.error('Error checking bullet list active state:', e);
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
				} catch (e) {
					console.error('Error toggling ordered list:', e);
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('orderedList') ?? false;
				} catch (e) {
					console.error('Error checking ordered list active state:', e);
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
				} catch (e) {
					console.error('Error toggling task list:', e);
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('taskList') ?? false;
				} catch (e) {
					console.error('Error checking task list active state:', e);
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
				} catch (e) {
					console.error('Error inserting image placeholder:', e);
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('image-placeholder') ?? false;
				} catch (e) {
					console.error('Error checking image placeholder active state:', e);
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
				} catch (e) {
					console.error('Error inserting video placeholder:', e);
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('video-placeholder') ?? false;
				} catch (e) {
					console.error('Error checking video placeholder active state:', e);
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
				} catch (e) {
					console.error('Error inserting audio placeholder:', e);
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('audio-placeholder') ?? false;
				} catch (e) {
					console.error('Error checking audio placeholder active state:', e);
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
				} catch (e) {
					console.error('Error inserting iframe placeholder:', e);
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('iframe-placeholder') ?? false;
				} catch (e) {
					console.error('Error checking iframe placeholder active state:', e);
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
				} catch (e) {
					console.error('Error handling table action:', e);
				}
			},
			isActive: (editor) => {
				try {
					return editor?.isActive?.('table') ?? false;
				} catch (e) {
					console.error('Error checking table active state:', e);
					return false;
				}
			}
		}
	]
};

export default commands;