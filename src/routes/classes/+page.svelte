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
          <!-- Date & Time -->
          <div>
            <p class="text-sm font-semibold text-gray-700 mb-1">Date & Time</p>
            <p class="text-base text-orange-600 font-medium">{formatDate(selectedClass.start)}</p>
            <p class="text-sm text-gray-600">at {formatTime(selectedClass.start)}</p>
          </div>

          <!-- Teacher -->
          {#if selectedClass.teacher}
            <div>
              <p class="text-sm font-semibold text-gray-700 mb-1">Teacher</p>
              <p class="text-base text-gray-900">{selectedClass.teacher}</p>
            </div>
          {/if}

          <!-- Duration & Capacity -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm font-semibold text-gray-700 mb-1">Duration</p>
              <p class="text-base text-gray-900">{selectedClass.duration_minutes} minutes</p>
            </div>
            {#if selectedClass.capacity}
              <div>
                <p class="text-sm font-semibold text-gray-700 mb-1">Capacity</p>
                <p class="text-base text-gray-900">{selectedClass.capacity} students</p>
              </div>
            {/if}
          </div>

          <!-- Levels -->
          {#if selectedClass.levels && selectedClass.levels.length > 0}
            <div>
              <p class="text-sm font-semibold text-gray-700 mb-1">Levels</p>
              <div class="flex flex-wrap gap-2">
                {#each selectedClass.levels as level}
                  <span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">{level}</span>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Description -->
          {#if selectedClass.description}
            <div>
              <p class="text-sm font-semibold text-gray-700 mb-1">Description</p>
              <p class="text-sm text-gray-600">{selectedClass.description}</p>
            </div>
          {/if}

          <!-- Notes -->
          {#if selectedClass.notes}
            <div>
              <p class="text-sm font-semibold text-gray-700 mb-1">Notes</p>
              <p class="text-sm text-gray-600">{selectedClass.notes}</p>
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
