<script lang="ts">
  import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, Check } from '@lucide/svelte';
  import { PlusIcon, CheckIcon } from 'svelte-animate-icons';
  import { cn } from '$lib/utils';
  import { t } from '$lib/stores/i18n.svelte';

  interface CategoryNode {
    id: string;
    translationKey: string;
    children?: CategoryNode[];
  }

  interface Props {
    categories: CategoryNode[];
    selectedCategory?: string;
    selectedSubcategory?: string;
    onSelect?: (category: string, subcategory?: string) => void;
  }

  let { 
    categories, 
    selectedCategory = $bindable(''),
    selectedSubcategory = $bindable(''),
    onSelect 
  }: Props = $props();

  let expandedNodes = $state<Set<string>>(new Set());

  function toggleNode(nodeId: string, event: Event) {
    event.stopPropagation();
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    expandedNodes = newExpanded;
  }

  function selectCategory(categoryId: string, subcategoryId?: string) {
    selectedCategory = categoryId;
    selectedSubcategory = subcategoryId || '';
    onSelect?.(categoryId, subcategoryId);
  }

  function isSelected(categoryId: string, subcategoryId?: string): boolean {
    if (subcategoryId) {
      return selectedCategory === categoryId && selectedSubcategory === subcategoryId;
    }
    return selectedCategory === categoryId && !selectedSubcategory;
  }
</script>

<div class="space-y-0.5">
  {#each categories as category}
    {@const hasChildren = category.children && category.children.length > 0}
    {@const isExpanded = expandedNodes.has(category.id)}
    {@const isCategorySelected = isSelected(category.id)}
    
    <div class="space-y-0.5">
      <!-- Ana Kategori -->
      <div
        role="button"
        tabindex="0"
        class={cn(
          "flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer transition-colors",
          "hover:bg-accent/50",
          isCategorySelected && !selectedSubcategory && "bg-primary/10 font-medium"
        )}
        onclick={() => selectCategory(category.id)}
        onkeydown={(e) => e.key === 'Enter' && selectCategory(category.id)}
      >
        <!-- Expand/Collapse Icon -->
        {#if hasChildren}
          <button
            class="p-0.5 hover:bg-accent rounded transition-colors"
            onclick={(e) => toggleNode(category.id, e)}
          >
            {#if isExpanded}
              <ChevronDown class="h-4 w-4 text-muted-foreground" />
            {:else}
              <ChevronRight class="h-4 w-4 text-muted-foreground" />
            {/if}
          </button>
        {:else}
          <div class="w-5"></div>
        {/if}

        <!-- Folder Icon -->
        {#if hasChildren}
          {#if isExpanded}
            <FolderOpen animationState="loading" size={18} class="text-primary" />
          {:else}
            <Folder class="h-4 w-4 text-muted-foreground" />
          {/if}
        {:else}
          <FileText class="h-4 w-4 text-muted-foreground" />
        {/if}

        <!-- Category Name -->
        <span class="flex-1 text-sm font-medium">
          {t(`categories.${category.translationKey}`)}
        </span>

        <!-- Selection Indicator -->
        {#if isCategorySelected && !selectedSubcategory}
          <CheckIcon animationState="loading" size={18} class="text-primary" />
        {/if}
      </div>

      <!-- Alt Kategoriler -->
      {#if hasChildren && isExpanded}
        <div class="ml-7 space-y-0.5 border-l-2 border-border/50 pl-2">
          {#each category.children as subcategory}
            {@const isSubSelected = isSelected(category.id, subcategory.id)}
            
            <div
              role="button"
              tabindex="0"
              class={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
                "hover:bg-accent/50",
                isSubSelected && "bg-primary/10 font-medium"
              )}
              onclick={() => selectCategory(category.id, subcategory.id)}
              onkeydown={(e) => e.key === 'Enter' && selectCategory(category.id, subcategory.id)}
            >
              <!-- Subcategory Icon -->
              <FileText class="h-3.5 w-3.5 text-muted-foreground" />
              
              <!-- Subcategory Name -->
              <span class="flex-1 text-sm">
                {t(`categories.${subcategory.translationKey}`)}
              </span>

              <!-- Selection Indicator -->
              {#if isSubSelected}
                <CheckIcon animationState="loading" size={18} class="text-primary" />
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/each}
</div>
