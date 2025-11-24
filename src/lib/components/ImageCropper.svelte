<script lang="ts">
    import { onMount, onDestroy, onMount as svelteOnMount } from 'svelte';
    import type { Cropper } from 'cropperjs';
    import 'cropperjs/dist/cropper.min.css';
    
    // Make this component client-side only
    import { browser } from '$app/environment';
    
    export let src: string;
    export let aspectRatio: number = 1; // Default to square
    export let onCrop: (blob: Blob) => void;
    export let onCancel: () => void;
    export let isLoading: boolean = false;
    
    let imageElement: HTMLImageElement;
    let cropper: Cropper | null = null;
    
    // Only run on client
    onMount(() => {
        if (!browser) return;
        
        // Dynamically import cropperjs to avoid SSR issues
        import('cropperjs').then(module => {
            const Cropper = module.default;
            
            cropper = new Cropper(imageElement, {
                aspectRatio,
                viewMode: 1,
                autoCropArea: 0.8,
                responsive: true,
                guides: false,
                background: false,
            });
        });
        
        return () => {
            if (cropper) {
                cropper.destroy();
                cropper = null;
            }
        };
    });
    
    function handleCrop() {
        if (!cropper) return;
        
        const canvas = cropper.getCroppedCanvas({
            width: 512,
            height: 512,
            minWidth: 256,
            minHeight: 256,
            maxWidth: 4096,
            maxHeight: 4096,
            fillColor: '#fff',
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high' as ImageSmoothingQuality,
        });
        
        if (!canvas) return;
        
        canvas.toBlob((blob) => {
            if (blob && onCrop) {
                onCrop(blob);
            }
        }, 'image/jpeg', 0.9);
    }
    
    // Only render the component on the client side
    $: if (browser && !src) {
        onCancel?.();
    }
</script>

{#if browser}
    <div class="relative w-full max-w-2xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
        <div class="p-4">
            <div class="relative w-full h-96 bg-gray-100 rounded-md overflow-hidden">
                <img 
                    bind:this={imageElement} 
                    {src} 
                    alt="Crop preview" 
                    class="block max-w-full h-auto"
                />
            </div>
            
            <div class="mt-4 flex justify-end space-x-2">
                <button
                    on:click={onCancel}
                    type="button"
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    disabled={isLoading}
                >
                    İptal
                </button>
                <button
                    on:click={handleCrop}
                    type="button"
                    class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    disabled={isLoading}
                >
                    {isLoading ? 'İşleniyor...' : 'Kırp ve Kaydet'}
                </button>
            </div>
        </div>
    </div>
{/if}
