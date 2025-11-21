<script>
  import { fade } from 'svelte/transition';
  import StudentNav from '$lib/components/StudentNav.svelte';
  import Onboarding from '$lib/components/onboarding.svelte';

  export let data;

  const tz = data.tz || Intl.DateTimeFormat().resolvedOptions().timeZone;

  let showToast = false;
  let toastMessage = '';
  let toastType = 'success';
  let selectedClass = null;
  let enrollingClassId = null;

  let enrolledClassIds = new Set(data.enrolledClassIds || []);

  // Create a map of class_id to enrollment info
  $: enrollmentMap = new Map((data.myClasses || []).map(e => [e.class_id, e]));

  // Prep status: enrollment_id -> Set of completed prep_item_ids
  // Convert arrays from server to Sets for easier lookups
  $: prepStatus = Object.entries(data.prepStatus || {}).reduce((acc, [enrollmentId, itemIds]) => {
    acc[enrollmentId] = new Set(itemIds);
    return acc;
  }, {});

  // Generate calendar for 4 weeks (current week + 3 more weeks)
  const today = new Date();

  // Get first day of current week (Sunday)
  function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  const startOfWeek = getStartOfWeek(today);

  // Generate all days for the calendar grid (4 weeks = 28 days)
  function generateCalendarDays() {
    const days = [];

    // Add 4 weeks (28 days) starting from the beginning of current week
    for (let i = 0; i < 28; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push({
        date,
        isCurrentMonth: true // All days are visible/active in 4-week view
      });
    }

    return days;
  }

  $: calendarDays = generateCalendarDays();

  // Group classes by date
  $: classesByDate = (data.availableClasses || []).reduce((acc, classItem) => {
    const dateKey = new Date(classItem.start).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(classItem);
    return acc;
  }, {});

  function getClassesForDay(date) {
    return classesByDate[date.toDateString()] || [];
  }

  function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: tz
    });
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: tz
    });
  }

  function openClassDetails(classItem) {
    selectedClass = classItem;
  }

  function closeModal() {
    selectedClass = null;
  }

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
        toastMessage = result.error || 'Failed to reserve spot';
        toastType = 'error';
        showToast = true;
        setTimeout(() => showToast = false, 4000);
        enrollingClassId = null;
        return;
      }

      enrolledClassIds.add(classItem.id);
      enrolledClassIds = enrolledClassIds;

      toastMessage = 'Spot reserved successfully!';
      toastType = 'success';
      showToast = true;
      setTimeout(() => showToast = false, 3000);
      closeModal();
    } catch (err) {
      console.error('Error:', err);
      toastMessage = 'Failed to reserve spot';
      toastType = 'error';
      showToast = true;
      setTimeout(() => showToast = false, 4000);
    } finally {
      enrollingClassId = null;
    }
  }

  let cancellingEnrollmentId = null;

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
        toastType = 'error';
        showToast = true;
        setTimeout(() => showToast = false, 3000);
        return;
      }

      // Update local state by creating a new object and Set to trigger reactivity
      const newPrepStatus = {};

      // Deep copy existing Sets
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

      prepStatus = newPrepStatus; // Assign new object to trigger reactivity
    } catch (err) {
      console.error('Error toggling prep item:', err);
      toastMessage = 'Failed to update prep item';
      toastType = 'error';
      showToast = true;
      setTimeout(() => showToast = false, 3000);
    }
  }

  async function cancelEnrollment(enrollmentId, classId) {
    if (cancellingEnrollmentId === enrollmentId) return;
    cancellingEnrollmentId = enrollmentId;

    try {
      const response = await fetch('/api/enrollments/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollment_id: enrollmentId })
      });

      const result = await response.json();

      if (!response.ok) {
        toastMessage = result.error || 'Failed to cancel enrollment';
        toastType = 'error';
        showToast = true;
        setTimeout(() => showToast = false, 4000);
        cancellingEnrollmentId = null;
        return;
      }

      enrolledClassIds.delete(classId);
      enrolledClassIds = enrolledClassIds;

      toastMessage = 'Class cancelled successfully';
      toastType = 'success';
      showToast = true;
      setTimeout(() => showToast = false, 3000);
      closeModal();
    } catch (err) {
      console.error('Error:', err);
      toastMessage = 'Failed to cancel enrollment';
      toastType = 'error';
      showToast = true;
      setTimeout(() => showToast = false, 4000);
    } finally {
      cancellingEnrollmentId = null;
    }
  }

  // Calculate date range for header
  const endOfRange = new Date(startOfWeek);
  endOfRange.setDate(startOfWeek.getDate() + 27); // Last day of 4 weeks

  function formatDateRange() {
    const startMonth = startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endMonth = endOfRange.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startMonth} - ${endMonth}`;
  }
</script>

<svelte:head>
  <title>Browse Classes - ESPL</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <StudentNav user={data.user} />
  <Onboarding {data} />

  <!-- Main Content -->
  <main class="lg:ml-56 p-4 sm:p-6 max-w-7xl">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-2 mb-1">
        <h1 class="text-2xl font-bold text-gray-900">Browse Classes</h1>
        {#if data.user.level}
          <span class="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">
            {data.user.level}
          </span>
        {/if}
      </div>
      <p class="text-sm text-gray-600">{formatDateRange()}</p>
    </div>

    <!-- Calendar View -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <!-- Weekday Headers -->
      <div class="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day}
          <div class="py-2 px-1 text-center text-xs sm:text-sm font-semibold text-gray-700">
            <span class="hidden sm:inline">{day}</span>
            <span class="sm:hidden">{day[0]}</span>
          </div>
        {/each}
      </div>

      <!-- Calendar Grid -->
      <div class="grid grid-cols-7">
        {#each calendarDays as { date, isCurrentMonth }}
          {@const dayClasses = getClassesForDay(date)}
          {@const isToday = date.toDateString() === today.toDateString()}

          <div
            class="min-h-20 sm:min-h-24 md:min-h-32 border-r border-b border-gray-200 p-1 sm:p-2 bg-white"
          >
            <!-- Day Number -->
            <div class="flex items-center justify-between mb-1">
              <span
                class="text-xs sm:text-sm font-medium text-gray-900"
                class:bg-orange-500={isToday}
                class:text-white={isToday}
                class:rounded-full={isToday}
                class:w-5={isToday}
                class:h-5={isToday}
                class:sm:w-6={isToday}
                class:sm:h-6={isToday}
                class:flex={isToday}
                class:items-center={isToday}
                class:justify-center={isToday}
              >
                {date.getDate()}
              </span>
            </div>

            <!-- Classes for this day -->
            {#if dayClasses.length > 0}
              <div class="space-y-1">
                {#each dayClasses.slice(0, 4) as classItem}
                  {@const isEnrolled = enrolledClassIds.has(classItem.id)}
                  <button
                    on:click={() => openClassDetails(classItem)}
                    class="w-full text-left px-1.5 py-1 rounded text-xs transition-colors"
                    class:bg-green-100={isEnrolled}
                    class:text-green-700={isEnrolled}
                    class:hover:bg-green-200={isEnrolled}
                    class:bg-orange-100={!isEnrolled}
                    class:text-orange-700={!isEnrolled}
                    class:hover:bg-orange-200={!isEnrolled}
                  >
                    <div class="flex items-center justify-between gap-1">
                      <span class="font-medium truncate">{formatTime(classItem.start)}</span>
                      {#if isEnrolled}
                        <span class="flex-shrink-0">✓</span>
                      {/if}
                    </div>
                    <div class="hidden sm:block text-[10px] truncate mt-0.5 opacity-75">
                      {classItem.title}
                    </div>
                  </button>
                {/each}
                {#if dayClasses.length > 4}
                  <div class="text-xs text-gray-500 px-1 text-center">+{dayClasses.length - 4}</div>
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <!-- Legend -->
    <div class="mt-4 flex flex-wrap gap-4 text-sm">
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 bg-orange-100 rounded"></div>
        <span class="text-gray-600">Available</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 bg-green-100 rounded"></div>
        <span class="text-gray-600">Enrolled</span>
      </div>
    </div>
  </main>

  <!-- Class Details Modal -->
  {#if selectedClass}
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      on:click={closeModal}
      transition:fade
    >
      <div
        class="bg-white rounded-lg shadow-2xl border border-gray-300 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        on:click|stopPropagation
      >
        <!-- Modal Header -->
        <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-2 flex-1">
            <h3 class="text-lg font-bold text-gray-900">{selectedClass.title}</h3>

            <!-- Description tooltip icon -->
            {#if selectedClass.description}
              <div class="relative group">
                <button class="text-gray-400 hover:text-gray-600">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <div class="hidden group-hover:block absolute z-10 top-full left-0 mt-2 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg max-w-xs w-64">
                  {selectedClass.description}
                  <div class="absolute bottom-full left-4 w-2 h-2 bg-gray-900 transform rotate-45 mb-1"></div>
                </div>
              </div>
            {/if}

            {#if enrolledClassIds.has(selectedClass.id)}
              <span class="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded flex items-center gap-1">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                Enrolled
              </span>
            {/if}
          </div>
          <button
            on:click={closeModal}
            class="text-gray-400 hover:text-gray-600 transition-colors ml-2"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal Content -->
        <div class="px-6 py-4 space-y-4">
          <!-- Topic (if available) -->
          {#if selectedClass.topic}
            <div>
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Topic</p>
              <p class="text-base font-medium text-gray-900">{selectedClass.topic}</p>
            </div>
          {/if}

          <!-- Class details stacked vertically -->
          <div class="space-y-2 text-sm text-gray-600">
            <div class="flex items-center gap-1.5">
              <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDate(selectedClass.start)}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formatTime(selectedClass.start)} • {selectedClass.duration_minutes} min</span>
            </div>
            {#if selectedClass.teacher}
              <div class="flex items-center gap-1.5">
                <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{selectedClass.teacher}</span>
              </div>
            {/if}
            <div class="flex items-center gap-1.5">
              <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span class={selectedClass.available_spaces === 0 ? 'text-red-600 font-medium' : ''}>
                {selectedClass.available_spaces} {selectedClass.available_spaces === 1 ? 'space' : 'spaces'} left
              </span>
            </div>
          </div>

          <!-- Notes -->
          {#if selectedClass.notes}
            <div>
              <p class="text-sm font-semibold text-gray-700 mb-1">Notes</p>
              <p class="text-sm text-gray-600">{selectedClass.notes}</p>
            </div>
          {/if}

          <!-- Prep Items -->
          {#if selectedClass.prep_items && selectedClass.prep_items.length > 0}
            <div class="border-t border-gray-200 pt-4 mt-4">
              <p class="text-sm font-semibold text-gray-700 mb-3">Class Preparation</p>
              <div class="space-y-2">
                {#each selectedClass.prep_items as prepItem}
                  {@const enrollment = enrollmentMap.get(selectedClass.id)}
                  {@const completedItems = enrollment ? (prepStatus[enrollment.enrollment_id] || new Set()) : new Set()}
                  {@const isCompleted = completedItems.has(prepItem.id)}

                  <div class="p-3 bg-gray-50 rounded border border-gray-200">
                    <div class="flex items-center gap-2">
                      <!-- Checkbox (only for enrolled students) -->
                      {#if enrolledClassIds.has(selectedClass.id)}
                        <input
                          type="checkbox"
                          checked={isCompleted}
                          on:change={(e) => togglePrepItem(enrollment.enrollment_id, prepItem.id, e.target.checked)}
                          class="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 flex-shrink-0"
                        />
                      {/if}

                      <div class="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                        <span class="text-sm font-medium text-gray-900">{prepItem.title}</span>
                        {#if prepItem.is_required}
                          <span class="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded font-medium flex-shrink-0">Required</span>
                        {/if}
                        {#if prepItem.kind}
                          <span class="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded capitalize flex-shrink-0">{prepItem.kind}</span>
                        {/if}
                        {#if prepItem.url}
                          <a
                            href={prepItem.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 flex-shrink-0"
                            title={prepItem.description || 'Open resource'}
                          >
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            <span>Open link</span>
                          </a>
                        {/if}
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>

        <!-- Modal Footer -->
        <div class="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          {#if enrolledClassIds.has(selectedClass.id)}
            {@const enrollment = enrollmentMap.get(selectedClass.id)}
            {@const isCancelling = cancellingEnrollmentId === enrollment?.enrollment_id}

            <!-- Enrolled: Show Join and Cancel -->
            <div class="flex gap-2">
              {#if selectedClass.zoom_link}
                <a
                  href={selectedClass.zoom_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex-1 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 text-center transition-colors"
                >
                  Join Class
                </a>
              {/if}

              <button
                on:click={() => cancelEnrollment(enrollment.enrollment_id, selectedClass.id)}
                disabled={isCancelling}
                class="px-4 py-2 text-gray-600 text-sm rounded hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel My Class'}
              </button>
            </div>
          {:else}
            {@const isEnrolling = enrollingClassId === selectedClass.id}

            <!-- Not enrolled: Show Reserve button -->
            <button
              on:click={() => reserveSpot(selectedClass)}
              disabled={isEnrolling}
              class="w-full px-4 py-2.5 bg-orange-500 text-white text-sm font-medium rounded hover:bg-orange-600 disabled:opacity-50"
            >
              {isEnrolling ? 'Reserving...' : 'Reserve Spot'}
            </button>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  <!-- Toast -->
  {#if showToast}
    <div class="fixed top-6 right-6 z-50 max-w-sm" transition:fade>
      <div class="bg-white rounded-lg shadow-lg border-l-4 p-4"
           class:border-green-500={toastType === 'success'}
           class:border-red-500={toastType === 'error'}>
        <p class="text-sm font-medium text-gray-900">{toastMessage}</p>
      </div>
    </div>
  {/if}
</div>
