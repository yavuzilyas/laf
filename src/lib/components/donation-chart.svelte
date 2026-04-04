<script lang="ts">
	import { t, i18n } from '$lib/stores/i18n.svelte.js';
	import * as Chart from "$lib/components/ui/chart/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { MagicCard } from "$lib/components/magic/magic-card";
	import * as Select from "$lib/components/ui/select/index.js";
	import * as ToggleGroup from "$lib/components/ui/toggle-group/index.js";
	import { scaleUtc } from "d3-scale";
	import { Area, AreaChart } from "layerchart";
	import { curveMonotoneX } from "d3-shape";
	import { onMount } from "svelte";
	import { BarSpinner } from "$lib/components/spell/bar-spinner";

	let chartData = $state<{ date: Date; amount: number; count: number; scaled_count: number }[]>([]);
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
			return t('donations.chart.timeRanges.all');
		case "365d":
			return t('donations.chart.timeRanges.365d');
		case "180d":
			return t('donations.chart.timeRanges.180d');
		case "90d":
			return t('donations.chart.timeRanges.90d');
		case "30d":
			return t('donations.chart.timeRanges.30d');
		case "14d":
			return t('donations.chart.timeRanges.14d');
		default:
			return t('donations.chart.timeRanges.30d');
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
			groupBy = "month";
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
						count: parseInt(item.count) || 0, // Ensure count is a number, default to 0
						scaled_count: 0
					};
				});
				
				// Scale count lower than the max amount to make it visually pleasing
				const maxAmount = Math.max(...chartData.map(item => item.amount));
				const maxCount = Math.max(...chartData.map(item => item.count));
				const scaleFactor = (maxCount > 0 && maxAmount > 0) ? (maxAmount * 0.25) / maxCount : 1;
				
				chartData = chartData.map(item => ({
					...item,
					scaled_count: item.count * scaleFactor
				}));
				
				// Ensure we have continuous data by filling any gaps with zero values
				if (chartData.length > 0) {
					// Sort by date to ensure proper order
					chartData.sort((a, b) => a.date.getTime() - b.date.getTime());
				}
			}
		} catch (error) {
		} finally {
			isLoading = false;
		}
	}

	$effect(() => {
		fetchDonationStats();
	});

const chartConfig = $derived({
	amount: { label: t('donations.chart.amount'), color: "var(--primary)" },
	scaled_count: { label: t('donations.chart.count'), color: "var(--primary)" },
} satisfies Chart.ChartConfig);
</script>

<MagicCard class="@container/card rounded-xl p-3 sm:p-6 min-w-0">
	<div>
<Card.Header>
	<Card.Title>{t('donations.chart.title')}</Card.Title>
	<Card.Description>
		<span class="@[540px]/card:block hidden">{t('donations.chart.description')}</span>
		<span class="@[540px]/card:hidden">{selectedLabel}</span>
	</Card.Description>
	<Card.Action>
		<ToggleGroup.Root
			type="single"
			bind:value={timeRange}
			variant="outline"
			class="@[900px]/card:flex hidden *:data-[slot=toggle-group-item]:!px-3 *:data-[slot=toggle-group-item]:!py-1.5 text-xs"
		>
			<ToggleGroup.Item value="all">{t('donations.chart.timeRanges.allShort')}</ToggleGroup.Item>
			<ToggleGroup.Item value="365d">{t('donations.chart.timeRanges.365dShort')}</ToggleGroup.Item>
			<ToggleGroup.Item value="180d">{t('donations.chart.timeRanges.180dShort')}</ToggleGroup.Item>
			<ToggleGroup.Item value="90d">{t('donations.chart.timeRanges.90dShort')}</ToggleGroup.Item>
			<ToggleGroup.Item value="30d">{t('donations.chart.timeRanges.30dShort')}</ToggleGroup.Item>
			<ToggleGroup.Item value="14d">{t('donations.chart.timeRanges.14dShort')}</ToggleGroup.Item>
		</ToggleGroup.Root>
		<Select.Root type="single" bind:value={timeRange}>
			<Select.Trigger
				size="sm"
				class="**:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[900px]/card:hidden flex w-32 sm:w-40"
				aria-label="Zaman aralığı seç"
			>
				<span data-slot="select-value">
					{selectedLabel}
				</span>
			</Select.Trigger>
			<Select.Content class="rounded-xl">
				<Select.Item value="all" class="rounded-lg">{t('donations.chart.timeRanges.all')}</Select.Item>
				<Select.Item value="365d" class="rounded-lg">{t('donations.chart.timeRanges.365d')}</Select.Item>
				<Select.Item value="180d" class="rounded-lg">{t('donations.chart.timeRanges.180d')}</Select.Item>
				<Select.Item value="90d" class="rounded-lg">{t('donations.chart.timeRanges.90d')}</Select.Item>
				<Select.Item value="30d" class="rounded-lg">{t('donations.chart.timeRanges.30d')}</Select.Item>
				<Select.Item value="14d" class="rounded-lg">{t('donations.chart.timeRanges.14d')}</Select.Item>
			</Select.Content>
		</Select.Root>
	</Card.Action>
</Card.Header>
	<Card.Content class="px-2 pt-4 sm:px-6 sm:pt-6">
		{#if isLoading}
			<div class="flex items-center justify-center h-[200px] sm:h-[250px]">
            	<BarSpinner class="text-primary" size={28} />
		</div>
	{:else if chartData.length === 0}
		<div class="flex items-center justify-center h-[200px] sm:h-[250px] text-muted-foreground">
			{t('donations.chart.noData')}
		</div>
		{:else}
			<Chart.Container config={chartConfig} class="aspect-auto h-[200px] sm:h-[250px] m-auto w-full">
				<AreaChart
					legend
					data={chartData}
					x="date"
					xScale={scaleUtc()}
				series={[
					{
						key: "amount",
						label: t('donations.chart.amount'),
						color: "green",
					},
					{
						key: "scaled_count",
						label: t('donations.chart.count'),
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
							? (timeRange === "all" ? 5 : timeRange === "14d" ? 3 : timeRange === "30d" ? 4 : timeRange === "90d" ? 3 : timeRange === "180d" ? 3 : timeRange === "365d" ? 4 : 3)
							: (timeRange === "all" ? 10 : timeRange === "14d" ? 7 : timeRange === "30d" ? 10 : timeRange === "90d" ? 6 : timeRange === "180d" ? 6 : timeRange === "365d" ? 12 : 10),
						format: (v: Date) => {
							if (groupBy === "year") {
								return v.getFullYear().toString();
							} else if (groupBy === "month") {
								return v.toLocaleDateString(i18n.currentLocale || "tr-TR", { month: "short", year: "numeric" });
							} else if (groupBy === "week") {
								const startOfYear = new Date(v.getFullYear(), 0, 1);
								const weekNumber = Math.ceil(((v.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
								return `${v.getFullYear()}-W${weekNumber}`;
							}
							return v.toLocaleDateString(i18n.currentLocale || "tr-TR", {
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
							if (groupBy === "month") {
								return v.toLocaleDateString(i18n.currentLocale || "tr-TR", { month: "long", year: "numeric" });
							}
							return v.toLocaleDateString(i18n.currentLocale || "tr-TR", {
								day: "numeric",
								month: "long",
								year: "numeric"
							});
						}}
						indicator="line"
					>
						{#snippet formatter({ item, name })}
							<div class="flex items-center gap-2">
								<div class="size-2.5 shrink-0 rounded-[2px]" style="background-color: {item.color || 'var(--primary)'}"></div>
								<div class="flex flex-1 justify-between gap-4">
									<span class="text-muted-foreground">{name}</span>
									<span class="font-mono font-medium">
										{#if name === t('donations.chart.amount')}
											{Number(item.payload?.amount || 0).toFixed(4)} XMR
										{:else}
											{item.payload?.count || 0} {t('donations.chart.pieces')}
										{/if}
									</span>
								</div>
							</div>
						{/snippet}
					</Chart.Tooltip>
				{/snippet}
				</AreaChart>
			</Chart.Container>
		{/if}
	</Card.Content>
	</div>
</MagicCard>
