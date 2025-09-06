<script lang="ts">
    let isOpen = false;import {ChevronRightIcon} from "@lucide/svelte";

  import { Motion, useAnimation } from "svelte-motion";

  import { cn } from "$lib/utils";

 export let items: {
    icon: any;
    name: string;
    href?: string;
    customStyle?: string;
  }[] = []; // dışarıdan gelecek
  let svgControls = useAnimation();

let list = {
  visible: {
    clipPath: "inset(0% 0% 0% 0% round 12px)",
    transition: {
      type: "spring",
      bounce: 0,
      duration: 0.4,
    },
  },
  hidden: {
    clipPath: "inset(10% 0% 90% 100% round 12px)", // sağdan sola kapanır
    transition: {
      duration: 0.22,
      type: "spring",
      bounce: 0,
    },
  },
};



  let variants = {
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.3,
      delay: i * 0.05, // sıralı açılma için daha uzun delay
    },
  }),
  hidden: {
    opacity: 0,
    scale: 0.4,         // küçükten büyüsün
    filter: "blur(15px)", // güçlü blur
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
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
	<path fill="lightgray" d="M5.85 17.1q1.275-.975 2.85-1.537T12 15t3.3.563t2.85 1.537q.875-1.025 1.363-2.325T20 12q0-3.325-2.337-5.663T12 4T6.337 6.338T4 12q0 1.475.488 2.775T5.85 17.1M12 13q-1.475 0-2.488-1.012T8.5 9.5t1.013-2.488T12 6t2.488 1.013T15.5 9.5t-1.012 2.488T12 13m0 9q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22" />
</svg>
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
    "absolute right-0 top-full mt-2 z-[60] min-w-[220px] w-max space-y-2 p-1.5 bg-secondary border border-neutral-800 rounded-xl origin-top-right shadow-lg",
    isOpen ? "pointer-events-auto" : "pointer-events-none"
  )}
>

{#each items as item, i}
  <Motion custom={i + 1} {variants} initial="hidden" animate={isOpen ? "visible" : "hidden"} let:motion>
    <li use:motion>
            <a
              href={item.href ?? "/"}
              class={cn(
                "group flex items-center gap-2 rounded-md border border-transparent text-primary focus-visible:outline-none",
                item?.customStyle
              )}
            >
              <svelte:component this={item.icon} size={16} strokeWidth={1.4} />
              <span class="text-secondary-foreground flex items-center gap-1 text-sm font-medium  hover:text-neutral-300 focus-visible:text-neutral-300 focus-visible:border-neutral-800 ">
                {item.name}
                                  <ChevronRightIcon
                    size={12}
                    class="-translate-x-1 scale-0 opacity-0 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 transition-all"
                  />
              </span>
            </a>
          </li>
          </Motion>
        {/each}
      </ul>
    </Motion>
  </Motion>
</nav>
