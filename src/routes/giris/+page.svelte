<script lang="ts">
  import AuthForm from "$lib/components/AuthForm.svelte";
  import logo from "$lib/assets/laf1.svg";
  import { i18n } from '$lib/stores/i18n.svelte.js';
  import Loader from '$lib/components/load.svelte';
</script>

<Loader />
<svelte:head>
  <title>{i18n.t('auth.title.login')}</title>
</svelte:head>

<div class="text-xs grid min-h-svh">
  <div class="flex flex-col gap-4 p-6 md:p-10">
    <div class="flex text-secondary-foreground justify-center gap-2 md:justify-start">
      <a href="/" class="flex text-base items-center gap-2 font-bold">
        <div class="bg-secondary text-primary-foreground flex p-1 items-center justify-center rounded-md">
          <img src="{logo}" alt="LAF" class="h-11 w-11" />
        </div>
        Liberteryen Anarşist Faaliyet
      </a>
    </div>
    <div class="flex flex-1 items-start justify-center">
      <div class="w-full max-w-xs">
        <AuthForm mode="login" />
      </div>
    </div>
  </div>
</div>
