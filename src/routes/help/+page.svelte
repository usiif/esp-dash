<script>
    export let data;
	const user = data.user;

	import { onMount, afterUpdate } from "svelte";

	let messages = [];
	let input = "";
	let mode = "";
	let sessionId = null;
	let loading = false;
	let chatRef;

	// ADD YOUR IMG LINKS HERE ✅
	const botAvatar = "https://storage.googleapis.com/msgsndr/Wpw7KRwapxKDboseXO64/media/68f404461e16747fc6e7b49d.png";
	const userAvatar = "https://storage.googleapis.com/msgsndr/Wpw7KRwapxKDboseXO64/media/68f404461e16747fc6e7b49d.png";

	const options = [
		{ key: "bug_report", label: "Report Issue" },
		{ key: "live_lesson_feedback", label: "Lesson Feedback" },
		{ key: "course_feedback", label: "Course Feedback" },
		{ key: "support_request", label: "Help Me" }
	];

	onMount(() => {
		sessionId = crypto.randomUUID();
	});

	async function sendMessage() {
		if (!input.trim() || loading) return;

		const userText = input;
		input = "";

		messages = [...messages, { role: "user", text: userText }];
		loading = true;

		const res = await fetch("/api/help", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				message: userText,
				sessionId,
				mode,
                name: user.name,
                email: user.email
			})
		});

		const data = await res.json().catch(() => null);

		messages = [
			...messages,
			{ role: "assistant", text: data?.reply ?? "No response — debugging…" }
		];

		loading = false;
	}

	function pickMode(o) {
		mode = o.key;
		messages = [
			{ role: "assistant", text: `Tell me more.` }
		];
	}

	afterUpdate(() => {
		if (chatRef) chatRef.scrollTop = chatRef.scrollHeight;
	});
</script>

<style>
	.bg-waves {
		background: linear-gradient(120deg, #fafafa 0%, #f0f7ff 60%, #ffe4c8 100%);
		background-size: 200% 200%;
		animation: wave 6s ease infinite;
	}
	@keyframes wave {
		0% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
		100% { background-position: 0% 50%; }
	}
	.typing span {
		width: 7px; height: 7px; border-radius: 50%;
		background: #aaa; animation: blink 1.4s infinite both;
	}
	.typing span:nth-child(2) { animation-delay: .2s; }
	.typing span:nth-child(3) { animation-delay: .4s; }
	@keyframes blink { 0%{opacity:.2}20%{opacity:1}100%{opacity:.2}}
</style>

<div class="flex flex-col h-[100svh] bg-waves">

	<!-- Header -->
	<div class="p-4 border-b bg-white/80 backdrop-blur flex gap-2 items-center font-semibold text-lg">
		<img src="https://storage.googleapis.com/msgsndr/Wpw7KRwapxKDboseXO64/media/68f404461e16747fc6e7b49d.png" class="w-7 h-7 rounded-full" alt="bot"/>
		Student Help Assistant
	</div>

	<!-- Chat Area -->
	<div bind:this={chatRef} class="flex-1 overflow-y-auto px-4 py-6 space-y-4">

		<!-- Horizontal pill suggestions -->
		{#if !mode && messages.length === 0}
			<div class="flex flex-col items-center gap-3 mt-8 mb-4">
				<h2 class="font-semibold text-gray-700 text-lg">How can I help you today, {data.user.name}?</h2>

				<div class="flex flex-wrap justify-center gap-2 max-w-2xl">
					{#each options as o}
						<div
							on:click={() => pickMode(o)}
							class="cursor-pointer px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-full hover:border-orange-500 hover:bg-orange-50 transition whitespace-nowrap"
						>
							{o.label}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Messages -->
		{#each messages as m}
			<div class={`flex gap-3 items-start ${m.role === "user" ? 'flex-row-reverse' : ''}`}>
				<img src={m.role === 'user' ? userAvatar : botAvatar} 
					class="w-9 h-9 rounded-full shadow" alt="avatar"/>

				<div
					class={`max-w-[78%] text-sm rounded-xl px-4 py-2 whitespace-pre-line leading-relaxed shadow-sm
						${m.role === 'user' 
							? 'bg-orange-100' 
							: 'bg-white border border-gray-200'}`}
				>
					{m.text}
				</div>
			</div>
		{/each}

		<!-- Typing animation -->
		{#if loading}
			<div class="flex gap-3 items-center">
				<img src={botAvatar} class="w-9 h-9 rounded-full shadow" alt="bot"/>
				<div class="bg-white border px-4 py-2 rounded-xl">
					<div class="typing flex gap-1">
						<span></span><span></span><span></span>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Input bar always visible -->
	<div class="p-4 border-t bg-white/90 backdrop-blur flex gap-2">
		<input
			bind:value={input}
			placeholder="Type a message…"
			on:keydown={(e)=> e.key === 'Enter' && sendMessage()}
			class="flex-1 p-3 border rounded-xl shadow-sm focus:outline-orange-500"
		/>

		<button
			on:click={sendMessage}
			class="px-4 py-2 bg-orange-600 hover:bg-blue-600 text-white rounded-xl font-medium transition"
		>
			Send
		</button>
	</div>
</div>
