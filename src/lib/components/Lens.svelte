<script lang="ts">
    import { scale } from "svelte/transition";

    let {
        zoomFactor = 2,
        isStatic = false,
        position = { x: 200, y: 150 },
        hovering = false
    } = $props();

    let mousePosition = $state({ x: 100, y: 100 });
    let isDragging = $state(false);
    let container: HTMLDivElement | undefined = $state();
    let lensSize = $state(166);

    // Resim genişliğine göre lens boyutunu hesapla
    const calculateLensSize = (): void => {
        if (!container) return;
        
        const img = container.querySelector('img');
        if (!img) return;
        
        const width = img.offsetWidth;
        
        // Resim genişliğine göre lens boyutu
        if (width > 1000) {
            lensSize = 500;
        } else if (width > 666) {
            lensSize = 333;
        } else if (width > 333) {
            lensSize = 166;
        } else {
            lensSize = 166;
        }
    };

    const handleImageLoad = (): void => {
        setTimeout(calculateLensSize, 50);
    };

    $effect(() => {
        if (container) {
            calculateLensSize();
        }
    });

    interface MouseEvent {
        currentTarget: EventTarget & {
            getBoundingClientRect: () => DOMRect;
        };
        clientX: number;
        clientY: number;
    }

    const handleMouseMove = (e: MouseEvent): void => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        mousePosition = { x, y };
        if (!isStatic) {
            position = { x, y };
        }
    };

    const handleTouchStart = (e: TouchEvent): void => {
        e.preventDefault();
        isDragging = true;
        hovering = true;
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        mousePosition = { x, y };
        if (!isStatic) {
            position = { x, y };
        }
    };

    const handleTouchMove = (e: TouchEvent): void => {
        if (!isDragging) return;
        e.preventDefault();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        mousePosition = { x, y };
        if (!isStatic) {
            position = { x, y };
        }
    };

    const handleTouchEnd = (e: TouchEvent): void => {
        e.preventDefault();
        isDragging = false;
        hovering = false;
    };

    const handleMouseEnter = (): void => {
        hovering = true;
    };

    const handleMouseLeave = (): void => {
        hovering = false;
    };
</script>

<div
    bind:this={container}  role="presentation"

    class="relative overflow-hidden z-20 cursor-none touch-none"
    onmouseenter={handleMouseEnter}
    onmouseleave={handleMouseLeave}
    onmousemove={handleMouseMove}
    ontouchstart={handleTouchStart}
    ontouchmove={handleTouchMove}
    ontouchend={handleTouchEnd}
    ontouchcancel={handleTouchEnd}
>
    <slot onload={handleImageLoad} />
    
    {#if isStatic && hovering}
        <div
            in:scale
            out:scale={{ duration: 666 }}
            class="absolute inset-0 overflow-hidden pointer-events-none"
            style="
                mask-image: radial-gradient(circle {lensSize / 2}px at {position.x}px {position.y}px, black 100%, transparent 100%);
                -webkit-mask-image: radial-gradient(circle {lensSize / 2}px at {position.x}px {position.y}px, black 100%, transparent 100%);
                transform-origin: {position.x}px {position.y}px;
            "
        >
            <div
                class="absolute inset-0"
                style="transform: scale({zoomFactor}); transform-origin: {position.x}px {position.y}px;"
            >
                <slot />
            </div>
        </div>
    {:else if hovering}
        <div
            transition:scale={{ duration: 666 }}
            class="absolute inset-0 overflow-hidden pointer-events-none"
            style="
                mask-image: radial-gradient(circle {lensSize / 2}px at {mousePosition.x}px {mousePosition.y}px, black 100%, transparent 100%);
                -webkit-mask-image: radial-gradient(circle {lensSize / 2}px at {mousePosition.x}px {mousePosition.y}px, black 100%, transparent 100%);
                transform-origin: {mousePosition.x}px {mousePosition.y}px;
                z-index: 50;
            "
        >
            <div
                class="absolute inset-0"
                style="transform: scale({zoomFactor}); transform-origin: {mousePosition.x}px {mousePosition.y}px;"
            >
                <slot />
            </div>
        </div>
    {/if}
</div>