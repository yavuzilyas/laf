<script lang="ts">
	import { Drawer as DrawerPrimitive } from "vaul-svelte";

	let {
		shouldScaleBackground = true,
		open = $bindable(false),
		activeSnapPoint = $bindable(null),
		...restProps
	}: DrawerPrimitive.RootProps = $props();
		import { playSound } from "$lib/stores/sound"; // 🔥 ekle


  let prevOpen = open;

  $effect(() => {
    if (open !== prevOpen) {
      playSound("swift");
      prevOpen = open;
    }
  });
</script>

<DrawerPrimitive.Root {shouldScaleBackground} bind:open bind:activeSnapPoint {...restProps} />
