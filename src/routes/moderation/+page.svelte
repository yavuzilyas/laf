<script lang="ts">
  import Navbar from '$lib/Navbar.svelte';
  import Footer from '$lib/Footer.svelte';
  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
  import { Globe, Link2, Plus, Trash2, Pencil, X, Check, ExternalLink, Calendar, Bell, Users, ChevronLeft, ChevronRight } from '@lucide/svelte';
  import { turkeyCities } from '$lib/data/turkey-cities';
  import * as Tabs from '$lib/components/ui/tabs/index.js';
  import { t } from '$lib/stores/i18n.svelte.js';
  import { showToast } from '$lib/hooks/toast';
  import MnemonicVerificationPopup from '$lib/components/MnemonicVerificationPopup.svelte';
	import PasswordVerificationPopup from '$lib/components/PasswordVerificationPopup.svelte';
 	import SectionCards from "$lib/components/section-cards.svelte";
 	import ChartAreaInteractive from "$lib/components/chart-area-interactive.svelte";
 	import DataTable from "$lib/components/data-table.svelte";
  import { Input } from '$lib/components/ui/input/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Switch } from '$lib/components/ui/switch/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import UserSearch from '$lib/components/UserSearch.svelte';
  import { Badge } from '$lib/components/ui/badge';
   // @ts-ignore - SvelteKit internal module
  import { invalidateAll } from '$app/navigation';

  let { data } = $props();
  let tableData = $state(data.tableData ?? []);
  let links = $state(data.links ?? []);
  let events = $state(data.events ?? []);

  $effect(() => {
    tableData = data.tableData ?? [];
    links = data.links ?? [];
    events = data.events ?? [];
  });

  let currentUser = data.currentUser;
  let showDeleteDialog = $state(false);
  let pendingDeleteUserId = $state<string | null>(null);
  let deleteDialogResolver: (() => void) | null = null;
  
  // Mnemonic verification state
  let showMnemonicVerification = $state(false);
  let showPasswordVerification = $state(false);
  let pendingAction = $state<(() => Promise<void>) | null>(null);
  let verificationToken = $state<string | null>(null);
  
  // Link and Event delete dialog states
  let showLinkDeleteDialog = $state(false);
  let showEventDeleteDialog = $state(false);
  let pendingDeleteLinkId = $state<string | null>(null);
  let pendingDeleteEventId = $state<string | null>(null);
  let linkPendingAction = $state<(() => Promise<void>) | null>(null);
  let eventPendingAction = $state<(() => Promise<void>) | null>(null);
  
  // Handle mnemonic verification
  function requestMnemonicVerification(action: () => Promise<void>) {
    pendingAction = action;
    showPasswordVerification = true;
  }
  
  async function handlePasswordVerified(token: string) {
    showPasswordVerification = false;
    verificationToken = token;
    
    // Execute pending action directly without mnemonic verification
    if (pendingAction) {
      try {
        await pendingAction();
      } catch (error) {
        showToast("An error occurred during the operation", "error");
      }
      pendingAction = null;
    } else if (linkPendingAction) {
      try {
        await linkPendingAction();
      } catch (error) {
        showToast("An error occurred during link operation", "error");
      }
      linkPendingAction = null;
    } else if (eventPendingAction) {
      try {
        await eventPendingAction();
      } catch (error) {
        showToast("An error occurred during event operation", "error");
      }
      eventPendingAction = null;
    }
  }
  
  function handlePasswordCancel() {
    showPasswordVerification = false;
    pendingAction = null;
    linkPendingAction = null;
    eventPendingAction = null;
  }
  
  async function handleMnemonicVerified(token: string) {
    showMnemonicVerification = false;
    verificationToken = token;
    if (pendingAction) {
      try {
        await pendingAction();
      } catch (error) {
        showToast("An error occurred during the operation", "error");
      }
      pendingAction = null;
    } else if (linkPendingAction) {
      try {
        await linkPendingAction();
      } catch (error) {
        showToast("An error occurred during link operation", "error");
      }
      linkPendingAction = null;
    } else if (eventPendingAction) {
      try {
        await eventPendingAction();
      } catch (error) {
        showToast("An error occurred during event operation", "error");
      }
      eventPendingAction = null;
    }
  }
  
  function handleMnemonicCancel() {
    showMnemonicVerification = false;
    pendingAction = null;
    linkPendingAction = null;
    eventPendingAction = null;
  }
  
  async function refreshModerationData() {
    await invalidateAll();
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
        await refreshModerationData();
      } else {
        const error = await response.json();
        showToast(error.error || t('moderation.actionFailed'), 'error');
      }
    } catch (error) {
      showToast(t('moderation.actionFailed'), 'error');
    }
  }

  async function banUser(userId: string) {
    if (!currentUser?.id || currentUser.id === 'unknown') {
      showToast('User information could not be retrieved', 'error');
      return;
    }

    try {
      const response = await fetch('/api/moderation/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          reason: 'Moderator action', 
          moderatorId: currentUser.id 
        })
      });

      if (response.ok) {
        showToast('User banned', 'success');
        await refreshModerationData();
      } else {
        showToast('Ban failed', 'error');
      }
    } catch (error) {
      showToast('Ban error', 'error');
    }
  }

  async function unbanUser(userId: string) {
    if (!currentUser?.id || currentUser.id === 'unknown') {
      showToast('User information could not be retrieved', 'error');
      return;
    }

    try {
      const response = await fetch('/api/moderation/ban', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          reason: 'Moderator action', 
          moderatorId: currentUser.id 
        })
      });

      if (response.ok) {
        showToast('Ban removed', 'success');
        await refreshModerationData();
      } else {
        showToast('Operation failed', 'error');
      }
    } catch (error) {
      showToast('Operation error', 'error');
    }
  }

  async function hideUser(userId: string) {
    if (!currentUser?.id || currentUser.id === 'unknown') {
      showToast('User information could not be retrieved', 'error');
      return;
    }

    try {
      const response = await fetch('/api/moderation/hide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          reason: 'Moderator action', 
          moderatorId: currentUser.id 
        })
      });

      if (response.ok) {
        showToast('User hidden', 'success');
        await refreshModerationData();
      } else {
        showToast('Hide failed', 'error');
      }
    } catch (error) {
      showToast('Hide error', 'error');
    }
  }

  async function unhideUser(userId: string) {
    if (!currentUser?.id || currentUser.id === 'unknown') {
      showToast('User information could not be retrieved', 'error');
      return;
    }

    try {
      const response = await fetch('/api/moderation/hide', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          reason: 'Moderator action', 
          moderatorId: currentUser.id 
        })
      });

      if (response.ok) {
        showToast('Visibility restored', 'success');
        await refreshModerationData();
      } else {
        showToast('Operation failed', 'error');
      }
    } catch (error) {
      showToast('Operation error', 'error');
    }
  }

  function openDeleteDialog(userId: string, resolver: () => void) {
    pendingDeleteUserId = userId;
    deleteDialogResolver = resolver;
    showDeleteDialog = true;
  }

  function handleDeleteDialogCancel() {
    pendingDeleteUserId = null;
    showDeleteDialog = false;
    deleteDialogResolver?.();
    deleteDialogResolver = null;
  }

  function handleDeleteDialogOpenChange(open: boolean) {
    showDeleteDialog = open;
    if (!open && pendingDeleteUserId) {
      handleDeleteDialogCancel();
    }
  }

  async function handleDeleteDialogConfirm() {
    const userId = pendingDeleteUserId;
    const resolver = deleteDialogResolver;
    pendingDeleteUserId = null;
    deleteDialogResolver = null;
    showDeleteDialog = false;

    if (userId) {
      await performDelete(userId);
    }

    resolver?.();
  }

  async function performDelete(userId: string) {
    if (!currentUser?.id || currentUser.id === 'unknown') {
      showToast('User information could not be retrieved', 'error');
      return;
    }

    const executeDelete = async () => {
      try {
        const response = await fetch('/api/moderation/delete', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(verificationToken ? { 'X-Verification-Token': verificationToken } : {})
          },
          body: JSON.stringify({ 
            userId, 
            reason: 'Moderator action', 
            moderatorId: currentUser.id 
          })
        });

        if (response.ok) {
          showToast('Account deletion process started', 'success');
          await refreshModerationData();
        } else {
          const errorData = await response.json().catch(() => ({}));
          showToast(errorData.message || 'Deletion failed', 'error');
        }
      } catch (error) {
        showToast('Deletion error', 'error');
      }
    };

    if (verificationToken) {
      await executeDelete();
    } else {
      requestMnemonicVerification(executeDelete);
    }
  }

  async function deleteUser(userId: string, options?: { skipConfirm?: boolean }) {
    if (!options?.skipConfirm) {
      return new Promise<void>((resolve) => openDeleteDialog(userId, resolve));
    }

    await performDelete(userId);
  }

  async function undoDeleteUser(userId: string) {
    if (!currentUser?.id || currentUser.id === 'unknown') {
      showToast('User information could not be retrieved', 'error');
      return;
    }

    try {
      const response = await fetch('/api/moderation/delete', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          reason: 'Moderator action', 
          moderatorId: currentUser.id 
        })
      });

      if (response.ok) {
        showToast('Account deletion cancelled', 'success');
        await refreshModerationData();
      } else {
        showToast('Operation failed', 'error');
      }
    } catch (error) {
      showToast('Operation error', 'error');
    }
  }

  async function cleanupDeletedUsers() {
    if (!currentUser?.id || currentUser.id === 'unknown') {
      showToast('User information could not be retrieved', 'error');
      return;
    }

    if (currentUser?.role !== 'admin') {
      showToast('Bu işlem sadece admin tarafından yapılabilir', 'error');
      return;
    }

    try {
      const response = await fetch('/api/moderation/cleanup-deleted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();

      if (response.ok) {
        if (result.deletedCount > 0) {
          showToast(`${result.deletedCount} hesap kalıcı olarak silindi`, 'success');
        } else {
          showToast(result.message || 'Silinecek hesap bulunamadı', 'info');
        }
        await refreshModerationData();
      } else {
        showToast(result.error || 'İşlem başarısız', 'error');
      }
    } catch (error) {
      showToast('İşlem hatası', 'error');
    }
  }

  async function promoteToModerator(userId: string) {
    if (currentUser?.role !== 'admin') {
      showToast('Admin privileges required for this operation', 'error');
      return;
    }

    try {
      const response = await fetch('/api/moderation/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'promote',
          moderatorId: currentUser.id
        })
      });

      if (response.ok) {
        showToast('User promoted to moderator', 'success');
        await refreshModerationData();
      } else {
        const error = await response.json();
        showToast(error.error ?? 'Operation failed', 'error');
      }
    } catch (error) {
      showToast('Operation error', 'error');
    }
  }

  async function demoteToUser(userId: string) {
    if (currentUser?.role !== 'admin') {
      showToast('Admin privileges required for this operation', 'error');
      return;
    }

    try {
      const response = await fetch('/api/moderation/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'demote',
          moderatorId: currentUser.id
        })
      });

      if (response.ok) {
        showToast('User moderator role removed', 'success');
        await refreshModerationData();
      } else {
        const error = await response.json();
        showToast(error.error ?? 'Operation failed', 'error');
      }
    } catch (error) {
      showToast('Operation error', 'error');
    }
  }

  $effect(() => {
    void refreshModerationData();
  });

  // Donation moderation functions
  async function approveDonation(donationId: string) {
    if (!currentUser?.id || currentUser.id === 'unknown') {
      showToast('User information could not be retrieved', 'error');
      return;
    }

    try {
      const response = await fetch('/api/donations/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          donationId
        })
      });

      if (response.ok) {
        showToast(t('moderation.donationApproved'), 'success');
        await refreshModerationData();
      } else {
        const error = await response.json();
        showToast(error.error || t('moderation.approvalFailed'), 'error');
      }
    } catch (error) {
      showToast('İşlem hatası', 'error');
    }
  }

  async function rejectDonation(donationId: string, reason?: string) {
    if (!currentUser?.id || currentUser.id === 'unknown') {
      showToast('User information could not be retrieved', 'error');
      return;
    }

    try {
      const response = await fetch('/api/donations/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          donationId,
          rejectionReason: reason
        })
      });

      if (response.ok) {
        showToast(t('moderation.donationRejected'), 'success');
        await refreshModerationData();
      } else {
        const error = await response.json();
        showToast(error.error || t('moderation.rejectionFailed'), 'error');
      }
    } catch (error) {
      showToast('İşlem hatası', 'error');
    }
  }

  // Link management functions
  let showLinkDialog = $state(false);
  let editingLink = $state<any>(null);
  let linkForm = $state({
    title: '',
    url: '',
    description: '',
    type: 'social',
    platform: '',
    display_order: 0,
    is_active: true,
    icon: null as File | null
  });

  const typeOptions = [
    { value: 'social', label: t('moderation.socialMedia') },
    { value: 'donation', label: t('moderation.donation') },
    { value: 'external', label: t('moderation.otherLinks') },
    { value: 'contact', label: t('moderation.contact') },
    { value: 'other', label: t('moderation.other') }
  ];

  function openLinkDialog(link?: any) {
    if (link) {
      editingLink = link;
      linkForm = {
        title: link.title,
        url: link.url,
        description: link.description || '',
        type: link.type,
        platform: link.platform || '',
        display_order: link.display_order,
        is_active: link.is_active,
        icon: null
      };
    } else {
      editingLink = null;
      linkForm = {
        title: '',
        url: '',
        description: '',
        type: 'social',
        platform: '',
        display_order: 0,
        is_active: true,
        icon: null
      };
    }
    showLinkDialog = true;
  }

  function closeLinkDialog() {
    showLinkDialog = false;
    editingLink = null;
    linkForm = {
      title: '',
      url: '',
      description: '',
      type: 'social',
      platform: '',
      display_order: 0,
      is_active: true,
      icon: null
    };
  }

  async function saveLink() {
    if (!linkForm.title || !linkForm.url) {
      showToast('Başlık ve URL zorunludur', 'error');
      return;
    }

    try {
      const formData = new FormData();
      if (editingLink) {
        formData.append('id', editingLink.id);
      }
      formData.append('title', linkForm.title);
      formData.append('url', linkForm.url);
      formData.append('description', linkForm.description);
      formData.append('type', linkForm.type);
      formData.append('platform', linkForm.platform);
      formData.append('display_order', linkForm.display_order.toString());
      formData.append('is_active', linkForm.is_active.toString());
      if (linkForm.icon) {
        formData.append('icon', linkForm.icon);
      }

      const response = await fetch('/api/links/manage', {
        method: editingLink ? 'PUT' : 'POST',
        body: formData
      });

      if (response.ok) {
        showToast(editingLink ? 'Link güncellendi' : 'Link eklendi', 'success');
        closeLinkDialog();
        await refreshModerationData();
      } else {
        const error = await response.json();
        showToast(error.error || 'İşlem başarısız', 'error');
      }
    } catch (error) {
      showToast('İşlem hatası', 'error');
    }
  }

  async function deleteLink(linkId: string) {
    if (!confirm('Bu linki silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch('/api/links/manage', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: linkId })
      });

      if (response.ok) {
        showToast('Link silindi', 'success');
        await refreshModerationData();
      } else {
        const error = await response.json();
        showToast(error.error || 'Silme başarısız', 'error');
      }
    } catch (error) {
      showToast('Silme hatası', 'error');
    }
  }

  function handleIconChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      linkForm.icon = input.files[0];
    }
  }

  // Event management functions
  let showEventDialog = $state(false);
  let editingEvent = $state<any>(null);
  let eventAttendees = $state<Array<{ id: string; user_id?: string; name: string; email?: string; phone?: string; joined_at: string }>>([]);
  let showAttendeeDialog = $state(false);
  let selectedAttendees = $state<Array<{ id: string; username: string; name?: string; surname?: string }>>([]);
  let attendeeSearchQuery = $state('');
  let attendeeSuggestions = $state<Array<{ id: string; username: string; name?: string; surname?: string; email?: string }>>([]);
  let attendeeSearchLoading = $state(false);
  let showAttendeeSuggestions = $state(false);
  let eventForm = $state({
    title: '',
    description: '',
    date: '',
    endDate: '',
    city: '',
    location: '',
    type: 'event' as 'event' | 'announcement',
    category: '',
    imageUrl: '',
    link: '',
    attendeeCount: 0,
    isActive: true
  });

  const eventCategoryOptions = [
    t('moderation.seminar'), t('moderation.conference'), t('moderation.action'), t('moderation.social'), t('moderation.academic'), t('moderation.camp'), t('moderation.announcement'), t('moderation.technical'), t('moderation.call'), t('moderation.other')
  ];

  // Event pagination
  let eventsCurrentPage = $state(1);
  const EVENTS_PER_PAGE = 10;
  
  let paginatedEvents = $derived(events.slice((eventsCurrentPage - 1) * EVENTS_PER_PAGE, eventsCurrentPage * EVENTS_PER_PAGE));
  let eventsTotalPages = $derived(Math.ceil(events.length / EVENTS_PER_PAGE));
  
  function goToEventsPage(page: number) {
    if (page >= 1 && page <= eventsTotalPages) {
      eventsCurrentPage = page;
    }
  }
  
  function getEventsPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const total = eventsTotalPages;
    const current = eventsCurrentPage;
    
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
      } else if (current >= total - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
      }
    }
    return pages;
  }

  function openEventDialog(event?: any) {
    if (event) {
      editingEvent = event;
      eventForm = {
        title: event.title,
        description: event.description,
        date: event.date ? new Date(event.date).toISOString().slice(0, 16) : '',
        endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
        city: event.city,
        location: event.location,
        type: event.type,
        category: event.category,
        imageUrl: event.imageUrl || '',
        link: event.link || '',
        attendeeCount: event.attendeeCount || 0,
        isActive: event.isActive ?? true
      };
    } else {
      editingEvent = null;
      eventForm = {
        title: '',
        description: '',
        date: '',
        endDate: '',
        city: '',
        location: '',
        type: 'event',
        category: '',
        imageUrl: '',
        link: '',
        attendeeCount: 0,
        isActive: true
      };
    }
    showEventDialog = true;
  }

  function closeEventDialog() {
    showEventDialog = false;
    editingEvent = null;
    eventForm = {
      title: '',
      description: '',
      date: '',
      endDate: '',
      city: '',
      location: '',
      type: 'event',
      category: '',
      imageUrl: '',
      link: '',
      attendeeCount: 0,
      isActive: true
    };
  }

  async function saveEvent() {
    if (!eventForm.title || !eventForm.description || !eventForm.date || !eventForm.category) {
      showToast(t('moderation.titleDescDateCategoryRequired'), 'error');
      return;
    }
    
    // City and location are required only for events, not announcements
    if (eventForm.type === 'event' && (!eventForm.city || !eventForm.location)) {
      showToast(t('moderation.cityLocationRequired'), 'error');
      return;
    }

    try {
      const response = await fetch('/api/events/manage', {
        method: editingEvent ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...eventForm,
          id: editingEvent?.id
        })
      });

      if (response.ok) {
        showToast(editingEvent ? t('moderation.eventUpdated') : t('moderation.eventAdded'), 'success');
        closeEventDialog();
        await refreshModerationData();
      } else {
        const error = await response.json();
        showToast(error.error || t('moderation.operationFailed'), 'error');
      }
    } catch (error) {
      showToast(t('moderation.operationError'), 'error');
    }
  }

  async function deleteEvent(eventId: string) {
    if (!confirm('Bu etkinlik/duyuruyu silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch('/api/events/manage', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: eventId })
      });

      if (response.ok) {
        showToast(t('moderation.eventDeleted'), 'success');
        await refreshModerationData();
      } else {
        const error = await response.json();
        showToast(error.error || t('moderation.deleteFailed'), 'error');
      }
    } catch (error) {
      showToast(t('moderation.deleteError'), 'error');
    }
  }

  async function loadEventAttendees(eventId: string) {
    try {
      const response = await fetch(`/api/events/${eventId}/attendees`);
      if (response.ok) {
        const result = await response.json();
        // Normalize the data to include both phone and email
        eventAttendees = (result.attendees || []).map((a: any) => ({
          id: a.id,
          user_id: a.userId || a.user_id,
          name: a.name,
          email: a.email,
          phone: a.phone || a.phone_number,
          joined_at: a.joinedAt || a.joined_at
        }));
      }
    } catch (error) {
      console.error('Error loading attendees:', error);
    }
  }

  function openAttendeeDialog(eventId: string) {
    editingEvent = events.find((e: any) => e.id === eventId);
    if (editingEvent) {
      loadEventAttendees(eventId);
      showAttendeeDialog = true;
    }
  }

  function closeAttendeeDialog() {
    showAttendeeDialog = false;
    editingEvent = null;
    eventAttendees = [];
    selectedAttendees = [];
  }

  async function addAttendeesToEvent() {
    if (!editingEvent || selectedAttendees.length === 0) return;

    try {
      for (const user of selectedAttendees) {
        await fetch(`/api/events/${editingEvent.id}/attendees`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
      }
      showToast(t('moderation.attendeesAdded'), 'success');
      await loadEventAttendees(editingEvent.id);
      await refreshModerationData();
      selectedAttendees = [];
    } catch (error) {
      showToast(t('moderation.attendeeAddError'), 'error');
    }
  }

  async function removeAttendee(attendeeId: string) {
    if (!editingEvent) return;

    try {
      const response = await fetch(`/api/events/${editingEvent.id}/attendees/${attendeeId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showToast(t('moderation.attendeeRemoved'), 'success');
        await loadEventAttendees(editingEvent.id);
        await refreshModerationData();
      } else {
        showToast(t('moderation.removeFailed'), 'error');
      }
    } catch (error) {
      showToast(t('moderation.removeError'), 'error');
    }
  }

  async function searchAttendeeUsers() {
    if (!attendeeSearchQuery.trim()) {
      attendeeSuggestions = [];
      return;
    }
    attendeeSearchLoading = true;
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(attendeeSearchQuery.trim())}`);
      if (response.ok) {
        const users = await response.json();
        // Filter out already selected users and already attending users
        attendeeSuggestions = users
          .filter((user: any) => 
            !selectedAttendees.some(selected => selected.id === user.id) &&
            !eventAttendees.some(attendee => attendee.user_id === user.id)
          )
          .slice(0, 5);
      }
    } catch (error) {
      attendeeSuggestions = [];
    } finally {
      attendeeSearchLoading = false;
    }
  }

  function addAttendeeUser(user: typeof selectedAttendees[0]) {
    selectedAttendees = [...selectedAttendees, user];
    attendeeSearchQuery = '';
    attendeeSuggestions = [];
    showAttendeeSuggestions = false;
  }

  function removeAttendeeUser(userId: string) {
    selectedAttendees = selectedAttendees.filter(user => user.id !== userId);
  }

  function clearAttendeeSearch() {
    attendeeSearchQuery = '';
    attendeeSuggestions = [];
    showAttendeeSuggestions = false;
  }

  function handleAttendeeChange(e: CustomEvent<{ users: typeof selectedAttendees }>) {
    selectedAttendees = e.detail.users;
  }
  function openLinkDeleteDialog(linkId: string) {
    pendingDeleteLinkId = linkId;
    showLinkDeleteDialog = true;
  }

  function handleLinkDeleteDialogCancel() {
    pendingDeleteLinkId = null;
    showLinkDeleteDialog = false;
  }

  function handleLinkDeleteDialogConfirm() {
    const linkId = pendingDeleteLinkId;
    pendingDeleteLinkId = null;
    showLinkDeleteDialog = false;
    if (linkId) {
      requestLinkPasswordVerification(() => performDeleteLink(linkId));
    }
  }

  // Event delete dialog handlers
  function openEventDeleteDialog(eventId: string) {
    pendingDeleteEventId = eventId;
    showEventDeleteDialog = true;
  }

  function handleEventDeleteDialogCancel() {
    pendingDeleteEventId = null;
    showEventDeleteDialog = false;
  }

  function handleEventDeleteDialogConfirm() {
    const eventId = pendingDeleteEventId;
    pendingDeleteEventId = null;
    showEventDeleteDialog = false;
    if (eventId) {
      requestEventPasswordVerification(() => performDeleteEvent(eventId));
    }
  }

  // Request password verification for link actions
  function requestLinkPasswordVerification(action: () => Promise<void>) {
    linkPendingAction = action;
    showPasswordVerification = true;
  }

  // Request password verification for event actions
  function requestEventPasswordVerification(action: () => Promise<void>) {
    eventPendingAction = action;
    showPasswordVerification = true;
  }

  // Perform actual link deletion with verification token
  async function performDeleteLink(linkId: string) {
    try {
      const response = await fetch('/api/links/manage', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          ...(verificationToken ? { 'X-Verification-Token': verificationToken } : {})
        },
        body: JSON.stringify({ id: linkId })
      });

      if (response.ok) {
        showToast(t('moderation.linkDeleted'), 'success');
        await refreshModerationData();
      } else {
        const error = await response.json();
        showToast(error.error || t('moderation.deleteFailed'), 'error');
      }
    } catch (error) {
      showToast(t('moderation.deleteError'), 'error');
    }
  }

  // Perform actual event deletion with verification token
  async function performDeleteEvent(eventId: string) {
    try {
      const response = await fetch('/api/events/manage', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          ...(verificationToken ? { 'X-Verification-Token': verificationToken } : {})
        },
        body: JSON.stringify({ id: eventId })
      });

      if (response.ok) {
        showToast(t('moderation.eventDeleted'), 'success');
        await refreshModerationData();
      } else {
        const error = await response.json();
        showToast(error.error || t('moderation.deleteFailed'), 'error');
      }
    } catch (error) {
      showToast(t('moderation.deleteError'), 'error');
    }
  }

  // Modified saveLink with password verification
  async function saveLinkWithVerification() {
    if (!linkForm.title || !linkForm.url) {
      showToast(t('moderation.titleUrlRequired'), 'error');
      return;
    }

    const executeSave = async () => {
      try {
        const formData = new FormData();
        if (editingLink) {
          formData.append('id', editingLink.id);
        }
        formData.append('title', linkForm.title);
        formData.append('url', linkForm.url);
        formData.append('description', linkForm.description);
        formData.append('type', linkForm.type);
        formData.append('platform', linkForm.platform);
        formData.append('display_order', linkForm.display_order.toString());
        formData.append('is_active', linkForm.is_active.toString());
        if (linkForm.icon) {
          formData.append('icon', linkForm.icon);
        }

        const response = await fetch('/api/links/manage', {
          method: editingLink ? 'PUT' : 'POST',
          headers: {
            ...(verificationToken ? { 'X-Verification-Token': verificationToken } : {})
          },
          body: formData
        });

        if (response.ok) {
          showToast(editingLink ? t('moderation.linkUpdated') : t('moderation.linkAdded'), 'success');
          closeLinkDialog();
          await refreshModerationData();
        } else {
          const error = await response.json();
          showToast(error.error || t('moderation.operationFailed'), 'error');
        }
      } catch (error) {
        showToast(t('moderation.operationError'), 'error');
      }
    };

    if (verificationToken) {
      await executeSave();
    } else {
      requestLinkPasswordVerification(executeSave);
    }
  }

  // Modified saveEvent with password verification
  async function saveEventWithVerification() {
    if (!eventForm.title || !eventForm.description || !eventForm.date || !eventForm.category) {
      showToast(t('moderation.titleDescDateCategoryRequired'), 'error');
      return;
    }
    
    if (eventForm.type === 'event' && (!eventForm.city || !eventForm.location)) {
      showToast(t('moderation.cityLocationRequired'), 'error');
      return;
    }

    const executeSave = async () => {
      try {
        const response = await fetch('/api/events/manage', {
          method: editingEvent ? 'PUT' : 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(verificationToken ? { 'X-Verification-Token': verificationToken } : {})
          },
          body: JSON.stringify({
            ...eventForm,
            id: editingEvent?.id
          })
        });

        if (response.ok) {
          showToast(editingEvent ? t('moderation.eventUpdated') : t('moderation.eventAdded'), 'success');
          closeEventDialog();
          await refreshModerationData();
        } else {
          const error = await response.json();
          showToast(error.error || t('moderation.operationFailed'), 'error');
        }
      } catch (error) {
        showToast(t('moderation.operationError'), 'error');
      }
    };

    if (verificationToken) {
      await executeSave();
    } else {
      requestEventPasswordVerification(executeSave);
    }
  }
</script>

<svelte:head>
  <title>{t('Moderation')} - LAF</title>
</svelte:head>

<!-- Password Verification Popup -->
<PasswordVerificationPopup
  bind:openVerif={showPasswordVerification}
  onVerified={handlePasswordVerified}
  onCancel={handlePasswordCancel}
  title="Moderator Action Confirmation"
  description="You need to verify your account password to perform moderator actions."
/>

<!-- Add Mnemonic Verification Popup -->
<MnemonicVerificationPopup
  bind:openVerif={showMnemonicVerification}
  verificationToken={verificationToken}
  onVerified={handleMnemonicVerified}
  onCancel={handleMnemonicCancel}
/>

<Navbar />
		<div class=" flex flex-1 flex-col items-center ">
			<div class="@container/main sm:max-w-4/5 w-full max-w-[96vw] flex-1 px-2 sm:px-4">
			<div class="flex flex-col gap-3 py-3 sm:gap-4 sm:py-4 md:gap-5 md:py-5">
          <div class="w-full flex justify-center items-center px-2 mt-10">
            <h1 class="text-xl font-bold sm:text-2xl">{t('ModerationAndAnalysis')}</h1>
          </div>

          <!-- DataTable Section -->
          <DataTable
            data={tableData}
            {banUser}
            {unbanUser}
            {hideUser}
            {unhideUser}
            {deleteUser}
            {undoDeleteUser}
            {currentUser}
            {promoteToModerator}
            {demoteToUser}
            {approveDonation}
            {rejectDonation}
          />

          <!-- Cleanup Deleted Users Button (Admin Only) -->
          {#if currentUser?.role === 'admin'}
            <div class="mt-6 flex justify-end">
              <Button
                onclick={cleanupDeletedUsers}
                variant="outline"
                class="gap-2 border-destructive text-destructive hover:bg-destructive/10"
              >
                <Trash2 class="w-4 h-4" />
                {t('moderation.cleanupDeletedUsers') ?? 'Silinenleri Kontrol Et'}
              </Button>
            </div>
          {/if}

          <!-- Links Management Section -->
          <div class="mt-12 space-y-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t pt-8">
              <div class="flex items-center gap-2">
                <Link2 class="w-5 h-5 text-primary" />
                <h2 class="text-lg font-semibold">Sosyal Medya ve Link Yönetimi</h2>
              </div>
              <Button onclick={() => openLinkDialog()} class="gap-2 w-full sm:w-auto">
                <Plus class="w-4 h-4" />
                Yeni Link Ekle
              </Button>
            </div>

            <!-- Links List -->
            {#if links.length === 0}
              <div class="text-center py-12 border rounded-lg bg-muted/50">
                <Globe class="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p class="text-muted-foreground">Henüz link eklenmemiş</p>
                <Button variant="outline" onclick={() => openLinkDialog()} class="mt-4">
                  İlk Linki Ekle
                </Button>
              </div>
            {:else}
              <div class="grid gap-4">
                {#each links.sort((a, b) => a.display_order - b.display_order) as link (link.id)}
                  <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-lg bg-card hover:shadow-sm transition-shadow">
                    <!-- Icon -->
                    <div class="flex-shrink-0">
                      {#if link.icon_url}
                        <img src={link.icon_url} alt={link.title} class="w-12 h-12 rounded-lg object-cover" />
                      {:else}
                        <div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Globe class="w-6 h-6 text-primary" />
                        </div>
                      {/if}
                    </div>

                    <!-- Content -->
                    <div class="flex-1 min-w-0 w-full">
                      <div class="flex flex-wrap items-center gap-2">
                        <h3 class="font-semibold">{link.title}</h3>
                        {#if !link.is_active}
                          <Badge variant="outline" class="text-xs">Pasif</Badge>
                        {/if}
                      </div>
                      <p class="text-sm text-muted-foreground truncate">{link.url}</p>
                      {#if link.description}
                        <p class="text-sm text-muted-foreground line-clamp-1">{link.description}</p>
                      {/if}
                      <div class="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Badge variant="secondary">{typeOptions.find(t => t.value === link.type)?.label || link.type}</Badge>
                        {#if link.platform}
                          <span>{link.platform}</span>
                        {/if}
                        <span>Sıra: {link.display_order}</span>
                        <span>{link.click_count || 0} tıklama</span>
                      </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex items-center gap-2 mt-2 sm:mt-0">
                      <Button variant="ghost" size="icon" onclick={() => openLinkDialog(link)}>
                        <Pencil class="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onclick={() => openLinkDeleteDialog(link.id)} class="text-destructive hover:text-destructive">
                        <Trash2 class="w-4 h-4" />
                      </Button>
                      <a href={link.url} target="_blank" rel="noopener noreferrer" class="p-2 hover:bg-accent rounded-md">
                        <ExternalLink class="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>

          <!-- Events Management Section -->
          <div class="mt-12 space-y-6 ">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t pt-8">
              <div class="flex items-center gap-2">
                <Calendar class="w-5 h-5 text-primary" />
                <h2 class="text-lg font-semibold">Etkinlik ve Duyuru Yönetimi</h2>
              </div>
              <Button onclick={() => openEventDialog()} class="gap-2 w-full sm:w-auto">
                <Plus class="w-4 h-4" />
                Yeni Etkinlik/Duyuru Ekle
              </Button>
            </div>

            <!-- Events List -->
            {#if events.length === 0}
              <div class="text-center py-12 border rounded-lg bg-muted/50">
                <Calendar class="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p class="text-muted-foreground">Henüz etkinlik/duyuru eklenmemiş</p>
                <Button variant="outline" onclick={() => openEventDialog()} class="mt-4">
                  İlk Etkinlik Ekle
                </Button>
              </div>
            {:else}
              <div class="grid gap-4">
                {#each paginatedEvents as event (event.id)}
                  <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-lg bg-card hover:shadow-sm transition-shadow max-w-[90vw] sm:max-w-full">
                    <!-- Icon/Type -->
                    <div class="flex-shrink-0">
                      <div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        {#if event.type === 'announcement'}
                          <Bell class="w-6 h-6 text-primary" />
                        {:else}
                          <Calendar class="w-6 h-6 text-primary" />
                        {/if}
                      </div>
                    </div>

                    <!-- Content -->
                    <div class="flex-1 min-w-0 w-full">
                      <div class="flex flex-wrap items-center gap-2">
                        <h3 class="font-semibold">{event.title}</h3>
                        {#if !event.isActive}
                          <Badge variant="outline" class="text-xs">Pasif</Badge>
                        {/if}
                        <Badge variant={event.type === 'announcement' ? 'secondary' : 'default'} class="text-xs">
                          {event.type === 'announcement' ? 'Duyuru' : 'Etkinlik'}
                        </Badge>
                      </div>
                      <p class="text-sm text-muted-foreground truncate">{event.description}</p>
                      <div class="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Badge variant="secondary">{event.category}</Badge>
                        <span>{event.city}</span>
                        <span>{new Date(event.date).toLocaleDateString('tr-TR')}</span>
                        {#if event.attendeeCount}
                          <span>{event.attendeeCount} katılımcı</span>
                        {/if}
                      </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex items-center gap-2 mt-2 sm:mt-0">
                      <Button variant="ghost" size="icon" onclick={() => openEventDialog(event)}>
                        <Pencil class="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onclick={() => openAttendeeDialog(event.id)} title="Katılımcıları Yönet">
                        <Users class="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onclick={() => openEventDeleteDialog(event.id)} class="text-destructive hover:text-destructive">
                        <Trash2 class="w-4 h-4" />
                      </Button>
                      {#if event.link}
                        <a href={event.link} target="_blank" rel="noopener noreferrer" class="p-2 hover:bg-accent rounded-md">
                          <ExternalLink class="w-4 h-4" />
                        </a>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
              
              <!-- Pagination -->
              {#if eventsTotalPages > 1}
                <div class="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onclick={() => goToEventsPage(eventsCurrentPage - 1)}
                    disabled={eventsCurrentPage === 1}
                  >
                    <ChevronLeft class="w-4 h-4" />
                  </Button>
                  
                  <div class="flex items-center gap-1">
                    {#each getEventsPageNumbers() as page}
                      {#if page === '...'}
                        <span class="px-2 text-muted-foreground">...</span>
                      {:else}
                        <Button
                          variant={eventsCurrentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onclick={() => goToEventsPage(page as number)}
                          class="min-w-[2.5rem]"
                        >
                          {page}
                        </Button>
                      {/if}
                    {/each}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onclick={() => goToEventsPage(eventsCurrentPage + 1)}
                    disabled={eventsCurrentPage === eventsTotalPages}
                  >
                    <ChevronRight class="w-4 h-4" />
                  </Button>
                </div>
                
                <p class="text-center text-sm text-muted-foreground">
                  {t('moderation.totalEventsPage', { count: events.length, current: eventsCurrentPage, total: eventsTotalPages })}
                </p>
              {/if}
            {/if}
          </div>

				<AlertDialog.Root bind:open={showDeleteDialog} onOpenChange={handleDeleteDialogOpenChange}>
					<AlertDialog.Content class="w-[calc(100%-2rem)] sm:w-full max-w-md mx-auto">
				<AlertDialog.Header>
					<AlertDialog.Title class="text-lg sm:text-xl">
						{t('AreYouSure') ?? 'Silme işlemini onaylayın'}
					</AlertDialog.Title>
					<AlertDialog.Description class="text-sm sm:text-base">
						{t('DeleteAccountConfirm') ?? 'Bu hesabı silmek istediğinizden emin misiniz? Hesap hemen gizlenecek ve 48 saat sonra tamamen silinecektir.'}
					</AlertDialog.Description>
				</AlertDialog.Header>
				<AlertDialog.Footer class="flex flex-col sm:flex-row gap-2 sm:justify-end">
					<AlertDialog.Cancel 
            class="w-full sm:w-auto" 
            onclick={handleDeleteDialogCancel}
          >
						{t('Cancel') ?? 'İptal'}
					</AlertDialog.Cancel>
					<AlertDialog.Action 
            class="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90" 
            onclick={handleDeleteDialogConfirm}
          >
						{t('ConfirmDelete') ?? 'Sil'}
					</AlertDialog.Action>
				</AlertDialog.Footer>
			</AlertDialog.Content>
				</AlertDialog.Root>

        <!-- Link Delete Alert Dialog -->
        <AlertDialog.Root bind:open={showLinkDeleteDialog} onOpenChange={(open) => { if (!open) handleLinkDeleteDialogCancel(); }}>
          <AlertDialog.Content class="w-[calc(100%-2rem)] sm:w-full max-w-md mx-auto">
            <AlertDialog.Header>
              <AlertDialog.Title class="text-lg sm:text-xl">
                Link Silme Onayı
              </AlertDialog.Title>
              <AlertDialog.Description class="text-sm sm:text-base">
                Bu linki silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Footer class="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <AlertDialog.Cancel 
                class="w-full sm:w-auto" 
                onclick={handleLinkDeleteDialogCancel}
              >
                İptal
              </AlertDialog.Cancel>
              <AlertDialog.Action 
                class="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                onclick={handleLinkDeleteDialogConfirm}
              >
                Sil
              </AlertDialog.Action>
            </AlertDialog.Footer>
          </AlertDialog.Content>
        </AlertDialog.Root>

        <!-- Event Delete Alert Dialog -->
        <AlertDialog.Root bind:open={showEventDeleteDialog} onOpenChange={(open) => { if (!open) handleEventDeleteDialogCancel(); }}>
          <AlertDialog.Content class="w-[calc(100%-2rem)] sm:w-full max-w-md mx-auto">
            <AlertDialog.Header>
              <AlertDialog.Title class="text-lg sm:text-xl">
                Etkinlik/Duyuru Silme Onayı
              </AlertDialog.Title>
              <AlertDialog.Description class="text-sm sm:text-base">
                Bu etkinlik/duyuruyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Footer class="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <AlertDialog.Cancel 
                class="w-full sm:w-auto" 
                onclick={handleEventDeleteDialogCancel}
              >
                İptal
              </AlertDialog.Cancel>
              <AlertDialog.Action 
                class="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                onclick={handleEventDeleteDialogConfirm}
              >
                Sil
              </AlertDialog.Action>
            </AlertDialog.Footer>
          </AlertDialog.Content>
        </AlertDialog.Root>

        <!-- Link Dialog -->
        {#if showLinkDialog}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" role="presentation" onclick={closeLinkDialog}>
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg" role="dialog" aria-modal="true" tabindex="-1" onclick={(e) => e.stopPropagation()}>
              <div class="flex flex-col space-y-1.5 text-center sm:text-left">
                <h2 class="text-lg font-semibold leading-none tracking-tight">
                  {editingLink ? 'Link Düzenle' : 'Yeni Link Ekle'}
                </h2>
                <p class="text-sm text-muted-foreground">
                  Sosyal medya veya diğer link bilgilerini girin
                </p>
              </div>

              <div class="grid gap-4 py-4">
                <div class="grid gap-2">
                  <Label for="title">Başlık *</Label>
                  <Input id="title" bind:value={linkForm.title} placeholder="Örn: Twitter, YouTube" />
                </div>

                <div class="grid gap-2">
                  <Label for="url">URL *</Label>
                  <Input id="url" bind:value={linkForm.url} placeholder="https://..." />
                </div>

                <div class="grid gap-2">
                  <Label for="description">Açıklama</Label>
                  <Textarea id="description" bind:value={linkForm.description} placeholder="Link açıklaması..." rows={2} />
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="grid gap-2">
                    <Label for="type">Tip</Label>
                    <select id="type" bind:value={linkForm.type} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      {#each typeOptions as option}
                        <option value={option.value}>{option.label}</option>
                      {/each}
                    </select>
                  </div>

                  <div class="grid gap-2">
                    <Label for="platform">Platform (opsiyonel)</Label>
                    <Input id="platform" bind:value={linkForm.platform} placeholder="twitter, youtube..." />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="grid gap-2">
                    <Label for="display_order">Sıra No</Label>
                    <Input id="display_order" type="number" bind:value={linkForm.display_order} min="0" />
                  </div>

                  <div class="grid gap-2">
                    <Label>Icon Yükle</Label>
                    <Input type="file" accept="image/*" onchange={handleIconChange} />
                  </div>
                </div>

                {#if linkForm.icon}
                  <p class="text-sm text-muted-foreground">Seçilen: {linkForm.icon.name}</p>
                {/if}

                <div class="flex items-center gap-2">
                  <Switch id="is_active" bind:checked={linkForm.is_active} />
                  <Label for="is_active">Aktif</Label>
                </div>
              </div>

              <div class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                <Button variant="outline" onclick={closeLinkDialog}>İptal</Button>
                <Button onclick={saveLinkWithVerification}>
                  {editingLink ? 'Güncelle' : 'Kaydet'}
                </Button>
              </div>
            </div>
          </div>
        {/if}

        <!-- Event Dialog -->
        {#if showEventDialog}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" role="presentation" onclick={closeEventDialog}>
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg" role="dialog" aria-modal="true" tabindex="-1" onclick={(e) => e.stopPropagation()}>
              <div class="flex flex-col space-y-1.5 text-center sm:text-left">
                <h2 class="text-lg font-semibold leading-none tracking-tight">
                  {editingEvent ? 'Etkinlik/Duyuru Düzenle' : 'Yeni Etkinlik/Duyuru Ekle'}
                </h2>
                <p class="text-sm text-muted-foreground">
                  Etkinlik veya duyuru bilgilerini girin
                </p>
              </div>

              <div class="grid gap-4 py-4">
                <div class="grid gap-2">
                  <Label for="event-title">Başlık *</Label>
                  <Input id="event-title" bind:value={eventForm.title} placeholder="Örn: LAF Semineri" />
                </div>

                <div class="grid gap-2">
                  <Label for="event-description">Açıklama *</Label>
                  <Textarea id="event-description" bind:value={eventForm.description} placeholder="Detaylı açıklama..." rows={3} />
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="grid gap-2">
                    <Label for="event-type">Tip</Label>
                    <select id="event-type" bind:value={eventForm.type} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <option value="event">Etkinlik</option>
                      <option value="announcement">Duyuru</option>
                    </select>
                  </div>

                  <div class="grid gap-2">
                    <Label for="event-category">Kategori *</Label>
                    <select id="event-category" bind:value={eventForm.category} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <option value="">Seçiniz</option>
                      {#each eventCategoryOptions as option}
                        <option value={option}>{option}</option>
                      {/each}
                    </select>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="grid gap-2">
                    <Label for="event-date">Tarih *</Label>
                    <Input id="event-date" type="datetime-local" bind:value={eventForm.date} />
                  </div>

                  <div class="grid gap-2">
                    <Label for="event-end-date">Bitiş Tarihi (opsiyonel)</Label>
                    <Input id="event-end-date" type="datetime-local" bind:value={eventForm.endDate} />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="grid gap-2">
                    <Label for="event-city">Şehir {eventForm.type === 'event' ? '*' : '(opsiyonel)'}</Label>
                    <select id="event-city" bind:value={eventForm.city} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <option value="">Şehir seçin...</option>
                      {#each turkeyCities as city}
                        <option value={city}>{city}</option>
                      {/each}
                    </select>
                  </div>

                  <div class="grid gap-2">
                    <Label for="event-location">Tam Adres {eventForm.type === 'event' ? '*' : '(opsiyonel)'}</Label>
                    <Input id="event-location" bind:value={eventForm.location} placeholder={eventForm.type === 'announcement' ? 'Online veya boş' : 'Örn: Kadıköy, ODTÜ Kültür Merkezi'} />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="grid gap-2">
                    <Label for="event-link">Link (opsiyonel)</Label>
                    <Input id="event-link" bind:value={eventForm.link} placeholder="https://..." />
                  </div>

                  <div class="grid gap-2">
                    <Label for="event-attendees">{t('moderation.attendeeCount')}</Label>
                    <Input id="event-attendees" type="number" bind:value={eventForm.attendeeCount} min="0" />
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <Switch id="event-is_active" bind:checked={eventForm.isActive} />
                  <Label for="event-is_active">Aktif</Label>
                </div>
              </div>

              <div class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                <Button variant="outline" onclick={closeEventDialog}>İptal</Button>
                <Button onclick={saveEventWithVerification}>
                  {editingEvent ? 'Güncelle' : 'Kaydet'}
                </Button>
              </div>
            </div>
          </div>
        {/if}

        <!-- Attendee Management Dialog -->
        {#if showAttendeeDialog}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" role="presentation" onclick={closeAttendeeDialog}>
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" tabindex="-1" onclick={(e) => e.stopPropagation()}>
              <div class="flex flex-col space-y-1.5 text-center sm:text-left">
                <h2 class="text-lg font-semibold leading-none tracking-tight">
                  Katılımcı Yönetimi - {editingEvent?.title}
                </h2>
                <p class="text-sm text-muted-foreground">
                  Etkinliğe katılımcı ekleyin veya mevcut katılımcıları yönetin
                </p>
              </div>

              <div class="grid gap-4 py-4">
                <!-- Add New Attendees -->
                <div class="grid gap-2 relative">
                  <Label>{t('moderation.addAttendee')}</Label>
                  <div class="relative">
                    <Input
                      bind:value={attendeeSearchQuery}
                      placeholder={t('moderation.searchByUsername')}
                      oninput={() => {
                        showAttendeeSuggestions = true;
                        searchAttendeeUsers();
                      }}
                      onfocus={() => showAttendeeSuggestions = true}
                    />
                    {#if attendeeSearchQuery}
                      <button
                        class="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
                        onclick={clearAttendeeSearch}
                      >
                        <X class="w-4 h-4" />
                      </button>
                    {/if}
                  </div>
                  
                  <!-- Suggestions Dropdown -->
                  {#if showAttendeeSuggestions && (attendeeSuggestions.length > 0 || attendeeSearchLoading)}
                    <div class="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                      {#if attendeeSearchLoading}
                        <div class="p-3 text-sm text-muted-foreground text-center">{t('moderation.searching')}</div>
                      {:else if attendeeSuggestions.length === 0 && attendeeSearchQuery}
                        <div class="p-3 text-sm text-muted-foreground text-center">{t('moderation.userNotFound')}</div>
                      {:else}
                        {#each attendeeSuggestions as user}
                          <button
                            class="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2"
                            onclick={() => addAttendeeUser(user)}
                          >
                            <div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <span class="text-xs font-medium">{(user.name || user.username).charAt(0).toUpperCase()}</span>
                            </div>
                            <div class="flex-1 min-w-0">
                              <div class="text-sm font-medium truncate">@{user.username}</div>
                              {#if user.name || user.surname}
                                <div class="text-xs text-muted-foreground truncate">{user.name} {user.surname}</div>
                              {/if}
                            </div>
                            <Plus class="w-4 h-4 text-primary" />
                          </button>
                        {/each}
                      {/if}
                    </div>
                  {/if}
                  
                  <!-- Selected Users -->
                  {#if selectedAttendees.length > 0}
                    <div class="flex flex-wrap gap-2 mt-2">
                      {#each selectedAttendees as user}
                        <div class="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md text-sm">
                          <span>@{user.username}</span>
                          <button
                            class="p-0.5 hover:bg-destructive/20 rounded"
                            onclick={() => removeAttendeeUser(user.id)}
                          >
                            <X class="w-3 h-3" />
                          </button>
                        </div>
                      {/each}
                    </div>
                    <Button onclick={addAttendeesToEvent} size="sm" class="mt-2">
                      <Plus class="w-4 h-4 mr-2" />
                      {selectedAttendees.length} {t('moderation.addAttendee')}
                    </Button>
                  {/if}
                </div>

                <!-- Current Attendees List -->
                <div class="grid gap-2">
                  <Label>{t('moderation.currentAttendees')} ({eventAttendees.length})</Label>
                  {#if eventAttendees.length === 0}
                    <p class="text-sm text-muted-foreground text-center py-4">Henüz katılımcı yok</p>
                  {:else}
                    <div class="space-y-2 max-h-60 overflow-y-auto">
                      {#each eventAttendees as attendee (attendee.id)}
                        <div class="flex items-center justify-between p-2 border rounded-lg">
                          <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span class="text-sm font-medium">{attendee.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <p class="text-sm font-medium">{attendee.name}</p>
                              {#if attendee.email}
                                <p class="text-xs">
                                  <a href="mailto:{attendee.email}" class="text-primary hover:underline">{attendee.email}</a>
                                </p>
                              {/if}
                              {#if attendee.phone}
                                <p class="text-xs">
                                  <a href="tel:{attendee.phone}" class="text-primary hover:underline">{attendee.phone}</a>
                                </p>
                              {/if}
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            class="text-destructive hover:text-destructive"
                            onclick={() => removeAttendee(attendee.id)}
                          >
                            <Trash2 class="w-4 h-4" />
                          </Button>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>

              <div class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                <Button variant="outline" onclick={closeAttendeeDialog}>Kapat</Button>
              </div>
            </div>
          </div>
        {/if}
			</div>
		</div>
	</div>

<Footer />
