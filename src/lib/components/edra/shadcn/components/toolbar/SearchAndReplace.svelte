<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import type { Editor } from '@tiptap/core';
	import Search from '@lucide/svelte/icons/search';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import CaseSensitive from '@lucide/svelte/icons/case-sensitive';
	import Replace from '@lucide/svelte/icons/replace';
	import ReplaceAll from '@lucide/svelte/icons/replace-all';
	import { cn } from '$lib/utils.js';
	import { slide } from 'svelte/transition';
	import EdraToolTip from '../EdraToolTip.svelte';
  import { t,tJoin } from '$lib/stores/i18n.svelte.js';

	interface Props {
		editor: Editor;
	}

	const { editor }: Props = $props();

	let open = $state(false);
	let showMore = $state(false);

	let searchText = $state('');
	let replaceText = $state('');
	let caseSensitive = $state(false);

	let searchIndex = $derived(editor.storage?.searchAndReplace?.resultIndex);
	let searchCount = $derived(editor.storage?.searchAndReplace?.results.length);

	function updateSearchTerm(clearIndex: boolean = false) {
		if (clearIndex) editor.commands.resetIndex();

		editor.commands.setSearchTerm(searchText);
		editor.commands.setReplaceTerm(replaceText);
		editor.commands.setCaseSensitive(caseSensitive);
	}

	function goToSelection() {
		const { results, resultIndex } = editor.storage.searchAndReplace;
		const position = results[resultIndex];
		if (!position) return;
		editor.commands.setTextSelection(position);
		const { node } = editor.view.domAtPos(editor.state.selection.anchor);
		if (node instanceof HTMLElement) node.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}

	function replace() {
		editor.commands.replace();
		goToSelection();
	}

	const next = () => {
		editor.commands.nextSearchResult();
		goToSelection();
	};

	const previous = () => {
		editor.commands.previousSearchResult();
		goToSelection();
	};

	const clear = () => {
		searchText = '';
		replaceText = '';
		caseSensitive = false;
		editor.commands.resetIndex();
	};

	const replaceAll = () => editor.commands.replaceAll();
</script>

<DropdownMenu.Root
	bind:open
	onOpenChange={(value) => {
		if (value === false) {
			editor.commands.setSearchTerm('');
			editor.commands.setReplaceTerm('');
		}
	}}
>
	<DropdownMenu.Trigger>
		<EdraToolTip tooltip={t('editor.toolbar.searchAndReplace.title')}>
			<Button variant="ghost" size="icon" class="gap-0.5">
				<Search />
				<ChevronDown class="text-muted-foreground !size-2" />
			</Button>
		</EdraToolTip>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content
		class="z-50 min-w-[20rem] overflow-hidden rounded-md border bg-popover p-4 text-popover-foreground shadow-md"
	>
		
		<div class="flex size-full flex-col gap-1">
			<div class="flex w-full items-center gap-1">
				<Button
			variant="ghost"
			size="icon"
			class={cn('transition-transform', showMore && 'bg-muted rotate-90')}
			onclick={() => (showMore = !showMore)}
			title="Show More"
		>
			<ChevronRight />
		</Button>
				<Input
					placeholder={t('Search')}
					bind:value={searchText}
					oninput={() => updateSearchTerm()}
					class="w-40"
				/>
				<span class="text-muted-foreground text-sm"
					>{searchCount > 0 ? searchIndex + 1 : 0}/{searchCount}
				</span>
				<EdraToolTip tooltip={t('editor.toolbar.searchAndReplace.caseSensitive')}>
					<Button
						variant="ghost"
						size="icon"
						class={cn(caseSensitive && 'bg-muted')}
						onclick={() => {
							caseSensitive = !caseSensitive;
							updateSearchTerm();
						}}
					>
						<CaseSensitive />
					</Button>
				</EdraToolTip>
				<EdraToolTip tooltip={t('Previous')}>
					<Button variant="ghost" size="icon" onclick={previous} title={t('Previous')}>
						<ArrowLeft />
					</Button>
				</EdraToolTip>
				<EdraToolTip tooltip={t('Next')}>
					<Button variant="ghost" size="icon" onclick={next} title={t('Next')}>
						<ArrowRight />
					</Button>
				</EdraToolTip>
			</div>
			{#if showMore}
				<div transition:slide class="flex w-full items-center gap-1">
					<Input
						placeholder={t('Replace')}
						bind:value={replaceText}
						oninput={() => updateSearchTerm()}
						class="w-40"
					/>
					<EdraToolTip tooltip={t('Replace')}>
						<Button variant="ghost" size="icon" onclick={replace}>
							<Replace />
						</Button>
					</EdraToolTip>
					<EdraToolTip tooltip={tJoin(['Replace', 'all'])}>
						<Button variant="ghost" size="icon" onclick={replaceAll}>
							<ReplaceAll />
						</Button>
					</EdraToolTip>
				</div>
			{/if}
		</div>
	</DropdownMenu.Content>
</DropdownMenu.Root>
