<script>
	import { fade } from 'svelte/transition';
	export let data;

	let step = 1;
	let showTutorial = data.user?.onboarding ?? false;

	function nextStep() {
		step = 2;
	}

	async function dismissTutorial() {
		try {
			await fetch('/api/onboarding', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ onboarding: false })
			});
			showTutorial = false;
			console.log('✅ Onboarding dismissed');
		} catch (err) {
			console.error('❌ Failed to update onboarding:', err);
		}
	}
</script>

{#if showTutorial}
<div transition:fade class="relative max-w-6xl mx-auto mt-5 mb-3 rounded-xl overflow-hidden shadow-md border border-orange-200">
  <!-- Background -->
  <div class="absolute inset-0 pointer-events-none opacity-25">
    <svg viewBox="0 0 500 150" preserveAspectRatio="none" class="w-full h-full">
      <defs>
        <linearGradient id="warmWave" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#f97316;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#fb923c;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#facc15;stop-opacity:0.9" />
        </linearGradient>
      </defs>
      <path
        d="M0.00,49.98 C150.00,150.00 349.60,-49.98 500.00,49.98 L500.00,150.00 L0.00,150.00 Z"
        fill="url(#warmWave)" />
    </svg>
  </div>

  <!-- Content -->
  <div class="relative z-10 px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-orange-50/80 backdrop-blur-sm">
    {#if step === 1}
      <!-- Step 1 -->
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0 mt-0.5">
          <div class="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-sm">👋</div>
        </div>

        <div class="space-y-1 max-w-3xl">
          <h2 class="font-semibold text-sm text-gray-900">Welcome, {data.user.name}!</h2>
          <p class="text-sm text-gray-700 leading-snug">
            We’re glad to have you here 🎉  
            This is your <span class="font-medium text-orange-700">Learning Dashboard</span> — where you’ll find your lessons, live classes, and practice tools all in one place.
          </p>
        </div>
      </div>

      <button
        on:click={nextStep}
        class="mt-4 sm:mt-0 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium py-2 px-4 rounded-md transition">
        Next →
      </button>

    {:else if step === 2}
      <!-- Step 2 -->
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0 mt-0.5">
          <div class="bg-orange-400 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-sm">🧭</div>
        </div>

        <div class="space-y-1 max-w-3xl">
          <h2 class="font-semibold text-sm text-gray-900">Keep Exploring</h2>
          <p class="text-sm text-gray-700 leading-snug">
            You can always keep learning by clicking 
            <span class="font-medium text-orange-700">“Start a Lesson Now”</span> — or revisit anytime through your portal:
            <a
              href={data.user.portal_magic}
              target="_blank"
              rel="noopener noreferrer"
              class="ml-1 text-orange-700 hover:underline font-medium">
              Open Portal →
            </a>
          </p>
        </div>
      </div>

      <button
        on:click={dismissTutorial}
        class="mt-4 sm:mt-0 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium py-2 px-4 rounded-md transition">
        Got it!
      </button>
    {/if}
  </div>
</div>
{/if}
