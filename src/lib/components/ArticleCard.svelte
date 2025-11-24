<script lang="ts">
  import { cn } from "$lib/utils";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import { Calendar, Clock, User, Eye, MessageCircle, ThumbsUp, ThumbsDown } from "@lucide/svelte";
  import { t } from '$lib/stores/i18n.svelte.ts';
  import Lens from '$lib/components/Lens.svelte';
  import A from "$lib/components/ui/a.svelte";
  
  interface Article {
    id: string;
    slug?: string;
    title: string;
    excerpt: string;
    content?: string;
    author: {
      name: string;
      avatar?: string;
      nickname?: string;
    };
    authorId?: string;
    publishedAt: string;
    readTime: number;
    category: string;
    tags: string[];
    views: number;
    comments: number;
    likes: number;
    dislikes?: number;
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

  const formatNumber = (num: number): string => {
    if (num < 1000) return num.toString();
    if (num < 10000) return (num / 1000).toFixed(1) + 'k';
    if (num < 100000) return (num / 1000).toFixed(0) + 'k';
    if (num < 1000000) return (num / 1000).toFixed(0) + 'k';
    if (num < 10000000) return (num / 1000000).toFixed(1) + 'm';
    return (num / 1000000).toFixed(0) + 'm';
  };
  import * as Tooltip from "$lib/components/ui/tooltip";
  import { Motion, useMotionValue, useMotionTemplate } from "svelte-motion";
  import { browser } from '$app/environment';

  // Sadece client-side'da Motion fonksiyonlarını kullan
  let mouseX = browser ? useMotionValue(0) : { set: () => {} };
  let mouseY = browser ? useMotionValue(0) : { set: () => {} };
  let background = browser && mouseX && mouseY ? useMotionTemplate`radial-gradient(200px circle at ${mouseX}px ${mouseY}px, rgba(51, 51, 51, 0.4), transparent 80%)` : '';


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
            <A href={`/${article.author.nickname || article.authorId}`} class="flex items-center gap-2 hover:opacity-80 transition-opacity">
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
            </A>
          <div class="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock class="h-3 w-3" />
            <span>{article.readTime} {t('articles.minRead')}</span>
          </div>
        </div>
        
        <Button variant="outline" size="sm" href={article.slug ? `/article/${article.slug}` : undefined}>
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
          class="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
    {/if}
    
    <div class="flex-1 space-y-2">
      <div class="flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary" class="text-xs">
          {article.category}
        </Badge>
        <time>{formatDate(article.publishedAt)}</time>
      </div>
      
      <h3 class="font-semibold leading-tight group-hover:text-primary transition-colors">
        {truncateText(article.title, 80)}
      </h3>
      
      <p class="text-sm text-muted-foreground">
        {truncateText(article.excerpt, 120)}
      </p>
      
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <A href={`/${article.author.nickname || article.authorId}`} class="flex items-center gap-2 hover:opacity-80 transition-opacity">
            {#if article.author.avatar}
              <img 
                src={article.author.avatar} 
                alt={article.author.name}
                class="h-10 w-10 rounded-full object-cover"
              />
            {:else}
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <User class="h-4 w-5" />
              </div>
            {/if}
            <div class="text-sm">
              <p class="font-medium">{article.author.name}</p>
            </div>
          </A>
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
          <A href={article.slug ? `/article/${article.slug}` : undefined} class="hover:text-foreground transition-colors">
            {article.author.name}
          </A>
        </div>
      </div>
      
      <div class="flex items-center gap-3 text-xs text-muted-foreground">
        <div class="flex items-center gap-1">
          <Eye class="h-3 w-3" />
          <span>{article.views}</span>
        </div>
        <div class="flex items-center gap-1">
          <ThumbsUp class="h-3 w-3" />
          <span>{article.likes}</span>
        </div>
      </div>
    </div>
  </article>

{:else}
  
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  role="presentation"
  onmousemove={(e) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();

    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  }}
  class="group relative h-fit w-full overflow-hidden rounded-xl bg-card"
>
  <div
    class="absolute right-5 top-0 h-px w-80 bg-gradient-to-l from-transparent via-white/30 via-10% to-transparent"
  />
  <Motion
    style={{
      background,
    }}
    let:motion
  >
    <div
      use:motion
      class="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-75 "
    ></div>
  </Motion>
  <article class={cn(
    "group h-fit overflow-hidden rounded-xl border text-card-foreground shadow-sm transition-all hover:shadow-md",
    className
  )} {...restProps}>
    {#if article.coverImage}
      <div class="relative p-3 sm:p-4 pb-0 overflow-hidden">
        <Lens>
        <A href={article.slug ? `/article/${article.slug}` : undefined}>
          <img 
            src={article.coverImage} 
            alt={article.title}
            class="aspect-[16/9] rounded-2xl w-full object-cover transition-transform duration-300 "
          />
        </A>
        </Lens>

      </div>
    {/if}
    
    <div class="p-3 sm:p-4 space-y-3">
      <div class="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
        <Badge variant="secondary">
          {t(article.category)}
        </Badge>

        <div class="flex text-xs items-center gap-1">
          <Calendar class="h-3 w-3" />
          <time>{formatDate(article.publishedAt)}</time>
        </div>

        <div class="flex text-xs items-center gap-1">
          <Clock class="h-3 w-3" />
          <span>{article.readTime} {t('min')}</span>
        </div>
      </div>
      
      <div>
        <h2 class="text-sm sm:text-base font-bold leading-tight tracking-tight group-hover:text-primary transition-colors">
          <A href={article.slug ? `/article/${article.slug}` : undefined}>{article.title}</A>
        </h2>
        <p class="mt-2 text-xs sm:text-sm text-muted-foreground">
          {truncateText(article.excerpt, 150)}
        </p>
      </div>
      
      
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <A href={`/${article.author.nickname || article.authorId}`} class="flex items-center gap-2 hover:opacity-80 transition-opacity">
            {#if article.author.avatar}
              <img 
                src={article.author.avatar} 
                alt={article.author.name}
                class="h-10 w-10 rounded-full object-cover"
              />
            {:else}
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <User class="h-4 w-5" />
              </div>
            {/if}
            <div class="text-xs sm:text-sm">
              <p class="font-medium">{article.author.name}</p>
            </div>
          </A>
        
        <div class="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger>
                <div class="flex items-center gap-1">
                  <Eye class="h-4 w-4" />
                  <span>{formatNumber(article.views)}</span>
                </div>
              </Tooltip.Trigger>
              <Tooltip.Content>
                <p>{article.views.toLocaleString()} görüntüleme</p>
              </Tooltip.Content>
            </Tooltip.Root>
          </Tooltip.Provider>

          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger>
                <div class="flex items-center gap-1">
                  <MessageCircle class="h-4 w-4" />
                  <span>{formatNumber(article.comments)}</span>
                </div>
              </Tooltip.Trigger>
              <Tooltip.Content>
                <p>{article.comments.toLocaleString()} yorum</p>
              </Tooltip.Content>
            </Tooltip.Root>
          </Tooltip.Provider>

          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger>
                <div class="flex items-center gap-1">
                  <ThumbsUp class="h-4 w-4" />
                  <span>{formatNumber(article.likes)}</span>
                </div>
              </Tooltip.Trigger>
              <Tooltip.Content>
                <p>{article.likes.toLocaleString()} beğeni</p>
              </Tooltip.Content>
            </Tooltip.Root>
          </Tooltip.Provider>

          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger>
                <div class="flex items-center gap-1">
                  <ThumbsDown class="h-4 w-4" />
                  <span>{formatNumber(article.dislikes || 0)}</span>
                </div>
              </Tooltip.Trigger>
              <Tooltip.Content>
                <p>{(article.dislikes || 0).toLocaleString()} beğenmeme</p>
              </Tooltip.Content>
            </Tooltip.Root>
          </Tooltip.Provider>
        </div>
      </div>
    </div>
  </article>
  </div>
{/if}
