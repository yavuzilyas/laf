<script lang="ts">
	import * as Chart from "$lib/components/ui/chart/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { MagicCard } from "$lib/components/magic/magic-card";
	import * as Select from "$lib/components/ui/select/index.js";
	import * as ToggleGroup from "$lib/components/ui/toggle-group/index.js";
	import { scaleUtc } from "d3-scale";
	import { Area, AreaChart } from "layerchart";
	import { curveMonotoneX } from "d3-shape";
	import { onMount } from "svelte";
	  import Loader from "@lucide/svelte/icons/loader";

	let chartData = $state<{ date: string; amount: number; count: number }[]>([]);
	let timeRange = $state("30d");
	let groupBy = $state("day");
	let isLoading = $state(true);
	let isMobile = $state(false);

	// Responsive detection
	function checkMobile() {
		isMobile = window.innerWidth < 768;
	}

	onMount(() => {
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	});

	const selectedLabel = $derived.by(() => {
		switch (timeRange) {
			case "all":
				return "Tüm Zamanlar";
			case "365d":
				return "Son 1 Yıl";
			case "180d":
				return "Son 6 Ay";
			case "90d":
				return "Son 3 Ay";
			case "30d":
				return "Son 1 Ay";
			case "14d":
				return "Son 2 Hafta";
			default:
				return "Son 1 Ay";
		}
	});

	async function fetchDonationStats() {
		isLoading = true;
		try {
			const now = new Date();
			let fromDate: Date | null = null;
			
			switch (timeRange) {
				case "all":
					fromDate = null; // No from date - get all data
					groupBy = "year";
					break;
				case "365d":
					fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
					groupBy = "month";
					break;
				case "180d":
					fromDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
					groupBy = "month";
					break;
				case "90d":
					fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
					groupBy = "month";
					break;
				case "30d":
					fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
					groupBy = "day";
					break;
				case "14d":
					fromDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
					groupBy = "day";
					break;
				default:
					fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
					groupBy = "day";
			}

			let url = `/api/donations/stats?groupBy=${groupBy}`;
			if (fromDate) {
				url += `&from_date=${fromDate.toISOString()}`;
			}
			url += `&to_date=${now.toISOString()}`;

			const response = await fetch(url);
			
			if (response.ok) {
				const data = await response.json();
				// Convert date strings to Date objects for proper chart rendering
				chartData = (data.stats || []).map((item: any) => {
					let date: Date;
					if (groupBy === "week" && item.date.includes("W")) {
						// Parse week format: 2026-W12
						const [year, week] = item.date.split("-W");
						const weekNum = parseInt(week);
						date = new Date(parseInt(year), 0, 1 + (weekNum - 1) * 7);
					} else {
						date = new Date(item.date);
					}
					return {
						date,
						amount: parseFloat(item.amount) || 0, // Ensure amount is a number, default to 0
						count: parseInt(item.count) || 0 // Ensure count is a number, default to 0
					};
				});
				
				// Ensure we have continuous data by filling any gaps with zero values
				if (chartData.length > 0) {
					// Sort by date to ensure proper order
					chartData.sort((a, b) => a.date.getTime() - b.date.getTime());
				}
			}
		} catch (error) {
			console.error('Failed to fetch donation stats:', error);
		} finally {
			isLoading = false;
		}
	}

	$effect(() => {
		fetchDonationStats();
	});

	const chartConfig = {
		amount: { label: "Bağış (XMR)", color: "var(--primary)" },
		count: { label: "Bağış Sayısı", color: "var(--primary)" },
	} satisfies Chart.ChartConfig;
</script>

<MagicCard class="@container/card rounded-xl p-6">
	<div>
	<Card.Header>
		<Card.Title>Bağış Grafiği</Card.Title>
		<Card.Description>
			<span class="@[540px]/card:block hidden">Bağış istatistikleri</span>
			<span class="@[540px]/card:hidden">{selectedLabel}</span>
		</Card.Description>
		<Card.Action>
			<ToggleGroup.Root
				type="single"
				bind:value={timeRange}
				variant="outline"
				class="@[900px]/card:flex hidden *:data-[slot=toggle-group-item]:!px-3 *:data-[slot=toggle-group-item]:!py-1.5 text-xs"
			>
				<ToggleGroup.Item value="all">Tümü</ToggleGroup.Item>
				<ToggleGroup.Item value="365d">1 Yıl</ToggleGroup.Item>
				<ToggleGroup.Item value="180d">6 Ay</ToggleGroup.Item>
				<ToggleGroup.Item value="90d">3 Ay</ToggleGroup.Item>
				<ToggleGroup.Item value="30d">1 Ay</ToggleGroup.Item>
				<ToggleGroup.Item value="14d">2 Hafta</ToggleGroup.Item>
			</ToggleGroup.Root>
			<Select.Root type="single" bind:value={timeRange}>
				<Select.Trigger
					size="sm"
					class="**:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[900px]/card:hidden flex w-40"
					aria-label="Zaman aralığı seç"
				>
					<span data-slot="select-value">
						{selectedLabel}
					</span>
				</Select.Trigger>
				<Select.Content class="rounded-xl">
					<Select.Item value="all" class="rounded-lg">Tüm Zamanlar</Select.Item>
					<Select.Item value="365d" class="rounded-lg">Son 1 Yıl</Select.Item>
					<Select.Item value="180d" class="rounded-lg">Son 6 Ay</Select.Item>
					<Select.Item value="90d" class="rounded-lg">Son 3 Ay</Select.Item>
					<Select.Item value="30d" class="rounded-lg">Son 1 Ay</Select.Item>
					<Select.Item value="14d" class="rounded-lg">Son 2 Hafta</Select.Item>
				</Select.Content>
			</Select.Root>
		</Card.Action>
	</Card.Header>
	<Card.Content class="px-2 pt-4 sm:px-6 sm:pt-6">
		{#if isLoading}
			<div class="flex items-center justify-center h-[250px]">
            <Loader class="animate-spin text-primary" />			</div>
		{:else if chartData.length === 0}
			<div class="flex items-center justify-center h-[250px] text-muted-foreground">
				Henüz bağış verisi bulunmuyor
			</div>
		{:else}
			<Chart.Container config={chartConfig} class="aspect-auto h-[250px] m-auto w-11/12">
				<AreaChart
					legend
					data={chartData}
					x="date"
					xScale={scaleUtc()}
					series={[
						{
							key: "amount",
							label: "Bağış (XMR)",
							color: "green",
						},
						{
							key: "count",
							label: "Bağış Sayısı",
							color: "var(--primary)",
						},
					]}
					seriesLayout="overlay"
					props={{
						area: {
							curve: curveMonotoneX,
							"fill-opacity": 0.2,
							line: { class: "stroke-2", "stroke-opacity": 0.8 },
							motion: "tween",
						},
						xAxis: {
							ticks: isMobile 
								? (timeRange === "14d" ? 3 : timeRange === "30d" ? 4 : timeRange === "90d" ? 3 : timeRange === "180d" ? 3 : timeRange === "365d" ? 4 : 3)
								: (timeRange === "14d" ? 7 : timeRange === "30d" ? 10 : timeRange === "90d" ? 6 : timeRange === "180d" ? 6 : timeRange === "365d" ? 12 : 10),
							format: (v: Date) => {
								if (groupBy === "year") {
									return v.getFullYear().toString();
								} else if (groupBy === "week") {
									// Get week number
									const startOfYear = new Date(v.getFullYear(), 0, 1);
								 const weekNumber = Math.ceil(((v.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
									return `${v.getFullYear()}-W${weekNumber}`;
								}
								return v.toLocaleDateString("tr-TR", {
									day: "numeric",
									month: "short"
								});
							},
						},
						yAxis: { 
							format: (v: number) => `${v.toFixed(2)} XMR`,
							ticks: 5,
							domain: [0, 'auto'] // Ensure Y-axis starts from 0
						},
					}}
				>
					{#snippet marks({ series, getAreaProps })}
						<defs>
							<linearGradient id="fillAmount" x1="0" y1="0" x2="0" y2="1">
								<stop
									offset="5%"
									stop-color="green"
									stop-opacity={1.0}
								/>
								<stop
									offset="95%"
									stop-color="green"
									stop-opacity={0.1}
								/>
							</linearGradient>
							<linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
								<stop
									offset="5%"
									stop-color="var(--color-count)"
									stop-opacity={1.0}
								/>
								<stop
									offset="95%"
									stop-color="var(--color-count)"
									stop-opacity={0.1}
								/>
							</linearGradient>
						</defs>
						{#each series as s, i (s.key)}
							<Area
								{...getAreaProps(s, i)}
								fill={s.key === "amount" ? "url(#fillAmount)" : "url(#fillCount)"}
							/>
						{/each}
					{/snippet}
					{#snippet tooltip()}
						<Chart.Tooltip
							labelFormatter={(v: Date) => {
								return v.toLocaleDateString("tr-TR", {
									day: "numeric",
									month: "long",
									year: "numeric"
								});
							}}
							valueFormatter={(value: number, name: string) => {
								if (name === "Bağış (XMR)") {
									return `${value.toFixed(4)} XMR`;
								} else if (name === "Bağış Sayısı") {
									return `${value} adet`;
								}
								return value.toString();
							}}
							indicator="line"
						/>
					{/snippet}
				</AreaChart>
			</Chart.Container>
		{/if}
	</Card.Content>
	</div>
</MagicCard>
