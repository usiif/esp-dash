<script>
  import { fade } from 'svelte/transition';
  import { onMount } from 'svelte';
  import StudentNav from '$lib/components/StudentNav.svelte';
  import Onboarding from '$lib/components/onboarding.svelte';

  export let data;

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // One-time timezone update after signup (if missing)
  onMount(() => {
    if (data.user.needs_timezone) {
      fetch('/api/update-timezone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tz })
      }).catch(err => {
        console.error('Failed to update timezone:', err);
      });
    }
  });

  let showToast = false;
  let toastMessage = '';
  let showFlashcardsModal = false;

  // Prep status: enrollment_id -> Set of completed prep_item_ids
  $: prepStatus = Object.entries(data.prepStatus || {}).reduce((acc, [enrollmentId, itemIds]) => {
    acc[enrollmentId] = new Set(itemIds);
    return acc;
  }, {});

  // Sort enrollments by start time and take first 3
  $: upcomingClasses = (data.myClasses || [])
    .filter(e => e.class && new Date(e.class.start) >= new Date())
    .sort((a, b) => new Date(a.class.start) - new Date(b.class.start))
    .slice(0, 3);

  // Calculate prep completion for all enrollments (reactive)
  $: prepCompletions = upcomingClasses.reduce((acc, enrollment) => {
    const prepItems = enrollment.class?.prep_items || [];
    if (prepItems.length === 0) {
      acc[enrollment.enrollment_id] = null;
      return acc;
    }

    const completedItems = prepStatus[enrollment.enrollment_id] || new Set();
    const completed = prepItems.filter(item => completedItems.has(item.id)).length;
    const total = prepItems.length;
    const percentage = Math.round((completed / total) * 100);

    acc[enrollment.enrollment_id] = { completed, total, percentage };
    return acc;
  }, {});

  async function togglePrepItem(enrollmentId, prepItemId, isDone) {
    try {
      const response = await fetch('/api/prep-status/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollment_id: enrollmentId,
          prep_item_id: prepItemId,
          is_done: isDone
        })
      });

      if (!response.ok) {
        toastMessage = 'Failed to update prep item';
        showToast = true;
        setTimeout(() => showToast = false, 3000);
        return;
      }

      // Update local state
      const newPrepStatus = {};
      for (const [key, value] of Object.entries(prepStatus)) {
        newPrepStatus[key] = new Set(value);
      }

      if (!newPrepStatus[enrollmentId]) {
        newPrepStatus[enrollmentId] = new Set();
      }

      if (isDone) {
        newPrepStatus[enrollmentId].add(prepItemId);
      } else {
        newPrepStatus[enrollmentId].delete(prepItemId);
      }

      prepStatus = newPrepStatus;
    } catch (err) {
      console.error('Error toggling prep item:', err);
      toastMessage = 'Failed to update prep item';
      showToast = true;
      setTimeout(() => showToast = false, 3000);
    }
  }

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
  <title>Dashboard - Expat Spanish Lessons</title>
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
            <p class="font-semibold text-gray-900 text-sm text-center">Book Live Classes</p>
          </a>

          <!-- Flashcards -->
          {#if data.user.flashcardsActivate || data.user.flashcardsDeck}
            <button
              on:click={() => showFlashcardsModal = true}
              class="flex flex-col items-center justify-center bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
            >
              <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p class="font-semibold text-gray-900 text-sm text-center">Review Flashcards</p>
            </button>
          {/if}

          <!-- Online Courses -->
          <a
            href="https://community.expatspanishlessons.com/courses/library-v2"
            target="_blank"
            rel="noopener noreferrer"
            class="flex flex-col items-center justify-center bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer"
          >
            <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p class="font-semibold text-gray-900 text-sm text-center">Online Courses</p>
          </a>
        </div>
      </div>

      <!-- Right Column: Upcoming Classes (1 column on desktop) -->
      <div class="lg:col-span-1">
        <h2 class="text-lg font-semibold text-gray-900 mb-3">Your Upcoming Live Classes</h2>

        {#if upcomingClasses.length > 0}
          <div class="space-y-3 mb-3">
            {#each upcomingClasses as enrollment (enrollment.enrollment_id)}
              {@const prepItems = enrollment.class?.prep_items || []}
              {@const completedItems = prepStatus[enrollment.enrollment_id] || new Set()}
              {@const prepCompletion = prepCompletions[enrollment.enrollment_id]}

              <div class="bg-white border border-gray-200 rounded-lg p-3 hover:border-orange-300 transition-colors">
                <div class="flex flex-col gap-3">
                  <!-- Class Info -->
                  <div>
                    <h3 class="font-semibold text-gray-900 text-sm mb-0.5">{enrollment.class.title}</h3>
                    <p class="text-xs font-medium">
                      <span class="text-orange-600">{formatDateTime(enrollment.class.start)}</span>
                      <span class="text-gray-500"> ({tz})</span>
                    </p>
                  </div>

                  <!-- Prep Status -->
                  {#if prepCompletion}
                    <div>
                      <div class="flex items-center justify-between mb-1">
                        <span class="text-xs font-medium text-gray-600">Preparation</span>
                        <span class="text-xs font-semibold"
                          class:text-green-600={prepCompletion.percentage === 100}
                          class:text-orange-600={prepCompletion.percentage > 0 && prepCompletion.percentage < 100}
                          class:text-gray-500={prepCompletion.percentage === 0}>
                          {prepCompletion.completed}/{prepCompletion.total}
                        </span>
                      </div>
                      <div class="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                        <div
                          class="h-1.5 rounded-full transition-all"
                          class:bg-green-500={prepCompletion.percentage === 100}
                          class:bg-orange-500={prepCompletion.percentage > 0 && prepCompletion.percentage < 100}
                          class:bg-gray-400={prepCompletion.percentage === 0}
                          style="width: {prepCompletion.percentage}%"
                        ></div>
                      </div>

                      <!-- Prep Items List -->
                      <div class="space-y-2">
                        {#each prepItems as prepItem}
                          {@const isCompleted = completedItems.has(prepItem.id)}
                          <div class="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={isCompleted}
                              on:change={(e) => togglePrepItem(enrollment.enrollment_id, prepItem.id, e.target.checked)}
                              class="w-4 h-4 mt-0.5 text-orange-600 border-gray-300 rounded focus:ring-orange-500 flex-shrink-0 cursor-pointer"
                            />
                            <div class="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap">
                              <span class="text-xs text-gray-700"
                                class:line-through={isCompleted}
                                class:text-gray-500={isCompleted}>
                                {prepItem.title}
                              </span>
                              {#if prepItem.is_required}
                                <span class="text-xs text-orange-600">*</span>
                              {/if}
                              {#if prepItem.url}
                                <a
                                  href={prepItem.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  class="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center gap-0.5"
                                >
                                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  <span>Link</span>
                                </a>
                              {/if}
                            </div>
                          </div>
                        {/each}
                      </div>
                    </div>
                  {/if}

                  <!-- Actions -->
                  <div class="flex items-center gap-2 pt-2 border-t border-gray-100">
                    {#if enrollment.class.hasEnded}
                      <!-- Show "Ended" indicator for past classes -->
                      <div class="flex-1 px-3 py-1.5 bg-gray-200 text-gray-600 text-xs font-medium rounded text-center whitespace-nowrap">
                        Ended
                      </div>
                    {:else}
                      <!-- Show Join and Cancel buttons for active/upcoming classes -->
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
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>

          <!-- Note about viewing all classes -->
          <p class="text-xs text-gray-500 text-center">
            Showing your next 3 classes.
            <a href="/classes" class="text-orange-600 hover:text-orange-700 underline">View all enrolled classes →</a>
          </p>
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

  <!-- Flashcards Modal -->
  {#if showFlashcardsModal}
    <div class="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4" on:click={() => showFlashcardsModal = false} transition:fade>
      <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full border-2 border-gray-200" on:click|stopPropagation transition:fade>
        <!-- Header -->
        <div class="flex items-start justify-between p-6 pb-4 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold text-gray-900 mb-0.5">Your Flashcards</h3>
              <p class="text-sm text-gray-600">Practice vocabulary with Brainscape</p>
            </div>
          </div>
          <button
            on:click={() => showFlashcardsModal = false}
            class="text-gray-400 hover:text-gray-700 transition-colors p-1 -mt-1"
            aria-label="Close"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-5">
          {#if data.user.flashcardsActivate}
            <div class="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-5 border border-blue-200">
              <div class="mb-4">
                <h4 class="text-base font-bold text-blue-900 mb-2">Step 1: Activate Your Deck</h4>
                <p class="text-sm text-gray-700 leading-relaxed">
                  First time using flashcards? Click below to add them to your Brainscape account.
                </p>
              </div>
              <a
                href={data.user.flashcardsActivate}
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Activate Flashcards
              </a>
            </div>
          {/if}

          {#if data.user.flashcardsDeck}
            <div class="bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg p-5 border border-green-200">
              <div class="mb-4">
                <h4 class="text-base font-bold text-green-900 mb-2">Step 2: Start Studying</h4>
                <p class="text-sm text-gray-700 leading-relaxed">
                  Already activated? Jump into your deck and start practicing.
                </p>
              </div>
              <a
                href={data.user.flashcardsDeck}
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center justify-center gap-2 px-5 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                Study Now
              </a>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  <!-- Toast -->
  {#if showToast}
    <div class="fixed top-6 right-6 z-50 max-w-sm" transition:fade>
      <div class="bg-white rounded-lg shadow-lg border-l-4 border-orange-500 p-4">
        <p class="text-sm font-medium text-gray-900">{toastMessage}</p>
      </div>
    </div>
  {/if}
</div>
