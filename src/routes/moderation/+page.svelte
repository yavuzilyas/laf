<script lang="ts">
  import Navbar from '$lib/Navbar.svelte';
  import Footer from '$lib/Footer.svelte';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Separator } from '$lib/components/ui/separator';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { 
    Shield, 
    FileText, 
    MessageSquare, 
    Users, 
    Eye, 
    EyeOff, 
    Trash2, 
    X,
    AlertTriangle,
    CheckCircle2
  } from '@lucide/svelte';
  import { t } from '$lib/stores/i18n.svelte.js';
  import { showToast } from '$lib/hooks/toast';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let { data } = $props();
  
  let stats = $state({
    reportedArticles: 0,
    reportedComments: 0,
    reportedUsers: 0,
    hiddenArticles: 0,
    hiddenComments: 0,
    totalReports: 0
  });

  let reports = $state({
    articles: [] as any[],
    comments: [] as any[],
    users: [] as any[]
  });

  let loading = $state(true);
  let activeTab = $state('overview');

  async function fetchStats() {
    try {
      const response = await fetch('/api/moderation/stats');
      if (response.ok) {
        stats = await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }

  async function fetchReports() {
    try {
      const response = await fetch('/api/moderation/reports');
      if (response.ok) {
        reports = await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    }
  }

  async function performAction(action: string, type: string, id: string, reason?: string) {
    try {
      const response = await fetch('/api/moderation/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, type, id, reason })
      });

      if (response.ok) {
        showToast(t('moderation.actionSuccess'), 'success');
        await Promise.all([fetchStats(), fetchReports()]);
      } else {
        const error = await response.json();
        showToast(error.error || t('moderation.actionFailed'), 'error');
      }
    } catch (error) {
      console.error('Action failed:', error);
      showToast(t('moderation.actionFailed'), 'error');
    }
  }

  function formatDate(date: string | Date) {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  }

  async function loadData() {
    loading = true;
    await Promise.all([fetchStats(), fetchReports()]);
    loading = false;
  }

  $effect(() => {
    loadData();
  });
</script>

<svelte:head>
  <title>{t('moderation.title')} - LAF</title>
</svelte:head>

<Navbar {data} />

<main class="container max-w-7xl mx-auto px-4 py-8">
  <div class="mb-8">
    <div class="flex items-center gap-3 mb-2">
      <Shield class="h-8 w-8 text-primary" />
      <h1 class="text-3xl font-bold">{t('moderation.title')}</h1>
    </div>
    <p class="text-muted-foreground">{t('moderation.description')}</p>
  </div>

  <Tabs bind:value={activeTab} class="w-full">
    <TabsList class="grid w-full grid-cols-4">
      <TabsTrigger value="overview">{t('moderation.overview')}</TabsTrigger>
      <TabsTrigger value="articles">{t('moderation.articles')} ({reports.articles.length})</TabsTrigger>
      <TabsTrigger value="comments">{t('moderation.comments')} ({reports.comments.length})</TabsTrigger>
      <TabsTrigger value="users">{t('moderation.users')} ({reports.users.length})</TabsTrigger>
    </TabsList>

    <TabsContent value="overview" class="space-y-4">
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">{t('moderation.reportedArticles')}</CardTitle>
            <FileText class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{stats.reportedArticles}</div>
            <p class="text-xs text-muted-foreground">{t('moderation.awaitingReview')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">{t('moderation.reportedComments')}</CardTitle>
            <MessageSquare class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{stats.reportedComments}</div>
            <p class="text-xs text-muted-foreground">{t('moderation.awaitingReview')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">{t('moderation.reportedUsers')}</CardTitle>
            <Users class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{stats.reportedUsers}</div>
            <p class="text-xs text-muted-foreground">{t('moderation.awaitingReview')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">{t('moderation.hiddenArticles')}</CardTitle>
            <EyeOff class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{stats.hiddenArticles}</div>
            <p class="text-xs text-muted-foreground">{t('moderation.currentlyHidden')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">{t('moderation.hiddenComments')}</CardTitle>
            <EyeOff class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{stats.hiddenComments}</div>
            <p class="text-xs text-muted-foreground">{t('moderation.currentlyHidden')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">{t('moderation.totalReports')}</CardTitle>
            <AlertTriangle class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{stats.totalReports}</div>
            <p class="text-xs text-muted-foreground">{t('moderation.allTime')}</p>
          </CardContent>
        </Card>
      </div>
    </TabsContent>

    <TabsContent value="articles" class="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('moderation.reportedArticles')}</CardTitle>
          <CardDescription>{t('moderation.articlesDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {#if loading}
            <div class="text-center py-8">{t('moderation.loading')}</div>
          {:else if reports.articles.length === 0}
            <div class="text-center py-8 text-muted-foreground">
              <CheckCircle2 class="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('moderation.noReportedArticles')}</p>
            </div>
          {:else}
            <ScrollArea class="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('moderation.title')}</TableHead>
                    <TableHead>{t('moderation.author')}</TableHead>
                    <TableHead>{t('moderation.reports')}</TableHead>
                    <TableHead>{t('moderation.status')}</TableHead>
                    <TableHead>{t('moderation.created')}</TableHead>
                    <TableHead class="text-right">{t('moderation.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {#each reports.articles as article}
                    <TableRow>
                      <TableCell class="font-medium">
                        <a 
                          href={article.slug ? `/article/${article.slug}` : '#'}
                          class="hover:underline"
                        >
                          {article.title || t('moderation.untitled')}
                        </a>
                      </TableCell>
                      <TableCell>
                        <a 
                          href={article.authorNickname ? `/${article.authorNickname}` : '#'}
                          class="hover:underline"
                        >
                          {article.authorNickname || t('moderation.unknown')}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">{article.reportCount}</Badge>
                      </TableCell>
                      <TableCell>
                        {#if article.hidden}
                          <Badge variant="secondary">{t('moderation.hidden')}</Badge>
                        {:else}
                          <Badge variant="outline">{t('moderation.visible')}</Badge>
                        {/if}
                      </TableCell>
                      <TableCell class="text-sm text-muted-foreground">
                        {formatDate(article.createdAt)}
                      </TableCell>
                      <TableCell class="text-right">
                        <div class="flex gap-2 justify-end">
                          {#if article.hidden}
                            <Button
                              size="sm"
                              variant="outline"
                              onclick={() => performAction('unhide', 'article', article.id)}
                            >
                              <Eye class="h-4 w-4" />
                            </Button>
                          {:else}
                            <Button
                              size="sm"
                              variant="outline"
                              onclick={() => performAction('hide', 'article', article.id)}
                            >
                              <EyeOff class="h-4 w-4" />
                            </Button>
                          {/if}
                          <Button
                            size="sm"
                            variant="outline"
                            onclick={() => performAction('clearReports', 'article', article.id)}
                          >
                            <X class="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onclick={() => performAction('delete', 'article', article.id)}
                          >
                            <Trash2 class="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  {/each}
                </TableBody>
              </Table>
            </ScrollArea>
          {/if}
        </CardContent>
      </Card>
    </TabsContent>

    <TabsContent value="comments" class="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('moderation.reportedComments')}</CardTitle>
          <CardDescription>{t('moderation.commentsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {#if loading}
            <div class="text-center py-8">{t('moderation.loading')}</div>
          {:else if reports.comments.length === 0}
            <div class="text-center py-8 text-muted-foreground">
              <CheckCircle2 class="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('moderation.noReportedComments')}</p>
            </div>
          {:else}
            <ScrollArea class="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('moderation.content')}</TableHead>
                    <TableHead>{t('moderation.author')}</TableHead>
                    <TableHead>{t('moderation.reports')}</TableHead>
                    <TableHead>{t('moderation.status')}</TableHead>
                    <TableHead>{t('moderation.created')}</TableHead>
                    <TableHead class="text-right">{t('moderation.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {#each reports.comments as comment}
                    <TableRow>
                      <TableCell class="max-w-md">
                        <div class="truncate" title={comment.content}>
                          {comment.content}
                        </div>
                      </TableCell>
                      <TableCell>
                        <a 
                          href={comment.authorNickname ? `/${comment.authorNickname}` : '#'}
                          class="hover:underline"
                        >
                          {comment.authorNickname || t('moderation.unknown')}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">{comment.reportCount}</Badge>
                      </TableCell>
                      <TableCell>
                        {#if comment.hidden}
                          <Badge variant="secondary">{t('moderation.hidden')}</Badge>
                        {:else}
                          <Badge variant="outline">{t('moderation.visible')}</Badge>
                        {/if}
                      </TableCell>
                      <TableCell class="text-sm text-muted-foreground">
                        {formatDate(comment.createdAt)}
                      </TableCell>
                      <TableCell class="text-right">
                        <div class="flex gap-2 justify-end">
                          {#if comment.hidden}
                            <Button
                              size="sm"
                              variant="outline"
                              onclick={() => performAction('unhide', 'comment', comment.id)}
                            >
                              <Eye class="h-4 w-4" />
                            </Button>
                          {:else}
                            <Button
                              size="sm"
                              variant="outline"
                              onclick={() => performAction('hide', 'comment', comment.id)}
                            >
                              <EyeOff class="h-4 w-4" />
                            </Button>
                          {/if}
                          <Button
                            size="sm"
                            variant="outline"
                            onclick={() => performAction('clearReports', 'comment', comment.id)}
                          >
                            <X class="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onclick={() => performAction('delete', 'comment', comment.id)}
                          >
                            <Trash2 class="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  {/each}
                </TableBody>
              </Table>
            </ScrollArea>
          {/if}
        </CardContent>
      </Card>
    </TabsContent>

    <TabsContent value="users" class="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('moderation.reportedUsers')}</CardTitle>
          <CardDescription>{t('moderation.usersDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {#if loading}
            <div class="text-center py-8">{t('moderation.loading')}</div>
          {:else if reports.users.length === 0}
            <div class="text-center py-8 text-muted-foreground">
              <CheckCircle2 class="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('moderation.noReportedUsers')}</p>
            </div>
          {:else}
            <ScrollArea class="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('moderation.user')}</TableHead>
                    <TableHead>{t('moderation.email')}</TableHead>
                    <TableHead>{t('moderation.reports')}</TableHead>
                    <TableHead>{t('moderation.created')}</TableHead>
                    <TableHead class="text-right">{t('moderation.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {#each reports.users as user}
                    <TableRow>
                      <TableCell class="font-medium">
                        <a 
                          href={user.nickname ? `/${user.nickname}` : '#'}
                          class="hover:underline"
                        >
                          {user.nickname || t('moderation.unknown')}
                        </a>
                      </TableCell>
                      <TableCell class="text-sm text-muted-foreground">
                        {user.email || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">{user.reportCount}</Badge>
                      </TableCell>
                      <TableCell class="text-sm text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell class="text-right">
                        <div class="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onclick={() => performAction('clearReports', 'user', user.id)}
                          >
                            <X class="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onclick={() => performAction('ban', 'user', user.id)}
                          >
                            <Shield class="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  {/each}
                </TableBody>
              </Table>
            </ScrollArea>
          {/if}
        </CardContent>
      </Card>
    </TabsContent>
  </Tabs>
</main>

<Footer />

