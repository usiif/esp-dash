<script>
	import '../app.css';
	import SupportBubble from '$lib/components/SupportBubble.svelte';

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
