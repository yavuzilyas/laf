<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import type { Badge as BadgeType } from '$lib/types/badges';

	let {
		badges,
		size = 'sm',
		maxVisible = 3,
		showTooltip = true
	}: {
		badges: BadgeType[];
		size?: 'xs' | 'sm' | 'md' | 'lg';
		maxVisible?: number;
		showTooltip?: boolean;
	} = $props();

	const visibleBadges = $derived(badges.slice(0, maxVisible));
	const hiddenCount = $derived(badges.length > maxVisible ? badges.length - maxVisible : 0);
</script>

<div class="flex flex-wrap items-center gap-1">
	<Tooltip.Provider>
		{#each visibleBadges as badge (badge.id)}
			{#if showTooltip && badge.description}
				<Tooltip.Root>
					<Tooltip.Trigger asChild>
						<Badge
							variant={badge.type}
							class={`${size === 'xs' ? 'text-xs px-1.5 py-0.5' : size === 'sm' ? 'text-sm px-2 py-1' : size === 'md' ? 'text-base px-3 py-1.5' : 'text-lg px-4 py-2 '} relative overflow-shown pl-8`}
						>
							<span
								class={`${size === 'xs' ? 'w-5 h-5' : size === 'sm' ? 'w-7 h-7' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'} absolute left-0 z-25`}
							>
								<img
									src={badge.icon}
									alt={badge.name}
									class="w-full h-full object-cover rounded-full"
								/>
							</span>
							{badge.name}
						</Badge>
					</Tooltip.Trigger>
					<Tooltip.Content side="top" sideOffset={4}>
						{badge.description}
					</Tooltip.Content>
				</Tooltip.Root>
			{:else}
				<Badge
					variant={badge.type}
					class={`${size === 'xs' ? 'text-xs px-1.5 py-0.5' : size === 'sm' ? 'text-sm px-2 py-1' : size === 'md' ? 'text-base px-3 py-1.5' : 'text-lg px-4 py-2'}`}
				>
					<span
						class={`${size === 'xs' ? 'w-3 h-3' : size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'} mr-1`}
					>
						<img
							src={badge.icon}
							alt={badge.name}
							class="w-full h-full object-cover rounded-full"
						/>
					</span>
					{badge.name}
				</Badge>
			{/if}
		{/each}

		{#if hiddenCount > 0}
			{#if showTooltip}
				<Tooltip.Root>
					<Tooltip.Trigger asChild>
						<div
							class={`inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground font-medium ${
								size === 'xs'
									? 'text-xs w-5 h-5'
									: size === 'sm'
										? 'text-sm w-6 h-6'
										: size === 'md'
											? 'text-base w-7 h-7'
											: 'text-lg w-8 h-8'
							}`}
						>
							+{hiddenCount}
						</div>
					</Tooltip.Trigger>
					<Tooltip.Content side="top" sideOffset={4}>
						{#each badges.slice(maxVisible) as hiddenBadge}
							<div class="flex items-center gap-1">
								<span class="w-4 h-4">
									<img
										src={hiddenBadge.icon}
										alt={hiddenBadge.name}
										class="w-full h-full object-cover rounded-full"
									/>
								</span>
								<span>{hiddenBadge.name}</span>
								{#if hiddenBadge.description}
									<span class="text-muted-foreground">- {hiddenBadge.description}</span>
								{/if}
							</div>
						{/each}
					</Tooltip.Content>
				</Tooltip.Root>
			{:else}
				<div
					class={`inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground font-medium ${
						size === 'xs'
							? 'text-xs w-5 h-5'
							: size === 'sm'
								? 'text-sm w-6 h-6'
								: size === 'md'
									? 'text-base w-7 h-7'
									: 'text-lg w-8 h-8'
					}`}
				>
					+{hiddenCount}
				</div>
			{/if}
		{/if}
	</Tooltip.Provider>
</div>
