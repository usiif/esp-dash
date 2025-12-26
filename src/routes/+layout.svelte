<script>
	import '../app.css';
	import SupportBubble from '$lib/components/SupportBubble.svelte';
	import PlacementModal from '$lib/components/PlacementModal.svelte';

	let { children, data } = $props();
</script>

{@render children()}

<!-- Global Support Bubble (shows on all pages if user is logged in) -->
{#if data.user}
	<SupportBubble
		userName={data.user.name}
		userEmail={data.user.email || ''}
		userId={data.user.id || ''}
	/>
{/if}

<!-- Placement Modal (shows when user level is not determined) -->
{#if data.user && !data.user.level_key}
	<PlacementModal
		userName={data.user.name}
		userEmail={data.user.email || ''}
	/>
{/if}
