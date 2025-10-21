<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Badge } from '$lib/components/ui/badge';
	import { getReactiveT } from '$lib/stores/i18n.svelte.js';
	import type { NotificationRecord } from '$lib/types/notification';

	export let open = false;
	export let notifications: NotificationRecord[] = [];
	export let unreadCount = 0;

	const dispatch = createEventDispatcher<{
		select: { notification: NotificationRecord };
		markAll: void;
	}>();

	function handleSelect(item: NotificationRecord) {
		dispatch('select', { notification: item });
	}

	function handleMarkAll() {
		dispatch('markAll');
	}

	function formatTimestamp(value: string) {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return '';
		return date.toLocaleString();
	}

	const translate = getReactiveT();
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="w-full sm:w-2/3 md:w-1/2">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<span>{translate('notifications.title') || 'Notifications'}</span>
				{#if unreadCount > 0}
					<Badge variant="destructive">+{unreadCount}</Badge>
				{/if}
			</Dialog.Title>
		</Dialog.Header>
		<div class="flex flex-col gap-4">
			{#if notifications.length > 0}
				<div class="flex justify-end">
					<Button size="sm" variant="outline" onclick={handleMarkAll} disabled={unreadCount === 0}>
						{translate('notifications.markAll') || 'Mark all as read'}
					</Button>
				</div>
				<ScrollArea class="max-h-96 pr-3">
					<div class="space-y-2">
						{#each notifications as item}
							<button
								type="button"
								class={item.read ? 'w-full rounded-lg border border-border px-4 py-3 text-left transition hover:border-primary/40' : 'w-full rounded-lg border border-primary/50 bg-primary/5 px-4 py-3 text-left transition hover:border-primary'}
								onclick={() => handleSelect(item)}
							>
								<div class="flex items-start justify-between gap-3">
									<div class="flex-1">
										<div class="font-semibold text-sm">{item.title}</div>
										<div class="text-xs text-muted-foreground leading-snug mt-1">{item.message}</div>
									</div>
									<div class="text-[10px] text-muted-foreground whitespace-nowrap">
										{formatTimestamp(item.createdAt)}
									</div>
								</div>
							</button>
						{/each}
					</div>
				</ScrollArea>
			{:else}
				<div class="text-center py-10 text-muted-foreground text-sm">{translate('notifications.empty') || 'No notifications yet'}</div>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
