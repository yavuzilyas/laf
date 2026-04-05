<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLImgAttributes } from "svelte/elements";

  interface Props extends HTMLImgAttributes {
    src: string;
    alt: string;
    class?: string;
  }

  let {
    src,
    alt,
    class: className,
    onerror,
    ...rest
  }: Props = $props();

  let isError = $state(false);
  let imgRef = $state<HTMLImageElement>();

  function handleError(e: Event) {
    isError = true;
    // Call any custom error handler passed via props
    if (onerror) {
      const handler = onerror as (e: Event) => void;
      handler(e);
    }
  }

  // Reset error state when src changes
  $effect(() => {
    if (src) {
      isError = false;
    }
  });
</script>

{#if !isError}
  <img
    bind:this={imgRef}
    {src}
    {alt}
    class={cn(className)}
    onerror={handleError}
    {...rest}
  />
{/if}
