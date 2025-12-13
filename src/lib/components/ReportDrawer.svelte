<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Flag } from "@lucide/svelte";
  import { showToast } from "$lib/hooks/toast";
  import { t } from '$lib/stores/i18n.svelte.js';
  import * as Drawer from "$lib/components/ui/drawer/index.js";
  type ReportType = 'profile' | 'article' | 'comment';

  let {
    open = $bindable(false),

    reportType = 'article',
    targetId = '',
    targetTitle = '',
    onReported = () => {}
  }: {
    open: boolean;
    reportType: ReportType;
    targetId: string;
    targetTitle?: string;
    onReported?: () => void;
  } = $props();

  let loading = $state(false);
  let reportMessage = $state('');
  const MAX_LENGTH = 300;

  async function submitReport() {

    // Check if user is logged in (member)
    const response = await fetch('/api/auth/session', { credentials: 'include' });
    const session = await response.json();
    
    if (!session?.user) {
      showToast(t('auth.errors.loginRequired'), 'error');
      open = false;
      return;
    }

    if (!reportMessage.trim()) {
      showToast(t('report.errors.messageRequired') || 'Lütfen rapor açıklaması yazın.', 'error');
      return;
    }

    if (reportMessage.trim().length > MAX_LENGTH) {
      showToast(t('report.errors.messageTooLong') || 'Rapor açıklaması çok uzun.', 'error');
      return;
    }

    loading = true;
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: reportType,
          targetId,
          reason: reportMessage.trim()
        })
      });

      if (response.ok) {
        showToast(t('report.success.reported'), 'success');
        open = false;
        onReported();
        resetState();
      } else {
        const data = await response.json();
        showToast(data.error || t('report.errors.reportFailed'), 'error');
      }
    } catch (error) {
      console.error('Report error:', error);
      showToast(t('report.errors.connectionError'), 'error');
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    open = false;
    resetState();
  }

  function resetState() {
    reportMessage = '';
  }

  function handleKeyPress(e: KeyboardEvent) {
    if (e.key === 'Escape') handleCancel();
  }

  $effect(() => {
    if (open) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') handleCancel();
      };
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  });

  const getReportTitle = $derived(() => {
    switch (reportType) {
      case 'profile': return t('report.titles.reportProfile');
      case 'article': return t('report.titles.reportArticle');
      case 'comment': return t('report.titles.reportComment');
      default: return t('report.titles.report');
    }
  });

  const getReportDescription = $derived(() => {
    switch (reportType) {
      case 'profile': return t('report.descriptions.reportProfile');
      case 'article': return t('report.descriptions.reportArticle');
      case 'comment': return t('report.descriptions.reportComment');
      default: return t('report.descriptions.report');
    }
  });
</script>

<Drawer.Root bind:open dismissible={true} onClose={handleCancel}>
  <Drawer.Trigger class="sr-only">open report drawer</Drawer.Trigger>
  <Drawer.Content>
    <div class="mx-auto w-full py-2 px-8 md:px-0 max-w-lg">
      <Drawer.Header>
        <div class="flex items-center gap-2">
          <Flag size={20} class="text-destructive z-60" />
          <Drawer.Title>{getReportTitle()}</Drawer.Title>
        </div>
        <Drawer.Description>{getReportDescription()}</Drawer.Description>
      </Drawer.Header>

      <div class="z-60 space-y-4 px-4 pb-4">
        {#if targetTitle}
          <div class="bg-muted/50 p-3 rounded-md">
            <p class="text-sm font-medium text-muted-foreground">
              {t('report.reporting')}: <span class="text-foreground">{targetTitle}</span>
            </p>
          </div>
        {/if}
        <div class="space-y-2">
          <Label for="report-message">{t('report.describeIssue') || 'Sorunu kısaca açıklayın'}</Label>
          <Textarea
            id="report-message"
            bind:value={reportMessage}
            maxlength={MAX_LENGTH}
            placeholder={t('report.describeIssuePlaceholder') || 'En fazla 300 karakter'}
            disabled={loading}
            rows={5}
            class="resize-none"
          />
          <div class="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t('report.moderationNote') || 'Yanlış raporlar yaptırım gerektirebilir.'}</span>
            <span>{reportMessage.trim().length}/{MAX_LENGTH}</span>
          </div>
        </div>
      </div>

      <Drawer.Footer class="flex flex-row gap-2">
        <Button
          class="flex-1 z-60"
          onclick={submitReport}
          disabled={loading || !reportMessage.trim()}
          variant="destructive"
        >
          {#if loading}
            <span class="z-60 inline-flex items-center gap-2">
              <span class="z-60 h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent"></span>
              {t('report.submitting')}...
            </span>
          {:else}
            <Flag class="h-4 w-4 mr-2" />
            {t('report.submit')}
          {/if}
        </Button>
        <Button variant="outline" class="z-60 flex-1" onclick={handleCancel} disabled={loading}>
          {t('Cancel')}
        </Button>
      </Drawer.Footer>
    </div>
  </Drawer.Content>
</Drawer.Root>