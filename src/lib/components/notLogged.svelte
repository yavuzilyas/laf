<script lang="ts">

    import { Button } from "$lib/components/ui/button";
    import { t } from '$lib/stores/i18n.svelte.js';
    import { 
        LogIn,
        UserPlus
    } from "@lucide/svelte";
      import * as Empty from "$lib/components/ui/empty/index.js";
  import { UserIcon} from 'svelte-animate-icons';
  import { browser } from '$app/environment';
</script>

<Empty.Root>
  <Empty.Header>
    <Empty.Media variant="icon">
      {#if browser}
        <UserIcon animationState="loading" size={48} loop={true} />
      {/if}
    </Empty.Media>
    <Empty.Title>{t('notLoggedIn')}</Empty.Title>
    <Empty.Description>
      {t('loginRequired')}
    </Empty.Description>
  </Empty.Header>
  <Empty.Content>
    <div class="flex gap-2">
      <Button size="sm" href="/login"><LogIn/> {t('Login')}</Button>
      <Button size="sm" variant="outline" href="/register"><UserPlus/> {t('Register')}</Button>
    </div>
    <p class="text-xs text-muted-foreground">{t('aProblem')}<Button size="xs" variant="link">{t('reportToHelpUs')}</Button></p>
  </Empty.Content>

</Empty.Root>