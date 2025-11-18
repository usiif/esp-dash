<script>
	import { fade, scale } from 'svelte/transition';
	export let data;
  
	// Student object from server:
	// data.user should include at least: onboarding_status, portal_magic, full_name ...
	const student = data?.user ?? {};
  
	// derive UI state from DB state
	let showTutorial = (student.onboarding_status && student.onboarding_status !== 'complete');
	let step = student.onboarding_status === 'password_set' ? 2 : 1;
  
	// update UI + call API
	async function updateOnboarding(state) {
	  try {
		const res = await fetch('/api/onboarding', {
		  method: 'POST',
		  headers: { 'Content-Type': 'application/json' },
		  body: JSON.stringify({ onboarding: state })
		});
  
		if (!res.ok) {
		  const err = await res.json().catch(() => ({}));
		  console.error('❌ Onboarding API error', err);
		  return false;
		}
  
		// reflect change in UI
		if (state === 'complete') {
		  showTutorial = false;
		} else if (state === 'password_set') {
		  step = 2;
		}
		return true;
	  } catch (err) {
		console.error('❌ Failed to update onboarding:', err);
		return false;
	  }
	}
  
	// Step 1: open portal and mark as "password_set"
	async function goToConfirm() {
	  if (student.portal_magic) {
		window.open(student.portal_magic, '_blank');
	  } else {
		// fallback: open homepage
		window.open('/', '_blank');
	  }
  
	  // give user time in the portal
	  await new Promise((resolve) => setTimeout(resolve, 1200));
	  await updateOnboarding('password_set');
	}
  
	// Step 2: mark complete and hide
	async function completeOnboarding() {
	  // tiny delay for UX
	  await new Promise((resolve) => setTimeout(resolve, 250));
	  const ok = await updateOnboarding('complete');
	  if (ok) {
		showTutorial = false;
	  }
	}
  
	function retryPortal() {
	  if (student.portal_magic) window.open(student.portal_magic, '_blank');
	  else window.open('/', '_blank');
	}
  </script>
  
  {#if showTutorial}
  <!-- Overlay -->
  <div
	in:fade
	out:fade
	class="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center px-4"
  >
	<!-- Card -->
	<div
	  in:scale
	  out:fade
	  class="relative bg-white rounded-2xl shadow-2xl border border-orange-200 max-w-6xl w-full overflow-hidden z-50"
	>
	  <!-- Brand Wave -->
	  <div class="absolute inset-0 opacity-25">
		<svg viewBox="0 0 500 150" preserveAspectRatio="none" class="w-full h-full">
		  <defs>
			<linearGradient id="onboardWave" x1="0%" y1="0%" x2="100%" y2="0%">
			  <stop offset="0%" style="stop-color:#f97316;stop-opacity:1" />
			  <stop offset="50%" style="stop-color:#fb923c;stop-opacity:1" />
			  <stop offset="100%" style="stop-color:#facc15;stop-opacity:0.9" />
			</linearGradient>
		  </defs>
		  <path
			d="M0.00,49.98 C150.00,150.00 349.60,-49.98 500.00,49.98 L500.00,150.00 L0.00,150.00 Z"
			fill="url(#onboardWave)"
		  />
		</svg>
	  </div>
  
	  <!-- Content -->
	  <div class="relative z-10 px-8 py-10 flex flex-col items-center text-center space-y-4">
  
		{#if step === 1}
		<!-- STEP 1 -->
		<div class="bg-orange-200 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl shadow">
		  <img alt="Expat Spanish Logo" src="https://storage.googleapis.com/msgsndr/Wpw7KRwapxKDboseXO64/media/68f404461e16747fc6e7b49d.png" class="w-8 h-8">
		</div>
  
		<h2 class="text-xl font-semibold text-gray-800">¡Bienvenido/a! Welcome to your student dashboard.</h2>
		<p class="text-sm sm:text-base text-gray-700 max-w-2xl leading-relaxed">
		  Before you begin exploring, 
		  <span class="font-semibold text-orange-600">let's set up your password.</span>
		</p>
  
		<button
		  on:click={goToConfirm}
		  class="cursor-pointer bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-lg text-sm sm:text-base transition-all shadow-md hover:shadow-lg mt-4"
		>
		  Set My Password →
		</button>
  
		<p class="text-xs text-gray-500 mt-2">
		  This ensures your account is fully ready to access the learning materials.
		</p>
  
		{:else if step === 2}
		<!-- STEP 2 -->
		<div class="bg-orange-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl shadow">
		  <!-- Check Icon -->
		  <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
		  </svg>
		</div>
  
		<h2 class="text-xl font-semibold text-gray-800">Were you able to log in?</h2>
		<p class="text-sm sm:text-base text-gray-700 max-w-2xl leading-relaxed">
		  If everything went well, you’re ready to start learning!
		  If not, you can try again or reach out for help.
		</p>
  
		<div class="flex flex-col sm:flex-row gap-3 mt-5">
		  <button
			on:click={completeOnboarding}
			class="cursor-pointer bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 px-6 rounded-lg text-sm transition"
		  >
			Yes, Let's Go →
		  </button>
  
		  <button
			on:click={retryPortal}
			class="cursor-pointer bg-white border border-orange-400 text-orange-600 hover:bg-orange-50 font-medium py-2.5 px-6 rounded-lg text-sm transition"
		  >
			Let's Try Again
		  </button>
		</div>
  
		<p class="text-xs text-gray-500 mt-3">
		  If you need help, email us at
		  <a href="mailto:contact@expatspanishlessons.com" class="text-orange-600 font-medium hover:underline">
			contact@expatspanishlessons.com
		  </a>.
		</p>
  
		{/if}
	  </div>
	</div>
  </div>
  {/if}
  