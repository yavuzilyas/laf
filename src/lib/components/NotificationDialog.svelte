<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Trash2, UserX, Ellipsis } from '@lucide/svelte';
	import type { NotificationRecord } from '$lib/types/notification';
	import { t } from '$lib/stores/i18n.svelte.ts';
	import { Badge } from '$lib/components/ui/badge';

	export let open = false;
	export let notifications: NotificationRecord[] = [];
	export let unreadCount = 0;
	export let blockedActorIds: string[] = [];

	const dispatch = createEventDispatcher<{
		select: { notification: NotificationRecord };
		markAll: void;
		delete: { notification: NotificationRecord };
		block: { notification: NotificationRecord };
		unblock: { notification: NotificationRecord };
	}>();

	function handleSelect(item: any) {
		const n = item as NotificationRecord;
		dispatch('select', { notification: n });
	}

	function handleDelete(item: any) {
		const n = item as NotificationRecord;
		dispatch('delete', { notification: n });
	}

	function handleBlock(item: any) {
		const n = item as NotificationRecord;
		dispatch('block', { notification: n });
	}

	function handleUnblock(item: any) {
		const n = item as NotificationRecord;
		dispatch('unblock', { notification: n });
	}

	function handleMarkAll() {
		dispatch('markAll');
	}

	function formatTimestamp(value: string) {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return '';
		return date.toLocaleString();
	}

</script>

<Dialog.Root bind:open>
	<Dialog.Content class="w-full sm:w-2/3 md:w-1/2">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<span>{t('notifications.title') || 'Notifications'}</span>
				{#if unreadCount > 0}
					<Badge variant="destructive">+{unreadCount}</Badge>
				{/if}
			</Dialog.Title>
		</Dialog.Header>
		<div class="flex flex-col gap-4">
			{#if notifications.length > 0}
				<div class="flex justify-end">
					<Button size="sm" variant="outline" onclick={handleMarkAll} disabled={unreadCount === 0}>
						{t('notifications.markAll') || 'Mark all as read'}
					</Button>
				</div>
				<ScrollArea class="max-h-96 pr-3">
					<div class="space-y-2">
						{#each notifications as item}
							<div class="relative group">
								<button
									type="button"
									class="w-full rounded-lg border border-border px-4 py-3 text-left transition hover:border-primary/40 {item.read ? '' : 'border-primary/50 bg-primary/5'}"
									onclick={() => handleSelect(item)}
								>
									<div class="flex flex-col items-start gap-3">
										<div class="flex flex-row gap-2">
											
											<div class="font-semibold text-sm">{item.title}</div>
																					<div class="text-[10px] text-muted-foreground whitespace-nowrap">
											{formatTimestamp(item.createdAt)}
										</div>
										</div>
											<div class="text-xs text-muted-foreground leading-snug mt-1">{item.message}</div>

									</div>
								</button>

								<!-- Dropdown Menu for actions -->
								<div class="absolute top-2 right-2">
									<DropdownMenu.Root>
										<DropdownMenu.Trigger >
											<Button size="xs" variant="outline" class="h-6 w-6 p-0">
												<Ellipsis class="h-4 w-4" />
											</Button>
										</DropdownMenu.Trigger>
										<DropdownMenu.Content align="end" class="w-48">
											<DropdownMenu.Item onclick={() => handleDelete(item)} class="text-destructive">
												<Trash2 class="mr-2 h-4 w-4" />
												{t('notifications.delete') || 'Sil'}
											</DropdownMenu.Item>
											{#if item.actor?.id}
												{#if blockedActorIds && blockedActorIds.includes(item.actor.id)}
													<DropdownMenu.Item onclick={() => handleUnblock(item)}>
														<UserX class="mr-2 h-4 w-4" />
														{t('notifications.unblockUser') || 'Bu kişiden gelen bildirimleri aç'}
													</DropdownMenu.Item>
												{:else}
													<DropdownMenu.Item onclick={() => handleBlock(item)} class="text-destructive">
														<UserX class="mr-2 h-4 w-4" />
														{t('notifications.blockUser') || 'Bu kişiden gelen bildirimleri engelle'}
													</DropdownMenu.Item>
												{/if}
											{/if}
										</DropdownMenu.Content>
									</DropdownMenu.Root>
								</div>
							</div>
						{/each}
					</div>
				</ScrollArea>
			{:else}
				<div class="text-center py-10 text-muted-foreground text-sm">{t('notifications.empty') || 'No notifications yet'}</div>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
