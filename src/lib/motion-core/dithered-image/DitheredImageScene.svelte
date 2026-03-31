<script lang="ts">
	import { T, useThrelte } from "@threlte/core";
	import { useTexture } from "@threlte/extras";
	import * as THREE from "three";

	interface Props {
		image: string;
		ditherMap?: "bayer4x4" | "bayer8x8" | "halftone" | "voidAndCluster";
		pixelSize?: number;
		color?: string;
		backgroundColor?: string;
		threshold?: number;
	}

	let {
		image,
		ditherMap = "bayer4x4",
		pixelSize = 1,
		color = "#ff6900",
		backgroundColor = "#111113",
		threshold = 0.0,
	}: Props = $props();

	const { size, dpr } = useThrelte();

	// ─── Threshold map verileri modül scope'unda sabit — her render'da yeniden oluşturulmuyor ───
	const THRESHOLD_MAPS: Record<string, number[]> = {
		bayer4x4: [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5],
		bayer8x8: [
			0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4,
			36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33,
			9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63,
			31, 55, 23, 61, 29, 53, 21,
		],
		halftone: [
			24, 10, 12, 26, 35, 47, 49, 37, 8, 0, 2, 14, 45, 59, 61, 51, 22, 6, 4, 16,
			43, 57, 63, 53, 30, 20, 18, 28, 33, 41, 55, 39, 34, 46, 48, 36, 25, 11,
			13, 27, 44, 58, 60, 50, 9, 1, 3, 15, 42, 56, 62, 52, 23, 7, 5, 17, 32, 40,
			54, 38, 31, 21, 19, 29,
		],
		voidAndCluster: [
			131, 187, 8, 78, 50, 18, 134, 89, 155, 102, 29, 95, 184, 73, 22, 86, 113,
			171, 142, 105, 34, 166, 9, 60, 151, 128, 40, 110, 168, 137, 45, 28, 64,
			188, 82, 54, 124, 189, 80, 13, 156, 56, 7, 61, 186, 121, 154, 6, 108, 177,
			24, 100, 38, 176, 93, 123, 83, 148, 96, 17, 88, 133, 44, 145, 69, 161,
			139, 72, 30, 181, 115, 27, 163, 47, 178, 65, 164, 14, 120, 48, 5, 127,
			153, 52, 190, 58, 126, 81, 116, 21, 106, 77, 173, 92, 191, 63, 99, 12, 76,
			144, 4, 185, 37, 149, 192, 39, 135, 23, 117, 31, 170, 132, 35, 172, 103,
			66, 129, 79, 3, 97, 57, 159, 70, 141, 53, 94, 114, 20, 49, 158, 19, 146,
			169, 122, 183, 11, 104, 180, 2, 165, 152, 87, 182, 118, 91, 42, 67, 25,
			84, 147, 43, 85, 125, 68, 16, 136, 71, 10, 193, 112, 160, 138, 51, 111,
			162, 26, 194, 46, 174, 107, 41, 143, 33, 74, 1, 101, 195, 15, 75, 140,
			109, 90, 32, 62, 157, 98, 167, 119, 179, 59, 36, 130, 175, 55, 0, 150,
		],
	};

	// ─── GPU texture cache — aynı ditherMap için DataTexture bir kez oluşturulur ───
	const textureCache = new Map<string, { tex: THREE.DataTexture; mapSize: THREE.Vector2 }>();

	const getThresholdTexture = (key: string) => {
		if (textureCache.has(key)) return textureCache.get(key)!;

		const data = THRESHOLD_MAPS[key] ?? THRESHOLD_MAPS["bayer4x4"];
		const side = Math.sqrt(data.length);
		const count = data.length;
		const floatData = new Float32Array(count);
		for (let i = 0; i < count; i++) floatData[i] = data[i] / count;

		const tex = new THREE.DataTexture(floatData, side, side, THREE.RedFormat, THREE.FloatType);
		tex.minFilter = THREE.NearestFilter;
		tex.magFilter = THREE.NearestFilter;
		tex.wrapS = THREE.RepeatWrapping;
		tex.wrapT = THREE.RepeatWrapping;
		tex.needsUpdate = true;

		const entry = { tex, mapSize: new THREE.Vector2(side, side) };
		textureCache.set(key, entry);
		return entry;
	};

	// ─── Shader stringleri modül scope'unda sabit — her bileşen örneği için yeniden oluşturulmuyor ───
	const vertexShader = /* glsl */ `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = vec4(position, 1.0);
		}
	`;

	const fragmentShader = /* glsl */ `
		uniform sampler2D uTexture;
		uniform sampler2D uThresholdMap;
		uniform vec2 uResolution;
		uniform vec2 uMapSize;
		uniform vec2 uCoverScale;
		uniform vec2 uCoverOffset;
		uniform float uPixelSize;
		uniform float uThreshold;
		uniform vec3 uColor;
		uniform vec3 uBackgroundColor;

		varying vec2 vUv;

		void main() {
			vec2 pixelCoord = floor(gl_FragCoord.xy / uPixelSize);

			vec2 centerPixel = pixelCoord * uPixelSize + (uPixelSize * 0.5);
			vec2 centerUv = centerPixel / uResolution;

			vec2 coverScale = max(uCoverScale, vec2(0.00001));
			vec2 imageUv = coverScale * centerUv + uCoverOffset;

			vec4 texColor = texture2D(uTexture, imageUv);

			// Luminance: BT.601 katsayıları
			float lum = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));

			vec2 mapUv = mod(pixelCoord, uMapSize) / uMapSize + (0.5 / uMapSize);
			float thresholdValue = texture2D(uThresholdMap, mapUv).r;

			float dither = step(thresholdValue + uThreshold, lum);
			gl_FragColor = vec4(mix(uBackgroundColor, uColor, dither), 1.0);
			#include <colorspace_fragment>
		}
	`;

	// ─── Uniform nesneleri bileşen ömrünce sabit referans — her frame yeni obje yok ───
	const resolutionUniform = new THREE.Vector2(1, 1);
	const coverScaleUniform = new THREE.Vector2(1, 1);
	const coverOffsetUniform = new THREE.Vector2(0, 0);
	const colorUniform = new THREE.Color();
	const backgroundColorUniform = new THREE.Color();

	// uniforms objesi bir kez oluşturulur, değerler .set() ile güncellenir
	const uniforms = {
		uTexture:        { value: null as THREE.Texture | null },
		uThresholdMap:   { value: null as THREE.DataTexture | null },
		uResolution:     { value: resolutionUniform },
		uMapSize:        { value: new THREE.Vector2(4, 4) },
		uCoverScale:     { value: coverScaleUniform },
		uCoverOffset:    { value: coverOffsetUniform },
		uPixelSize:      { value: pixelSize },
		uThreshold:      { value: threshold },
		uColor:          { value: colorUniform },
		uBackgroundColor:{ value: backgroundColorUniform },
	};

	// ─── Resim boyutları ───
	let imageWidth = 1;
	let imageHeight = 1;

	const updateCoverUniforms = () => {
		const screenAspect = $size.width / $size.height;
		const imageAspect = imageWidth / imageHeight;
		let scaleX = 1, scaleY = 1, offsetX = 0, offsetY = 0;

		if (screenAspect > imageAspect) {
			scaleY = imageAspect / screenAspect;
			offsetY = (1 - scaleY) * 0.5;
		} else {
			scaleX = screenAspect / imageAspect;
			offsetX = (1 - scaleX) * 0.5;
		}
		coverScaleUniform.set(scaleX, scaleY);
		coverOffsetUniform.set(offsetX, offsetY);
	};

	// ─── Texture yükleme ───
	const tex = $derived(
		useTexture(image, {
			transform: (t) => {
				t.colorSpace = THREE.SRGBColorSpace;
				// Mipmaps dithering için gereksiz — kapatmak bellek + GPU yükü azaltır
				t.generateMipmaps = false;
				t.minFilter = THREE.LinearFilter;
				return t;
			},
		}),
	);

	$effect(() => {
		const t = $tex;
		if (!t?.image) return;
		imageWidth = t.image.width;
		imageHeight = t.image.height;
		uniforms.uTexture.value = t;
		updateCoverUniforms();
	});

	// ─── ditherMap değişince cache'den al, obje yeniden oluşturma ───
	$effect(() => {
		const { tex: dtex, mapSize } = getThresholdTexture(ditherMap);
		uniforms.uThresholdMap.value = dtex;
		uniforms.uMapSize.value.copy(mapSize);
	});

	// ─── Ekran boyutu değişince resolution güncelle ───
	$effect(() => {
		resolutionUniform.set($size.width * $dpr, $size.height * $dpr);
		updateCoverUniforms();
	});

	// ─── Renk prop'ları değişince sadece .set() — yeni Color nesnesi yok ───
	$effect(() => { colorUniform.set(color); });
	$effect(() => { backgroundColorUniform.set(backgroundColor); });

	// ─── pixelSize / threshold scalar güncellemeleri ───
	$effect(() => { uniforms.uPixelSize.value = pixelSize; });
	$effect(() => { uniforms.uThreshold.value = threshold; });

	// ─── Threlte render modunu on-demand'a al — sabit animasyon döngüsü yok ───
	const { invalidate } = useThrelte();
	$effect(() => {
		// Herhangi bir uniform değişince bir frame render et
		void $tex;
		void color;
		void backgroundColor;
		void $size;
		invalidate();
	});

	const ready = $derived(!!$tex && !!uniforms.uThresholdMap.value);
</script>

{#if ready}
	<T.Mesh>
		<T.PlaneGeometry args={[2, 2]} />
		<T.ShaderMaterial
			{vertexShader}
			{fragmentShader}
			{uniforms}
		/>
	</T.Mesh>
{/if}