<svelte:head>
	<title>Login - Expat Spanish Lessons</title>
</svelte:head>


<script>
	let email = '';
	let message = '';

	async function sendCode() {
		message = '';

		try {
			const res = await fetch('/api/send-code', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});

			const data = await res.json();

			if (res.ok) {
	window.location.href = `/verify?email=${encodeURIComponent(email)}`;
} else {
	message = data.error || 'Something went wrong.';
}

		} catch (err) {
			message = 'Server unavailable. Please try again.';
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-orange-50 text-gray-800">
	<div class="bg-white shadow-md rounded-xl p-8 w-full max-w-sm border border-orange-100">
		<h1 class="text-2xl font-semibold mb-4 text-orange-600">Welcome Back</h1>
		<p class="text-sm text-gray-600 mb-6">
			Enter your email and we’ll send you a verification code.
		</p>

		<input
			bind:value={email}
			type="email"
			placeholder="you@example.com"
			required
			class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-400 focus:border-orange-400 outline-none text-sm mb-4"
		/>

		<button
			on:click={sendCode}
			class="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-medium transition"
		>
			Send Code
		</button>

		{#if message}
			<p class="text-sm mt-3 text-center text-red-500">{message}</p>
		{/if}
	</div>
</div>
