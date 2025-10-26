<svelte:head>
  <title>Dashboard - Expat Spanish Lessons</title>
</svelte:head>

<script>
  	import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import Onboarding from '$lib/components/onboarding.svelte'
 
  export let data;

  onMount(() => {
		// Prevent multiple script injections on client navigation
		if (document.getElementById('leadconnector-chat-widget')) return;

		const script = document.createElement('script');
		script.src = 'https://widgets.leadconnectorhq.com/loader.js';
		script.dataset.resourcesUrl = 'https://widgets.leadconnectorhq.com/chat-widget/loader.js';
		script.dataset.widgetId = '68fe0a70bb21f16ca0a3bafe';
		script.id = 'leadconnector-chat-widget';
		document.body.appendChild(script);

		console.log('💬 LeadConnector chat widget loaded');
	});

</script>


<div class="min-h-screen bg-orange-50 text-gray-800">
  <!-- Navbar -->
  <header class="bg-white shadow-sm py-3 px-6 flex justify-between items-center">
    <h1 class="text-md font-semibold text-orange-600">Expat Spanish Lessons</h1>
    <a href="/api/logout" class="text-sm text-gray-500 hover:text-orange-500 transition">Logout</a>
  </header>

  <!-- 🧭 Learning Area (Onboarding Panel) -->

  <div class="lg:col-span-3">
    <Onboarding {data} />
  </div>

  <!-- Main -->
  <main class="p-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
    <!-- LEFT COLUMN -->
    <div class="lg:col-span-2 space-y-5">
      <!-- Greeting -->
      <div class="bg-white p-4 rounded-lg border border-orange-100 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-800">👋 Hola, {data.user.name}</h2>
        <p class="text-sm text-gray-600">Current Course: {data.user.level}</p>
      </div>

      <!-- Quick Actions Row -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <!-- Start Lesson -->
        <div class="bg-white p-4 rounded-lg border border-orange-100 shadow-sm text-center flex flex-col justify-between">
          <div>
            <div class="flex justify-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="#ea580c" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 12l5 5L20 7" />
              </svg>
            </div>
            <h3 class="text-sm font-semibold text-gray-800 mb-2 pb-2 border-b border-orange-100">
              My Spanish Courses
            </h3>
            <p class="text-xs text-gray-500 mb-3 mx-auto max-w-[220px] leading-snug">
              Your online courses are the path to learning and progressing your Spanish skills.
            </p>
          </div>
          <a
            href="https://expatspanishlessons.app.clientclub.net/login"
            target="_blank"
            rel="noopener noreferrer"
            class="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-3 rounded-md text-xs transition inline-flex items-center justify-center gap-1"
          >
            Start a Lesson Now
          </a>
        </div>

        <!-- Book Class -->
        <div class="bg-white p-4 rounded-lg border border-orange-100 shadow-sm text-center flex flex-col justify-between">
          <div>
            <div class="flex justify-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="#ea580c" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="text-sm font-semibold text-gray-800 mb-2 pb-2 border-b border-orange-100">
              Book A Live Class
            </h3>
            <p class="text-xs text-gray-600 mb-3 mx-auto max-w-[220px] leading-snug">See your level’s calendar and schedule.</p>
          </div>
          {#if data?.calendarLink}
            <a
              href={data.calendarLink}
              target="_blank"
              rel="noopener noreferrer"
              class="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-3 rounded-md text-xs transition"
            >
              Book Now
            </a>
          {:else}
            <p class="text-xs text-gray-500 italic">No calendar available.</p>
          {/if}
        </div>

        <!-- Flashcards -->
        <div class="bg-white p-4 rounded-lg border border-orange-100 shadow-sm text-center flex flex-col justify-between">
          <div>
            <div class="flex justify-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="#ea580c" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m6-6H6" />
              </svg>
            </div>
            <h3 class="text-sm font-semibold text-gray-800 mb-2 pb-2 border-b border-orange-100">My Flashcards</h3>
            <p class="text-xs text-gray-600 mb-3 mx-auto max-w-[220px] leading-snug">Review the vocabulary from your course to keep it fresh.</p>
          </div>
          <a
            href="https://expatspanishlessons.app.clientclub.net/login"
            target="_blank"
            rel="noopener noreferrer"
            class="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-3 rounded-md text-xs transition"
          >
            Go to Brainscape
          </a>
        </div>
      </div>
    </div>

    <!-- RIGHT COLUMN -->
    <div class="bg-white p-5 rounded-lg border border-orange-100 shadow-sm overflow-y-auto max-h-[80vh]">
      <h3 class="font-semibold text-gray-800 mb-3 text-base">Your Scheduled Sessions</h3>

      {#if data.appointments.length > 0}
        <ul class="space-y-2">
          {#each data.appointments as a}
            <li class="p-3 border border-orange-100 rounded-md bg-orange-50">
              <p class="font-medium text-gray-800 text-sm">{a.title}</p>
              <p class="text-xs text-gray-500">{a.startTime} (CST)</p>
              <div class="flex gap-2 mt-2 text-xs">
                <a href={a.address} target="_blank" rel="noopener noreferrer" class="text-orange-600 hover:underline">Join</a>
                <a href={a.cancelLink} target="_blank" rel="noopener noreferrer" class="text-gray-600 hover:text-orange-600">Cancel</a>
              </div>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="text-xs text-gray-500 italic">No sessions scheduled.</p>
      {/if}
    </div>
  </main>
</div>
