<svelte:head>
	<title>Login - Expat Spanish Lessons</title>
</svelte:head>

<script>
	import { goto } from '$app/navigation';

	let email = '';
	let loading = false;
	let message = '';

	async function sendCode() {
		if (loading || !email) return;

		loading = true;
		message = '';

		// Normalize email to lowercase
		const normalizedEmail = email.trim().toLowerCase();

		try {
			const res = await fetch('/api/send-code', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: normalizedEmail })
			});

			const data = await res.json();

			if (res.ok) {
				// ✅ Redirect immediately (don't reset loading)
				goto(`/verify?email=${encodeURIComponent(normalizedEmail)}`);
				return; // stop execution before finally runs
			}

			message = data.error || 'Something went wrong.';
		} catch (err) {
			message = 'Server unavailable. Please try again.';
		} finally {
			// 🧠 only reset loading if there was no redirect
			if (!res?.ok) loading = false;
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-orange-50 text-gray-800">
	<div class="bg-white shadow-md rounded-xl p-8 w-full max-w-sm border border-orange-100">
		<h1 class="text-2xl font-semibold mb-4 text-orange-600">Welcome Back</h1>
		<p class="text-sm text-gray-600 mb-6">Enter your email to continue your Spanish journey.</p>

		<input
			bind:value={email}
			type="email"
			placeholder="you@example.com"
			required
			class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-400 focus:border-orange-400 outline-none text-sm mb-4"
		/>

		<button
			on:click={sendCode}
			class="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-medium transition cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
			disabled={loading || !email}
		>
			{#if loading}
				Sending...
			{:else}
				Send me a code
			{/if}
		</button>

		{#if message}
			<p class="text-sm mt-3 text-center text-red-500">{message}</p>
		{/if}
	</div>
</div>
