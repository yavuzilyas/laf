<script lang="ts">
  import { cn } from "$lib/utils";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import { t } from '$lib/stores/i18n.svelte.ts';
  import { Calendar, Clock, User, Eye, MessageCircle, Heart, ArrowRight } from "@lucide/svelte";

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
    showStats = true,
    class: className,
    ...restProps
  }: {
    article: Article;
    variant?: "default" | "minimal" | "overlay";
    showStats?: boolean;
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
</script>

{#if variant === "overlay"}
  <!-- Overlay Hero -->
  <section class={cn(
    "relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10",
    "min-h-[500px] flex items-end",
    className
  )} {...restProps}>
    {#if article.coverImage}
      <div class="absolute inset-0">
        <img 
          src={article.coverImage} 
          alt={article.title}
          class="h-full w-full object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>
    {/if}
    
    <div class="relative z-10 p-8 text-white">
      <div class="max-w-4xl space-y-6">
        <div class="flex items-center gap-3">
          <Badge class="bg-primary text-primary-foreground">
            {article.category}
          </Badge>
          {#if article.featured}
            <Badge class="bg-yellow-500 text-yellow-50">
              {t('articles.featured')}
            </Badge>
          {/if}
        </div>
        
        <h1 class="text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
          {article.title}
        </h1>
        
        <p class="text-lg text-gray-200 md:text-xl max-w-3xl">
          {article.excerpt}
        </p>
        
        <div class="flex flex-wrap items-center gap-6 text-sm text-gray-300">
          <div class="flex items-center gap-2">
            {#if article.author.avatar}
              <img 
                src={article.author.avatar} 
                alt={article.author.name}
                class="h-8 w-8 rounded-full object-cover"
              />
            {:else}
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <User class="h-4 w-4" />
              </div>
            {/if}
            <span class="font-medium">{article.author.name}</span>
          </div>
          
          <div class="flex items-center gap-1">
            <Calendar class="h-4 w-4" />
            <time>{formatDate(article.publishedAt)}</time>
          </div>
          
          <div class="flex items-center gap-1">
            <Clock class="h-4 w-4" />
            <span>{article.readTime} {t('articles.minRead')}</span>
          </div>
          
          {#if showStats}
            <div class="flex items-center gap-4">
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
          {/if}
        </div>
        
        <Button size="lg" class="bg-white text-black hover:bg-white/90">
          {t('articles.readArticle')}
          <ArrowRight class="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  </section>

{:else if variant === "minimal"}
  <!-- Minimal Hero -->
  <section class={cn(
    "space-y-6 py-12 text-center",
    className
  )} {...restProps}>
    <div class="flex justify-center">
      <Badge variant="secondary" class="text-sm">
        {article.category}
      </Badge>
    </div>
    
    <h1 class="text-3xl font-bold leading-tight tracking-tight md:text-4xl lg:text-5xl max-w-4xl mx-auto">
      {article.title}
    </h1>
    
    <p class="text-lg text-muted-foreground md:text-xl max-w-3xl mx-auto">
      {article.excerpt}
    </p>
    
    <div class="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
      <div class="flex items-center gap-2">
        {#if article.author.avatar}
          <img 
            src={article.author.avatar} 
            alt={article.author.name}
            class="h-6 w-6 rounded-full object-cover"
          />
        {:else}
          <div class="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
            <User class="h-3 w-3" />
          </div>
        {/if}
        <span>{article.author.name}</span>
      </div>
      
      <div class="flex items-center gap-1">
        <Calendar class="h-4 w-4" />
        <time>{formatDate(article.publishedAt)}</time>
      </div>
      
      <div class="flex items-center gap-1">
        <Clock class="h-4 w-4" />
        <span>{article.readTime} {t('articles.minRead')}</span>
      </div>
    </div>
    
    <Button size="lg">
      {t('articles.readArticle')}
      <ArrowRight class="ml-2 h-4 w-4" />
    </Button>
  </section>

{:else}
  <!-- Default Hero -->
  <section class={cn(
    "overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm",
    "lg:grid lg:grid-cols-2 lg:gap-8",
    className
  )} {...restProps}>
    {#if article.coverImage}
      <div class="relative overflow-hidden lg:order-2">
        <img 
          src={article.coverImage} 
          alt={article.title}
          class="aspect-[16/9] w-full object-cover lg:aspect-[4/3] lg:h-full"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent lg:bg-gradient-to-r" />
        {#if article.featured}
          <Badge class="absolute top-4 right-4 bg-primary text-primary-foreground">
            {t('articles.featured')}
          </Badge>
        {/if}
      </div>
    {/if}
    
    <div class="flex flex-col justify-center p-8 lg:order-1 lg:p-12">
      <div class="space-y-6">
        <div class="flex items-center gap-2">
          <Badge variant="secondary">
            {article.category}
          </Badge>
          <div class="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar class="h-3 w-3" />
            <time>{formatDate(article.publishedAt)}</time>
          </div>
        </div>
        
        <h1 class="text-3xl font-bold leading-tight tracking-tight md:text-4xl">
          {article.title}
        </h1>
        
        <p class="text-lg text-muted-foreground">
          {article.excerpt}
        </p>
        
        <div class="flex flex-wrap gap-2">
          {#each article.tags.slice(0, 4) as tag}
            <Badge variant="outline" class="text-xs">
              #{tag}
            </Badge>
          {/each}
        </div>
        
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2">
              {#if article.author.avatar}
                <img 
                  src={article.author.avatar} 
                  alt={article.author.name}
                  class="h-10 w-10 rounded-full object-cover"
                />
              {:else}
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <User class="h-5 w-5" />
                </div>
              {/if}
              <div>
                <p class="font-medium">{article.author.name}</p>
                <div class="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock class="h-3 w-3" />
                  <span>{article.readTime} {t('articles.minRead')}</span>
                </div>
              </div>
            </div>
          </div>
          
          {#if showStats}
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
          {/if}
        </div>
        
        <Button size="lg" class="w-fit">
          {t('articles.readArticle')}
          <ArrowRight class="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  </section>
{/if}
