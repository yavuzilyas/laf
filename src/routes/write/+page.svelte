<script lang="ts">
    import Navbar from "$lib/Navbar.svelte";
    import Footer from "$lib/Footer.svelte";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Textarea } from "$lib/components/ui/textarea";
    import { Badge } from "$lib/components/ui/badge";
    import * as Select from "$lib/components/ui/select";
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
    import { Separator } from "$lib/components/ui/separator";
    import { t } from '$lib/stores/i18n.svelte.ts';
    import { goto } from '$app/navigation';
    import { 
        Save, 
        Eye, 
        Send, 
        X, 
        Plus,
        FileText,
        Globe,
        Tag,
        BookOpen
    } from "@lucide/svelte";
    

    
    let { data } = $props();
    let user = data?.user;

    // Redirect if not logged in
    if (!user) {
        goto('/giris');
    }

    // Article form data
    let articleData = $state({
        title: "",
        excerpt: "",
        content: "",
        category: "",
        tags: [],
        language: "tr",
        status: "draft" // draft, published
    });

    let isSubmitting = $state(false);
    let isSaving = $state(false);
    let newTag = $state("");
    let editorElement: HTMLElement;


    // Categories
    const categories = [
        "Teori",
        "Tarih", 
        "Ekonomi",
        "Felsefe",
        "Teknoloji",
        "Politika",
        "Analiz",
        "Görüş"
    ];

    // Languages
    const languages = [
        { label: "Türkçe", value: "tr" },
        { label: "English", value: "en" },
        { label: "Deutsch", value: "de" },
        { label: "Français", value: "fr" }
    ];

    
    const addTag = (tag: string) => {
        if (tag.trim() && !articleData.tags.includes(tag.trim())) {
            articleData.tags = [...articleData.tags, tag.trim()];
        }
    };

    const removeTag = (tag: string) => {
        articleData.tags = articleData.tags.filter(t => t !== tag);
    };

    const saveAsDraft = async () => {
        isSaving = true;
        try {
            const response = await fetch('/api/articles/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...articleData,
                    status: 'draft'
                })
            });

            if (response.ok) {
                const result = await response.json();
                // Show success message
                console.log('Draft saved successfully');
            } else {
                console.error('Failed to save draft');
            }
        } catch (error) {
            console.error('Error saving draft:', error);
        } finally {
            isSaving = false;
        }
    };

    const publishArticle = async () => {
        if (!articleData.title.trim() || !articleData.content.trim()) {
            alert('Başlık ve içerik zorunludur');
            return;
        }

        isSubmitting = true;
        try {
            const response = await fetch('/api/articles/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...articleData,
                    status: 'published'
                })
            });

            if (response.ok) {
                const result = await response.json();
                goto(`/article/${result.slug}`);
            } else {
                const error = await response.json();
                alert(error.message || 'Makale yayınlanırken hata oluştu');
            }
        } catch (error) {
            console.error('Error publishing article:', error);
            alert('Makale yayınlanırken hata oluştu');
        } finally {
            isSubmitting = false;
        }
    };

    const previewArticle = () => {
        // Open preview in new tab/modal
        const previewWindow = window.open('', '_blank');
        if (previewWindow) {
            previewWindow.document.write(`
                <html>
                    <head>
                        <title>${articleData.title || 'Önizleme'}</title>
                        <style>
                            body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
                            h1 { color: #1f2937; }
                            .meta { color: #6b7280; font-size: 0.875rem; margin-bottom: 2rem; }
                            .content { line-height: 1.7; }
                        </style>
                    </head>
                    <body>
                        <h1>${articleData.title || 'Başlıksız Makale'}</h1>
                        <div class="meta">
                            Kategori: ${articleData.category || 'Belirlenmemiş'} | 
                            Dil: ${languages.find(l => l.value === articleData.language)?.label || 'Türkçe'}
                        </div>
                        <div class="content">${articleData.content || 'İçerik henüz yazılmamış.'}</div>
                    </body>
                </html>
            `);
        }
    };

	import { EdraEditor, EdraToolBar, EdraDragHandleExtended } from '$lib/components/edra/shadcn/index.js';
	// Editor states
	let content = $state<Content>();
	let editor = $state<Editor>();
	function onUpdate() {
		content = editor?.getJSON();
	}
    
</script>

<svelte:head>
    <title>{t('writeArticle')}</title>
    <meta name="description" content="Yeni makale yazın ve yayınlayın" />
</svelte:head>

<Navbar />

<main class=" bg-background">
    <div class="container mx-auto px-4 py-8">
        {#if !user}
            <!-- Not logged in state -->
            <div class="flex flex-col items-center justify-center py-12 text-center">
                <div class="rounded-full bg-muted p-4 mb-4">
                    <FileText class="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 class="text-2xl font-bold mb-2">Giriş Yapmanız Gerekiyor</h2>
                <p class="text-muted-foreground mb-6">Makale yazmak için önce giriş yapmalısınız.</p>
                <Button href="/giris">Giriş Yap</Button>
            </div>
        {:else}
            <!-- Article Editor -->
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex items-end justify-between">
                    <div>
                        <h1 class="text-3xl font-bold">Yeni Makale</h1>
                        <p class="text-muted-foreground">Düşüncelerinizi paylaşın</p>
                    </div>
                    
                    <div class="flex items-center gap-2">
                        <Button variant="outline" onclick={previewArticle}>
                            <Eye class="w-4 h-4 mr-2" />
                            Önizleme
                        </Button>
                        <Button variant="outline" onclick={saveAsDraft} disabled={isSaving}>
                            <Save class="w-4 h-4 mr-2" />
                            {isSaving ? 'Kaydediliyor...' : 'Taslak Kaydet'}
                        </Button>
                        <Button onclick={publishArticle} disabled={isSubmitting}>
                            <Send class="w-4 h-4 mr-2" />
                            {isSubmitting ? 'Yayınlanıyor...' : 'Yayınla'}
                        </Button>
                    </div>
                </div>

                <!-- Article Form -->
                <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <!-- Main Content -->
                    <div class="lg:col-span-3 space-y-4">

                            <Input 
                                id="title"
                                bind:value={articleData.title}
                                placeholder="Makalenizin başlığını yazın..."
                                class="text-base font-bold !bg-background h-12"
                            />

                            <Textarea 
                                id="excerpt"
                                bind:value={articleData.excerpt}
                                placeholder="Makalenizin kısa bir özetini yazın..."
                                rows="3"
                            />



	<div class="bg-background z-50 size-full h-fit  rounded-md overflow-hidden border border-dashed">
		{#if editor && !editor.isDestroyed}
			<EdraToolBar
				class="bg-secondary/50 flex w-full items-center overflow-x-auto border-b border-dashed p-0.5"
				{editor}
			/>
			<EdraDragHandleExtended {editor} />
		{/if}
		<EdraEditor
			bind:editor
			{content}
			class="h-[32rem] max-h-screen overflow-y-scroll p-7"
			{onUpdate}
		/>
	</div>

                        </div>


                    <!-- Sidebar -->
                    <div class="space-y-6">
                        <!-- Publish Settings -->
                        <Card>
                            <CardHeader>
                                <CardTitle class="flex items-center gap-2">
                                    <Send class="w-4 h-4" />
                                    Yayın Ayarları
                                </CardTitle>
                            </CardHeader>
                            <CardContent class="space-y-4">
                                <!-- Status -->
                                <div>
                                    <Label class="text-sm font-medium">Durum</Label>
                                    <div class="mt-1">
                                        <Badge variant={articleData.status === 'published' ? 'default' : 'secondary'}>
                                            {articleData.status === 'published' ? 'Yayında' : 'Taslak'}
                                        </Badge>
                                    </div>
                                </div>

                                <!-- Language -->
                                <div>
                                    <Label class="text-sm font-medium flex items-center gap-2">
                                        <Globe class="w-3 w-3" />
                                        Dil
                                    </Label>
                                    <Select.Root
                                        value={articleData.language}
                                        onValueChange={(value) => articleData.language = value}
                                    >
                                        <Select.Trigger class="w-full">
                                            {languages.find(l => l.value === articleData.language)?.label || 'Dil Seçin'}
                                        </Select.Trigger>
                                        <Select.Content>
                                            {#each languages as language}
                                                <Select.Item value={language.value}>{language.label}</Select.Item>
                                            {/each}
                                        </Select.Content>
                                    </Select.Root>
                                </div>
                            </CardContent>
                        </Card>

                        <!-- Categories & Tags -->
                        <Card>
                            <CardHeader>
                                <CardTitle class="flex items-center gap-2">
                                    <Tag class="w-4 h-4" />
                                    Kategori & Etiketler
                                </CardTitle>
                            </CardHeader>
                            <CardContent class="space-y-4">
                                <div>
                                    <Label class="text-sm font-medium">Alan</Label>
                                    <Select.Root
                                        value={articleData.category}
                                        onValueChange={(value) => articleData.category = value}
                                    >
                                        <Select.Trigger class="w-full">
                                            {articleData.category || 'Alan Seçin'}
                                        </Select.Trigger>
                                        <Select.Content>
                                            {#each categories as category}
                                                <Select.Item value={category}>{category}</Select.Item>
                                            {/each}
                                        </Select.Content>
                                    </Select.Root>
                                </div>
                                <!-- Category -->
                                <div>
                                    <Label class="text-sm font-medium">Dal</Label>
                                    <Select.Root
                                        value={articleData.category}
                                        onValueChange={(value) => articleData.category = value}
                                    >
                                        <Select.Trigger class="w-full">
                                            {articleData.category || 'Dal Seçin'}
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
                                    <Label class="text-sm font-medium">Etiketler</Label>
                                    <div class="flex gap-2 mt-2">
                                        <Input 
                                            bind:value={newTag}
                                            placeholder="Etiket ekle..."
                                            class="flex-1"
                                            onkeydown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addTag(newTag);
                                                    newTag = "";
                                                }
                                            }}
                                        />
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            onclick={() => {
                                                addTag(newTag);
                                                newTag = "";
                                            }}
                                        >
                                            <Plus class="w-4 h-4" />
                                        </Button>
                                    </div>
                                    
                                    {#if articleData.tags.length > 0}
                                        <div class="flex flex-wrap gap-2 mt-3">
                                            {#each articleData.tags as tag}
                                                <Badge variant="outline" class="gap-1">
                                                    {tag}
                                                    <button
                                                        onclick={() => removeTag(tag)}
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

                        <!-- Author Info -->
                        <Card>
                            <CardHeader>
                                <CardTitle class="flex items-center gap-2">
                                    <BookOpen class="w-4 h-4" />
                                    Yazar Bilgisi
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
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
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</main>

<Footer />
