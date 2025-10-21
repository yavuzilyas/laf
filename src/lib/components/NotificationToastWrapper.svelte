<script lang="ts">
	import { onDestroy } from 'svelte';
	import ToastHost from '$lib/components/ToastHost.svelte';
	import {
		startNotificationsWatcher,
		stopNotificationsWatcher
	} from '$lib/stores/notifications';

	let { user }: { user?: { id: string } | null } = $props();

	function ensureWatcher() {
		if (user?.id) {
			startNotificationsWatcher();
		} else {
			stopNotificationsWatcher();
		}
	}

	$effect(() => {
		ensureWatcher();
	});

	onDestroy(() => {
		stopNotificationsWatcher();
	});
</script>

<ToastHost />
