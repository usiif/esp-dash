<script>
    export let data;

    // Sort levels for consistent display (Level 1, Level 2, etc.)
    $: sortedLevels = Object.entries(data.studentsByLevel || {})
      .sort((a, b) => {
        // Extract numbers from level names (e.g., "Level 4" -> 4)
        const numA = parseInt(a[0].match(/\d+/)?.[0] || '999');
        const numB = parseInt(b[0].match(/\d+/)?.[0] || '999');
        return numA - numB;
      });
  </script>

<svelte:head>
	<title>Admin - Expat Spanish Lessons</title>
</svelte:head>

<div class="max-w-6xl mx-auto space-y-6">
  <!-- Top Stats Cards -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
    <div class="bg-white p-5 rounded-lg shadow-sm border border-orange-100">
      <div class="text-sm text-gray-500">Students</div>
      <div class="text-2xl font-semibold mt-2">{data.totalStudents}</div>
    </div>

    <div class="bg-white p-5 rounded-lg shadow-sm border border-orange-100">
      <div class="text-sm text-gray-500">Active Sessions</div>
      <div class="text-2xl font-semibold mt-2">{data.activeSessions}</div>
    </div>

    <div class="bg-white p-5 rounded-lg shadow-sm border border-orange-100">
      <div class="text-sm text-gray-500">Pending Onboarding</div>
      <div class="text-2xl font-semibold mt-2">{data.pendingOnboarding}</div>
    </div>

    <div class="bg-white p-5 rounded-lg shadow-sm border border-orange-100">
      <div class="text-sm text-gray-500">Weekly Bookings</div>
      <div class="text-2xl font-semibold mt-2">{data.weeklyBookings}</div>
    </div>
  </div>

  <!-- Students by Level Breakdown -->
  <div class="bg-white p-6 rounded-lg shadow-sm border border-orange-100">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Students by Level</h3>

    {#if sortedLevels.length === 0}
      <p class="text-sm text-gray-500">No student data available</p>
    {:else}
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {#each sortedLevels as [level, count]}
          <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div class="text-sm font-medium text-gray-700">{level}</div>
            <div class="text-2xl font-bold text-orange-600 mt-1">{count}</div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
  