<script lang="ts">
	import { onMount } from "svelte";
	import type { Component } from "svelte";

	interface Icon {
		x: number;
		y: number;
		z: number;
		scale: number;
		opacity: number;
		id: number;
	}

	interface IconCloudProps {
		icons?: Component[];
		images?: string[];
		class?: string;
	}

	let { icons, images, class: className = "" }: IconCloudProps = $props();

	let isMobile = $state(false);

	function checkMobile() {
		isMobile = window.innerWidth < 768;
	}

	onMount(() => {
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	});

	let canvasRef: HTMLCanvasElement | null = $state(null);
	let iconPositions = $state<Icon[]>([]);
	let isDragging = $state(false);
	let lastMousePos = $state({ x: 0, y: 0 });
	let mousePos = $state({ x: 0, y: 0 });
	let targetRotation = $state<{
		x: number;
		y: number;
		startX: number;
		startY: number;
		distance: number;
		startTime: number;
		duration: number;
	} | null>(null);

	let animationFrameId = 0;
	let rotationRef = { x: 0, y: 0 };
	let iconCanvases: HTMLCanvasElement[] = [];
	let imagesLoaded: boolean[] = [];

	function easeOutCubic(t: number): number {
		return 1 - Math.pow(1 - t, 3);
	}

	// Create icon canvases
	$effect(() => {
		if (!icons && !images) return;

		const items = icons || images || [];
		imagesLoaded = new Array(items.length).fill(false);

		const newIconCanvases = items.map((_item, index) => {
			const offscreen = document.createElement("canvas");
			offscreen.width = 40;
			offscreen.height = 40;
			const offCtx = offscreen.getContext("2d");

			if (offCtx) {
				if (images) {
					const img = new Image();
					img.crossOrigin = "anonymous";
					img.src = items[index] as string;
					img.onload = () => {
						offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
						offCtx.beginPath();
						offCtx.arc(20, 20, 20, 0, Math.PI * 2);
						offCtx.closePath();
						offCtx.clip();
						offCtx.drawImage(img, 0, 0, 40, 40);
						imagesLoaded[index] = true;
					};
				}
			}
			return offscreen;
		});

		iconCanvases = newIconCanvases;
	});

	// Generate initial icon positions on a sphere
	$effect(() => {
		const items = icons || images || [];
		const newIcons: Icon[] = [];
		const numIcons = items.length || 20;

		const offset = 2 / numIcons;
		const increment = Math.PI * (3 - Math.sqrt(5));

		for (let i = 0; i < numIcons; i++) {
			const y = i * offset - 1 + offset / 2;
			const r = Math.sqrt(1 - y * y);
			const phi = i * increment;

			const x = Math.cos(phi) * r;
			const z = Math.sin(phi) * r;

			newIcons.push({
				x: x * 100,
				y: y * 100,
				z: z * 100,
				scale: 1,
				opacity: 1,
				id: i,
			});
		}
		iconPositions = newIcons;
	});

	function handleMouseDown(e: MouseEvent) {
		const rect = canvasRef?.getBoundingClientRect();
		if (!rect || !canvasRef) return;

		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		const ctx = canvasRef.getContext("2d");
		if (!ctx) return;

		for (const icon of iconPositions) {
			const cosX = Math.cos(rotationRef.x);
			const sinX = Math.sin(rotationRef.x);
			const cosY = Math.cos(rotationRef.y);
			const sinY = Math.sin(rotationRef.y);

			const rotatedX = icon.x * cosY - icon.z * sinY;
			const rotatedZ = icon.x * sinY + icon.z * cosY;
			const rotatedY = icon.y * cosX + rotatedZ * sinX;

			const screenX = canvasRef.width / 2 + rotatedX;
			const screenY = canvasRef.height / 2 + rotatedY;

			const scale = (rotatedZ + 200) / 300;
			const radius = 20 * scale;
			const dx = x - screenX;
			const dy = y - screenY;

			if (dx * dx + dy * dy < radius * radius) {
				const targetX = -Math.atan2(icon.y, Math.sqrt(icon.x * icon.x + icon.z * icon.z));
				const targetY = Math.atan2(icon.x, icon.z);

				const currentX = rotationRef.x;
				const currentY = rotationRef.y;
				const distance = Math.sqrt(
					Math.pow(targetX - currentX, 2) + Math.pow(targetY - currentY, 2)
				);

				const duration = Math.min(2000, Math.max(800, distance * 1000));

				targetRotation = {
					x: targetX,
					y: targetY,
					startX: currentX,
					startY: currentY,
					distance,
					startTime: performance.now(),
					duration,
				};
				return;
			}
		}

		isDragging = true;
		lastMousePos = { x: e.clientX, y: e.clientY };
	}

	function handleMouseMove(e: MouseEvent) {
		const rect = canvasRef?.getBoundingClientRect();
		if (rect) {
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;
			mousePos = { x, y };
		}

		if (isDragging) {
			const deltaX = e.clientX - lastMousePos.x;
			const deltaY = e.clientY - lastMousePos.y;

			rotationRef = {
				x: rotationRef.x + deltaY * 0.002,
				y: rotationRef.y + deltaX * 0.002,
			};

			lastMousePos = { x: e.clientX, y: e.clientY };
		}
	}

	function handleMouseUp() {
		isDragging = false;
	}

	// Animation and rendering
	onMount(() => {
		const canvas = canvasRef;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;

		const animate = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			const centerX = canvas.width / 2;
			const centerY = canvas.height / 2;
			const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
			const dx = mousePos.x - centerX;
			const dy = mousePos.y - centerY;
			const distance = Math.sqrt(dx * dx + dy * dy);
			const speed = 0.003 + (distance / maxDistance) * 0.01;

			if (targetRotation) {
				const elapsed = performance.now() - targetRotation.startTime;
				const progress = Math.min(1, elapsed / targetRotation.duration);
				const easedProgress = easeOutCubic(progress);

				rotationRef = {
					x:
						targetRotation.startX +
						(targetRotation.x - targetRotation.startX) * easedProgress,
					y:
						targetRotation.startY +
						(targetRotation.y - targetRotation.startY) * easedProgress,
				};

				if (progress >= 1) {
					targetRotation = null;
				}
			} else if (!isDragging) {
				rotationRef = {
					x: rotationRef.x + (dy / canvas.height) * speed,
					y: rotationRef.y + (dx / canvas.width) * speed,
				};
			}

			iconPositions.forEach((icon, index) => {
				const cosX = Math.cos(rotationRef.x);
				const sinX = Math.sin(rotationRef.x);
				const cosY = Math.cos(rotationRef.y);
				const sinY = Math.sin(rotationRef.y);

				const rotatedX = icon.x * cosY - icon.z * sinY;
				const rotatedZ = icon.x * sinY + icon.z * cosY;
				const rotatedY = icon.y * cosX + rotatedZ * sinX;

				const scale = (rotatedZ + 200) / 300;
				const opacity = Math.max(0.2, Math.min(1, (rotatedZ + 150) / 200));

				ctx.save();
				ctx.translate(canvas.width / 2 + rotatedX, canvas.height / 2 + rotatedY);
				ctx.scale(scale, scale);
				ctx.globalAlpha = opacity;

				if (icons || images) {
					if (iconCanvases[index] && imagesLoaded[index]) {
						ctx.drawImage(iconCanvases[index], -20, -20, 40, 40);
					}
				} else {
					ctx.beginPath();
					ctx.arc(0, 0, 20, 0, Math.PI * 2);
					ctx.fillStyle = "#4444ff";
					ctx.fill();
					ctx.fillStyle = "white";
					ctx.textAlign = "center";
					ctx.textBaseline = "middle";
					ctx.font = "16px Arial";
					ctx.fillText(`${icon.id + 1}`, 0, 0);
				}

				ctx.restore();
			});

			animationFrameId = requestAnimationFrame(animate);
		};

		animate();

		return () => {
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}
		};
	});
</script>

<canvas
	bind:this={canvasRef}
	width={isMobile ? 300 : 400}
	height={isMobile ? 300 : 400}
	onmousedown={handleMouseDown}
	onmousemove={handleMouseMove}
	onmouseup={handleMouseUp}
	onmouseleave={handleMouseUp}
	class={`rounded-lg max-w-full h-auto ${className}`}
	aria-label="Interactive 3D Icon Cloud"
></canvas>
