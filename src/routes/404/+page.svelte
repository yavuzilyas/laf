/s<script lang="ts">
  import Navbar from '$lib/Navbar.svelte';
  import Footer from '$lib/Footer.svelte';
  import NotFound from "$lib/components/404.svelte";
</script>

<Navbar />
<div class="container max-w-7xl min-h-[calc(100vh-10rem)] mx-auto px-4 xl:px-0 py-6">
    <NotFound />
</div>
<Footer />
