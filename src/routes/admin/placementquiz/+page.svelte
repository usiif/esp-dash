<script>
  export let data;

  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }
</script>

<svelte:head>
  <title>Placement Quizzes - Admin</title>
</svelte:head>

<div class="max-w-6xl mx-auto">
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-gray-900">Placement Quizzes</h1>
    <p class="text-sm text-gray-600 mt-1">View all placement quiz sessions</p>
  </div>

  {#if data.sessions.length === 0}
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
      <p class="text-gray-500">No placement quiz sessions found</p>
    </div>
  {:else}
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-200 bg-gray-50">
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Started</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Final Level</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          {#each data.sessions as session}
            <tr class="hover:bg-gray-50 transition-colors">
              <td class="px-4 py-3 text-sm font-medium text-gray-900">
                {session.name || 'Anonymous'}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {session.email}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {formatDate(session.started_at)}
              </td>
              <td class="px-4 py-3 text-sm">
                {#if session.final_level}
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                    Level {session.final_level}
                  </span>
                {:else}
                  <span class="text-gray-400">—</span>
                {/if}
              </td>
              <td class="px-4 py-3 text-sm">
                {#if session.finished_at}
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    Completed
                  </span>
                {:else}
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    In Progress
                  </span>
                {/if}
              </td>
              <td class="px-4 py-3 text-right">
                <a
                  href="/admin/placementquiz/{session.id}"
                  class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded transition-colors"
                >
                  View Results
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
