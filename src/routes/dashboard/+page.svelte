<script>
  import { fade } from 'svelte/transition';
  import Onboarding from '$lib/components/onboarding.svelte';
  import UserMenu from '$lib/components/UserMenu.svelte';

  export let data;

  const tz = data.tz || Intl.DateTimeFormat().resolvedOptions().timeZone;

  let showToast = false;
  let toastMessage = '';
  let toastType = 'success';

  function showSuccessToast(message) {
    toastMessage = message;
    toastType = 'success';
    showToast = true;
    setTimeout(() => showToast = false, 3000);
  }

  function showErrorToast(message) {
    toastMessage = message;
    toastType = 'error';
    showToast = true;
    setTimeout(() => showToast = false, 4000);
  }

  function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateKey = date.toDateString();
    const todayKey = today.toDateString();
    const tomorrowKey = tomorrow.toDateString();

    let dayLabel = '';
    if (dateKey === todayKey) dayLabel = 'Today';
    else if (dateKey === tomorrowKey) dayLabel = 'Tomorrow';
    else dayLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: tz });

    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz });
    return `${dayLabel} at ${time}`;
  }

  let enrolledClassIds = new Set(data.enrolledClassIds || []);
  let myClasses = data.myClasses || [];
  let enrollingClassId = null;
  let expandedClassId = null;

  async function reserveSpot(classItem) {
    if (enrollingClassId === classItem.id) return;
    enrollingClassId = classItem.id;

    try {
      const response = await fetch('/api/enrollments/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class_id: classItem.id })
      });

      const result = await response.json();

      if (!response.ok) {
        showErrorToast(result.error || 'Failed to reserve spot');
        enrollingClassId = null;
        return;
      }

      enrolledClassIds.add(classItem.id);
      enrolledClassIds = enrolledClassIds;

      myClasses = [{
        enrollment_id: result.enrollment.id,
        class_id: classItem.id,
        status: 'reserved',
        enrolled_at: result.enrollment.enrolled_at,
        class: classItem
      }, ...myClasses];

      showSuccessToast('Spot reserved!');
    } catch (err) {
      console.error('Error:', err);
      showErrorToast('Failed to reserve spot');
    } finally {
      enrollingClassId = null;
    }
  }

  async function cancelSpot(enrollment) {
    if (!confirm(`Cancel "${enrollment.class.title}"?`)) return;

    try {
      const response = await fetch('/api/enrollments/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollment_id: enrollment.enrollment_id })
      });

      const result = await response.json();

      if (!response.ok) {
        showErrorToast(result.error || 'Failed to cancel');
        return;
      }

      enrolledClassIds.delete(enrollment.class_id);
      enrolledClassIds = enrolledClassIds;
      myClasses = myClasses.filter(e => e.enrollment_id !== enrollment.enrollment_id);

      showSuccessToast('Cancelled');
    } catch (err) {
      console.error('Error:', err);
      showErrorToast('Failed to cancel');
    }
  }
</script>

<svelte:head>
  <title>Dashboard - Expat Spanish Lessons</title>
</svelte:head>

<div class="min-h-screen bg-orange-50">
  <header class="bg-white shadow-sm py-3 px-4 sm:px-6 flex justify-between items-center sticky top-0 z-10">
    <h1 class="text-lg font-semibold text-orange-600">Expat Spanish</h1>
    <UserMenu user={data.user} />
  </header>

  <Onboarding {data} />

  <main class="max-w-7xl mx-auto p-3 sm:p-4">
    <!-- Welcome & Quick Actions -->
    <div class="bg-white rounded-lg shadow-sm border border-orange-100 p-4 mb-3">
      <div class="flex items-center gap-2 mb-3">
        <h2 class="text-base font-semibold text-gray-900">👋 Hola, {data.user.name}!</h2>
        {#if data.user.level}
          <span class="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">
            {data.user.level}
          </span>
        {/if}
      </div>

      <!-- Quick Action Links -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {#if data.user.flashcardsShare}
          <a
            href={data.user.flashcardsShare}
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-lg p-3 hover:bg-orange-100 transition-colors cursor-pointer"
          >
            <div class="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div class="flex-1">
              <p class="text-sm font-semibold text-gray-900">Flashcards</p>
              <p class="text-xs text-gray-600">Practice vocabulary</p>
            </div>
          </a>
        {/if}

        <a
          href="https://community.expatspanishlessons.com/courses/library-v2"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-3 hover:bg-green-100 transition-colors cursor-pointer"
        >
          <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-sm font-semibold text-gray-900">Continue Studying</p>
            <p class="text-xs text-gray-600">Access course library</p>
          </div>
        </a>
      </div>
    </div>

    <!-- Main Layout: Left (Available Classes) + Right (My Classes Sidebar) -->
    <div class="flex flex-col lg:flex-row gap-3">
      <!-- LEFT: Available Classes + Quick Links -->
      <div class="flex-1 space-y-3">
        <!-- Available Classes (Next 2 Weeks) -->
        <section class="bg-white rounded-lg shadow-sm border border-orange-100">
          <div class="p-3 border-b border-gray-100">
            <h3 class="text-sm font-semibold text-gray-900">Available Classes - Next 2 Weeks</h3>
          </div>

          {#if data.availableClasses.length === 0}
            <div class="p-6 text-center text-gray-500 text-sm">
              No upcoming classes available
            </div>
          {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 p-2 max-h-[580px] overflow-y-auto">
              {#each data.availableClasses as classItem (classItem.id)}
                {@const isEnrolled = enrolledClassIds.has(classItem.id)}
                {@const isEnrolling = enrollingClassId === classItem.id}
                {@const isExpanded = expandedClassId === classItem.id}

                <div class="border border-gray-200 rounded-lg p-3 hover:border-orange-300 transition-colors">
                  <h4 class="text-sm font-medium text-gray-900 mb-2">{classItem.title}</h4>
                  <p class="text-xs font-medium text-orange-600 mb-2">{formatDateTime(classItem.start)}</p>

                  <div class="flex items-center gap-1.5 mb-2">
                    {#if isEnrolled}
                      <button
                        disabled
                        class="flex-1 px-2 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded border border-green-200 cursor-not-allowed"
                      >
                        ✓ Enrolled
                      </button>
                    {:else}
                      <button
                        on:click={() => reserveSpot(classItem)}
                        disabled={isEnrolling}
                        class="flex-1 px-2 py-1.5 bg-orange-500 text-white text-xs font-medium rounded hover:bg-orange-600 cursor-pointer disabled:opacity-50"
                      >
                        {isEnrolling ? 'Reserving...' : 'Reserve Spot'}
                      </button>
                    {/if}
                    <button
                      on:click={() => expandedClassId = isExpanded ? null : classItem.id}
                      class="px-2 py-1.5 text-xs text-orange-600 hover:text-orange-700 cursor-pointer border border-orange-200 rounded"
                    >
                      {isExpanded ? 'Less' : 'More'}
                    </button>
                  </div>

                  <!-- Expandable details section -->
                  {#if isExpanded}
                    <div class="pt-2 border-t border-gray-200 space-y-1.5" transition:fade>
                      {#if classItem.teacher}
                        <p class="text-xs text-gray-600">
                          <span class="font-medium">Teacher:</span> {classItem.teacher}
                        </p>
                      {/if}
                      <p class="text-xs text-gray-600">
                        <span class="font-medium">Duration:</span> {classItem.duration_minutes} min
                      </p>
                      <p class="text-xs text-gray-600">
                        <span class="font-medium">Spots:</span> {classItem.capacity}
                      </p>
                      {#if classItem.description}
                        <p class="text-xs text-gray-600">
                          <span class="font-medium">Description:</span> {classItem.description}
                        </p>
                      {/if}
                      {#if classItem.notes}
                        <p class="text-xs text-gray-600">
                          <span class="font-medium">Notes:</span> {classItem.notes}
                        </p>
                      {/if}
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </section>
      </div>

      <!-- RIGHT: My Upcoming Classes Sidebar -->
      <aside class="lg:w-80 w-full">
        <div class="bg-white rounded-lg shadow-sm border border-green-100 sticky top-20">
          <div class="p-3 border-b border-green-100 bg-green-50">
            <h3 class="text-sm font-semibold text-gray-900">My Upcoming Classes</h3>
            <p class="text-xs text-gray-600 mt-0.5">{myClasses.length} {myClasses.length === 1 ? 'class' : 'classes'} booked</p>
          </div>

          {#if myClasses.length === 0}
            <div class="p-6 text-center text-gray-500 text-xs">
              No classes booked yet
            </div>
          {:else}
            <div class="divide-y divide-gray-100 max-h-[580px] overflow-y-auto">
              {#each myClasses as enrollment (enrollment.enrollment_id)}
                <div class="p-3 hover:bg-gray-50 transition-colors" transition:fade>
                  <h4 class="text-sm font-medium text-gray-900 mb-1">{enrollment.class.title}</h4>
                  <p class="text-xs font-medium text-green-600 mb-3">{formatDateTime(enrollment.class.start)}</p>

                  <div class="space-y-1.5">
                    {#if enrollment.class.zoom_link}
                      <a
                        href={enrollment.class.zoom_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="block w-full px-3 py-2 bg-orange-500 text-white text-sm font-medium rounded hover:bg-orange-600 cursor-pointer text-center"
                      >
                        Join Class
                      </a>
                    {/if}
                    <button
                      on:click={() => cancelSpot(enrollment)}
                      class="w-full px-3 py-1.5 text-xs text-gray-600 hover:text-red-600 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </aside>
    </div>
  </main>

  <!-- Toast -->
  {#if showToast}
    <div class="fixed top-6 right-6 z-50 max-w-sm" transition:fade>
      <div
        class="bg-white rounded-lg shadow-lg border-l-4 p-4"
        class:border-green-500={toastType === 'success'}
        class:border-red-500={toastType === 'error'}
      >
        <div class="flex items-center gap-3">
          {#if toastType === 'success'}
            <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          {:else}
            <svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          {/if}
          <p class="text-sm font-medium text-gray-900 flex-1">{toastMessage}</p>
          <button on:click={() => showToast = false} class="text-gray-400 hover:text-gray-600">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
