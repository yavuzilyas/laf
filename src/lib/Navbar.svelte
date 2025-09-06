<script lang="ts">
        import * as Tooltip from "$lib/components/ui/tooltip/index.js";
  import SunIcon from "@lucide/svelte/icons/sun";
  import MoonIcon from "@lucide/svelte/icons/moon";
 
  import { resetMode, setMode } from "mode-watcher";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { buttonVariants } from "$lib/components/ui/button/index.js";
  import DropdownMenuMotion from "$lib/components/DropdownMenuMotion.svelte";
    import {LogIn, CirclePlus, UserCircleIcon, LayoutGridIcon, TrashIcon, BellIcon, LogInIcon } from "@lucide/svelte";
  let menu = [
    { name: "Makale", href: "#" },
    { name: "Nutuk", href: "#" },
    { name: "Lügat", href: "#" },
    { name: "Külliyât", href: "#" },
    { name: "Tahkikat", href: "#" },
  ];
  import logo from '$lib/assets/laf1.svg';

    const loggedInItems = [
    { icon: UserCircleIcon, name: "Hesap", href: "/hesap" },
    { icon: LayoutGridIcon, name: "Ayarlar", href: "/ayarlar" },
    { icon: BellIcon, name: "Bildirimler", href: "/bildirim" },
    { icon: TrashIcon, name: "Çıkış Yap", href: "/logout", customStyle: "!text-red-500 hover:bg-red-500/10" },
  ];

  // Giriş yapmamış kullanıcı menüsü
  const loggedOutItems = [
    { icon: LogInIcon, name: "Giriş", href: "/login" },
    { icon: CirclePlus, name: "Kayıt", href: "/register" },
  ];
  // Kullanıcının giriş durumuna göre items seç
  const items = loggedOutItems;
</script>
 

<nav class="w-full text-[var(--laf-white)] border-b-1 py-1">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between">
      <!-- Logo -->
      <img class="max-h-5" src="{logo}" alt="LAF" />

      <!-- Menu -->
      <div class="hidden md:flex text-gray-200 space-x-4 text-xs">
        {#each menu as item}

            <Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger><a href={item.href} class="font-bold cursor-pointer">{item.name}</a></Tooltip.Trigger>
    <Tooltip.Content>
      <p>{item.name} sayfasına git.</p>
    </Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>

        {/each}
      </div>
      <div class="">
        <!-- <DropdownMenu.Root>
  <DropdownMenu.Trigger
    class="{buttonVariants({ variant: "outline", size: "icon" })}"
  >
    <SunIcon
      class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 !transition-all dark:-rotate-90 dark:scale-0"
    />
    <MoonIcon
      class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 !transition-all dark:rotate-0 dark:scale-100"
    />
    <span class="sr-only">Tema seçimi</span>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end">
    <DropdownMenu.Item onclick={() => setMode("light")}>Beyaz</DropdownMenu.Item
    >
    <DropdownMenu.Item onclick={() => setMode("dark")}>Siyah</DropdownMenu.Item>
    <DropdownMenu.Item onclick={() => resetMode()}>Sistem</DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root> -->
        <!-- <a href="#log-in" class="text-sm font-bold text-[var(--laf-yellow)]">Giriş Yap</a> -->
    <DropdownMenuMotion {items} />

    </div>
    </div>
  </div>
</nav>