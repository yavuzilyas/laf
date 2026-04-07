<script lang="ts">
    import Navbar from "$lib/Navbar.svelte";
    import Footer from "$lib/Footer.svelte";
    import TurkeyMap from "$lib/components/TurkeyMap.svelte";
    import { Button } from "$lib/components/ui/button";
    import { Badge } from "$lib/components/ui/badge";
    import * as Dialog from "$lib/components/ui/dialog";
  import * as Tooltip from "$lib/components/ui/tooltip";
    import { t } from '$lib/stores/i18n.svelte';
    import { getCurrentLocale } from '$lib/stores/i18n.svelte';

    // Locale-aware URL helper
    const currentLocale = $derived(getCurrentLocale() || 'tr');
    const l = (path: string) => `/${currentLocale}${path}`;
    import { Calendar, MapPin, Clock, Users, Bell, Megaphone, ExternalLink, Share2 } from '@lucide/svelte';
    import { showToast } from '$lib/hooks/toast';
    import { afterNavigate } from '$app/navigation';
    import { onMount, tick } from 'svelte';

    // Types
    interface Event {
        id: string;
        title: string;
        description: string;
        date: string;
        endDate?: string;
        city: string;
        location: string;
        type: 'event' | 'announcement';
        category: string;
        imageUrl?: string;
        attendeeCount?: number;
        isPast: boolean;
        link?: string;
        hasJoined?: boolean;
        attendees?: Array<{ id: string; name: string; email?: string; avatar_url?: string }>;
    }

    // Props from server
    let { data } = $props<{ data: { events: Event[]; user?: any } }>();
    let user = $derived(data?.user);

    // State
    let selectedCity = $state<string>('');
    let activeTab = $state<'all' | 'events' | 'announcements'>('all');
    let timeFilter = $state<'all' | 'upcoming' | 'past'>('all');
    let selectedEvent = $state<Event | null>(null);
    let dialogOpen = $state(false);

    // Use server data
    const events = $derived(data?.events ?? []);

    // Derived values
    const filteredEvents = $derived(() => {
        let result = [...events];

        // Tab filter
        if (activeTab === 'events') {
            result = result.filter(e => e.type === 'event');
        } else if (activeTab === 'announcements') {
            result = result.filter(e => e.type === 'announcement');
        }

        // Time filter
        if (timeFilter === 'upcoming') {
            result = result.filter(e => !e.isPast);
        } else if (timeFilter === 'past') {
            result = result.filter(e => e.isPast);
        }

        // Sort: Selected city events first, then by date
        return result.sort((a, b) => {
            if (selectedCity) {
                const aIsSelectedCity = a.city === selectedCity || a.city === 'Türkiye';
                const bIsSelectedCity = b.city === selectedCity || b.city === 'Türkiye';
                
                if (aIsSelectedCity && !bIsSelectedCity) return -1;
                if (!aIsSelectedCity && bIsSelectedCity) return 1;
            }
            
            // Same group - sort by date
            // When 'all' is selected, sort from newest to oldest (descending)
            // Otherwise sort from oldest to newest (ascending)
            if (timeFilter === 'all') {
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            }
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
    });

    // City event status for map coloring
    const cityEventStatus = $derived(() => {
        const status: Record<string, 'future' | 'past' | 'none'> = {};
        const allCities = ['Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin', 'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Isparta', 'Mersin', 'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak', 'Van', 'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale', 'Batman', 'Şırnak', 'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce'];
        
        // Initialize all cities as 'none'
        allCities.forEach(city => status[city] = 'none');
        
        // Check each city for events
        events.forEach((event: Event) => {
            if (event.type === 'event' && event.city !== 'Türkiye') {
                if (!event.isPast) {
                    // Has future event - highest priority
                    status[event.city] = 'future';
                } else if (status[event.city] !== 'future') {
                    // Has past event only if no future event
                    status[event.city] = 'past';
                }
            }
        });
        
        return status;
    });

    // Pagination state
    const ITEMS_PER_PAGE = 5;
    let announcementsPage = $state(1);
    let eventsPage = $state(1);

    // Paginated lists
    const filteredAnnouncements = $derived(() => {
        return filteredEvents().filter(e => e.type === 'announcement');
    });

    const filteredEventsList = $derived(() => {
        return filteredEvents().filter(e => e.type === 'event');
    });

    const paginatedAnnouncements = $derived(() => {
        const start = (announcementsPage - 1) * ITEMS_PER_PAGE;
        return filteredAnnouncements().slice(start, start + ITEMS_PER_PAGE);
    });

    const paginatedEvents = $derived(() => {
        const start = (eventsPage - 1) * ITEMS_PER_PAGE;
        return filteredEventsList().slice(start, start + ITEMS_PER_PAGE);
    });

    const totalAnnouncementPages = $derived(() => Math.ceil(filteredAnnouncements().length / ITEMS_PER_PAGE) || 1);
    const totalEventPages = $derived(() => Math.ceil(filteredEventsList().length / ITEMS_PER_PAGE) || 1);

    function formatDate(dateStr: string): string {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);
    }

    function formatTime(dateStr: string): string {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    function handleCitySelect(event: CustomEvent<{ city: string; plate: string }>) {
        selectedCity = event.detail.city;
        announcementsPage = 1;
        eventsPage = 1;
        // Scroll to map section to show both map and events
        setTimeout(() => {
            const mapSection = document.getElementById('map-section');
            if (mapSection) {
                mapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }

    function openDialog(event: Event) {
        selectedEvent = event;
        dialogOpen = true;
    }

    function clearFilters() {
        selectedCity = '';
        activeTab = 'all';
        timeFilter = 'all';
    }

    // Handle hash on initial page load
    onMount(() => {
        handleHash();
    });

    // Handle hash on client-side navigation
    afterNavigate(() => {
        handleHash();
    });

    // Watch for data.events to be ready (for SSR initial load)
    let hashProcessed = $state(false);
    $effect(() => {
        if (!hashProcessed && data.events && data.events.length > 0) {
            const hash = window.location.hash;
            if (hash && hash.startsWith('#event-')) {
                hashProcessed = true;
                handleHash();
            }
        }
    });

    async function handleHash() {
        if (typeof window === 'undefined') return;
        
        const hash = window.location.hash;
        if (!hash || !hash.startsWith('#event-')) return;
        
        let eventId = hash.replace('#event-', '');
        
        // Handle case where URL has extra characters after event ID
        const uuidMatch = eventId.match(/^([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
        if (uuidMatch) {
            eventId = uuidMatch[1];
        }
        
        // Find the event in data
        const event = data.events?.find((e: Event) => e.id === eventId);
        if (!event) return;
        
        // Determine which page the event is on
        if (event.type === 'announcement') {
            const allAnnouncements = filteredAnnouncements();
            const index = allAnnouncements.findIndex((e: Event) => e.id === eventId);
            if (index !== -1) {
                const page = Math.floor(index / ITEMS_PER_PAGE) + 1;
                announcementsPage = page;
            }
        } else {
            const allEvents = filteredEventsList();
            const index = allEvents.findIndex((e: Event) => e.id === eventId);
            if (index !== -1) {
                const page = Math.floor(index / ITEMS_PER_PAGE) + 1;
                eventsPage = page;
            }
        }
        
        // Wait for Svelte to update DOM
        await tick();
        await new Promise(r => setTimeout(r, 200));
        
        // Now try to find and scroll to the element
        const eventElement = document.getElementById(`event-${eventId}`);
        if (eventElement) {
            eventElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            eventElement.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
            setTimeout(() => {
                eventElement.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
            }, 3000);
        }
        
        // Open dialog
        selectedEvent = event;
        dialogOpen = true;
    }
    async function joinEvent(eventId: string) {
        if (!user) {
            showToast(t('events.loginRequired'), 'error');
            return;
        }
        
        try {
            const response = await fetch(`/api/events/${eventId}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();

            if (response.ok && result.success) {
                showToast(t('events.joinSuccess'), 'success');
                // Update local attendee count
                const eventIndex = events.findIndex((e: Event) => e.id === eventId);
                if (eventIndex !== -1) {
                    events[eventIndex].attendeeCount = result.attendeeCount;
                    events[eventIndex].hasJoined = true;
                }
            } else {
                showToast(result.error || t('events.joinError'), 'error');
            }
        } catch (error) {
            showToast(t('events.genericError'), 'error');
        }
    }
    async function shareEvent(event: Event) {
        const url = `${window.location.origin}${window.location.pathname}#event-${event.id}`;
        const shareData = {
            title: event.title,
            text: event.description,
            url: url
        };
        
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                // User cancelled or share failed
            }
        } else {
            // Fallback: copy to clipboard
            try {
                await navigator.clipboard.writeText(url);
                showToast(t('events.linkCopied'), 'success');
            } catch (err) {
                showToast(t('events.copyFailed'), 'error');
            }
        }
    }
</script>

<svelte:head>
    <title>{t('events.title')} | LAF</title>
    <meta name="description" content={t('events.description')} />
</svelte:head>

<Navbar />

<main class="flex flex-col min-h-screen pb-12">
    <!-- Hero Section -->
    <section class="bg-gradient-to-b from-primary/5 to-background py-12">
        <div class="container max-w-7xl mx-auto px-4 sm:px-6">
            <div class="text-center space-y-4">
                <div class="flex justify-center gap-3 mb-4">
                    <Megaphone size={36} class="text-primary" />
                    <Calendar size={36} class="text-primary" />
                </div>
                <h1 class="text-3xl md:text-4xl font-bold text-foreground">
                    {t('events.title')}
                </h1>
                <p class="text-muted-foreground max-w-2xl mx-auto">
                    {t('events.description')}
                </p>
            </div>
        </div>
    </section>

    <!-- Turkey Map Section -->
    <section id="map-section" class="pb-8">
        <div class="container max-w-7xl mx-auto px-2 sm:px-6">
            <TurkeyMap 
                on:select={handleCitySelect} 
                cityEventStatus={cityEventStatus()} 
                cityUserCounts={data.userUserCounts} 
            />
        </div>
    </section>

    <!-- Filters and Content -->
    <section id="events-section" class="sm:py-8 flex-1">
        <div class="container max-w-7xl  mx-auto px-4 sm:px-6">
            <!-- Filters -->
            <div class="flex flex-col md:flex-row justify-between gap-4 mb-8">


                <!-- Time Filter -->
                <div class="flex gap-2 flex-wrap ">
                    <Button
                        variant={timeFilter === 'all' ? 'secondary' : 'outline'}
                        size="xs"
                        onclick={() => timeFilter = 'all'}
                    >
                        {t('events.allTime')}
                    </Button>
                    <Button
                        variant={timeFilter === 'upcoming' ? 'secondary' : 'outline'}
                        size="xs"
                        onclick={() => timeFilter = 'upcoming'}
                    >
                        {t('events.future')}
                    </Button>
                    <Button
                        variant={timeFilter === 'past' ? 'secondary' : 'outline'}
                        size="xs"
                        onclick={() => timeFilter = 'past'}
                    >
                        {t('events.past')}
                    </Button>
                </div>
                           <!-- Active Filters Display -->
                <div class="flex items-center gap-2 mb-6 flex-wrap">
                    <span class="text-sm text-muted-foreground">{t('articles.filters.title')}:</span>
                    {#if selectedCity}
                        <Badge variant="secondary" class="gap-1">
                            <MapPin class="w-3 h-3" />
                            {selectedCity}
                        </Badge>
                    {/if}
                    {#if activeTab !== 'all'}
                        <Badge variant="secondary">
                            {activeTab === 'events' ? t('events.upcoming') : t('events.announcements')}
                        </Badge>
                    {/if}
                    {#if timeFilter !== 'upcoming'}
                        <Badge variant="secondary">
                            {timeFilter === 'past' ? t('events.past') : t('events.allTime')}
                        </Badge>
                    {/if}
                    <button
                        onclick={clearFilters}
                        class="text-sm text-primary hover:underline ml-2"
                    >
                        {t('events.clearFilters')}
                    </button>
                </div>
            </div>

 

            <!-- Two Column Layout: Announcements Left, Events Right -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Left Column: Announcements -->
                <div class="space-y-6">
                    <div class="flex items-center gap-2 mb-4">
                        <Bell class="w-5 h-5 text-primary" />
                        <h2 class="text-xl font-semibold">{t('events.announcements')}</h2>
                    </div>
                    
                    <div class="space-y-4">
                        {#each paginatedAnnouncements() as announcement (announcement.id)}
                            <div id="event-{announcement.id}" class="bg-card border border-border rounded-lg p-2.5 hover:shadow-sm transition-all">
                                
                                
                                <h3 class="text-sm font-semibold mb-1 leading-tight">{announcement.title}</h3>
                                <p class="text-xs text-muted-foreground mb-2 line-clamp-2">{announcement.description}</p>
                                <div class="flex items-center gap-2 my-2">
                                    <Badge variant="secondary" class="text-[10px] h-4">
                                        {t(`${announcement.category}`)}
                                    </Badge>
                                </div>
                                <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
                                    <span class="flex items-center gap-1">
                                        <Calendar class="w-3 h-3" />
                                        {formatDate(announcement.date)}
                                    </span>
{#if announcement.city}
                                    <span class="flex items-center gap-1">
                                        <MapPin class="w-3 h-3" />
                                        {announcement.city}
                                    </span>
                                    {/if}
                                </div>
                                
                                <div class="mt-2 flex gap-2">
                                    <Button variant="outline" size="xs" class="flex-1 h-7 text-xs" onclick={() => openDialog(announcement)}>
                                        {t('common.view')}
                                    </Button>
                                    <Button variant="ghost" size="icon" class="h-7 w-7" onclick={() => shareEvent(announcement)}>
                                        <Share2 class="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        {/each}
                        
                        {#if filteredAnnouncements().length === 0}
                            <div class="text-center py-8 bg-muted/30 rounded-xl">
                                <Bell class="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                                <p class="text-sm text-muted-foreground">{t('events.noAnnouncements')}</p>
                            </div>
                        {/if}
                        
                        <!-- Announcements Pagination -->
                        {#if totalAnnouncementPages() > 1}
                            <div class="flex justify-center items-center gap-2 pt-4">
                                <Button
                                    variant="outline"
                                    size="xs"
                                    onclick={() => announcementsPage = Math.max(1, announcementsPage - 1)}
                                    disabled={announcementsPage === 1}
                                >
                                    ←
                                </Button>
                                <span class="text-xs text-muted-foreground">
                                    {announcementsPage} / {totalAnnouncementPages()}
                                </span>
                                <Button
                                    variant="outline"
                                    size="xs"
                                    onclick={() => announcementsPage = Math.min(totalAnnouncementPages(), announcementsPage + 1)}
                                    disabled={announcementsPage === totalAnnouncementPages()}
                                >
                                    →
                                </Button>
                            </div>
                        {/if}
                    </div>
                </div>
                
                <!-- Right Column: Events -->
                <div class="space-y-6">
                    <div class="flex items-center gap-2 mb-4">
                        <Calendar class="w-5 h-5 text-primary" />
                        <h2 class="text-xl font-semibold">{t('events.events')}</h2>
                    </div>
                    
                    <div class="space-y-4">
                        {#each paginatedEvents() as event (event.id)}
                            <div id="event-{event.id}" class="bg-card border border-border rounded-lg p-2.5 hover:shadow-sm transition-all">
                                
                                
                                <h3 class="text-sm font-semibold mb-1 leading-tight">{event.title}</h3>
                                <p class="text-xs text-muted-foreground mb-2 line-clamp-2">{event.description}</p>
                                <div class="flex items-center gap-2 my-2">
                                    <Badge variant="default" class="text-[10px] h-4">
                                        {t(`${event.category}`)}
                                    </Badge>
                                    {#if event.isPast}
                                        <Badge variant="outline" class="text-[10px] h-4">{t('events.completed')}</Badge>
                                    {:else}
                                        <Badge variant="outline" class="text-[10px] h-4 text-green-600 border-green-600">{t('events.upcoming')}</Badge>
                                    {/if}
                                </div>
                                <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
                                    <span class="flex items-center gap-1">
                                        <Calendar class="w-3 h-3" />
                                        {formatDate(event.date)}
                                    </span>
                                    {#if !event.isPast}
                                        <span class="flex items-center gap-1">
                                            <Clock class="w-3 h-3" />
                                            {formatTime(event.date)}
                                        </span>
                                    {/if}
{#if event.city || event.location}
                                    <span class="flex items-center gap-1">
                                        <MapPin class="w-3 h-3" />
                                        {event.city}{event.location ? ` - ${event.location}` : ''}
                                    </span>
                                    {/if}
                                    {#if event.attendeeCount !== undefined}
                                        <span class="flex items-center gap-1">
                                            <Users class="w-3 h-3" />
                                            {event.attendeeCount}
                                        </span>
                                    {/if}
                                    {#if event.link}
                                        <a href={event.link} target="_blank" rel="noopener noreferrer" class="flex items-center gap-1 text-primary hover:underline">
                                            <ExternalLink class="w-3 h-3" />
                                            {t('events.link')}
                                        </a>
                                    {/if}
                                    
                                </div>
                                
                                {#if !event.isPast}
                                    <div class="mt-2 flex gap-2">
                                        <Button variant="outline" size="xs" class="flex-1 h-7 text-xs" onclick={() => openDialog(event)}>
                                            {t('events.details')}
                                        </Button>
                                        {#if user}
                                            <Button variant={event.hasJoined ? 'outline' : 'default'} size="xs" class="flex-1 h-7 text-xs" onclick={() => joinEvent(event.id)} disabled={event.hasJoined}>
                                                {event.hasJoined ? t('events.joined') : t('events.joinEvent')}
                                            </Button>
                                        {:else}
                                            <Button variant="outline" size="xs" class="flex-1 h-7 text-xs" onclick={() => showToast(t('events.loginRequired'), 'error')}>
                                                {t('events.login')}
                                            </Button>
                                        {/if}
                                        <Button variant="ghost" size="icon" class="h-7 w-7" onclick={() => shareEvent(event)}>
                                            <Share2 class="w-4 h-4" />
                                        </Button>
                                    </div>
                                {:else}
                                    <div class="mt-2 flex gap-2">
                                        <Button variant="outline" size="xs" class="flex-1 h-7 text-xs" onclick={() => openDialog(event)}>
                                            {t('events.details')}
                                        </Button>
                                        <Button variant="ghost" size="icon" class="h-7 w-7" onclick={() => shareEvent(event)}>
                                            <Share2 class="w-4 h-4" />
                                        </Button>
                                    </div>
                                {/if}
                            </div>
                        {/each}
                        
                        {#if filteredEventsList().length === 0}
                            <div class="text-center py-8 bg-muted/30 rounded-xl">
                                <Calendar class="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                                <p class="text-sm text-muted-foreground">{t('events.noEvents')}</p>
                            </div>
                        {/if}
                        
                        <!-- Events Pagination -->
                        {#if totalEventPages() > 1}
                            <div class="flex justify-center items-center gap-2 pt-4">
                                <Button
                                    variant="outline"
                                    size="xs"
                                    onclick={() => eventsPage = Math.max(1, eventsPage - 1)}
                                    disabled={eventsPage === 1}
                                >
                                    ←
                                </Button>
                                <span class="text-xs text-muted-foreground">
                                    {eventsPage} / {totalEventPages()}
                                </span>
                                <Button
                                    variant="outline"
                                    size="xs"
                                    onclick={() => eventsPage = Math.min(totalEventPages(), eventsPage + 1)}
                                    disabled={eventsPage === totalEventPages()}
                                >
                                    →
                                </Button>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </section>
</main>

<!-- Event/Announcement Details Dialog -->
<Dialog.Root bind:open={dialogOpen}>
    <Dialog.Content class="sm:max-w-2/3 md:max-w-1/2">
        <div class="flex items-start justify-between">
            <Dialog.Header class="flex-1">
                <Dialog.Title>{selectedEvent?.title}</Dialog.Title>
                <Dialog.Description>
                    <div class="flex items-center gap-2 mt-2">
                        <Badge variant={selectedEvent?.type === 'announcement' ? 'secondary' : 'default'} class="text-xs">
                            {selectedEvent?.category ? t(`${selectedEvent.category}`) : ''}
                        </Badge>
                        {#if selectedEvent?.isPast && selectedEvent?.type === 'event'}
                            <Badge variant="outline" class="text-xs">{t('events.completed')}</Badge>
                        {:else if selectedEvent?.type === 'event'}
                            <Badge variant="outline" class="text-xs text-green-600 border-green-600">{t('events.upcoming')}</Badge>
                        {/if}
                    </div>
                </Dialog.Description>
            </Dialog.Header>
            {#if selectedEvent}
                <Button variant="ghost" size="icon" class="h-8 w-8 mt-5 -mr-4" onclick={() => selectedEvent && shareEvent(selectedEvent)}>
                    <Share2 class="w-4 h-4" />
                </Button>
            {/if}
        </div>
        
        <div class="space-y-4 py-4">
            <p class="text-sm text-foreground">{selectedEvent?.description}</p>
            
            <div class="space-y-2 text-sm text-muted-foreground">
                <div class="flex items-center gap-2">
                    <Calendar class="w-4 h-4" />
                    <span>{selectedEvent ? formatDate(selectedEvent.date) : ''}</span>
                </div>
                {#if selectedEvent?.endDate}
                    <div class="flex items-center gap-2">
                        <Calendar class="w-4 h-4" />
                        <span>{t('events.endDate')}: {formatDate(selectedEvent.endDate)}</span>
                    </div>
                {/if}
                {#if selectedEvent && !selectedEvent.isPast && selectedEvent.type === 'event'}
                    <div class="flex items-center gap-2">
                        <Clock class="w-4 h-4" />
                        <span>{formatTime(selectedEvent.date)}</span>
                    </div>
                {/if}
                {#if selectedEvent?.city || selectedEvent?.location}
                <div class="flex items-center gap-2">
                    <MapPin class="w-4 h-4" />
                    <span>{selectedEvent?.city}{selectedEvent?.location ? ` - ${selectedEvent.location}` : ''}</span>
                </div>
                {/if}
                {#if selectedEvent?.link}
                    <div class="flex items-center gap-2">
                        <ExternalLink class="w-4 h-4" />
                        <a href={selectedEvent.link} target="_blank" rel="noopener noreferrer" class="text-primary hover:underline text-sm truncate max-w-[250px]">
                            {selectedEvent.link}
                        </a>
                    </div>
                {/if}
                {#if selectedEvent?.attendeeCount && selectedEvent.attendeeCount > 0}
                    <div class="flex items-center gap-2">
                        <Users class="w-4 h-4" />
                        <span>{selectedEvent.attendeeCount} {t('events.attendees').toLowerCase()}</span>
                    </div>
                {/if}
            </div>
        </div>
        
        <Dialog.Footer class="flex flex-col gap-2">
            <!-- Attendees List in Dialog -->
                {#if selectedEvent?.type === 'event' && selectedEvent?.attendees && selectedEvent.attendees.length > 0}
                <div class="w-full border-t pt-4 mb-2">
                    <p class="text-sm font-medium mb-2">{t('events.attendees')} ({selectedEvent.attendees.length})</p>
                    <div class="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {#each selectedEvent.attendees as attendee}
                            {@const tooltipId = 'tooltip-' + attendee.id}
                            <div class="relative group">
                                <a href={l(`/${attendee.name}`)} class="block">
                                    <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-border hover:border-primary transition-colors">
                                        {#if attendee.avatar_url}
                                            <img src={attendee.avatar_url} alt={attendee.name} class="w-full h-full object-cover" />
                                        {:else}
                                            <span class="text-xs font-medium">{attendee.name.charAt(0).toUpperCase()}</span>
                                        {/if}
                                    </div>
                                </a>
                                <!-- Custom Tooltip -->
                                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[200]">
                                    @{attendee.name}
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

<Footer />
