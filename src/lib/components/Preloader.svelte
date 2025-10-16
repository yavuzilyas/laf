<script lang="ts">
	import { navigating } from "$app/stores";
	let active = $state(false);
	$effect(() => {
		active = !!$navigating;
	});
</script>

{#if active}
	<div class="fixed inset-x-0 top-0 z-[80]">
		<div class="h-0.5 w-full bg-transparent">
			<div class="h-0.5 w-0 bg-primary animate-[loader_1s_ease_infinite]">
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes loader {
		0% { width: 0%; }
		50% { width: 60%; }
		100% { width: 100%; }
	}
</style>
