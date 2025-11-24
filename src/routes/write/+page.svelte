<script lang="ts">
  import Navbar from '$lib/Navbar.svelte';
  import Footer from '$lib/Footer.svelte';
    import NotLogged from "$lib/components/notLogged.svelte";
    import Write from "$lib/components/Write.svelte";

    let { data } = $props();
    let user = data?.user;
    let article = data?.article;
    let mode = data?.mode;
</script>
<Navbar />
<div class="container max-w-7xl min-h-[calc(100vh-8rem)] mx-auto px-4 xl:px-0 py-6">
  {#if !user}
    <NotLogged />
  {:else}
      <Write {article} {mode} />
  {/if}
</div>
<Footer />
