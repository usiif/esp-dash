<svelte:head>
	<title>Students - Expat Spanish Lessons</title>
</svelte:head>


<script>
    import { goto } from '$app/navigation';
  
    export let data;
    const students = data.students || [];
    const page = data.page || 1;
    const per_page = data.per_page || 50;
    const total = data.total || 0;
  
    const totalPages = Math.max(1, Math.ceil(total / per_page));
    const startIndex = total === 0 ? 0 : (page - 1) * per_page + 1;
    const endIndex = Math.min(total, (page - 1) * per_page + students.length);
  
    function badgeClass(status) {
      switch ((status || '').toString().toLowerCase()) {
        case 'complete':
          return 'bg-green-100 text-green-700';
        case 'password_set':
          return 'bg-blue-100 text-blue-700';
        case 'pending':
        default:
          return 'bg-yellow-100 text-yellow-800';
      }
    }
  
    function avatarInitial(fullName) {
      return (fullName || 'S').slice(0, 1).toUpperCase();
    }
  
    const pageUrl = (p) => `/admin/students?page=${p}&per_page=${per_page}`;
  
    // Try SPA navigation, but guarantee navigation by falling back to location.href
    async function goTo(p) {
      if (p < 1 || p > totalPages) return;
      const url = pageUrl(p);
  
      // try goto + short timeout fallback
      let settled = false;
      try {
        const gotoPromise = goto(url, { replaceState: false, noscroll: false });
        // if goto completes (router handled) we'll mark settled
        gotoPromise.then(() => { settled = true; }).catch(() => { /* ignore */ });
      } catch (e) {
        // ignore
      }
  
      // after 150ms, if nothing happened, force a full navigation
      setTimeout(() => {
        if (!settled) window.location.href = url;
      }, 150);
    }
  </script>
  
  <div class="max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-lg font-semibold text-gray-800">Students</h3>
        <div class="text-sm text-gray-500">{total} total • Showing {startIndex}–{endIndex}</div>
      </div>
  
      <!-- Pagination (top): compact arrow buttons -->
      <div class="flex items-center gap-3">
        <button
          class="p-2 rounded-md border border-orange-100 bg-white hover:bg-orange-50 transition flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
          on:click={() => goTo(page - 1)}
          aria-label="Previous page"
          disabled={page <= 1}
        >
          <svg class="w-5 h-5 text-gray-700" viewBox="0 0 20 20" fill="none">
            <path d="M12 15l-5-5 5-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
  
        <div class="px-3 py-2 text-sm text-gray-700">
          Page <span class="font-semibold">{page}</span> / <span class="font-semibold">{totalPages}</span>
        </div>
  
        <button
          class="p-2 rounded-md border border-orange-100 bg-white hover:bg-orange-50 transition flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
          on:click={() => goTo(page + 1)}
          aria-label="Next page"
          disabled={page >= totalPages}
        >
          <svg class="w-5 h-5 text-gray-700" viewBox="0 0 20 20" fill="none">
            <path d="M8 5l5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  
    <div class="bg-white rounded-lg shadow-sm border border-orange-100 overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead class="bg-orange-50">
          <tr>
            <th class="text-left px-4 py-3">Student</th>
            <th class="text-left px-4 py-3">Email</th>
            <th class="text-left px-4 py-3">Level</th>
            <th class="text-left px-4 py-3">Onboarding</th>
            <th class="text-left px-4 py-3">Timezone</th>
          </tr>
        </thead>
  
        <tbody>
          {#if students.length === 0}
            <tr>
              <td class="px-4 py-6 text-center text-gray-500" colspan="5">No students found.</td>
            </tr>
          {:else}
            {#each students as s}
              <tr class="border-t last:border-b hover:bg-orange-50 transition-colors">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    {#if s.profile_pic}
                      <img src={s.profile_pic} alt="avatar" class="w-8 h-8 rounded-full object-cover" />
                    {:else}
                      <div class="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-semibold text-sm uppercase">
                        {avatarInitial(s.full_name)}
                      </div>
                    {/if}
                    <div>
                      <div class="font-medium text-gray-800">{s.full_name}</div>
                    </div>
                  </div>
                </td>
  
                <td class="px-4 py-3">
                  <div class="text-gray-700">{s.email}</div>
                </td>
  
                <td class="px-4 py-3">
                  <div class="text-sm text-gray-700">{s.level_key}</div>
                </td>
  
                <td class="px-4 py-3">
                  <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass(s.onboarding_status)}`}>
                    {s.onboarding_status}
                  </span>
                </td>
  
                <td class="px-4 py-3">
                  <div class="text-sm text-gray-700">{s.tz}</div>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  
    <!-- bottom pagination -->
    <div class="mt-4 flex items-center justify-between">
      <div class="text-sm text-gray-500">Showing {startIndex}–{endIndex} of {total}</div>
  
      <div class="flex items-center gap-3">
        <button
          class="p-2 rounded-md border border-orange-100 bg-white hover:bg-orange-50 transition flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
          on:click={() => goTo(page - 1)}
          aria-label="Previous page"
          disabled={page <= 1}
        >
          <svg class="w-5 h-5 text-gray-700" viewBox="0 0 20 20" fill="none">
            <path d="M12 15l-5-5 5-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
  
        <div class="px-3 py-2 text-sm text-gray-700">
          Page <span class="font-semibold">{page}</span> / <span class="font-semibold">{totalPages}</span>
        </div>
  
        <button
          class="p-2 rounded-md border border-orange-100 bg-white hover:bg-orange-50 transition flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
          on:click={() => goTo(page + 1)}
          aria-label="Next page"
          disabled={page >= totalPages}
        >
          <svg class="w-5 h-5 text-gray-700" viewBox="0 0 20 20" fill="none">
            <path d="M8 5l5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
  