<script lang="ts">
  import App from '$lib/App.svelte';
  import Loader from '$lib/components/load.svelte';
</script>


<main>
  <slot />
  <App name="SvelteKit" />
</main>
