  <script lang="ts">
import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { articleEditor } from '$lib/stores/article-editor.svelte.js';
  import { t } from '$lib/stores/i18n.svelte.js';

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
  import { CategoryTree } from '$lib/components/ui/category-tree';
  import { categoryTree } from '$lib/data/categories';


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
    CheckCircle,
    Info,
    User,
    UserPlus,
    LogIn  } from '@lucide/svelte';

    let { article, mode } = $props();
    const user = $derived($page.data.user);

  const rt = () => t;

  let editors = $state<Record<string, any>>({});
  // Cache last known editor content per language to prevent effect loops
  let lastContentByLang = $state<Record<string, string>>({});
  let hydratedContentByLang = $state<Record<string, string>>({});
  let hydratedEditorByLang = $state<Record<string, any>>({});
  let newTag = $state('');
  let showCollaboratorDialog = $state(false);
  let showVersionDialog = $state(false);
  let showCategoryDialog = $state(false);
  let showDraftsDialog = $state(false);
  let collaboratorEmail = $state('');

  const availableLanguages = [
    { value: 'tr', label: 'Türkçe', flag: '🇹🇷' },
    { value: 'en', label: 'English', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' }
  ];


  const articleData = $derived(articleEditor.articleData);
  const activeLanguage = $derived(articleEditor.activeLanguage);
  const currentTranslation = $derived(articleEditor.currentTranslation);
  const availableLangs = $derived(articleEditor.availableLanguages);
  

  function cacheEditorContent(language: string, serialized: string) {
    lastContentByLang[language] = serialized;
    hydratedContentByLang[language] = serialized;
    hydratedEditorByLang[language] = editors[language];
  }

  function onEditorUpdate(language: string) {
    return () => {
      if (editors[language]) {
        const content = editors[language].getJSON();
        // Avoid writing identical content back to the store (prevents update-depth loops)
        try {
          const serialized = JSON.stringify(content);
          if (lastContentByLang[language] !== serialized) {
            cacheEditorContent(language, serialized);
            articleEditor.updateTranslation(language, 'content', content);
          }
        } catch (_) {
          // Fallback: if serialization fails, perform a guarded update once
          articleEditor.updateTranslation(language, 'content', content);
        }
      }
    };
  }

  // Category dialog temp selection (moved out of onEditorUpdate to avoid recreating state per update)
  let tempCategory = $state('');
  let tempSubcategory = $state('');

  function openCategoryDialog() {
    tempCategory = articleData.category || '';
    tempSubcategory = articleData.subcategory || '';
    showCategoryDialog = true;
  }

  function applyCategorySelection() {
    articleEditor.updateMetadata('category', tempCategory || '');
    articleEditor.updateMetadata('subcategory', tempSubcategory || '');
    showCategoryDialog = false;
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
      delete lastContentByLang[language];
      delete hydratedContentByLang[language];
      delete hydratedEditorByLang[language];
      articleEditor.removeLanguage(language);
    }
  }

  function normalizeEditorContent(content: unknown) {
    if (content == null) return null;
    if (typeof content === 'string') {
      try {
        return JSON.parse(content);
      } catch {
        return content;
      }
    }
    return content;
  }

  function resetEditorCaches() {
    lastContentByLang = {};
    hydratedContentByLang = {};
    hydratedEditorByLang = {};
  }

  $effect(() => {
    for (const lang of availableLangs) {
      const editorInstance = editors[lang];
      const translation = articleData.translations[lang];

      if (!editorInstance || editorInstance.isDestroyed || !translation) continue;

      const normalized = normalizeEditorContent(translation.content);
      if (!normalized) continue;

      let targetSerialized: string;
      try {
        targetSerialized = JSON.stringify(normalized);
      } catch {
        continue;
      }

      const isNewInstance = hydratedEditorByLang[lang] !== editorInstance;

      try {
        if (!isNewInstance && hydratedContentByLang[lang] === targetSerialized) {
          hydratedEditorByLang[lang] = editorInstance;
          continue;
        }

        editorInstance.commands.setContent(normalized);
        const serializedAfterSet = JSON.stringify(editorInstance.getJSON());
        cacheEditorContent(lang, serializedAfterSet);
      } catch {
        cacheEditorContent(lang, targetSerialized);
      }
    }
  });



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
    resetEditorCaches();
    articleEditor.initialize();

    if (mode === 'edit' && article) {
      articleEditor.hydrate(article);
    }

    if (user && user.id) {
      articleEditor.updateMetadata('authorId', user.id);
    }
  });

  onDestroy(() => {
    articleEditor.destroy();
  });
    import { PlusIcon, FolderCheckIcon } from 'svelte-animate-icons';
import {NotebookPenIcon} from 'svelte-animate-icons';
</script>
    <Dialog.Root bind:open={showCategoryDialog}>
      <Dialog.Content class="w-full sm:w-1/2 md:w-2/7 ">
        <Dialog.Header>
          <Dialog.Title class="flex items-center gap-2">
            <PlusIcon animationState="loading" size={24} class="text-primary" />
            {rt()('article.selectCategory')}
          </Dialog.Title>
          <Dialog.Description>
            {rt()('article.categoryTags')}
          </Dialog.Description>
        </Dialog.Header>

        <ScrollArea class="max-h-[400px] pr-4">
          <CategoryTree
            categories={categoryTree}
            bind:selectedCategory={tempCategory}
            bind:selectedSubcategory={tempSubcategory}
          />
        </ScrollArea>

        <Dialog.Footer class="gap-2">
          <Button variant="outline" onclick={() => showCategoryDialog = false}>
            {rt()('common.cancel')}
          </Button>
          <Button onclick={applyCategorySelection}>
            {rt()('common.apply')}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>

    <div class="space-y-4">
      <div class="flex flex-col items-center justify-center gap-1">
          <NotebookPenIcon triggers={{ hover: false }} duration={2500} animationState="loading" size={48} class="text-primary" />
          <h1 class="text-xl sm:text-2xl whitespace-nowrap font-bold flex items-center gap-2">
            {rt()('article.newArticle')}

          </h1>
          <p class="text-muted-foreground">{rt()('article.shareThoughts')}</p>
      </div>

      <div class="grid grid-re grid-cols-1 lg:grid-cols-9 gap-4">
        <div class="lg:col-span-2 space-y-4 sm:sticky md:top-12 sm:self-start md:max-h-[calc(100vh-8rem] overflow-x-hidden">
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Send class="w-4 h-4" />
                {rt()('article.publishSettings')}
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div>
                <Label class="text-sm font-medium">{rt()('article.thumbnail')}</Label>
                {#if articleData.thumbnail}
                  <div class="mt-2 space-y-2">
                    <img src={articleData.thumbnail} alt="thumbnail" class="w-full h-36 object-cover rounded-md border" />
                    <div class="flex gap-2">
                      <Button size="sm" variant="outline" onclick={() => window.open(articleData.thumbnail, '_blank')}>{rt()('common.view')}</Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onclick={async () => {
                          const previousUrl = articleData.thumbnail;
                          if (previousUrl) {
                            try {
                              await fetch('/api/upload', {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ url: previousUrl })
                              });
                            } catch (error) {
                              console.error('Thumbnail delete error:', error);
                            }
                          }
                          articleEditor.updateMetadata('thumbnail', '');
                        }}
                      >{rt()('common.remove')}</Button>
                    </div>
                  </div>
                {:else}
                  <div class="mt-2 flex items-center gap-2">
                    <Input type="file" accept="image/*" required onchange={async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (!file) return;
                                              const maxBytes = 4 * 1024 * 1024; // 4MB
                        if ((file as any).size && (file as any).size > maxBytes) {
                          alert('Maksimum dosya boyutu 4MB olmalı.');
                          return;
                        }

                        const isImage = file.type?.startsWith('image/');
                        if (!isImage) {
                          alert('Sadece görsel yükleyebilirsiniz.');
                          return;
                        }

                        const img = new Image();
                        const urlObj = URL.createObjectURL(file);
                        const validateAndUpload = async () => {
                          try {
                            const ratio = img.naturalWidth / img.naturalHeight;
                            const target = 16 / 9;
                            const diff = Math.abs(ratio - target) / target;
                            if (diff > 0.02) {
                              alert('Thumbnail 16:9 oranında olmalı.');
                              URL.revokeObjectURL(urlObj);
                              return;
                            }

                            const fd = new FormData();
                            fd.append('file', file);
                            fd.append('folder', 'thumbnails');

                            try {
                              const articleId = await articleEditor.ensureArticleId();
                              if (articleId) {
                                fd.append('articleId', articleId);
                              }
                            } catch (error) {
                              console.error('Failed to ensure article ID before upload', error);
                            }

                            fd.append('type', 'thumbnail');
                            if (articleData.thumbnail) {
                              fd.append('previousUrl', articleData.thumbnail);
                            }

                            const res = await fetch('/api/upload', { method: 'POST', body: fd });
                            if (res.ok) {
                              const { url } = await res.json();
                              articleEditor.updateMetadata('thumbnail', url);
                            } else {
                              console.error('Upload failed:', await res.text());
                              alert('Thumbnail yüklenemedi');
                            }
                          } catch (error) {
                            console.error('Upload error:', error);
                            alert('Thumbnail yükleme hatası');
                          } finally {
                            URL.revokeObjectURL(urlObj);
                          }
                        };

                        img.onload = validateAndUpload;
                        img.onerror = () => {
                          alert('Görsel okunamadı.');
                          URL.revokeObjectURL(urlObj);
                        };
                        img.src = urlObj;
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
<Popover.Root>
  <Popover.Trigger class="w-fit">
    <Button
      variant="outline"
      role="combobox"
      class="h-9 w-[240px] justify-between overflow-x-hidden"
    >

        {t('searchLanguages')}

    </Button>
  </Popover.Trigger>

  <Popover.Content class="w-[240px] p-0 overflow-x-hidden">
    <Command.Root>
      <Command.Input placeholder={t('searchLanguages')}/>
      <Command.List>
        <Command.Empty>{t('noLanguagesFound')}</Command.Empty>
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
              <div class="flex items-center gap-2 overflow-x-hidden">
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

          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Tag class="w-4 h-4" />
                {rt()('article.categoryTags')}
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div>
                <Label class="text-sm font-medium">{rt()('article.category')}</Label>
                <Button
                  variant="outline"
                  class="w-full h-10 justify-start overflow-hidden"
                  onclick={openCategoryDialog}
                >
                  {#if articleData.category}
                    <span class="flex items-center gap-2">
                      <span class="font-medium">{rt()(`categories.${articleData.category}`)}</span>
                      {#if articleData.subcategory}
                        <span class="text-muted-foreground">/ {rt()(`categories.${articleData.subcategory}`)}</span>
                      {/if}
                    </span>
                  {:else}
                    {rt()('article.selectCategory')}
                  {/if}
                </Button>
              </div>

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
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <BookOpen class="w-4 h-4" />
                {rt()('article.authorInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span class="text-sm font-medium">
                    {user?.name ? user.name.charAt(0).toUpperCase() : (user?.nickname?.charAt(0)?.toUpperCase() ?? '?')}
                  </span>
                </div>
                <div>
                  <p class="font-medium">
                    {user?.name && user?.surname ? `${user.name} ${user.surname}` : (user?.nickname ?? '—')}
                  </p>
                  <p class="text-sm text-muted-foreground">@{user?.nickname ?? 'guest'}</p>
                </div>
              </div>
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
                                  <Button class="w-full" onclick={publishArticle} disabled={articleEditor.isSaving}>
            <Send class="w-4 h-4" />
            {articleEditor.isSaving ? rt()('article.publishing') : rt()('article.publish')}
          </Button>
        </div>
        <div class="lg:col-span-7">
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
                <Input
                  value={translation.title}
                  placeholder={rt()('article.titlePlaceholder')}
                  class="text-xl font-bold h-12"
                  oninput={(e) => articleEditor.updateTranslation(lang, 'title', (e.target as HTMLInputElement).value)}
                />
                <Textarea
                  value={translation.excerpt}
                  placeholder={rt()('article.excerptPlaceholder')}
                  class="resize-none"
                  rows={3}
                  maxlength={300}
                  oninput={(e) => articleEditor.updateTranslation(lang, 'excerpt', (e.target as HTMLTextAreaElement).value)}
                />
                <div class="bg-background  rounded-md border">
                  {#if editors[lang] && !editors[lang].isDestroyed}
                    <EdraToolBar
                      class="bg-background/44 pb-1 sm:p-0.5 backdrop-blur-sm border-b rounded-md rounded-b-none  flex w-full items-center overflow-x-scroll sm:overflow-x-auto sm:p-0.5 sticky top-8 sm:top-7 z-1 self-start"
                      editor={editors[lang]}
                    />
                  {/if}
                  
                  <ScrollArea orientation="vertical" class="z-0 min-h-[780px] sm:min-h-[1080px] lg:min-h-[1280px] h-fit">
                    <EdraEditor
                      bind:editor={editors[lang]}
                      content={translation.content}
                      class="py-2 p-3  md:py-7 sm:p-10"
                      onUpdate={onEditorUpdate(lang)}
                    />
                    <EdraDragHandleExtended />
                  </ScrollArea>
                </div>
              </Tabs.Content>
            {/each}
          </Tabs.Root>
        </div>
      </div>
      
    </div>

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

    <Dialog.Root bind:open={showDraftsDialog}>
      <Dialog.Content class="max-w-2xl max-h-[80vh]">
        <Dialog.Header>
          <Dialog.Title class="flex items-center gap-2">
            <History class="w-5 h-5" />
            {rt()('article.loadDraft')}
          </Dialog.Title>
          <Dialog.Description>
            {rt()('article.versionDescription')}
          </Dialog.Description>
        </Dialog.Header>

        <ScrollArea class="max-h-96">
          <div class="space-y-2 py-4">
            {#each articleEditor.drafts as d}
              <div class="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div class="font-medium">{d.title}</div>
                  <div class="text-sm text-muted-foreground">
                    {d.updatedAt ? new Date(d.updatedAt).toLocaleString() : ''}
                  </div>
                </div>
                <div class="flex gap-2">
                  <Button size="sm" onclick={() => openDraftById(d.id)}>
                    {rt()('common.open')}
                  </Button>
                  <Button size="sm" variant="destructive" onclick={async () => { await articleEditor.deleteDraft(d.id); }}>
                    {rt()('common.delete')}
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
          <Button variant="outline" onclick={() => showDraftsDialog = false}>
            {rt()('common.close')}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>

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

