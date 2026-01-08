<script lang="ts">
  import * as Tooltip from "$lib/components/ui/tooltip";
  import * as Popover from "$lib/components/ui/popover";
  import { onMount } from "svelte";

  export let content: string;
  export let side: 'top' | 'right' | 'bottom' | 'left' = 'top';
  export let delay = 0;
  
  let isMobile = false;
  
  onMount(() => {
    const checkMobile = () => {
      isMobile = window.innerWidth < 768; // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  });
</script>

{#if isMobile}
  <Popover.Root>
    <Popover.Trigger>
      <slot />
    </Popover.Trigger>
    <Popover.Content class="p-2 text-sm bg-popover text-popover-foreground rounded-md shadow-md">
      {content}
    </Popover.Content>
  </Popover.Root>
{:else}

{/if}
