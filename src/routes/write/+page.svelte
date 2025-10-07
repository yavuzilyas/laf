<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { articleEditor } from '$lib/stores/article-editor.svelte.js';
  import { t } from '$lib/stores/i18n.svelte.ts';
  import Navbar from '$lib/Navbar.svelte';
  import Footer from '$lib/Footer.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import * as Tabs from '$lib/components/ui/tabs/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Badge } from '$lib/components/ui/badge';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Separator } from '$lib/components/ui/separator';
  import * as Select from '$lib/components/ui/select';
    import * as Popover from '$lib/components/ui/popover';
        import * as Command from '$lib/components/ui/command';


  import { EdraEditor, EdraToolBar, EdraDragHandleExtended } from '$lib/components/edra/shadcn/index.js';
  import {
    Save,
    Eye,
    Send,
    X,
    Plus,
    FileText,
    Globe,
    Tag,
    BookOpen,
    Users,
    History,
    Languages,
    Clock,
    CheckCircle
  } from '@lucide/svelte';

    // Get user data from layout
    let { data } = $props();
    let user = data?.user;
  
  // keep existing rt()('key') callsites working
  const rt = () => t;
  
  // Editor states (use $state for deep reactivity so toolbar appears when editor binds)
  let editors = $state<Record<string, any>>({});
  let newTag = $state('');
  let showCollaboratorDialog = $state(false);
  let showVersionDialog = $state(false);
  let collaboratorEmail = $state('');
  
  // Language options
  const availableLanguages = [
    { value: 'tr', label: 'Türkçe', flag: '🇹🇷' },
    { value: 'en', label: 'English', flag: '🇺🇸' },
    { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { value: 'fr', label: 'Français', flag: '🇫🇷' }
  ];

  // Categories
  const categories = [
    'Teori', 'Tarih', 'Ekonomi', 'Felsefe', 
    'Teknoloji', 'Politika', 'Analiz', 'Görüş'
  ];

  // Reactive data
  const articleData = $derived(articleEditor.articleData);
  const activeLanguage = $derived(articleEditor.activeLanguage);
  const currentTranslation = $derived(articleEditor.currentTranslation);
  const availableLangs = $derived(articleEditor.availableLanguages);
  const isAutosaving = $derived(articleEditor.isAutosaving);
  const hasUnsavedChanges = $derived(articleEditor.hasUnsavedChanges);

  function onEditorUpdate(language: string) {
    return () => {
      if (editors[language]) {
        const content = editors[language].getJSON();
        articleEditor.updateTranslation(language, 'content', content);
      }
    };
  }

  function addLanguage() {
    const newLang = availableLanguages.find(lang => 
      !availableLangs.includes(lang.value)
    );
    if (newLang) {
      articleEditor.addLanguage(newLang.value);
    }
  }

  function removeLanguage(language: string) {
    if (availableLangs.length > 1) {
      articleEditor.removeLanguage(language);
    }
  }

  async function addCollaborator() {
    if (collaboratorEmail.trim()) {
      try {
        const response = await fetch('/api/users/find-by-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: collaboratorEmail.trim() })
        });
        
        if (response.ok) {
          const user = await response.json();
          articleEditor.addCollaborator(user.id);
          collaboratorEmail = '';
          showCollaboratorDialog = false;
        } else {
          alert('Kullanıcı bulunamadı');
        }
      } catch (error) {
        console.error('Error finding user:', error);
      }
    }
  }

  async function saveDraft() {
    const success = await articleEditor.saveDraft();
    if (success) {
      // Show success toast
      console.log('Draft saved successfully');
    }
  }

  async function publishArticle() {
    try {
      const result = await articleEditor.publishArticle();
      if (result) {
        await goto(`/article/${result.slug}`);
      }
    } catch (error: any) {
      alert(error.message);
    }
  }

  onMount(async () => {
    // Load existing draft
    await articleEditor.loadDraft();
    await articleEditor.loadVersions();
    
    // Set author
    articleEditor.updateMetadata('authorId', user.id);
  });

  onDestroy(() => {
    articleEditor.destroy();
  });
</script>
<Navbar />
<div class="container max-w-7xl mx-auto px-4 xl:px-0 py-6">
  {#if !user}
    <!-- Not logged in state -->
    <div class="flex flex-col items-center justify-center py-12 text-center">
      <div class="rounded-full bg-muted p-4 mb-4">
        <FileText class="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 class="text-2xl font-bold mb-2">{rt()('auth.loginRequired')}</h2>
      <p class="text-muted-foreground mb-6">{rt()('auth.loginToWrite')}</p>
      <Button href="/giris">{rt()('auth.login')}</Button>
    </div>
  {:else}
    <!-- Article Editor -->
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-end justify-between">
        <div>
          <h1 class="text-2xl font-bold flex items-center gap-2">
            {rt()('article.newArticle')}
            {#if hasUnsavedChanges}
              <div class="flex items-center text-xs text-muted-foreground">
                <Clock class="w-3.5 h-3.5 mr-1 animate-pulse" />
                {rt()('article.autosaving')}
              </div>
            {:else if isAutosaving}
              <div class="flex items-center text-xs text-primary">
                <Clock class="w-3.5 h-3.5 mr-1" />
                {rt()('article.unsavedChanges')}
              </div>
            {:else}
              <div class="flex items-center text-xs text-green-600">
                <CheckCircle class="w-3.5 h-3.5 mr-1" />
                {rt()('article.saved')}
              </div>
            {/if}
          </h1>
          <p class="text-muted-foreground">{rt()('article.shareThoughts')}</p>
        </div>
        
        <div class="flex items-center gap-2">
          <Button variant="outline" onclick={() => showVersionDialog = true}>
            <History class="w-4 h-4 mr-2" />
            {rt()('article.versions')}
          </Button>
          <Button variant="outline" onclick={() => showCollaboratorDialog = true}>
            <Users class="w-4 h-4 mr-2" />
            {rt()('article.collaborators')}
          </Button>
          <Button variant="outline" onclick={saveDraft} disabled={articleEditor.isSaving}>
            <Save class="w-4 h-4 mr-2" />
            {articleEditor.isSaving ? rt()('article.saving') : rt()('article.saveDraft')}
          </Button>
          <Button onclick={publishArticle} disabled={articleEditor.isSaving}>
            <Send class="w-4 h-4 mr-2" />
            {articleEditor.isSaving ? rt()('article.publishing') : rt()('article.publish')}
          </Button>
        </div>
      </div>

      <!-- Article Form -->
      <div class="grid grid-cols-1 lg:grid-cols-6 gap-4">
        <!-- Main Content -->
        <div class="lg:col-span-4">
          <!-- Language Tabs -->
          <Tabs.Root value={activeLanguage}>
            <div class="flex items-center justify-between mb-4">
              <Tabs.List class="grid w-full h-min grid-cols-4">
                {#each availableLangs as lang}
                  {@const langInfo = availableLanguages.find(l => l.value === lang)}
                  <Tabs.Trigger 
                    value={lang} 
                    onclick={() => articleEditor.setActiveLanguage(lang)}
                    class="flex items-center gap-2"
                  >
                    <span>{langInfo?.flag}</span>
                    <span>{langInfo?.label}</span>

                  </Tabs.Trigger>
                {/each}
              </Tabs.List>

            </div>

            {#each availableLangs as lang}
              <Tabs.Content value={lang} class="space-y-4">
                {@const translation = articleData.translations[lang]}
                
                <!-- Title -->
                <Input
                  bind:value={translation.title}
                  placeholder={rt()('article.titlePlaceholder')}
                  class="text-xl font-bold h-12"
                  oninput={() => articleEditor.updateTranslation(lang, 'title', translation.title)}
                />

                <!-- Excerpt -->
                <Textarea
                  bind:value={translation.excerpt}
                  placeholder={rt()('article.excerptPlaceholder')}
                  class="resize-none"
                  rows={3}
                  maxlength={300}
                  oninput={() => articleEditor.updateTranslation(lang, 'excerpt', translation.excerpt)}
                />

                <!-- Content Editor -->
                <div class="bg-background rounded-md border">
                  {#if editors[lang] && !editors[lang].isDestroyed}
                    <EdraToolBar
                      class="bg-secondary/50 flex w-full items-center overflow-x-auto p-0.5"
                      editor={editors[lang]}
                    />
                    <EdraDragHandleExtended editor={editors[lang]} />
                  {/if}
                  
                  <ScrollArea orientation="vertical" class="h-[600px]">
                    <EdraEditor
                      bind:editor={editors[lang]}
                      content={translation.content}
                      class="py-7 p-10"
                      onUpdate={onEditorUpdate(lang)}
                    />
                  </ScrollArea>
                </div>
              </Tabs.Content>
            {/each}
          </Tabs.Root>
        </div>

        <!-- Sidebar -->
        <div class="lg:col-span-2 space-y-4">
          <!-- Publish Settings -->
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Send class="w-4 h-4" />
                {rt()('article.publishSettings')}
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <!-- Thumbnail Upload -->
              <div>
                <Label class="text-sm font-medium">{rt()('article.thumbnail')}</Label>
                {#if articleData.thumbnail}
                  <div class="mt-2 space-y-2">
                    <img src={articleData.thumbnail} alt="thumbnail" class="w-full h-36 object-cover rounded-md border" />
                    <div class="flex gap-2">
                      <Button size="sm" variant="outline" onclick={() => window.open(articleData.thumbnail, '_blank')}>{rt()('common.view')}</Button>
                      <Button size="sm" variant="destructive" onclick={() => articleEditor.updateMetadata('thumbnail', '')}>{rt()('common.remove')}</Button>
                    </div>
                  </div>
                {:else}
                  <div class="mt-2 flex items-center gap-2">
                    <input type="file" accept="image/*" onchange={async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (!file) return;
                      const fd = new FormData();
                      fd.append('file', file);
                      fd.append('folder', 'image');
                      const res = await fetch('/api/upload', { method: 'POST', body: fd });
                      if (res.ok) {
                        const { url } = await res.json();
                        articleEditor.updateMetadata('thumbnail', url);
                      }
                    }} />
                  </div>
                {/if}
              </div>
              <!-- Status -->
              <div>
                <Label class="text-sm font-medium">{rt()('article.status')}</Label>
                <Badge variant={articleData.status === 'published' ? 'default' : 'secondary'}>
                  {articleData.status === 'published' ? rt()('article.published') : rt()('article.draft')}
                </Badge>
              </div>

              <!-- Available Languages -->
              <div>
                <Label class="text-sm font-medium">{rt()('article.availableLanguages')}</Label>
                <div class="flex flex-col  gap-2 mt-1">
                  <div class="flex flex-wrap gap-1">
                    {#each availableLangs as lang}
                      {@const langInfo = availableLanguages.find(l => l.value === lang)}
                      <Badge variant="outline" class="text-xs">
                        {langInfo?.flag} {langInfo?.label}
                      </Badge>
                    {/each}
                  </div>
   <!-- Multi-language selector using shadcn-svelte -->
<Popover.Root>
  <Popover.Trigger class="w-fit">
    <Button
      variant="outline"
      role="combobox"
      class="h-9 w-[240px] justify-between"
    >

        Select languages...

    </Button>
  </Popover.Trigger>

  <Popover.Content class="w-[240px] p-0">
    <Command.Root>
      <Command.Input placeholder="Search languages..." />
      <Command.List>
        <Command.Empty>No languages found.</Command.Empty>
        <Command.Group>
          {#each availableLanguages as opt}
            <Command.Item
              value={opt.value}
              onclick={() => {
                if (availableLangs.includes(opt.value)) {
                  removeLanguage(opt.value);
                } else {
                  articleEditor.addLanguage(opt.value);
                }
              }}
              class="flex items-center justify-between cursor-pointer hover:bg-accent px-2 py-1 rounded-sm"
            >
              <div class="flex items-center gap-2">
                <span>{opt.flag}</span>
                <span>{opt.label}</span>
              </div>

              {#if availableLangs.includes(opt.value)}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 text-primary"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8.25 8.25a1 1 0 01-1.414 0l-3.75-3.75a1 1 0 111.414-1.414l3.043 3.043 7.543-7.543a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              {/if}
            </Command.Item>
          {/each}
        </Command.Group>
      </Command.List>
    </Command.Root>
  </Popover.Content>
</Popover.Root>

                </div>
                <div class="mt-3 space-y-2">
                  <div class="text-sm text-muted-foreground">
                    {rt()('article.defaultLanguage')}: <span class="font-medium">{articleData.defaultLanguage?.toUpperCase() || activeLanguage.toUpperCase()}</span>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    {#each availableLangs as lang}
                      <Button
                        size="sm"
                        variant={articleData.defaultLanguage === lang ? 'default' : 'outline'}
                        onclick={() => articleEditor.updateMetadata('defaultLanguage', lang)}
                      >
                        {lang.toUpperCase()}
                      </Button>
                    {/each}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Categories & Tags -->
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Tag class="w-4 h-4" />
                {rt()('article.categoryTags')}
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <!-- Category (shadcn Select) -->
              <div>
                <Label class="text-sm font-medium">{rt()('article.category')}</Label>
                <Select.Root value={articleData.category} onValueChange={(v) => articleEditor.updateMetadata('category', v)}>
                  <Select.Trigger class="w-full h-10">
                    {articleData.category || rt()('article.selectCategory')}
                  </Select.Trigger>
                  <Select.Content>
                    {#each categories as category}
                      <Select.Item value={category}>{category}</Select.Item>
                    {/each}
                  </Select.Content>
                </Select.Root>
              </div>

              <!-- Subcategory (shadcn Select) -->
              <div>
                <Label class="text-sm font-medium">{rt()('article.subcategory')}</Label>
                <Select.Root value={articleData.subcategory} onValueChange={(v) => articleEditor.updateMetadata('subcategory', v)}>
                  <Select.Trigger class="w-full h-10">
                    {articleData.subcategory || rt()('article.selectSubcategory')}
                  </Select.Trigger>
                  <Select.Content>
                    {#each categories as category}
                      <Select.Item value={category}>{category}</Select.Item>
                    {/each}
                  </Select.Content>
                </Select.Root>
              </div>

              <!-- Tags -->
              <div>
                <Label class="text-sm font-medium">{rt()('article.tags')}</Label>
                <div class="flex gap-2">
                  <Input
                    bind:value={newTag}
                    placeholder={rt()('article.addTag')}
                    class="flex-1"
                    onkeydown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        articleEditor.addTag(newTag);
                        newTag = '';
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onclick={() => {
                      articleEditor.addTag(newTag);
                      newTag = '';
                    }}
                  >
                    <Plus class="w-4 h-4" />
                  </Button>
                </div>
                
                {#if articleData.tags.length > 0}
                  <div class="flex flex-wrap gap-1 mt-2">
                    {#each articleData.tags as tag}
                      <Badge variant="outline" class="gap-1">
                        {tag}
                        <button
                          onclick={() => articleEditor.removeTag(tag)}
                          class="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <X class="w-3 h-3" />
                        </button>
                      </Badge>
                    {/each}
                  </div>
                {/if}
              </div>
            </CardContent>
          </Card>

          <!-- Author & Collaborators -->
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <BookOpen class="w-4 h-4" />
                {rt()('article.authorInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <!-- Author -->
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span class="text-sm font-medium">
                    {user.name ? user.name.charAt(0).toUpperCase() : user.nickname.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p class="font-medium">
                    {user.name && user.surname ? `${user.name} ${user.surname}` : user.nickname}
                  </p>
                  <p class="text-sm text-muted-foreground">@{user.nickname}</p>
                </div>
              </div>

              <!-- Collaborators -->
              {#if articleData.collaborators.length > 0}
                <div>
                  <Label class="text-sm font-medium">{rt()('article.collaborators')}</Label>
                  <div class="space-y-2 mt-2">
                    {#each articleData.collaborators as collaboratorId}
                      <div class="flex items-center justify-between">
                        <span class="text-sm">Collaborator {collaboratorId}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onclick={() => articleEditor.removeCollaborator(collaboratorId)}
                        >
                          <X class="w-4 h-4" />
                        </Button>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    <!-- Collaborator Dialog -->
    <Dialog.Root bind:open={showCollaboratorDialog}>
      <Dialog.Content class="!max-w-fit">
        <Dialog.Header>
          <Dialog.Title class="flex items-center gap-2">
            <Users class=" text-primary w-5 h-5" />
            {rt()('article.addCollaborator')}
          </Dialog.Title>
          <Dialog.Description>
            {rt()('article.collaboratorDescription')}
          </Dialog.Description>
        </Dialog.Header>
        
        <div class="pt-2 ">
          <div class="gap-2 flex flex-col">
            <Label for="collaborator-email">{rt()('article.collaboratorEmail')}</Label>
            <Input
              id="collaborator-email"
              bind:value={collaboratorEmail}
              placeholder="user@example.com"
              type="email"
            />
          </div>
        </div>
        
        <Dialog.Footer class="gap-2">
          <Button variant="outline" onclick={() => showCollaboratorDialog = false}>
            {rt()('common.cancel')}
          </Button>
          <Button onclick={addCollaborator} disabled={!collaboratorEmail.trim()}>
            {rt()('article.addCollaborator')}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>

    <!-- Version History Dialog -->
    <Dialog.Root bind:open={showVersionDialog}>
      <Dialog.Content class="max-w-2xl max-h-[80vh]">
        <Dialog.Header>
          <Dialog.Title class="flex items-center gap-2">
            <History class="w-5 h-5" />
            {rt()('article.versionHistory')}
          </Dialog.Title>
          <Dialog.Description>
            {rt()('article.versionDescription')}
          </Dialog.Description>
        </Dialog.Header>
        
        <ScrollArea class="max-h-96">
          <div class="space-y-2 py-4">
            {#each articleEditor.versions as version}
              <div class="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div class="font-medium">
                    {rt()('article.version')} {version.version}
                  </div>
                  <div class="text-sm text-muted-foreground">
                    {new Date(version.createdAt).toLocaleDateString()} - {version.createdBy}
                  </div>
                  {#if version.changeNote}
                    <div class="text-xs text-muted-foreground mt-1">
                      {version.changeNote}
                    </div>
                  {/if}
                </div>
                <div class="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye class="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    {rt()('article.restore')}
                  </Button>
                </div>
              </div>
            {:else}
              <div class="text-center py-8 text-muted-foreground">
                {rt()('article.noVersions')}
              </div>
            {/each}
          </div>
        </ScrollArea>
        
        <Dialog.Footer>
          <Button variant="outline" onclick={() => showVersionDialog = false}>
            {rt()('common.close')}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  {/if}
</div>
<Footer />