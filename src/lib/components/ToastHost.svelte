<script lang="ts">
	import { goto } from '$app/navigation';
	import { toasts, type Toast, showToast } from "$lib/hooks/toast";
	import { readAndClearPendingToast } from "$lib/hooks/toast";
	import { t, tJoin } from '$lib/stores/i18n.svelte.js';
	import { cn } from "$lib/utils";
	import { CheckCircle2, XCircle, Info } from "@lucide/svelte";
	import { Motion } from "svelte-motion";
	import logo from "$lib/assets/laf1.svg";
		import { playSound } from "$lib/stores/sound";

	let liveList: Toast[] = $state([]);
	let renderList = $state<{ toast: Toast; exiting?: boolean }[]>([]);
	let toastQueue: Toast[] = $state([]); // Bildirim kuyruğu
	let isShowingToast = $state(false); // Şu anda bildirim gösteriliyor mu?
	const EXIT_MS = 100;
	$effect(() => {
		const unsub = toasts.subscribe((v) => {
			// Yeni bildirimleri kuyruğa ekle
			const currentIds = new Set([...renderList.map(i => i.toast.id), ...toastQueue.map(t => t.id)]);
			v.forEach((t) => {
				if (!currentIds.has(t.id)) {
					toastQueue.push(t);
				}
			});
			
			// Eğer şu anda bildirim gösterilmiyorsa ve kuyrukta bildirim varsa
			if (!isShowingToast && toastQueue.length > 0) {
				showNextToast();
			}
			
			liveList = v;
		});
		return () => unsub();
	});
	
	function handleToastClick(item: { toast: Toast }) {
        const link = item.toast.link;
        if (!link) return;
        goto(link);
        removeToast(item.toast.id);
    }
    
	function showNextToast() {
    if (toastQueue.length === 0) {
        isShowingToast = false;
        return;
    }

    isShowingToast = true;
    const nextToast = toastQueue.shift()!;
    
    // Toast tipine göre ses çal
    if (nextToast.type === "success") {
		setTimeout(() => 
        playSound("success"), 100);
    } else if (nextToast.type === "error") {
        		setTimeout(() => playSound("errorNot"), 100);
    } else {
        setTimeout(() => playSound("info"), 100);
    }
    
    // Yeni bildirimi render listesine ekle
    renderList = [{ toast: nextToast }, ...renderList];
    
    // Bildirimin otomatik kapanma süresini ayarla
    setTimeout(() => {
        removeToast(nextToast.id);
    }, nextToast.duration || 3500);
}
	function removeToast(id: number) {
		// Bildirimi kapat
		renderList.forEach((item) => {
			if (item.toast.id === id && !item.exiting) {
				item.exiting = true;
				setTimeout(() => {
					renderList = renderList.filter((i) => i.toast.id !== id);
					// Bu bildirim kapandıktan sonra sıradakini göster
					setTimeout(() => showNextToast(), 100);
				}, EXIT_MS);
			}
		});
	}

	// Keep a reactive reference to locale so UI updates when language changes
    const currentLocale = $derived(t.currentLocale);

    $effect.pre(() => {
        const pending = readAndClearPendingToast();
        if (!pending) return;
        if (pending.message) {
            showToast(pending.message, pending.type, pending.duration);
        } else if (pending.key) {
            // Translate on the client at display time for reactivity
            showToastKeyInternal(pending.key, pending.type, pending.duration);
        } else if (pending.keys && pending.keys.length) {
            showToastKeysInternal(pending.keys, pending.sep || ' ', pending.type, pending.duration);
        }
    });

    // Internal helpers to push translated toasts that will re-render on locale change
    function translatedMessageOf(item: Toast): string {
        if (item.message) return item.message;
        if (item.key) return t(item.key);
        if (item.keys && item.keys.length) return tJoin(item.keys, item.sep || ' ');
        return '';
    }

    function showToastKeyInternal(key: string, type: Toast['type'], duration = 3000) {
        const id = Date.now() + Math.random();
        const toast: Toast = { id, key, type, duration };
        // Add the toast with the key directly to maintain reactivity
        toastQueue.push(toast);
        if (!isShowingToast && toastQueue.length === 1) {
            showNextToast();
        }
    }
    function showToastKeysInternal(keys: string[], sep: string, type: Toast['type'], duration = 3000) {
        const id = Date.now() + Math.random();
        const toast: Toast = { id, keys, sep, type, duration };
        // Add the toast with the keys directly to maintain reactivity
        toastQueue.push(toast);
        if (!isShowingToast && toastQueue.length === 1) {
            showNextToast();
        }
    }

	const itemVariants = {
		visible: {
			clipPath: "inset(0% 0% 0% 0% round 14px)",
			transition: {
				type: "spring",
				bounce: 0,
				duration: 0.6
			},
			y: 36,
			filter: "blur(0px)",
		},
		hidden: {
			clipPath: "inset(0% 50% 0% 50% round 14px)",
			transition: {
				duration: 0.5,
				type: "spring",
				bounce: 0,
			},
			y: -52,
			filter: "blur(14px)",
		},
	};
</script>

<div class="w-full h-0 fixed translate z-[70] flex flex-col justify-center items-center gap-1">
	{#each renderList as item, i (item.toast.id)}
		<Motion
			custom={i + 1}
			variants={itemVariants}
			initial="hidden"
			animate={item.exiting ? "hidden" : "visible"}
			transition={{ duration: 0.3 }}
			let:motion
		>
			<div
			
				use:motion
				on:click={() => handleToastClick(item)}
				class={cn(
					"w-10/12 md:w-fit",
					"rounded-xl px-4.5 py-2.5 mt-1 md:mt-2 text-sm font-bold flex items-center select-none justify-center gap-2",
					item.toast.link ? 'cursor-pointer hover:bg-secondary/90 transition-colors' : '',
					"bg-secondary/80 text-secondary-foreground backdrop-blur-md"
				)}
			>
				<span class="flex items-center text-hard-primary  flex-row"><img src={logo} class="text-hard-primary w-auto h-3.5" alt="LAF Logo" />:</span>
            <span class="gap-1 flex flex-row items-center">
				{#if item.toast.type === "success"}
					<CheckCircle2 class="w-4 h-4 text-green-500 flex-shrink-0" />
				{:else if item.toast.type === "error"}
					<XCircle class="w-4 h-4 text-red-500 flex-shrink-0" />
				{:else}
					<Info class="w-4 h-4 text-sky-500 flex-shrink-0" />
				{/if}
				                {translatedMessageOf(item.toast)}</span>
            </div>
        </Motion>
    {/each}
</div>