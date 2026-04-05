<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Trash2, UserX, Ellipsis, ChevronDown, ChevronUp, Edit, CheckCircle2, XCircle } from '@lucide/svelte';
	import type { NotificationRecord, TranslationObject } from '$lib/types/notification';
	import { Badge } from '$lib/components/ui/badge';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { t, getCurrentLocale } from '$lib/stores/i18n.svelte';

	// Locale-aware URL helper
	const locale = $derived(getCurrentLocale() || 'tr');
	const l = (path: string) => `/${locale}${path}`;

	let { open = $bindable(false), notifications = [], unreadCount = 0, blockedActorIds = [] }: {
		open?: boolean;
		notifications?: NotificationRecord[];
		unreadCount?: number;
		blockedActorIds?: string[];
	} = $props();

	interface NotificationGroup {
		notifications: NotificationRecord[];
		expanded: boolean;
		type: NotificationRecord['type'];
		actor: NotificationRecord['actor'];
		latestTimestamp: number;
	}

	// Separate state for tracking expanded groups (persists across re-groups)
	let expandedGroups = $state<Record<string, boolean>>({});

	// Group notifications by type and actor (derived, no state mutation)
	let groupedNotifications = $derived((notifications || []).reduce((groups: Record<string, NotificationGroup>, notification) => {
		const key = `${notification.type}-${notification.actor?.id || 'system'}`;
		if (!groups[key]) {
			groups[key] = {
				notifications: [],
				expanded: expandedGroups[key] ?? false,
				type: notification.type,
				actor: notification.actor,
				latestTimestamp: new Date(notification.createdAt).getTime()
			};
		}
		groups[key].notifications.push(notification);
		const timestamp = new Date(notification.createdAt).getTime();
		if (timestamp > groups[key].latestTimestamp) {
			groups[key].latestTimestamp = timestamp;
		}
		return groups;
	}, {} as Record<string, NotificationGroup>));

	// Sort groups by latest timestamp
	let sortedGroups = $derived(Object.entries(groupedNotifications)
		.sort(([, a], [, b]) => (b as NotificationGroup).latestTimestamp - (a as NotificationGroup).latestTimestamp));

	// Toggle group expansion - only updates expandedGroups state
	function toggleGroup(key: string) {
		expandedGroups[key] = !(expandedGroups[key] ?? false);
	}

	// Get display name for actor
	function getDisplayName(actor: { name?: string | null; nickname?: string | null } | null) {
		if (!actor) return 'System';
		return actor.name || actor.nickname || 'Unknown';
	}

	const dispatch = createEventDispatcher<{
		select: { notification: NotificationRecord };
		markAll: void;
		delete: { notification: NotificationRecord };
		block: { notification: NotificationRecord };
		unblock: { notification: NotificationRecord };
		editArticle: { notification: NotificationRecord };
		approveTranslation: { notification: NotificationRecord };
		rejectTranslation: { notification: NotificationRecord };
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

	function handleEditArticle(item: any) {
		const n = item as NotificationRecord;
		dispatch('editArticle', { notification: n });
	}

	function handleApproveTranslation(item: any) {
		const n = item as NotificationRecord;
		dispatch('approveTranslation', { notification: n });
	}

	function handleRejectTranslation(item: any) {
		const n = item as NotificationRecord;
		dispatch('rejectTranslation', { notification: n });
	}

		function handleMarkAll() {
		dispatch('markAll');
	}

	function formatTimestamp(value: string) {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return '';
  
		const now = new Date();
		const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
		const locale = getCurrentLocale() || 'tr';
		
		// Use Intl.RelativeTimeFormat for natural time formatting
		const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
		
		if (diffInSeconds < 60) {
			return t('notifications.justNow');
		}
  
		if (diffInSeconds < 3600) {
			const minutes = Math.floor(diffInSeconds / 60);
			return rtf.format(-minutes, 'minute');
		}
  
		if (diffInSeconds < 86400) {
			const hours = Math.floor(diffInSeconds / 3600);
			return rtf.format(-hours, 'hour');
		}
		
		if (diffInSeconds < 604800) {
			const days = Math.floor(diffInSeconds / 86400);
			return rtf.format(-days, 'day');
		}
  
		// For dates older than a week, show date and time
		return new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(date);
	}

	function translateNotificationText(text: string | TranslationObject, actor: NotificationRecord['actor'], meta: NotificationRecord['meta']): string {
		// If it's already a string, return as is
		if (typeof text === 'string') {
			// Check if it's a JSON string that needs to be parsed
			try {
				const parsed = JSON.parse(text);
				if (parsed && typeof parsed === 'object' && parsed.key) {
					text = parsed;
				} else {
					return text;
				}
			} catch {
				// If parsing fails, return as string
				return text;
			}
		}
		
		// Now text should be a TranslationObject
		if (typeof text === 'string') {
			return text;
		}
		
		// Process values and replace {user} with actor name
		const processedValues: Record<string, string | number> = {};
		
		// First, process existing values
		if (text.values) {
			for (const [key, value] of Object.entries(text.values)) {
				if (key === 'user' || key === 'user1' || key === 'user2') {
					// Skip user values - we'll add them from actor/meta
					continue;
				} else if (typeof value === 'string' && (value.startsWith('notifications.') || value.startsWith('Info.') || value.startsWith('moderation.'))) {
					processedValues[key] = t(value);
				} else if (value !== null && value !== undefined) {
					processedValues[key] = value;
				}
			}
		}
		
		// Get the translation template to check what placeholders are needed
		const translationTemplate = t(text.key);
		
		// Add user values from actor/meta based on what's needed in the template
		if (translationTemplate.includes('{user}') && !processedValues.user) {
			if (actor) {
				processedValues.user = actor.nickname || actor.name || t('notifications.messages.unknownUser');
			} else {
				processedValues.user = t('notifications.messages.unknownUser');
			}
		}
		
		// Handle user1 and user2 for multiple user notifications
		if (translationTemplate.includes('{user1}') && !processedValues.user1) {
			if (meta?.likerNames && Array.isArray(meta.likerNames) && meta.likerNames.length > 0) {
				processedValues.user1 = meta.likerNames[0] || t('notifications.messages.unknownUser');
			} else if (actor) {
				processedValues.user1 = actor.nickname || actor.name || t('notifications.messages.unknownUser');
			} else {
				processedValues.user1 = t('notifications.messages.unknownUser');
			}
		}
		
		if (translationTemplate.includes('{user2}') && !processedValues.user2) {
			if (meta?.likerNames && Array.isArray(meta.likerNames) && meta.likerNames.length > 1) {
				processedValues.user2 = meta.likerNames[1] || t('notifications.messages.unknownUser');
			} else {
				processedValues.user2 = t('notifications.messages.unknownUser');
			}
		}
		
		// Handle notes placeholder for rejection reasons
		if (translationTemplate.includes('{notes}') && !processedValues.notes) {
			if (meta?.notes) {
				processedValues.notes = meta.notes;
			}
		}
		
		// Handle other common placeholders from meta
		if (translationTemplate.includes('{moderator}') && !processedValues.moderator) {
			if (actor) {
				processedValues.moderator = actor.nickname || actor.name || t('notifications.messages.unknownUser');
			} else {
				processedValues.moderator = t('notifications.messages.unknownUser');
			}
		}
		
		if (translationTemplate.includes('{title}') && !processedValues.title) {
			if (meta?.articleTitle) {
				processedValues.title = meta.articleTitle;
			}
		}
		
		// Now translate with all values
		return t(text.key, processedValues);
	}

</script>

<Dialog.Root bind:open>
  <Dialog.Content class="w-15/16 sm:w-2/3 md:w-1/2 h-[70vh] max-h-[80vh] flex flex-col overflow-hidden">
    <Dialog.Header class="pt-6 flex-shrink-0">
      <Dialog.Title class="flex items-center justify-between">
        <span>{t('notifications.title') || 'Bildirimler'}</span>
        <Button 
          variant="outline" 
          size="xs" 
          onclick={handleMarkAll} 
          disabled={unreadCount === 0}
        >
          {t('notifications.markAll')}
        </Button>
      </Dialog.Title>
    </Dialog.Header>

    <div class="flex-1 overflow-hidden">
      <ScrollArea orientation="vertical" class="h-full w-full">
        {#if notifications.length > 0}
          <div class="p-2 space-y-2">
          {#each sortedGroups as [key, group]}
            <div class="rounded-lg border">

                <div class="flex items-center p-2 justify-between">
                  <div class="flex items-center gap-2">
                    {#if group.actor && group.actor.nickname}
                      <a href={l(`/${group.actor.nickname}`)} class="flex-shrink-0">
                        <Avatar class="h-10 w-10">
                          <AvatarFallback>
                            {(group.actor.nickname?.[0] || '?').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </a>
                    {/if}
                    <div class="text-left">
                      <div class="text-sm">
                        {#if group.actor && group.actor.nickname}
                          <a href={l(`/${group.actor.nickname}`)} class="hover:text-primary transition-colors">
                            {getDisplayName(group.actor)}
                          </a>
                        {:else}
                          {t('notifications.systemNotification')}
                        {/if}
                      </div>
                      <div class="text-xs text-muted-foreground">
                        {group.notifications.length} {group.notifications.length === 1 ? t('notifications.notification') : t('notifications.notifications')}
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs text-muted-foreground">
                      {formatTimestamp(group.notifications[0].createdAt)}
                    </span>
                    {#if group.notifications.length > 1}
                                  <Button
                variant="outline"
                size="icon"
                onclick={() => toggleGroup(key)}
              >
                      {#if group.expanded}
                        <ChevronUp class="h-4 w-4 text-muted-foreground" />
                      {:else}
                        <ChevronDown class="h-4 w-4 text-muted-foreground" />
                      {/if}
                      </Button>
                    {/if}
                    
                  </div>
                </div>
              

              {#if group.expanded || group.notifications.length === 1}
                <div class="border-t">
                  {#each group.notifications as item (item.id)}
                    <div 
                      class="py-2.5 px-4 flex flex-row justify-between items-center relative group hover:bg-accent/20 transition-colors  {!item.read ? 'bg-primary/5' : ''}"
                    >
                      <div class="flex flex-col gap-1 flex-1">
                        <!-- Title -->
                        <div class="text-sm font-medium text-foreground">
                          {translateNotificationText(item.title, item.actor, item.meta)}
                        </div>
                        <!-- Message/Content -->
                        <div onclick={() => handleSelect(item)} class="text-xs text-secondary-foreground hover:text-primary cursor-pointer">
                          {translateNotificationText(item.message, item.actor, item.meta)}
                        </div>
                        <!-- Timestamp -->
                        <div class="text-xs text-muted-foreground">
                          {formatTimestamp(item.createdAt)}
                        </div>
                      </div>

                      <!-- Action buttons -->
                      <div class="flex items-center gap-1">
                        <!-- Translation Review buttons -->
                        {#if item.type === 'translation_review' && item.meta?.translationStatusId}
                          <Button 
                            onclick={() => handleApproveTranslation(item)} 
                            size="icon" 
                            variant="outline"
                            class="text-green-600 hover:text-green-700 hover:bg-green-50"
                            title={t('notifications.approveTranslation')}
                          >
                            <CheckCircle2 class="h-4 w-4" />
                          </Button>
                          <Button 
                            onclick={() => handleRejectTranslation(item)} 
                            size="icon" 
                            variant="outline"
                            class="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title={t('notifications.rejectTranslation')}
                          >
                            <XCircle class="h-4 w-4" />
                          </Button>
                        {/if}
                        
                        <!-- Edit Article button for rejected articles -->
                        {#if item.type === 'article_status' && item.meta?.newStatus === 'rejected' && item.meta?.articleId}
                          <Button 
                            onclick={() => handleEditArticle(item)} 
                            size="icon" 
                            variant="outline"
                            title={t('notifications.editArticle')}
                          >
                            <Edit class="h-4 w-4" />
                          </Button>
                        {/if}
                        
                        <!-- Delete button -->
                        <Button onclick={() => handleDelete(item)} size="icon" variant="outline" title={t('notifications.deleteNotification')}>
                          <Trash2 class="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  {/each}
                </div>
              {:else if group.notifications.length > 1}
                <div class="px-4 py-2 text-xs text-muted-foreground text-center border-t">
                  {t('notifications.moreNotifications', { count: group.notifications.length - 1 })}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {:else}
        <div class="flex flex-col items-center justify-center py-10 text-center">
          <div class="text-muted-foreground mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bell-off mx-auto">
              <path d="M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5"></path>
              <path d="M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .36-1.7"></path>
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
              <line x1="2" y1="2" x2="22" y2="22"></line>
            </svg>
          </div>
          <p class="text-muted-foreground text-sm">
            {t('notifications.empty') || 'Henüz bildiriminiz yok'}
          </p>
        </div>
      {/if}
    </ScrollArea>
  </div>
  </Dialog.Content>
</Dialog.Root>
