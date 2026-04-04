<script lang="ts">
  import { cn } from "$lib/utils";
  import { Badge } from "$lib/components/ui/badge";
  import { Calendar, Clock, User, Sparkles, Eye, MessageCircle, ThumbsUp, ThumbsDown } from "@lucide/svelte";
  import { t, getCurrentLocale } from '$lib/stores/i18n.svelte';

  // Locale-aware URL helper
  const currentLocale = $derived(getCurrentLocale() || 'tr');
  const l = (path: string) => `/${currentLocale}${path}`;
  import A from "$lib/components/ui/a.svelte";
  import MagicCard from '$lib/components/magic/magic-card/magic-card.svelte';
  import * as Tooltip from "$lib/components/ui/tooltip";

  interface Article {
    id: string;
    slug?: string;
    title: string;
    excerpt: string;
    author: {
      name: string;
      surname?: string;
      avatar?: string;
      nickname: string;
    };
    author_nickname: string;
    publishedAt: string;
    readTime: number;
    category: string;
    coverImage?: string;
    views?: number;
    likes?: number;
    comments?: number;
    dislikes?: number;
    collaborators?: Array<{
      id: string;
      name: string;
      nickname: string;
      avatar?: string;
    }>;
  }

  let {
    articles,
    class: className,
    title,
    ...restProps
  }: {
    articles: Article[];
    class?: string;
    title?: string;
  } = $props();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(getCurrentLocale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatNumber = (num: number): string => {
    if (!num) return '0';
    if (num < 1000) return num.toString();
    if (num < 10000) return (num / 1000).toFixed(1) + 'k';
    if (num < 100000) return (num / 1000).toFixed(0) + 'k';
    if (num < 1000000) return (num / 1000).toFixed(0) + 'k';
    if (num < 10000000) return (num / 1000000).toFixed(1) + 'm';
    return (num / 1000000).toFixed(0) + 'm';
  };

  const getCollaboratorDisplayName = (collaborator: any) => {
    if (collaborator?.name || collaborator?.surname) {
      return [collaborator.name, collaborator.surname].filter(Boolean).join(' ').trim();
    }
    return collaborator?.nickname || 'Unknown User';
  };

  const getCollaboratorIdentifier = (collaborator: any) => {
    return collaborator?.nickname || collaborator?.id || 'user';
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  const getAuthorIdentifier = (article: Article) => {
    return article.author?.nickname || article.author_nickname || 'user';
  };

  const getAuthorDisplayName = (article: Article) => {
    const name = article.author?.name;
    const surname = article.author?.surname;
    if (name || surname) {
      return [name, surname].filter(Boolean).join(' ').trim();
    }
    return article.author?.nickname || article.author_nickname || 'Unknown User';
  };

  // Limit to 3 articles and apply translations based on current locale
  const recommendedArticles = $derived(
    articles.slice(0, 3).map((article: any) => {
      const translations = article.translations || {};
      const translationKeys = Object.keys(translations);
      const currentLocale = getCurrentLocale();
      const fallbackKey = translationKeys[0] || article.language || article.defaultLanguage || article.default_language || 'tr';
      const displayLanguage = currentLocale && translations[currentLocale]
        ? currentLocale
        : fallbackKey;

      const translation = translations[displayLanguage] || translations[fallbackKey] || {};

      return {
        ...article,
        title: translation.title || article.title || 'Başlıksız',
        excerpt: translation.excerpt || article.excerpt || '',
        slug: translation.slug || article.slug,
        language: displayLanguage,
      };
    })
  );
</script>

<div class={cn("w-full", className)} {...restProps}>
  {#if title}
    <div class="flex items-center gap-2 mb-6">
      <Sparkles class="h-5 w-5 text-primary" />
      <h3 class="text-xl font-bold tracking-tight">{title}</h3>
    </div>
  {/if}

  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
    {#each recommendedArticles as article, index (article.id)}
      <a
        href={article.slug ? l(`/article/${article.slug}`) : undefined}
        class="block group"
      >
        <MagicCard
          class="h-full rounded-xl overflow-hidden"
          gradientSize={250}
          gradientColor="#392E15"
          gradientOpacity={0.6}
          gradientFrom="#926A0E"
          gradientTo="#eab308"
        >
          <article class="h-full flex flex-col">
            <!-- Cover Image -->
            {#if article.coverImage}
              <div class="relative overflow-hidden aspect-[16/10]">
                <img
                  src={article.coverImage}
                  alt={article.title}
                  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                <Badge class="absolute top-4 left-4 bg-primary/90 text-primary-foreground">
                  {t(`${article.category}`)}
                </Badge>
              </div>
            {/if}

            <!-- Content -->
            <div class="flex flex-col flex-1 p-5 space-y-3">
              <!-- Category & Meta -->
              <div class="flex items-center gap-3 text-xs text-muted-foreground">
                {#if !article.coverImage}
                  <Badge variant="secondary" class="text-xs">
                    {t(`${article.category}`)}
                  </Badge>
                {/if}
                <div class="flex items-center gap-1">
                  <Calendar class="h-3 w-3" />
                  <time>{formatDate(article.publishedAt)}</time>
                </div>
                <div class="flex items-center gap-1">
                  <Clock class="h-3 w-3" />
                  <span>{article.readTime} {t('min')}</span>
                </div>
              </div>

              <!-- Title -->
              <h4 class="text-lg font-bold leading-tight tracking-tight group-hover:text-primary transition-colors line-clamp-2">
                {article.title}
              </h4>

              <!-- Excerpt -->
              <p class="text-sm text-muted-foreground line-clamp-3 flex-1">
                {truncateText(article.excerpt, 180)}
              </p>

              <!-- Stats Row -->
              <div class="flex items-center gap-3 text-xs text-muted-foreground">
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger>
                      <div class="flex items-center gap-1">
                        <Eye class="h-3 w-3" />
                        <span>{formatNumber(article.views || 0)}</span>
                      </div>
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                      <p>{(article.views || 0).toLocaleString()} {t('articles.stats.view')}</p>
                    </Tooltip.Content>
                  </Tooltip.Root>
                </Tooltip.Provider>

                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger>
                      <div class="flex items-center gap-1">
                        <MessageCircle class="h-3 w-3" />
                        <span>{formatNumber(article.comments || 0)}</span>
                      </div>
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                      <p>{(article.comments || 0).toLocaleString()} {t('articles.stats.comment')}</p>
                    </Tooltip.Content>
                  </Tooltip.Root>
                </Tooltip.Provider>

                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger>
                      <div class="flex items-center gap-1">
                        <ThumbsUp class="h-3 w-3" />
                        <span>{formatNumber(article.likes || 0)}</span>
                      </div>
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                      <p>{(article.likes || 0).toLocaleString()} {t('articles.stats.like')}</p>
                    </Tooltip.Content>
                  </Tooltip.Root>
                </Tooltip.Provider>

                {#if article.dislikes}
                  <Tooltip.Provider>
                    <Tooltip.Root>
                      <Tooltip.Trigger>
                        <div class="flex items-center gap-1">
                          <ThumbsDown class="h-3 w-3" />
                          <span>{formatNumber(article.dislikes)}</span>
                        </div>
                      </Tooltip.Trigger>
                      <Tooltip.Content>
                        <p>{article.dislikes.toLocaleString()} {t('articles.stats.dislike')}</p>
                      </Tooltip.Content>
                    </Tooltip.Root>
                  </Tooltip.Provider>
                {/if}
              </div>

              <!-- Author & Collaborators -->
              <div class="flex items-center gap-3 pt-3 border-t border-border/50">
                <div class="flex items-center gap-2 flex-1">
                  {#if article.author?.avatar}
                    <img
                      src={article.author.avatar}
                      alt={getAuthorDisplayName(article)}
                      class="h-8 w-8 rounded-full object-cover border border-border"
                    />
                  {:else}
                    <div class="flex h-8 w-8 items-center justify-center rounded-full bg-muted border border-border">
                      <User class="h-4 w-4" />
                    </div>
                  {/if}
                  <div class="flex flex-col min-w-0">
                    <span class="text-xs font-medium truncate">
                      {getAuthorDisplayName(article)}
                    </span>
                    <span class="text-xs text-muted-foreground truncate">
                      @{getAuthorIdentifier(article)}
                    </span>
                  </div>
                </div>

                <!-- Collaborators -->
                {#if article.collaborators && article.collaborators.length > 0}
                  <div class="flex items-center gap-1">
                    <div class="flex -space-x-2">
                      {#each article.collaborators.slice(0, 2) as collaborator}
                        <A href={l(`/${getCollaboratorIdentifier(collaborator)}`)} class="hover:opacity-80 transition-opacity">
                          {#if collaborator.avatar}
                            <img 
                              src={collaborator.avatar} 
                              alt={getCollaboratorDisplayName(collaborator)}
                              class="h-6 w-6 rounded-full object-cover border-2 border-background"
                              title={getCollaboratorDisplayName(collaborator)}
                            />
                          {:else}
                            <div 
                              class="flex h-6 w-6 items-center justify-center rounded-full bg-muted border-2 border-background"
                              title={getCollaboratorDisplayName(collaborator)}
                            >
                              <User class="h-3 w-3" />
                            </div>
                          {/if}
                        </A>
                      {/each}
                      {#if article.collaborators.length > 2}
                        <div class="flex h-6 w-6 items-center justify-center rounded-full bg-muted border-2 border-background text-xs font-medium">
                          +{article.collaborators.length - 2}
                        </div>
                      {/if}
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          </article>
        </MagicCard>
      </a>
    {/each}
  </div>
</div>
