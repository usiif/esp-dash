<script>
	import { page } from '$app/stores';

	let code = '';
	let email = '';
	let message = '';

	// Get email from query params (e.g. /verify?email=user@example.com)
	$: email = $page.url.searchParams.get('email') || '';

	async function verify() {
		message = '';

		if (!code || code.length < 4) {
			message = 'Enter your 4-character code.';
			return;
		}

		try {
			const res = await fetch('/api/verify-code', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, code })
			});

			const data = await res.json();

			if (res.ok) {
				window.location.href = '/dashboard';
			} else {
				message = data.error || 'Invalid or expired code.';
			}
		} catch (err) {
			message = 'Server unavailable. Please try again.';
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-orange-50 text-gray-800">
	<div class="bg-white shadow-md rounded-xl p-8 w-full max-w-sm border border-orange-100">
		<h1 class="text-2xl font-semibold mb-4 text-orange-600">Enter Your Code</h1>
		<p class="text-sm text-gray-600 mb-6">
			We sent a 6-character code to <span class="font-medium text-orange-700">{email}</span>.
		</p>

		<input
			bind:value={code}
			type="text"
			maxlength="6"
			placeholder="125681"
			class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-400 focus:border-orange-400 outline-none text-center text-lg tracking-widest uppercase mb-4"
		/>

		<button
			on:click={verify}
			class="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-medium transition"
		>
			Verify
		</button>

		{#if message}
			<p class="text-sm mt-3 text-center text-red-500">{message}</p>
		{/if}

		<p class="text-xs text-gray-500 mt-6 text-center">
			Code expires in 10 minutes.
		</p>
	</div>
</div>
