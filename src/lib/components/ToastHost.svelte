<script lang="ts">
	import { toasts, type Toast, showToast } from "$lib/hooks/toast";
	import { readAndClearPendingToast } from "$lib/hooks/toast";
	import { cn } from "$lib/utils";
	import { CheckCircle2, XCircle, Info } from "@lucide/svelte";
	import { Motion } from "svelte-motion";
	import logo from "$lib/assets/laf1.svg";
	let liveList: Toast[] = $state([]);
	let renderList = $state<{ toast: Toast; exiting?: boolean }[]>([]);
	let toastQueue: Toast[] = $state([]); // Bildirim kuyruğu
	let isShowingToast = $state(false); // Şu anda bildirim gösteriliyor mu?
	const EXIT_MS = 250;
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
	
	function showNextToast() {
		if (toastQueue.length === 0) {
			isShowingToast = false;
			return;
		}
		
		isShowingToast = true;
		const nextToast = toastQueue.shift()!;
		
		// Yeni bildirimi render listesine ekle
		renderList = [{ toast: nextToast }, ...renderList];
		
		// Bildirimin otomatik kapanma süresini ayarla
		setTimeout(() => {
			removeToast(nextToast.id);
		}, nextToast.duration || 3000);
	}
	
	function removeToast(id: string) {
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

	$effect.pre(() => {
		const pending = readAndClearPendingToast();
		if (pending) {
			showToast(pending.message, pending.type, pending.duration);
		}
	});

	const itemVariants = {
		visible: {
			clipPath: "inset(0% 0% 0% 0% round 14px)",
			transition: {
				type: "spring",
				bounce: 0,
				duration: 0.7, 
				delay: 0.5,
			},
			y: 36,
			filter: "blur(0px)",
		},
		hidden: {
			clipPath: "inset(0% 50% 0% 50% round 14px)",
			transition: {
				duration: 0.6,
				type: "spring",
				bounce: 0,
			},
			y: -52,
			filter: "blur(14px)",
		},
	};
</script>

<div class="w-full fixed translate z-[70] flex flex-col justify-center items-center gap-1">
	{#each renderList as item, i (item.toast.id)}
		<Motion
			custom={i + 1}
			variants={itemVariants}
			initial="hidden"
			animate={item.exiting ? "hidden" : "visible"}
			transition={{ duration: 0.28 }}
			let:motion
		>
			<div
			
				use:motion
				class={cn(
					"w-10/12 md:w-fit",
					"rounded-xl px-4.5 py-2.5 mt-1 md:mt-2 text-sm font-bold flex items-center select-none justify-center gap-2",
					"bg-neutral-900/66 text-neutral-50 backdrop-blur-md"
				)}
			>
				<span class="text-primary flex items-center flex-row"><img src={logo} class="w-auto h-3.5" alt="LAF Logo" />:</span>
			<span class="gap-1 flex flex-row items-center">
				{#if item.toast.type === "success"}
					<CheckCircle2 class="w-4 h-4 text-green-400 flex-shrink-0" />
				{:else if item.toast.type === "error"}
					<XCircle class="w-4 h-4 text-red-400 flex-shrink-0" />
				{:else}
					<Info class="w-4 h-4 text-sky-400 flex-shrink-0" />
				{/if}
				{item.toast.message}</span>
			</div>
		</Motion>
	{/each}
</div>