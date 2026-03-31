<script lang="ts">
	import { Canvas } from "@threlte/core";
	import Scene from "./DitheredImageScene.svelte";
	import { cn } from "../utils/cn";
	import { NoToneMapping } from "three";
	import type { ComponentProps } from "svelte";

	type SceneProps = ComponentProps<typeof Scene>;

	interface Props {
		src: SceneProps["image"];
		class?: string;
		ditherMap?: SceneProps["ditherMap"];
		pixelSize?: SceneProps["pixelSize"];
		color?: SceneProps["color"];
		backgroundColor?: SceneProps["backgroundColor"];
		threshold?: SceneProps["threshold"];
		[key: string]: unknown;
	}

	let {
		src,
		class: className = "",
		ditherMap = "bayer4x4",
		pixelSize = 1,
		color = "#ff6900",
		backgroundColor = "#111113",
		threshold = 0.0,
		...rest
	}: Props = $props();

	// dpr'yi reaktif state yerine sabit olarak oku —
	// resize sırasında yeniden hesaplanması gerekmez, Canvas kendi içinde halleder
	const dpr = Math.min(
		typeof window !== "undefined" ? window.devicePixelRatio : 1,
		// Mobilde 3x dpr tam çözünürlükte GPU'yu boğar; 2 ile sınırla
		2,
	);
</script>

<div class={cn("relative h-full w-full overflow-hidden", className)} {...rest}>
	<div class="absolute inset-0 z-0">
		<Canvas
			{dpr}
			toneMapping={NoToneMapping}
			renderMode="on-demand"
		>
			<Scene
				image={src}
				{ditherMap}
				{pixelSize}
				{color}
				{backgroundColor}
				{threshold}
			/>
		</Canvas>
	</div>
</div>