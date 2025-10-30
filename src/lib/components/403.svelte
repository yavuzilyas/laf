<script lang="ts">

    import { Button } from "$lib/components/ui/button";
    import { t } from '$lib/stores/i18n.svelte.js';
    import { 
        House,
        UserRoundSearch
    } from "@lucide/svelte";
      import * as Empty from "$lib/components/ui/empty/index.js";
  import { GlobeLockIcon} from 'svelte-animate-icons';
  import { browser } from '$app/environment';
</script>

<Empty.Root>
  <Empty.Header>
    <Empty.Media variant="smicon">
      {#if browser}
        <GlobeLockIcon triggers={{ hover: false }}  animationState="loading" duration={1200} loop={true} />
      {/if}
    </Empty.Media>
    <Empty.Title>{t('403Title')}</Empty.Title>
    <Empty.Description>
      {t('403Description')}
    </Empty.Description>
  </Empty.Header>
  <Empty.Content>
    <div class="flex gap-2">
      <Button size="sm" href="/"><House/> {t('Homepage')}</Button>
      <Button size="sm" variant="outline" href="/profile"><UserRoundSearch/> {t('SeeItsProfile')}</Button>
    </div>
    <p class="text-xs text-muted-foreground">{t('aProblem')}<Button size="xs" variant="link">{t('reportToHelpUs')}</Button></p>
  </Empty.Content>

</Empty.Root>