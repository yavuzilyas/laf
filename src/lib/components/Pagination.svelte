<script lang="ts">
  import { cn } from "$lib/utils";
  import { Button } from "$lib/components/ui/button";
  import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "@lucide/svelte";
  import { t } from '$lib/stores/i18n.svelte';

  let {
    currentPage = 1,
    totalPages = 1,
    totalItems = 0,
    itemsPerPage = 12,
    onPageChange,
    showInfo = true,
    class: className,
    ...restProps
  }: {
    currentPage: number;
    totalPages: number;
    totalItems?: number;
    itemsPerPage?: number;
    onPageChange: (page: number) => void;
    showInfo?: boolean;
    class?: string;
  } = $props();

  const maxVisiblePages = 5;

  const visiblePages = $derived(() => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const halfVisible = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - halfVisible);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

    if (end - start < maxVisiblePages - 1) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    const pages: (number | string)[] = [];
    
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  });

  const startItem = $derived((currentPage - 1) * itemsPerPage + 1);
  const endItem = $derived(Math.min(currentPage * itemsPerPage, totalItems));

  function handlePageChange(page: number) {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  }
</script>

<div class={cn("flex flex-col sm:flex-row items-center justify-between gap-4", className)} {...restProps}>
  {#if showInfo && totalItems > 0}
    <div class="text-sm text-muted-foreground">
      {t('pagination.showing') || 'Showing'} 
      <span class="font-medium text-foreground">{startItem}</span>
      –
      <span class="font-medium text-foreground">{endItem}</span>
      {t('pagination.of') || 'of'}
      <span class="font-medium text-foreground">{totalItems}</span>
      {t('pagination.results') || 'results'}
    </div>
  {:else}
    <div></div>
  {/if}

  {#if totalPages > 1}
    <div class="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        class="h-8 w-8"
        onclick={() => handlePageChange(1)}
        disabled={currentPage === 1}
      >
        <ChevronsLeft class="h-4 w-4" />
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        class="h-8 w-8"
        onclick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft class="h-4 w-4" />
      </Button>

      <div class="flex items-center gap-1 px-1">
        {#each visiblePages() as page}
          {#if page === '...'}
            <span class="px-2 text-sm text-muted-foreground">...</span>
          {:else}
            <Button
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              class="h-8 w-8 min-w-8 p-0 text-xs"
              onclick={() => handlePageChange(page as number)}
            >
              {page}
            </Button>
          {/if}
        {/each}
      </div>

      <Button
        variant="outline"
        size="icon"
        class="h-8 w-8"
        onclick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight class="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        class="h-8 w-8"
        onclick={() => handlePageChange(totalPages)}
        disabled={currentPage === totalPages}
      >
        <ChevronsRight class="h-4 w-4" />
      </Button>
    </div>
  {/if}
</div>
