<script>
  import { fade } from 'svelte/transition';
  import StudentNav from '$lib/components/StudentNav.svelte';
  import Onboarding from '$lib/components/onboarding.svelte';

  export let data;

  const tz = data.tz || Intl.DateTimeFormat().resolvedOptions().timeZone;

  let showToast = false;
  let toastMessage = '';

  // Sort enrollments by start time and take first 3
  $: upcomingClasses = (data.myClasses || [])
    .filter(e => e.class && new Date(e.class.start) >= new Date())
    .sort((a, b) => new Date(a.class.start) - new Date(b.class.start))
    .slice(0, 3);

  function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    const dayFormat = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: tz
    });
    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: tz
    });
    return `${dayFormat} — ${time}`;
  }

  async function cancelBooking(enrollmentId) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const response = await fetch('/api/enrollments/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollment_id: enrollmentId })
      });

      const result = await response.json();

      if (!response.ok) {
        toastMessage = result.error || 'Failed to cancel';
        showToast = true;
        setTimeout(() => showToast = false, 4000);
        return;
      }

      data.myClasses = data.myClasses.filter(e => e.enrollment_id !== enrollmentId);
      toastMessage = 'Booking cancelled successfully';
      showToast = true;
      setTimeout(() => showToast = false, 3000);
    } catch (err) {
      console.error('Error:', err);
      toastMessage = 'Failed to cancel';
      showToast = true;
      setTimeout(() => showToast = false, 4000);
    }
  }
</script>

<svelte:head>
  <title>Dashboard - ESPL</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <StudentNav user={data.user} />
  <Onboarding {data} />

  <!-- Main Content with padding for desktop sidebar -->
  <main class="lg:ml-56 p-4 sm:p-6 max-w-7xl">
    <!-- Welcome Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-1">Welcome back, {data.user.name}!</h1>
      {#if data.user.level}
        <p class="text-sm text-gray-600">
          <span class="font-medium text-orange-600">{data.user.level}</span> — Here's what's coming up
        </p>
      {:else}
        <p class="text-sm text-gray-600">Here's what's coming up for you</p>
      {/if}
    </div>

    <!-- Two Column Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Column: Quick Actions (2 columns on desktop) -->
      <div class="lg:col-span-2">
        <h2 class="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div class="grid grid-cols-2 gap-3">
          <!-- Browse Classes -->
          <a
            href="/classes"
            class="flex flex-col items-center justify-center bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-orange-400 hover:shadow-md transition-all cursor-pointer"
          >
            <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
              <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p class="font-semibold text-gray-900 text-sm text-center">Browse Classes</p>
          </a>

          <!-- Flashcards -->
          {#if data.user.flashcardsShare}
            <a
              href={data.user.flashcardsShare}
              target="_blank"
              rel="noopener noreferrer"
              class="flex flex-col items-center justify-center bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
            >
              <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p class="font-semibold text-gray-900 text-sm text-center">Flashcards</p>
            </a>
          {/if}

          <!-- Recordings -->
          <a
            href="/recordings"
            class="flex flex-col items-center justify-center bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-green-400 hover:shadow-md transition-all cursor-pointer"
          >
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p class="font-semibold text-gray-900 text-sm text-center">Recordings</p>
          </a>
        </div>
      </div>

      <!-- Right Column: Upcoming Classes (1 column on desktop) -->
      <div class="lg:col-span-1">
        <h2 class="text-lg font-semibold text-gray-900 mb-3">Upcoming Classes</h2>

        {#if upcomingClasses.length > 0}
          <div class="space-y-2 mb-3">
            {#each upcomingClasses as enrollment (enrollment.enrollment_id)}
              <div class="bg-white border border-gray-200 rounded-lg p-3 hover:border-orange-300 transition-colors">
                <div class="flex flex-col gap-2">
                  <!-- Class Info -->
                  <div>
                    <h3 class="font-semibold text-gray-900 text-sm mb-0.5">{enrollment.class.title}</h3>
                    <p class="text-xs text-orange-600 font-medium">{formatDateTime(enrollment.class.start)}</p>
                  </div>

                  <!-- Actions -->
                  <div class="flex items-center gap-2">
                    {#if enrollment.class.zoom_link}
                      <a
                        href={enrollment.class.zoom_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="flex-1 px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded hover:bg-orange-600 text-center whitespace-nowrap"
                      >
                        Join
                      </a>
                    {/if}
                    <button
                      on:click={() => cancelBooking(enrollment.enrollment_id)}
                      class="text-xs text-gray-500 hover:text-red-600 underline"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <!-- No upcoming classes -->
          <div class="bg-white rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
            <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p class="text-gray-600 text-sm mb-3">No upcoming classes</p>
            <a
              href="/classes"
              class="inline-flex items-center gap-1 px-4 py-2 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600"
            >
              Browse Classes
            </a>
          </div>
        {/if}
      </div>
    </div>
  </main>

  <!-- Toast -->
  {#if showToast}
    <div class="fixed top-6 right-6 z-50 max-w-sm" transition:fade>
      <div class="bg-white rounded-lg shadow-lg border-l-4 border-orange-500 p-4">
        <p class="text-sm font-medium text-gray-900">{toastMessage}</p>
      </div>
    </div>
  {/if}
</div>
