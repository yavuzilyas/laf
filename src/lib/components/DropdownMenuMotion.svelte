<script lang="ts">
      let isOpen = false;

  import {Menu, Expand, Shrink, Volume2, VolumeOff} from "@lucide/svelte";
  import { Motion, useAnimation } from "svelte-motion";
  import { cn } from "$lib/utils";
  import {UserRound }from "@lucide/svelte";
  import SunIcon from "@lucide/svelte/icons/sun";
  import MoonIcon from "@lucide/svelte/icons/moon";
 
  import { toggleMode } from "mode-watcher";
  import { Button } from "$lib/components/ui/button/index.js";
  import LanguageSelector from "./LanguageSelector.svelte";
  import { t } from '$lib/stores/i18n.svelte.ts';
	import { playSound } from "$lib/stores/sound"; // 🔥 ekle

export let items: { 
    icon?: any; 
    name?: string; 
    href?: string; 
    custom?: boolean; 
    element?: () => any; 
    customStyle?: string;
    onClick?: () => void; // Yeni prop
  }[] = [];
  let svgControls = useAnimation();

let list = {
  visible: {
    clipPath: "inset(0% 0% 0% 0% round 12px)",
    transition: {
      type: "spring",
      bounce: 0,
    },
    filter: "blur(0px)",
  },
  hidden: {
    clipPath: "inset(5% 5% 95% 95% round 12px)", // sağdan sola kapanır
    transition: {
      duration: 0.45,
      type: "spring",
      bounce: 0,
    },
    filter: "blur(12px)",
  },
};

let variants = {
  visible: (i: number) => ({
    opacity: 1,
    x: 0,             // sola kayma animasyonu burada
    filter: "blur(0px)",
    transition: { duration: 0.22, delay: i * 0.08},
  }),
  hidden: {
    opacity: 0,
    x: 24,            // başlangıçta sağdan 10px ötede
    filter: "blur(6px)",
  },
};
function handleItemClick(item: any) {
    if (item.onClick) {
      item.onClick();
      isOpen = false; // Menüyü kapat
    }
    // Eğer href varsa, normal link davranışı (sayfa yenileme) olacak, ancak onClick yoksa.
    // Eğer her ikisi de varsa, onClick çalıştıktan sonra sayfa yenilenecektir. Bu genellikle istenmez.
    // Bu nedenle, genellikle bir öğede ya href ya da onClick olmalı.
  }
    import { soundEnabled } from "$lib/stores/sound";

  import { get } from "svelte/store";

  function toggle() {
  soundEnabled.update(v => !v);
}
  import { isFullscreen, toggleFullscreen } from "$lib/stores/fullscreen";

</script>

<!-- NAV'i relative yaptık: absolute olan ul buna göre hizalanır -->
<nav class={cn("relative max-w-fit w-min mx-auto  z-50")}> 
  <Motion whileTap={{ scale: 0.97 }} let:motion>
    <button
      use:motion
      on:click={() => (isOpen = !isOpen, playSound("tab"))}
      class=" w-full flex items-center justify-between rounded-xl outline-none"
    >
      <div style="transform-origin: 50% 55%;">
        <Motion animate={svgControls} let:motion>
          <Menu class=" scale-110 cursor-pointer md:scale-100 text-primary"size={20} strokeWidth={2.25} />
        </Motion>
      </div>
    </button>

    <!-- Motion: ul'e use:motion ile bağlanıyor. right-0 ile sağ kenarı butonun sağına yaslıyoruz
         min-w[...] w-max ile butondan geniş olursa sola doğru büyümesini sağlıyoruz.
         origin-top-right animasyonların sağ üstten başlaması için. -->
    <Motion animate={isOpen ? "visible" : "hidden"} variants={list} initial="hidden" let:motion>
      <ul
  use:motion
  class={cn(
    "absolute flex flex-col gap-1.5 right-0 top-full mt-4 sm:mt-3 z-[60] w-fit  px-3.5 py-2 bg-secondary/66 backdrop-blur-md rounded-xl origin-top-right shadow-lg",
    isOpen ? "pointer-events-auto" : "pointer-events-none"
  )}
>

{#each items as item, i}
  <Motion
    custom={i + 1}
    {variants}
    initial="hidden"
    animate={isOpen ? "visible" : "hidden"}
    let:motion
  >
    <li use:motion>
      {#if item.onClick}
        <Button  size="xs" variant="outline"
          onclick={() => handleItemClick(item)}
          class={cn(
            "text-primary hover:text-primary w-full",
            item?.customStyle
          )}
        >
          <svelte:component this={item.icon} size={16} strokeWidth={2.25} />
          <span class="text-secondary-foreground font-bold  hover:text-secondary-foreground">
            {item.name}

          </span>
        </Button>
      {:else}
        <Button size="xs" variant="outline"
          href={item.href ?? "/"}
          class={cn(
            "text-primary hover:text-primary w-full",
            item?.customStyle
          )}
        >
          <svelte:component this={item.icon} size={16} strokeWidth={2.25} />
          <span class="text-secondary-foreground font-bold hover:text-secondary-foreground">
            {item.name}
          </span>
        </Button>
      {/if}
    </li>
  </Motion>
{/each}
<Motion
  custom={items.length + 1}
  {variants}
  initial="hidden"
  animate={isOpen ? "visible" : "hidden"}
  let:motion
>
<div use:motion class="flex flex-row gap-1">
  <li>

<Button size="xs" class="w-fit h-9 flex flex-row text-xs justify-center gap-2"onclick={toggleMode} variant="outline">
  <SunIcon strokeWidth={2.25}
    class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 !transition-all text-primary dark:-rotate-90 dark:scale-0"
  />
  <MoonIcon strokeWidth={2.25}
    class="absolute h-[1.2rem] w-[1.2rem] text-primary  rotate-90 scale-0 !transition-all dark:rotate-0 dark:scale-100"
  />

</Button>
  </li>
    <li >

<Button size="xs" class="w-fit h-9 flex flex-row text-xs justify-center" onclick={toggle} variant="outline">
    <Volume2
    class="h-[1.2rem] w-[1.2rem] text-primary transition-all
           {$soundEnabled ? 'scale-100 opacity-100' : 'scale-0 opacity-0 absolute'}"
  />
  <VolumeOff
    class="h-[1.2rem] w-[1.2rem] text-primary transition-all
           {$soundEnabled ? 'scale-0 opacity-0 absolute' : 'scale-100 opacity-100'}"
  />
</Button>
  </li>
      <li >

<Button size="xs" class="w-fit h-9 flex flex-row text-xs justify-center" onclick={toggleFullscreen} variant="outline">
    <Shrink
    class="h-[1.2rem] w-[1.2rem] text-primary transition-all
           {$isFullscreen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 absolute'}"
  />
  <Expand
    class="h-[1.2rem] w-[1.2rem] text-primary transition-all
           {$isFullscreen ? 'scale-0 opacity-0 absolute' : 'scale-100 opacity-100'}"
  />
</Button>
  </li>
  </div>
</Motion>
<Motion
  custom={items.length + 1}
  {variants}
  initial="hidden"
  animate={isOpen ? "visible" : "hidden"}
  let:motion
>
  <li use:motion>
<LanguageSelector />

  </li>
</Motion>

      </ul>
    </Motion>
  </Motion>
</nav>
