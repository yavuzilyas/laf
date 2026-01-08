<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { t } from '$lib/stores/i18n.svelte.js';
    import { 
        Home,
        RefreshCw
    } from "@lucide/svelte";
    import * as Empty from "$lib/components/ui/empty/index.js";
    import { ServerCogIcon } from 'svelte-animate-icons';
    import { browser } from '$app/environment';
    import ReportDrawer from './ReportDrawer.svelte';
    
    let showReportDrawer = $state(false);
    const errorType = '500';
    
    function openReportDrawer() {
        showReportDrawer = true;
    }
</script>

<Empty.Root>
  <Empty.Header>
    <Empty.Media variant="smicon">
      {#if browser}
        <ServerCogIcon triggers={{ hover: false }}  animationState="loading" duration={3000} loop={true} />
      {/if}
    </Empty.Media>
    <Empty.Title>{t('500Title')}</Empty.Title>
    <Empty.Description>
      {t('500Description')}
    </Empty.Description>
  </Empty.Header>
  <Empty.Content>
    <div class="flex gap-2">
      <Button size="sm" href="/"><Home/> {t('Homepage')}</Button>
      <Button size="sm" variant="outline" on:click={() => window.location.reload()}><RefreshCw/> {t('Try Again')}</Button>
    </div>
    <p class="text-xs text-muted-foreground">{t('aProblem')} <Button size="xs" variant="link" onclick={openReportDrawer}>{t('reportToHelpUs')}</Button></p>
    {#if browser}
      <ReportDrawer 
        bind:open={showReportDrawer}
        reportType="error"
        targetId="500"
        targetTitle={`${t('500Title')} (${window.location.href})`}
      />
    {/if}
  </Empty.Content>
</Empty.Root>
