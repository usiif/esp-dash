<script>
  import { createEventDispatcher } from 'svelte';

  export let events = [];
  export let calendarHeight = 'calc(100vh - 220px)';

  const dispatch = createEventDispatcher();

  let currentWeekOffset = 0; // 0 = this week, 1 = next week, -1 = last week
  let viewMode = 'week'; // 'week' or 'month'

  // Get Sunday of current week
  function getSundayOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Sunday is day 0
    const sunday = new Date(d.setDate(diff));
    sunday.setHours(0, 0, 0, 0);
    return sunday;
  }

  // Generate calendar for current view
  $: currentDate = (() => {
    const d = new Date();
    const sunday = getSundayOfWeek(d);
    sunday.setDate(sunday.getDate() + (currentWeekOffset * 7));
    sunday.setHours(0, 0, 0, 0);
    return sunday;
  })();

  // Generate 7 days for week view
  $: weekDays = (() => {
    if (viewMode !== 'week') return [];
    const result = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentDate);
      d.setDate(currentDate.getDate() + i);
      result.push(d);
    }
    return result;
  })();

  // Generate days for month view (4 weeks starting from current week's Sunday)
  $: monthDays = (() => {
    if (viewMode !== 'month') return [];
    const result = [];

    // Start from current week's Sunday and show 4 weeks (28 days)
    for (let i = 0; i < 28; i++) {
      const d = new Date(currentDate);
      d.setDate(currentDate.getDate() + i);
      result.push({ date: d, isCurrentMonth: true });
    }

    return result;
  })();

  // Group events by date
  $: eventsByDate = (() => {
    const map = {};
    events.forEach(ev => {
      if (!ev.start) return;
      const date = new Date(ev.start);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    // Sort events within each day by start time
    Object.values(map).forEach(dayEvents => {
      dayEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
    });
    return map;
  })();

  function getDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function formatTime(isoString) {
    const date = new Date(isoString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')}${ampm}`;
  }

  function isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  function openEvent(ev) {
    dispatch('open', ev);
  }

  function createClass(date) {
    const d = new Date(date);
    d.setHours(9, 0, 0, 0);
    dispatch('create', { date: d.toISOString() });
  }

  function prev() {
    currentWeekOffset--;
  }

  function next() {
    currentWeekOffset++;
  }

  function goToToday() {
    currentWeekOffset = 0;
  }

  function toggleView() {
    viewMode = viewMode === 'week' ? 'month' : 'week';
    currentWeekOffset = 0; // Reset to current period when switching
  }

  $: displayRange = (() => {
    const endDate = new Date(currentDate);
    if (viewMode === 'week') {
      endDate.setDate(endDate.getDate() + 6);
    } else {
      endDate.setDate(endDate.getDate() + 27); // 4 weeks
    }
    return `${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  })();

  function getTeacherInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
</script>

<div class="flex flex-col h-full bg-white rounded-lg shadow-sm border" style="height: {calendarHeight};">
  <!-- Header with controls -->
  <div class="flex items-center justify-between p-4 border-b flex-shrink-0">
    <div class="flex items-center gap-3">
      <button
        on:click={prev}
        class="px-3 py-1.5 border rounded hover:bg-gray-50 text-sm font-medium"
      >
        ← Previous
      </button>
      <button
        on:click={goToToday}
        class="px-4 py-1.5 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm font-medium"
      >
        Today
      </button>
      <button
        on:click={next}
        class="px-3 py-1.5 border rounded hover:bg-gray-50 text-sm font-medium"
      >
        Next →
      </button>
    </div>

    <div class="text-sm font-medium text-gray-700">
      {displayRange}
    </div>

    <div class="flex items-center gap-2">
      <button
        on:click={toggleView}
        class="px-4 py-1.5 border rounded hover:bg-gray-50 text-sm font-medium"
      >
        {viewMode === 'week' ? 'Month View' : 'Week View'}
      </button>
    </div>
  </div>

  <!-- Calendar grid -->
  <div class="flex-1 overflow-auto p-4">
    {#if viewMode === 'week'}
      <!-- Week View - Detailed -->
      <div class="grid grid-cols-7 gap-3 min-h-full">
        {#each weekDays as day}
          {@const dateKey = getDateKey(day)}
          {@const dayEvents = eventsByDate[dateKey] || []}
          {@const today = isToday(day)}

        <div
          class="flex flex-col border rounded-lg overflow-hidden min-h-[200px]"
          class:ring-2={today}
          class:ring-orange-500={today}
          class:bg-orange-50={today}
        >
          <!-- Day header -->
          <div class="p-2 border-b bg-gray-50" class:bg-orange-100={today}>
            <div class="text-xs font-semibold text-gray-600" class:text-orange-700={today}>
              {day.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div class="text-lg font-bold text-gray-900" class:text-orange-600={today}>
              {day.getDate()}
            </div>
          </div>

          <!-- Events -->
          <div class="flex-1 p-1.5 space-y-1.5 overflow-auto">
            <!-- Add class button -->
            <button
              on:click={() => createClass(day)}
              class="w-full text-xs text-orange-500 hover:text-orange-600 font-medium text-left px-2 py-1 rounded hover:bg-orange-50"
            >
              + Add
            </button>

            {#each dayEvents as ev}
              <button
                on:click={() => openEvent(ev)}
                class="w-full text-left p-2 rounded border hover:shadow-md transition-shadow bg-white group"
                title={ev.title}
              >
                <!-- Time and title -->
                <div class="flex items-start justify-between gap-1 mb-1.5">
                  <div class="text-xs font-semibold text-gray-900 truncate flex-1">
                    {formatTime(ev.start)}
                  </div>
                  <div
                    class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style="background: #ea580c;"
                  >
                    {getTeacherInitials(ev.teacher)}
                  </div>
                </div>

                <div class="text-xs font-medium text-gray-700 truncate mb-2">
                  {ev.title}
                </div>

                <!-- Progress bar -->
                {#if ev.capacity > 0}
                  <div class="space-y-0.5">
                    <div class="flex items-center justify-between text-[10px] text-gray-500">
                      <span>{ev.enrolled}/{ev.capacity}</span>
                      <span>{Math.round((ev.enrolled / ev.capacity) * 100)}%</span>
                    </div>
                    <div class="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all"
                        class:bg-green-500={ev.enrolled / ev.capacity < 0.7}
                        class:bg-yellow-500={ev.enrolled / ev.capacity >= 0.7 && ev.enrolled / ev.capacity < 0.9}
                        class:bg-orange-500={ev.enrolled / ev.capacity >= 0.9 && ev.enrolled / ev.capacity < 1}
                        class:bg-red-500={ev.enrolled / ev.capacity >= 1}
                        style="width: {Math.min(100, (ev.enrolled / ev.capacity) * 100)}%"
                      ></div>
                    </div>
                  </div>
                {/if}
              </button>
            {/each}
          </div>
        </div>
      {/each}
    </div>

    {:else}
      <!-- Month View - Minimal -->
      <div class="space-y-2">
        <!-- Weekday headers -->
        <div class="grid grid-cols-7 gap-2 mb-2">
          {#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day}
            <div class="text-center text-xs font-semibold text-gray-600 py-1">
              {day}
            </div>
          {/each}
        </div>

        <!-- Month grid (4 weeks) -->
        <div class="grid grid-cols-7 gap-2">
          {#each monthDays as { date, isCurrentMonth }}
            {@const dateKey = getDateKey(date)}
            {@const dayEvents = eventsByDate[dateKey] || []}
            {@const today = isToday(date)}

            <div
              class="border rounded-lg p-2 min-h-[100px] flex flex-col bg-white"
              class:ring-2={today}
              class:ring-orange-500={today}
              class:bg-orange-50={today}
            >
              <!-- Date number -->
              <div
                class="text-sm font-semibold mb-1"
                class:text-orange-600={today}
                class:text-gray-900={!today}
              >
                {date.getDate()}
              </div>

              <!-- Events (minimal) -->
              <div class="space-y-0.5 flex-1 overflow-hidden">
                {#each dayEvents.slice(0, 4) as ev}
                  <button
                    on:click={() => openEvent(ev)}
                    class="w-full text-left px-1.5 py-0.5 rounded text-[10px] hover:bg-gray-100 truncate"
                    title="{formatTime(ev.start)} - {ev.title}"
                  >
                    <span class="font-medium">{formatTime(ev.start).replace(':00', '').replace(' ', '')}</span>
                    <span class="text-gray-600 ml-1">{ev.title}</span>
                  </button>
                {/each}
                {#if dayEvents.length > 4}
                  <div class="text-[10px] text-gray-500 px-1.5">
                    +{dayEvents.length - 4} more
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>
