<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { t } from '$lib/stores/i18n.svelte.js';
    import { 
        House,
        Search
    } from "@lucide/svelte";
    import * as Empty from "$lib/components/ui/empty/index.js";
    import { FileQuestionMarkIcon } from 'svelte-animate-icons';
    import { browser } from '$app/environment';
    import ReportDrawer from './ReportDrawer.svelte';
    
    let showReportDrawer = $state(false);
    
    function openReportDrawer() {
        showReportDrawer = true;
    }
</script>

<Empty.Root>
  <Empty.Header>
    <Empty.Media variant="smicon">
      {#if browser}
        <FileQuestionMarkIcon triggers={{ hover: false }}  animationState="loading" duration={4000} loop={true} />
      {/if}
    </Empty.Media>
    <Empty.Title>{t('404Title')}</Empty.Title>
    <Empty.Description>
      {t('404Description')}
    </Empty.Description>
  </Empty.Header>
  <Empty.Content>
    <div class="flex gap-2">
      <Button size="sm" href="/"><House/> {t('Homepage')}</Button>
      <Button size="sm" variant="outline" onclick="window.history.back()"><Search/> {t('Go Back')}</Button>
    </div>
    <p class="text-xs text-muted-foreground">{t('aProblem')} <Button size="xs" variant="link" on:click={openReportDrawer}>{t('reportToHelpUs')}</Button></p>
    {#if browser}
      <ReportDrawer 
        bind:open={showReportDrawer}
        reportType="error"
        targetId="404"
        targetTitle={`${t('404Title')} (${window.location.href})`}
      />
    {/if}
  </Empty.Content>
</Empty.Root>
