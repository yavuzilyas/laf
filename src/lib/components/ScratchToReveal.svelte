<script lang="ts">
    import { onMount } from "svelte";
    import { tweened } from "svelte/motion";
    import { cubicOut } from "svelte/easing";
    import { cn } from "$lib/utils";
    import { Motion, useAnimation } from "svelte-motion";
  
    export let width: number;
    export let height: number;
    export let minScratchPercentage: number = 85;
    export let onComplete: (() => void) | undefined;
    let _class: string | undefined;
    export { _class as class };
    export let gradientColors: [string, string, string] = [
      "#A97CF8",
      "#F38CB8",
      "#FDCC92",
    ];
  
    let isScratching = false;
    let isComplete = false;
    let canvas: HTMLCanvasElement | null;
    let ctx: CanvasRenderingContext2D | null;
    let container: HTMLDivElement | null;
  
    let controls = useAnimation();
  
    function drawGradient() {
      if (!canvas) return;
      ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, gradientColors[0]);
      gradient.addColorStop(0.5, gradientColors[1]);
      gradient.addColorStop(1, gradientColors[2]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function resizeCanvas() {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        drawGradient();
      }
    }

    onMount(() => {
      // Ensure initial sizing matches slot content
      resizeCanvas();
      const ro = new ResizeObserver(() => {
        resizeCanvas();
      });
      if (container) ro.observe(container);

      if (canvas) {
        ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ccc";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const gradient = ctx.createLinearGradient(
            0,
            0,
            canvas.width,
            canvas.height
          );
          gradient.addColorStop(0, gradientColors[0]);
          gradient.addColorStop(0.5, gradientColors[1]);
          gradient.addColorStop(1, gradientColors[2]);
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }

      const handleMouseMove = (event: MouseEvent) => {
        if (!isScratching) return;
        scratch(event.clientX, event.clientY);
      };

      const handleTouchMove = (event: TouchEvent) => {
        if (!isScratching) return;
        event.preventDefault(); // Scroll'u engelle
        const touch = event.touches[0];
        scratch(touch.clientX, touch.clientY);
      };

      const stopScratching = () => {
        isScratching = false;
        checkCompletion();
      };

      document.addEventListener("mousemove", handleMouseMove);
      // Touch event'leri için passive: false kullanarak preventDefault'i etkin hale getir
      document.addEventListener("touchmove", handleTouchMove, { passive: false });
      document.addEventListener("mouseup", stopScratching);
      document.addEventListener("touchend", stopScratching);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("mouseup", stopScratching);
        document.removeEventListener("touchend", stopScratching);
        if (container) ro.disconnect();
      };
    });

    function handleMouseDown() {
      isScratching = true;
    }

    function handleTouchStart(event: TouchEvent) {
      event.preventDefault(); // Scroll'u engelle
      isScratching = true;
    }
  
    function scratch(clientX: number, clientY: number) {
      if (canvas && ctx) {
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left + 15;
        const y = clientY - rect.top + 15;
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  
    async function startAnimation() {
      // Önce 0.5 saniyede 1.5 boyutuna büyüsün
      await controls.start({
        scale: 1.12,
        transition: { duration: 0.66 }
      });
      
      // Sonra 1.4-1.45 arasında sonsuz döngüde titresin
      await controls.start({
        scale: [1.12, 1.10, 1.12],
        transition: {
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }
      });
    }
  
    function checkCompletion() {
      if (isComplete) return;

      if (canvas && ctx) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        const totalPixels = pixels.length / 4;
        let clearPixels = 0;
  
        for (let i = 3; i < pixels.length; i += 4) {
          if (pixels[i] === 0) clearPixels++;
        }
  
        const percentage = (clearPixels / totalPixels) * 100;
  
        if (percentage >= minScratchPercentage) {
          isComplete = true;
          // Fire completion immediately to allow UI to proceed
          if (onComplete) onComplete();
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // Then run the animation feedback
          startAnimation();
        }
      }
    }
</script>
  
<!-- svelte-ignore a11y-no-static-element-interactions -->
<Motion let:motion animate={controls}>
  <div
    use:motion
    bind:this={container}
    class={cn("scratch-container", _class)}
    style="width: fit-content; height: fit-content; cursor:
     url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj4KICA8Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNSIgc3R5bGU9ImZpbGw6I2ZmZjtzdHJva2U6IzAwMDtzdHJva2Utd2lkdGg6MXB4OyIgLz4KPC9zdmc+'), auto; z-index: 90; touch-action: none;"
  >
    <canvas
      bind:this={canvas}
      {width}
      {height}
      class="z-20"
      on:mousedown={handleMouseDown}
      on:touchstart={handleTouchStart}
      style="touch-action: none;"
    ></canvas>
    <div style="position: relative; width: 100%; height: 100%;">
      <slot />
    </div>
  </div>
</Motion>
  
<style>
  .scratch-container {
    position: relative;
    user-select: none;
    animation: shimmer 2s infinite;
    /* Mobilde pinch-zoom ve scroll'u engelle */
    touch-action: none;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }

  canvas {
    position: absolute;
    top: 0;
    left: 0;
    /* Canvas üzerinde tüm touch hareketlerini engelle */
    touch-action: none;
  }
</style>