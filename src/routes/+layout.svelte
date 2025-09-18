<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
  import "../app.css";
  import { ModeWatcher } from "mode-watcher";
  import ToastHost from "$lib/components/ToastHost.svelte";
  import Preloader from "$lib/components/Preloader.svelte";
    let { children } = $props();

</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher />
<Preloader />
<ToastHost />
{@render children?.()}