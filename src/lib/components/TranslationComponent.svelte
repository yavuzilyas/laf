<script lang="ts">
  import { i18n } from '$lib/stores/i18n.svelte.js';
  import type { InterpolationValues } from '$lib/types/i18n.js';
  
  interface Props {
    key: string;
    values?: InterpolationValues;
    tag?: string;
  }
  
  let { key, values, tag = 'span' }: Props = $props();
  
  // Reactive translation - component seviyesinde $derived
  const translation = $derived(i18n.t(key, values));
</script>

<svelte:element this={tag}>
  {translation}
</svelte:element>