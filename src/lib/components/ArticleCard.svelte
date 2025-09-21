<script lang="ts">
  import { cn } from "$lib/utils";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import { Calendar, Clock, User, Eye, MessageCircle, Heart } from "@lucide/svelte";
  import { t } from '$lib/stores/i18n.svelte.ts';
  import Lens from '$lib/components/Lens.svelte';
  interface Article {
    id: string;
    title: string;
    excerpt: string;
    content?: string;
    author: {
      name: string;
      avatar?: string;
    };
    publishedAt: string;
    readTime: number;
    category: string;
    tags: string[];
    views: number;
    comments: number;
    likes: number;
    featured?: boolean;
    coverImage?: string;
  }

  let {
    article,
    variant = "default",
    class: className,
    ...restProps
  }: {
    article: Article;
    variant?: "default" | "compact" | "featured" | "minimal";
    class?: string;
  } = $props();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(t.currentLocale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };
</script>

{#if variant === "featured"}
  <!-- Featured Article Card -->
  <article class={cn(
    "group relative !max-h-fit overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md",
    "md:grid md:grid-cols-2 md:gap-6",
    className
  )} {...restProps}>
    {#if article.coverImage}
      <div class="relative overflow-hidden md:order-2">
        <img 
          src={article.coverImage} 
          alt={article.title}
          class="aspect-[16/9] w-full object-cover transition-transform duration-300 group-hover:scale-105 md:aspect-[4/3]"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        {#if article.featured}
          <Badge class="absolute top-3 right-3">
            {t('articles.featured')}
          </Badge>
        {/if}
      </div>
    {/if}
    
    <div class="flex flex-col justify-between p-6 md:order-1">
      <div class="space-y-4">
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary" class="text-xs">
            {article.category}
          </Badge>
          <span>•</span>
          <div class="flex items-center gap-1">
            <Calendar class="h-3 w-3" />
            <time>{formatDate(article.publishedAt)}</time>
          </div>
        </div>
        
        <div>
          <h2 class="text-2xl font-bold leading-tight tracking-tight group-hover:text-primary transition-colors">
            {article.title}
          </h2>
          <p class="mt-2 text-muted-foreground leading-relaxed">
            {truncateText(article.excerpt, 200)}
          </p>
        </div>
        
        <div class="flex flex-wrap gap-1">
          {#each article.tags.slice(0, 3) as tag}
            <Badge variant="outline" class="text-xs">
              #{tag}
            </Badge>
          {/each}
        </div>
      </div>
      
      <div class="mt-6 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            {#if article.author.avatar}
              <img 
                src={article.author.avatar} 
                alt={article.author.name}
                class="h-8 w-8 rounded-full object-cover"
              />
            {:else}
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <User class="h-4 w-4" />
              </div>
            {/if}
            <div class="text-sm">
              <p class="font-medium">{article.author.name}</p>
            </div>
          </div>
          <div class="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock class="h-3 w-3" />
            <span>{article.readTime} {t('articles.minRead')}</span>
          </div>
        </div>
        
        <Button variant="outline" size="sm">
          {t('articles.readMore')}
        </Button>
      </div>
    </div>
  </article>

{:else if variant === "compact"}
  <!-- Compact Article Card -->
  <article class={cn(
    "group flex gap-4 h-fit rounded-lg border bg-card p-4 text-card-foreground shadow-sm transition-all hover:shadow-md",
    className
  )} {...restProps}>
    {#if article.coverImage}
      <div class="relative flex-shrink-0 overflow-hidden rounded-md">
        <img 
          src={article.coverImage} 
          alt={article.title}
          class="h-20 w-20 object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
    {/if}
    
    <div class="flex-1 space-y-2">
      <div class="flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary" class="text-xs">
          {article.category}
        </Badge>
        <span>•</span>
        <time>{formatDate(article.publishedAt)}</time>
      </div>
      
      <h3 class="font-semibold leading-tight group-hover:text-primary transition-colors">
        {truncateText(article.title, 80)}
      </h3>
      
      <p class="text-sm text-muted-foreground">
        {truncateText(article.excerpt, 120)}
      </p>
      
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3 text-xs text-muted-foreground">
          <div class="flex items-center gap-1">
            <Eye class="h-3 w-3" />
            <span>{article.views}</span>
          </div>
          <div class="flex items-center gap-1">
            <MessageCircle class="h-3 w-3" />
            <span>{article.comments}</span>
          </div>
          <div class="flex items-center gap-1">
            <Clock class="h-3 w-3" />
            <span>{article.readTime} {t('articles.min')}</span>
          </div>
        </div>
      </div>
    </div>
  </article>

{:else if variant === "minimal"}
  <!-- Minimal Article Card -->
  <article class={cn(
    "group h-fit space-y-3 rounded-lg p-4 transition-all hover:bg-muted/50",
    className
  )} {...restProps}>
    <div class="flex items-center gap-2 text-xs text-muted-foreground">
      <Badge variant="outline" class="text-xs">
        {article.category}
      </Badge>
      <span>•</span>
      <time>{formatDate(article.publishedAt)}</time>
      <span>•</span>
      <span>{article.readTime} {t('articles.minRead')}</span>
    </div>
    
    <h3 class="font-semibold leading-tight group-hover:text-primary transition-colors">
      {article.title}
    </h3>
    
    <p class="text-sm text-muted-foreground">
      {truncateText(article.excerpt, 150)}
    </p>
    
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-1 text-xs text-muted-foreground">
          <User class="h-3 w-3" />
          <span>{article.author.name}</span>
        </div>
      </div>
      
      <div class="flex items-center gap-3 text-xs text-muted-foreground">
        <div class="flex items-center gap-1">
          <Eye class="h-3 w-3" />
          <span>{article.views}</span>
        </div>
        <div class="flex items-center gap-1">
          <Heart class="h-3 w-3" />
          <span>{article.likes}</span>
        </div>
      </div>
    </div>
  </article>

{:else}
  <!-- Default Article Card -->
  <article class={cn(
    "group h-fit overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md",
    className
  )} {...restProps}>
    {#if article.coverImage}
      <div class="relative overflow-hidden">
        <Lens>
        <img 
          src={article.coverImage} 
          alt={article.title}
          class="aspect-[16/9] w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        </Lens>
        <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        {#if article.featured}
          <Badge class="absolute top-3 right-3 bg-primary text-primary-foreground">
            {t('articles.featured')}
          </Badge>
        {/if}
      </div>
    {/if}
    
    <div class="p-6 space-y-4">
      <div class="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="secondary">
          {article.category}
        </Badge>
        <span>•</span>
        <div class="flex items-center gap-1">
          <Calendar class="h-3 w-3" />
          <time>{formatDate(article.publishedAt)}</time>
        </div>
        <span>•</span>
        <div class="flex items-center gap-1">
          <Clock class="h-3 w-3" />
          <span>{article.readTime} {t('articles.minRead')}</span>
        </div>
      </div>
      
      <div>
        <h2 class="text-xl font-bold leading-tight tracking-tight group-hover:text-primary transition-colors">
          {article.title}
        </h2>
        <p class="mt-2 text-muted-foreground">
          {truncateText(article.excerpt, 150)}
        </p>
      </div>
      
      <div class="flex flex-wrap gap-1">
        {#each article.tags.slice(0, 4) as tag}
          <Badge variant="outline" class="text-xs">
            #{tag}
          </Badge>
        {/each}
      </div>
      
      <div class="flex items-center justify-between pt-2">
        <div class="flex items-center gap-2">
          {#if article.author.avatar}
            <img 
              src={article.author.avatar} 
              alt={article.author.name}
              class="h-8 w-8 rounded-full object-cover"
            />
          {:else}
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <User class="h-4 w-4" />
            </div>
          {/if}
          <div class="text-sm">
            <p class="font-medium">{article.author.name}</p>
          </div>
        </div>
        
        <div class="flex items-center gap-4 text-sm text-muted-foreground">
          <div class="flex items-center gap-1">
            <Eye class="h-4 w-4" />
            <span>{article.views}</span>
          </div>
          <div class="flex items-center gap-1">
            <MessageCircle class="h-4 w-4" />
            <span>{article.comments}</span>
          </div>
          <div class="flex items-center gap-1">
            <Heart class="h-4 w-4" />
            <span>{article.likes}</span>
          </div>
        </div>
      </div>
    </div>
  </article>
{/if}
