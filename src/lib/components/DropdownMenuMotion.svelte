<script lang="ts">
    let isOpen = false;import {ChevronRightIcon} from "@lucide/svelte";

  import { Motion, useAnimation } from "svelte-motion";
  import { cn } from "$lib/utils";
  import SunIcon from "@lucide/svelte/icons/sun";
  import MoonIcon from "@lucide/svelte/icons/moon";
  import UserRound from "@lucide/svelte/icons/user-round";
  import { toggleMode } from "mode-watcher";
  import { Button } from "$lib/components/ui/button/index.js";
export let items: {
  icon?: any;
  name?: string;
  href?: string;
  custom?: boolean;
  element?: () => any;
  customStyle?: string;
}
[] = []; // dışarıdan gelecek
  let svgControls = useAnimation();

let list = {
  visible: {
    clipPath: "inset(0% 0% 0% 0% round 12px)",
    transition: {
      type: "spring",
      bounce: 0,
      duration: 0.45,
    },
  },
  hidden: {
    clipPath: "inset(0% 10% 100% 90% round 12px)", // sağdan sola kapanır
    transition: {
      duration: 0.27,
      type: "spring",
      bounce: 0,
    },
  },
};



let variants = {
  visible: (i) => ({
    opacity: 1,
    x: 0,             // sola kayma animasyonu burada
    filter: "blur(0px)",
    transition: { duration: 0.22, delay: i * 0.08},
  }),
  hidden: {
    opacity: 0,
    x: 18,            // başlangıçta sağdan 10px ötede
    filter: "blur(6px)",
  },
};



</script>

<!-- NAV'i relative yaptık: absolute olan ul buna göre hizalanır -->
<nav class={cn("relative max-w-[200px] w-full mx-auto  z-50")}>
  <Motion whileTap={{ scale: 0.97 }} let:motion>
    <button
      use:motion
      on:click={() => (isOpen = !isOpen)}
      class="cursor-pointer w-full flex items-center justify-between rounded-xl outline-none"
    >
      <div style="transform-origin: 50% 55%;">
        <Motion animate={svgControls} let:motion>
          <UserRound class="text-primary"/>
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
    "absolute right-0 top-full mt-2.5 z-[60] w-max  px-3.5 py-2 bg-secondary rounded-xl origin-top-right shadow-lg",
    isOpen ? "pointer-events-auto" : "pointer-events-none"
  )}
>
{#each items as item, i}
  <Motion
    as="li"
    custom={i + 1}
    {variants}
    initial="hidden"
    animate={isOpen ? "visible" : "hidden"}
    let:motion
  >
    <a
      href={item.href ?? "/"}
      class={cn(
        "group flex py-1 items-center gap-2 rounded-md border border-transparent text-primary focus-visible:outline-none duration-200 hover:text-primary",
        item?.customStyle
      )}
      use:motion
    >
      <svelte:component this={item.icon} size={16} strokeWidth={1.75} />
      <span class="text-secondary-foreground flex items-center gap-1 text-xs duration-333 font-bold hover:text-secondary-foreground">
        {item.name}
        <ChevronRightIcon
          size={12}
          class="-translate-x-5 scale-0 opacity-0 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 transition-all"
        />
      </span>
    </a>
  </Motion>
{/each}

<Motion
  custom={items.length + 1}
  {variants}
  initial="hidden"
  animate={isOpen ? "visible" : "hidden"}
  let:motion
>
  <li class="mt-1" use:motion>
    <Button class="w-full cursor-pointer" onclick={toggleMode} variant="outline" size="icon">
      <SunIcon size={20}
        class="text-primary h-[1.2rem] w-[1.2rem] rotate-0 scale-100 !transition-all dark:-rotate-90 dark:scale-0 duration-[666ms]"
      />
      <MoonIcon size={20}
        class="text-primary absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 !transition-all dark:rotate-0 dark:scale-100 duration-[666ms]"
      />
    </Button>
  </li>
</Motion>


      </ul>
    </Motion>
  </Motion>
</nav>
