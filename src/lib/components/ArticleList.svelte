<script lang="ts">
  import { cn } from "$lib/utils";
  import ArticleCard from "./ArticleCard.svelte";
  import { Button } from "$lib/components/ui/button";
  import { Skeleton } from "$lib/components/ui/skeleton";
  import { t } from '$lib/stores/i18n.svelte';
  import { Grid, List } from "@lucide/svelte";
  import { BarSpinner } from "$lib/components/spell/bar-spinner";

  interface Article {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    content?: string;
    status?: 'published' | 'pending' | 'draft';
    author: {
      name: string;
      avatar?: string;
      nickname: string;
    };
    author_nickname: string;
    authorId?: string;
    publishedAt: string;
    readTime: number;
    category: string;
    tags: string[];
    views: number;
    comments: number;
    likes: number;
    featured?: boolean;
    coverImage?: string;
    collaborators?: Array<{
      id: string;
      name: string;
      nickname: string;
      avatar?: string;
    }>;
    collaboratorProfiles?: Array<{
      id: string;
      name: string;
      surname?: string;
      nickname: string;
      avatar?: string;
      bio?: string;
      followersCount?: number;
      followingCount?: number;
    }>;
  }

  let {
    articles = [],
    loading = false,
    layout = "grid",
    variant = "default",
    showLoadMore = false,
    hasMore = false,
    onLoadMore,
    usePagination = false,
    itemsPerPage = 12,
    currentPage = $bindable(1),
    onPageChange,
    maxColumns = 3,
    class: className,
    ...restProps
  }: {
    articles: Article[];
    loading?: boolean;
    layout?: "grid" | "list" | "masonry";
    variant?: "default" | "compact" | "featured" | "minimal";
    showLoadMore?: boolean;
    hasMore?: boolean;
    onLoadMore?: () => void;
    usePagination?: boolean;
    itemsPerPage?: number;
    currentPage?: number;
    onPageChange?: (page: number) => void;
    maxColumns?: 2 | 3;
    class?: string;
  } = $props();

  import { BookXIcon } from 'svelte-animate-icons';
  import Pagination from "./Pagination.svelte";

  // Use the layout prop directly instead of internal state
  const totalPages = $derived(Math.ceil(articles.length / itemsPerPage));
  const paginatedArticles = $derived(
    usePagination 
      ? articles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) 
      : articles
  );

  function handlePageChange(page: number) {
    currentPage = page;
    if (onPageChange) onPageChange(page);
  }
</script>

<div class={cn("space-y-6", className)} {...restProps}>

  <!-- Articles Grid/List -->
  {#if loading && articles.length === 0}
    <!-- Loading Skeletons -->
    <div class={cn(
      layout === "grid" 
        ? `grid gap-6 grid-cols-1 md:grid-cols-2 ${maxColumns === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}` 
        : "space-y-4"
    )}>
      {#each Array(6) as _}
        <div class="space-y-3">
          <Skeleton class="h-48 w-full rounded-lg" />
          <div class="space-y-2">
            <Skeleton class="h-4 w-3/4" />
            <Skeleton class="h-4 w-1/2" />
            <Skeleton class="h-3 w-1/4" />
          </div>
        </div>
      {/each}
    </div>
  {:else if articles.length === 0}
    <!-- Empty State -->
    <div class="flex flex-col items-center justify-center py-12 text-center">
      <div class="rounded-full bg-muted pt-3.5 pb-3 px-4">
                        <BookXIcon triggers={{ hover: false }} duration={2500} animationState="loading" size={28} class="text-primary" />
      </div>
      <h3 class="mt-4 text-lg font-semibold">{t('articles.noArticles')}</h3>
      <p class="mt-2 text-sm text-muted-foreground">
        {t('articles.noArticlesDescription')}
      </p>
    </div>
  {:else}
    <!-- Articles Display -->
    {#if layout === "grid"}
      <div class={cn(
        "grid gap-3 sm:gap-6",
        variant === "featured" ? "md:grid-cols-2 lg:grid-cols-2" : (maxColumns === 2 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"),
        variant === "compact" ? (maxColumns === 2 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3") : ""
      )}>
        {#each paginatedArticles as article (article.id)}
          <ArticleCard {article} {variant} />
        {/each}
      </div>
    {:else if layout === "list"}
      <div class="space-y-4">
        {#each paginatedArticles as article (article.id)}
          <ArticleCard {article} variant="compact" />
        {/each}
      </div>
    {:else if layout === "masonry"}
      <!-- Masonry Layout - CSS Grid based -->
      <div class={`columns-1 gap-6 md:columns-2 ${maxColumns === 2 ? 'lg:columns-2' : 'lg:columns-3'}`}>
        {#each paginatedArticles as article (article.id)}
          <div class="mb-6 break-inside-avoid">
            <ArticleCard {article} variant="minimal" />
          </div>
        {/each}
      </div>
    {/if}

    <!-- Pagination -->
    {#if usePagination && totalPages > 1}
      <div class="mt-8">
        <Pagination
          {currentPage}
          {totalPages}
          totalItems={articles.length}
          {itemsPerPage}
          onPageChange={handlePageChange}
        />
      </div>
    {/if}

    <!-- Load More Button -->
    {#if showLoadMore && hasMore}
      <div class="flex justify-center pt-8">
        <Button
          variant="outline"
          size="sm"
          onclick={onLoadMore}
          disabled={loading}
          class="min-w-32"
        >
          {#if loading}
            <BarSpinner class="text-primary" size={16} />
            {t('articles.loading')}
          {:else}
            {t('articles.loadMore')}
          {/if}
        </Button>
      </div>
    {/if}

    <!-- Loading More Indicator -->
    {#if loading && articles.length > 0}
      <div class="flex justify-center pt-4">
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <BarSpinner class="text-primary" size={16} />
          {t('articles.loadingMore')}
        </div>
      </div>
    {/if}
  {/if}
</div>
