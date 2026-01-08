<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  
  let status = 0;
  let message = '';
  
  onMount(() => {
    // Get the error status from the page store
    status = $page.status || 500;
    message = $page.error?.message || 'An error occurred';
    
    // Redirect based on error status
    if (status === 404) {
      window.location.href = '/404';
    } else if (status >= 500) {
      window.location.href = '/500';
    }
  });
</script>

<!-- Fallback error display in case redirect fails -->
<div class="min-h-screen flex items-center justify-center bg-background p-4">
  <div class="text-center">
    <h1 class="text-4xl font-bold mb-4">{status}</h1>
    <p class="text-muted-foreground mb-6">{message}</p>
    <a href="/" class="text-primary hover:underline">Return Home</a>
  </div>
</div>
