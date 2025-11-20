<script>
  import { fade } from 'svelte/transition';

  export let classItem;
  export let isEnrolled = false;
  export let showJoinButton = false;
  export let isEnrolling = false;
  export let onReserve = null;
  export let onCancel = null;
  export let enrollmentId = null;
  export let tz = null;

  let showDetails = false;

  function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    const dayFormat = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: tz || undefined
    });
    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: tz || undefined
    });
    return `${dayFormat} — ${time}`;
  }
</script>

<div class="border border-gray-200 rounded-lg p-4 bg-white hover:border-orange-300 transition-colors">
  <div class="flex items-start justify-between gap-4">
    <!-- Left Side: Class Info -->
    <div class="flex-1 min-w-0">
      <h3 class="font-bold text-gray-900 text-base mb-1">{classItem.title}</h3>
      <p class="text-sm text-orange-600 font-medium mb-1">{formatDateTime(classItem.start || classItem.starts_at)}</p>
      {#if classItem.teacher}
        <p class="text-xs text-gray-500">{classItem.teacher}</p>
      {/if}
    </div>

    <!-- Right Side: Actions -->
    <div class="flex flex-col items-end gap-2 flex-shrink-0">
      {#if showJoinButton && classItem.zoom_link}
        <a
          href={classItem.zoom_link}
          target="_blank"
          rel="noopener noreferrer"
          class="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded hover:bg-orange-600 whitespace-nowrap"
        >
          Join Class
        </a>
      {:else if isEnrolled}
        <button
          disabled
          class="px-4 py-2 bg-green-50 text-green-700 text-sm font-medium rounded border border-green-200 cursor-not-allowed whitespace-nowrap"
        >
          ✓ Enrolled
        </button>
      {:else if onReserve}
        <button
          on:click={() => onReserve(classItem)}
          disabled={isEnrolling}
          class="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded hover:bg-orange-600 disabled:opacity-50 whitespace-nowrap"
        >
          {isEnrolling ? 'Reserving...' : 'Reserve Spot'}
        </button>
      {/if}

      <!-- Cancel Link -->
      {#if onCancel && enrollmentId}
        <button
          on:click={() => onCancel(enrollmentId)}
          class="text-sm text-gray-600 hover:text-red-600 underline"
        >
          Cancel
        </button>
      {/if}

      <!-- Details Toggle -->
      <button
        on:click={() => showDetails = !showDetails}
        class="text-sm text-orange-600 hover:text-orange-700 underline"
      >
        {showDetails ? 'Hide Details' : 'Details'}
      </button>
    </div>
  </div>

  <!-- Expandable Details Drawer -->
  {#if showDetails}
    <div class="mt-4 pt-4 border-t border-gray-200 space-y-2" transition:fade>
      {#if classItem.description}
        <div>
          <span class="text-xs font-semibold text-gray-700">Description:</span>
          <p class="text-sm text-gray-600 mt-1">{classItem.description}</p>
        </div>
      {/if}

      <div class="flex flex-wrap gap-4 text-xs text-gray-600">
        <div>
          <span class="font-semibold">Duration:</span> {classItem.duration_minutes} min
        </div>
        {#if classItem.capacity}
          <div>
            <span class="font-semibold">Capacity:</span> {classItem.capacity} students
          </div>
        {/if}
        {#if classItem.levels && classItem.levels.length > 0}
          <div>
            <span class="font-semibold">Levels:</span> {classItem.levels.join(', ')}
          </div>
        {/if}
      </div>

      {#if classItem.notes}
        <div>
          <span class="text-xs font-semibold text-gray-700">Notes:</span>
          <p class="text-sm text-gray-600 mt-1">{classItem.notes}</p>
        </div>
      {/if}
    </div>
  {/if}
</div>
