<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
    import Navbar from '$lib/Navbar.svelte';
  import Footer from '$lib/Footer.svelte';
    import { Button } from "$lib/components/ui/button";
    import { t } from '$lib/stores/i18n.svelte.js';
    import { 
        House,
        UserRoundSearch
    } from "@lucide/svelte";
    import * as Empty from "$lib/components/ui/empty/index.js";
    import { GlobeLockIcon, FileQuestionMarkIcon, ServerCogIcon } from 'svelte-animate-icons';
    import { browser } from '$app/environment';
    import ReportDrawer from '$lib/components/ReportDrawer.svelte';
    let showReportDrawer = $state(false);
    
    setTimeout(() => {
    openReportDrawer();}, 4100 );
    
    function openReportDrawer() {
        showReportDrawer = true;
    }
  let status = $page.status || 500;
  let message = $page.error?.message || 'An error occurred';

</script>

<Navbar />
<div class="container max-w-7xl min-h-[calc(100vh-8rem)] mx-auto px-4 xl:px-0 py-6">



<Empty.Root>
  <Empty.Header>
    <Empty.Media variant="smicon">
      {#if browser}
      {#if status == 403}
        <GlobeLockIcon triggers={{ hover: false }}  animationState="loading" duration={1200} loop={true} />
      {/if}
      {#if status == 404}
        <FileQuestionMarkIcon triggers={{ hover: false }}  animationState="loading" duration={4000} loop={true} />
      {/if}
      {#if status == 500}
              <ServerCogIcon triggers={{ hover: false }}  animationState="loading" duration={3000} loop={true} />
{/if}
      {/if}
    </Empty.Media>
    <Empty.Title>{status}</Empty.Title>
    <Empty.Description>
      {message}
    </Empty.Description>
  </Empty.Header>
  <Empty.Content>
    <div class="flex gap-2">
      <Button size="sm" href="/"><House/> {t('Homepage')}</Button>
            <Button size="sm" variant="outline" onclick={() => window.history.back()}><UserRoundSearch/> {t('Go Back')}</Button>

    </div>
    <p class="text-xs text-muted-foreground">{t('aProblem')} <Button size="xs" variant="link" onclick={openReportDrawer}>{t('reportToHelpUs')}</Button></p>
    {#if browser}
      <ReportDrawer 
        bind:open={showReportDrawer}
        reportType="error"
        targetId={status.toString()}
        targetTitle={`${t('errorTitle')} (${window.location.href})`}
      />
    {/if}
  </Empty.Content>

</Empty.Root>
</div>
<Footer />