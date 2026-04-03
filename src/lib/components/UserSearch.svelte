<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import * as Popover from '$lib/components/ui/popover';
  import * as Command from '$lib/components/ui/command';
  import { Search, User, X } from '@lucide/svelte';

  export let selectedUsers: Array<{ id: string; username: string; name?: string; surname?: string }> = [];
  
  let searchQuery = '';
  let searchResults: Array<{ id: string; username: string; name?: string; surname?: string }> = [];
  let isOpen = false;
  let isLoading = false;

  const dispatch = createEventDispatcher();

  async function searchUsers() {
    if (!searchQuery.trim()) {
      searchResults = [];
      return;
    }

    isLoading = true;
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery.trim())}`);
      if (response.ok) {
        const users = await response.json();
        searchResults = users
          .filter((user: any) => !selectedUsers.some(selected => selected.id === user.id))
          .slice(0, 10);
      }
    } catch (error) {
      searchResults = [];
    } finally {
      isLoading = false;
    }
  }

  function selectUser(user: typeof selectedUsers[0]) {
    selectedUsers = [...selectedUsers, user];
    searchQuery = '';
    searchResults = [];
    isOpen = false;
    dispatch('change', { users: selectedUsers });
  }

  function removeUser(userId: string) {
    selectedUsers = selectedUsers.filter(user => user.id !== userId);
    dispatch('change', { users: selectedUsers });
  }

  $: if (searchQuery.trim()) {
    const timeout = setTimeout(() => searchUsers(), 300);
    setTimeout(() => clearTimeout(timeout), 310);
  }
</script>

<div class="space-y-2">
  <div class="flex gap-2">
    <Popover.Root bind:open={isOpen}>
      <Popover.Trigger>
        <Button
          variant="outline"
          size="xs"
          class="!w-full justify-start text-left"
        >
          <Search class="w-4 h-4" />
          @username...
        </Button>
      </Popover.Trigger>
      <Popover.Content class="w-80 p-0">
        <Command.Root>
          <Command.Input
            bind:value={searchQuery}
            placeholder="Search by @username..."
            on:input={searchUsers}
          />
          <Command.List>
            <Command.Empty>
              {#if isLoading}
                Searching...
              {:else if searchQuery.trim()}
                No users found
              {:else}
                Type to search users
              {/if}
            </Command.Empty>
            {#each searchResults as user}
              <Command.Item
                value={user.username}
                onSelect={() => selectUser(user)}
                class="flex items-center gap-2 p-2 cursor-pointer hover:bg-accent"
              >
                <User class="w-4 h-4" />
                <div class="flex-1">
                  <div class="font-medium">@{user.username}</div>
                  {#if user.name || user.surname}
                    <div class="text-sm text-muted-foreground">
                      {user.name} {user.surname}
                    </div>
                  {/if}
                </div>
              </Command.Item>
            {/each}
          </Command.List>
        </Command.Root>
      </Popover.Content>
    </Popover.Root>
  </div>

  {#if selectedUsers.length > 0}
    <div class="flex flex-wrap gap-2">
      {#each selectedUsers as user}
        <Badge variant="secondary" class="gap-1">
          <User class="w-3 h-3" />
          @{user.username}
          {#if user.name || user.surname}
            <span class="text-muted-foreground">
              ({user.name} {user.surname})
            </span>
          {/if}
          <button
            type="button"
            onclick={() => removeUser(user.id)}
            class="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
          >
            <X class="w-3 h-3" />
          </button>
        </Badge>
      {/each}
    </div>
  {/if}
</div>
