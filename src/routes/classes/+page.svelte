<script>
  import { fade } from 'svelte/transition';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import StudentNav from '$lib/components/StudentNav.svelte';
  import Onboarding from '$lib/components/onboarding.svelte';
  import AccessRestrictionModal from '$lib/components/AccessRestrictionModal.svelte';

  export let data;

  // Profile timezone (used for emails/notifications) - from server
  const profileTz = data.tz || Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Viewing timezone (either from URL param or profile) - from server
  $: viewingTz = data.viewingTz || profileTz;

  // Active timezone for display
  $: tz = viewingTz;

  let showToast = false;
  let toastMessage = '';
  let toastType = 'success';
  let selectedClass = null;
  let enrollingClassId = null;

  let enrolledClassIds = new Set(data.enrolledClassIds || []);

  // Store myClasses as a mutable variable so we can update it
  let myClasses = data.myClasses || [];

  // Get user's level number
  const userLevelNum = data.user.level_number ? parseInt(data.user.level_number) : null;
  const canShowPreviousLevel = userLevelNum && userLevelNum >= 2 && userLevelNum <= 6;
  const previousLevelName = canShowPreviousLevel ? `Level ${userLevelNum - 1}` : null;

  // Check which level we're currently viewing from URL
  $: currentViewLevel = $page.url.searchParams.get('level') || data.user.level;

  // Handle level toggle - full page reload with query parameter
  function toggleToLevel(levelName) {
    const url = new URL(window.location.href);
    if (levelName === data.user.level) {
      // Switching back to user's own level - remove query param
      url.searchParams.delete('level');
    } else {
      // Switching to different level
      url.searchParams.set('level', levelName);
    }
    window.location.href = url.toString();
  }

  // Create a map of class_id to enrollment info (reactive based on myClasses)
  $: enrollmentMap = new Map(myClasses.map(e => [e.class_id, e]));

  // Prep status: enrollment_id -> Set of completed prep_item_ids
  // Convert arrays from server to Sets for easier lookups
  $: prepStatus = Object.entries(data.prepStatus || {}).reduce((acc, [enrollmentId, itemIds]) => {
    acc[enrollmentId] = new Set(itemIds);
    return acc;
  }, {});

  // Generate calendar for 4 weeks (current week + 3 more weeks)
  // This doesn't need to be timezone-aware - we just need the UTC dates
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
  const calendarDays = (() => {
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
  })();

  // Group classes by date (simple grouping, no timezone conversion needed)
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

  function formatTimeRange(startDateStr, durationMinutes) {
    const start = new Date(startDateStr);
    const end = new Date(start.getTime() + durationMinutes * 60000);

    const startTime = start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: tz
    });

    const endTime = end.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: tz
    });

    return `${startTime} - ${endTime}`;
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

      // Update enrolledClassIds
      enrolledClassIds.add(classItem.id);
      enrolledClassIds = enrolledClassIds;

      // Add the new enrollment to myClasses so cancellation works
      if (result.enrollment) {
        myClasses = [...myClasses, {
          enrollment_id: result.enrollment.id,
          class_id: classItem.id,
          status: result.enrollment.status,
          enrolled_at: result.enrollment.enrolled_at,
          class: classItem
        }];
      }

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

      // Remove from enrolledClassIds
      enrolledClassIds.delete(classId);
      enrolledClassIds = enrolledClassIds;

      // Remove from myClasses so it's truly removed from state
      myClasses = myClasses.filter(e => e.enrollment_id !== enrollmentId);

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
  const endOfRange = (() => {
    const end = new Date(startOfWeek);
    end.setDate(startOfWeek.getDate() + 27);
    return end;
  })();

  function formatDateRange() {
    const startMonth = startOfWeek.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    const endMonth = endOfRange.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    return `${startMonth} - ${endMonth}`;
  }

  // Generate Google Calendar link for a class
  function generateGoogleCalendarLink(classItem) {
    const startDate = new Date(classItem.start);
    const endDate = new Date(startDate.getTime() + classItem.duration_minutes * 60000);

    const formatDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: classItem.title || 'Spanish Class',
      dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
      details: `Topic: ${classItem.topic || 'Spanish Class'}\nTeacher: ${classItem.teacher}\n\nJoin via Zoom: ${classItem.zoom_link}\n\nView your dashboard: https://my.expatspanishlessons.com/dashboard`,
      location: 'Zoom (Online)',
      trp: 'false'
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  // Generate iCal download link
  function generateICalLink(classItem) {
    return `https://my.expatspanishlessons.com/api/calendar/ics/${classItem.id}`;
  }

  // Common timezones list
  const commonTimezones = [
    { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
    { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
    { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
    { value: 'America/Phoenix', label: 'Arizona' },
    { value: 'America/Anchorage', label: 'Alaska' },
    { value: 'Pacific/Honolulu', label: 'Hawaii' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris, Berlin, Madrid' },
    { value: 'Europe/Istanbul', label: 'Istanbul' },
    { value: 'Africa/Cairo', label: 'Cairo' },
    { value: 'Asia/Dubai', label: 'Dubai' },
    { value: 'Asia/Kolkata', label: 'India' },
    { value: 'Asia/Bangkok', label: 'Bangkok' },
    { value: 'Asia/Singapore', label: 'Singapore' },
    { value: 'Asia/Shanghai', label: 'Beijing, Shanghai' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
    { value: 'Australia/Sydney', label: 'Sydney' },
    { value: 'Pacific/Auckland', label: 'Auckland' },
    { value: 'UTC', label: 'UTC' }
  ];

  let updatingProfileTz = false;
  let showTzDropdown = false;

  function handleTimezoneSelect(newTz) {
    showTzDropdown = false;

    const url = new URL(window.location.href);

    if (newTz === profileTz) {
      // Switching back to profile timezone - remove query param
      url.searchParams.delete('tz');
    } else {
      // Switching to different timezone
      url.searchParams.set('tz', newTz);
    }

    // Full page reload with new timezone
    window.location.href = url.toString();
  }

  // Get current timezone label
  function getCurrentLabel() {
    const current = commonTimezones.find(tz => tz.value === viewingTz);
    return current ? current.label : viewingTz;
  }

  // Close dropdown when clicking outside
  onMount(() => {
    function handleClickOutside(event) {
      if (showTzDropdown && !event.target.closest('.timezone-dropdown-container')) {
        showTzDropdown = false;
      }
    }

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  });

  async function updateProfileTimezone() {
    updatingProfileTz = true;
    try {
      const response = await fetch('/api/update-timezone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tz: viewingTz })
      });

      if (!response.ok) {
        toastMessage = 'Failed to update profile timezone';
        toastType = 'error';
        showToast = true;
        setTimeout(() => showToast = false, 4000);
        return;
      }

      // Update succeeded - reload page to reflect new profile timezone
      toastMessage = 'Profile timezone updated successfully';
      toastType = 'success';
      showToast = true;
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error('Error updating timezone:', err);
      toastMessage = 'Failed to update profile timezone';
      toastType = 'error';
      showToast = true;
      setTimeout(() => showToast = false, 4000);
    } finally {
      updatingProfileTz = false;
    }
  }
</script>

<svelte:head>
  <title>Browse Classes - ESPL</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <StudentNav user={data.user} />
  <Onboarding {data} />

  <!-- Main Content -->
  <main class="lg:ml-56 relative h-screen flex flex-col">
    <!-- Header -->
    <div class="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 flex-shrink-0">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div class="flex items-baseline gap-2">
            <h1 class="text-2xl font-bold text-gray-900">
              {currentViewLevel} Live Classes
            </h1>
          </div>
          <p class="text-sm text-gray-600 mt-1">{formatDateRange()}</p>
        </div>

        <div class="flex items-center gap-3 flex-wrap">
          <!-- Timezone Selector -->
          <div class="relative timezone-dropdown-container">
            <button
              on:click={() => showTzDropdown = !showTzDropdown}
              class="inline-flex items-center gap-2 pl-9 pr-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div class="absolute left-3">
                <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span>{getCurrentLabel()}</span>
              <svg class="w-4 h-4 text-gray-500 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {#if showTzDropdown}
              <div
                class="fixed sm:absolute top-auto sm:top-full left-4 right-4 sm:left-auto sm:right-0 mt-1 w-auto sm:w-80 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-[60vh] overflow-y-auto"
                on:click|stopPropagation
              >
                {#each commonTimezones as timezone}
                  <button
                    on:click={() => handleTimezoneSelect(timezone.value)}
                    class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between gap-2 transition-colors first:rounded-t-lg last:rounded-b-lg"
                    class:bg-orange-50={timezone.value === viewingTz}
                  >
                    <span class="flex-1 truncate">{timezone.label}</span>
                    {#if timezone.value === profileTz}
                      <span class="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded flex-shrink-0">Default</span>
                    {/if}
                  </button>
                {/each}
              </div>
            {/if}
          </div>

          <!-- Level Toggle -->
          {#if canShowPreviousLevel}
            <div class="inline-flex rounded-lg border border-gray-300 bg-white p-1">
              <button
                on:click={() => toggleToLevel(data.user.level)}
                class="px-4 py-2 text-sm font-medium rounded-md transition-colors"
                class:bg-orange-500={currentViewLevel === data.user.level}
                class:text-white={currentViewLevel === data.user.level}
                class:text-gray-700={currentViewLevel !== data.user.level}
                class:hover:bg-gray-100={currentViewLevel !== data.user.level}
              >
                {data.user.level}
              </button>
              <button
                on:click={() => toggleToLevel(previousLevelName)}
                class="px-4 py-2 text-sm font-medium rounded-md transition-colors"
                class:bg-orange-500={currentViewLevel === previousLevelName}
                class:text-white={currentViewLevel === previousLevelName}
                class:text-gray-700={currentViewLevel !== previousLevelName}
                class:hover:bg-gray-100={currentViewLevel !== previousLevelName}
              >
                {previousLevelName}
              </button>
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Timezone Info Banner -->
    {#if viewingTz !== profileTz}
      <div class="mx-4 sm:mx-6 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start justify-between gap-3 flex-shrink-0">
        <div class="flex-1">
          <p class="text-sm text-blue-900">
            Viewing times in <span class="font-semibold">{viewingTz}</span>.
            Want to make this your default?
            <button
              on:click={updateProfileTimezone}
              disabled={updatingProfileTz}
              class="font-semibold underline hover:text-blue-700 disabled:opacity-50"
            >
              {updatingProfileTz ? 'Updating...' : 'Update My Profile Timezone'}
            </button>
          </p>
        </div>
        <button
          on:click={() => {
            const url = new URL(window.location.href);
            url.searchParams.delete('tz');
            window.location.href = url.toString();
          }}
          class="text-blue-700 hover:text-blue-900 transition-colors flex-shrink-0"
          title="Switch back to profile timezone"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    {/if}

    <!-- Calendar View -->
    <div class="mx-4 sm:mx-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative flex-1 flex flex-col">
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
      <div class="grid grid-cols-7 h-full">
        {#each calendarDays as { date, isCurrentMonth }}
          {@const dayClasses = getClassesForDay(date)}
          {@const isToday = date.toDateString() === today.toDateString()}

          <div
            class="border-r border-b border-gray-200 p-1 sm:p-2 bg-white"
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
                  {@const isFull = classItem.available_spaces === 0}
                  {@const isPast = classItem.isPast}
                  <button
                    on:click={() => openClassDetails(classItem)}
                    class="w-full text-left px-1.5 py-1 rounded transition-colors border-2"
                    class:opacity-75={isPast}
                    class:border-gray-400={isPast}
                    class:border-dashed={isPast}
                    class:border-transparent={!isPast}
                    class:bg-green-100={isEnrolled && !isPast}
                    class:text-green-700={isEnrolled && !isPast}
                    class:hover:bg-green-200={isEnrolled && !isPast}
                    class:bg-green-50={isEnrolled && isPast}
                    class:text-green-600={isEnrolled && isPast}
                    class:hover:bg-green-100={isEnrolled && isPast}
                    class:bg-gray-100={!isEnrolled && isFull && !isPast}
                    class:text-gray-500={!isEnrolled && isFull && !isPast}
                    class:hover:bg-gray-200={!isEnrolled && isFull && !isPast}
                    class:bg-gray-50={!isEnrolled && isFull && isPast}
                    class:text-gray-400={!isEnrolled && isFull && isPast}
                    class:bg-orange-100={!isEnrolled && !isFull && !isPast}
                    class:text-orange-700={!isEnrolled && !isFull && !isPast}
                    class:hover:bg-orange-200={!isEnrolled && !isFull && !isPast}
                    class:bg-orange-50={!isEnrolled && !isFull && isPast}
                    class:text-orange-600={!isEnrolled && !isFull && isPast}
                  >
                    <div class="flex items-center justify-between gap-1">
                      <span class="text-[11px] font-medium truncate">{formatTime(classItem.start)}</span>
                      {#if isEnrolled}
                        <span class="flex-shrink-0 text-xs">✓</span>
                      {/if}
                    </div>
                    <div class="text-[11px] truncate mt-0.5 font-medium">
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
    <div class="mx-4 sm:mx-6 my-4 flex flex-wrap gap-4 text-sm flex-shrink-0">
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 bg-orange-100 rounded"></div>
        <span class="text-gray-600">Available</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 bg-green-100 rounded"></div>
        <span class="text-gray-600">Enrolled</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 bg-gray-100 rounded border border-gray-300"></div>
        <span class="text-gray-600">Full</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 bg-white rounded border-2 border-dashed border-gray-400"></div>
        <span class="text-gray-600">Past classes</span>
      </div>
    </div>

    <!-- Access Restriction Modal (inside main content area) -->
    <AccessRestrictionModal accessLevel={data.user.access_level} />
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
                Scheduled
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
              <span>{formatTimeRange(selectedClass.start, selectedClass.duration_minutes)} ({tz})</span>
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
            {@const isPast = selectedClass.isPast}

            <!-- Enrolled: Show Join and Cancel or Past Indicator -->
            <div class="space-y-3">
              {#if isPast}
                <!-- Past class - show disabled state -->
                <div class="w-full px-4 py-2.5 text-sm font-medium rounded bg-gray-200 text-gray-600 text-center">
                  Class Ended
                </div>
              {:else}
                <!-- Active class - show Join and Cancel -->
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
              {/if}

              <!-- Calendar Export Buttons - only if not past -->
              {#if !selectedClass.isPast}
                <div class="pt-2 border-t border-gray-200">
                  <p class="text-xs text-gray-600 mb-2">Add to your calendar:</p>
                  <div class="flex gap-2">
                    <a
                      href={generateGoogleCalendarLink(selectedClass)}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex-1 px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Google
                    </a>
                    <a
                      href={generateICalLink(selectedClass)}
                      class="flex-1 px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      iCal
                    </a>
                  </div>
                </div>
              {/if}
            </div>
          {:else}
            {@const isEnrolling = enrollingClassId === selectedClass.id}
            {@const isFull = selectedClass.available_spaces === 0}
            {@const isPast = selectedClass.isPast}

            <!-- Not enrolled: Show Reserve button or Past indicator -->
            {#if isPast}
              <div class="w-full px-4 py-2.5 text-sm font-medium rounded bg-gray-200 text-gray-600 text-center">
                Class Ended
              </div>
            {:else}
              <button
                on:click={() => reserveSpot(selectedClass)}
                disabled={isEnrolling || isFull}
                class="w-full px-4 py-2.5 text-sm font-medium rounded transition-colors"
                class:bg-orange-500={!isFull}
                class:hover:bg-orange-600={!isFull}
                class:text-white={!isFull}
                class:bg-gray-300={isFull}
                class:text-gray-600={isFull}
                class:cursor-not-allowed={isFull}
                class:disabled:opacity-50={!isFull}
              >
                {#if isFull}
                  Class Full
                {:else if isEnrolling}
                  Reserving...
                {:else}
                  Reserve Spot
                {/if}
              </button>
            {/if}
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
