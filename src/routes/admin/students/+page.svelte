<svelte:head>
	<title>Students - Expat Spanish Lessons</title>
</svelte:head>


<script>
    import { fade } from 'svelte/transition';

    export let data;
    let students = data.students || [];
    const page = data.page || 1;
    const per_page = data.per_page || 50;
    const total = data.total || 0;

    const totalPages = Math.max(1, Math.ceil(total / per_page));
    const startIndex = total === 0 ? 0 : (page - 1) * per_page + 1;
    const endIndex = Math.min(total, (page - 1) * per_page + students.length);

    let selectedStudent = null;
    let studentEnrollments = [];
    let loadingEnrollments = false;
    let searchQuery = data.search || '';
    let searchTimeout;

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

    function performSearch() {
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }
      params.set('page', '1'); // Reset to first page on new search
      params.set('per_page', per_page.toString());
      window.location.href = `/admin/students?${params.toString()}`;
    }

    function handleKeydown(event) {
      if (event.key === 'Enter') {
        performSearch();
      }
    }

    function clearSearch() {
      searchQuery = '';
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('per_page', per_page.toString());
      window.location.href = `/admin/students?${params.toString()}`;
    }

    function pageUrl(pageNum) {
      const params = new URLSearchParams();
      params.set('page', pageNum.toString());
      params.set('per_page', per_page.toString());
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }
      return `/admin/students?${params.toString()}`;
    }

    function goTo(pageNum) {
      window.location.href = pageUrl(pageNum);
    }

    async function openStudentDetails(student) {
      selectedStudent = student;
      loadingEnrollments = true;
      studentEnrollments = [];

      try {
        const response = await fetch(`/api/admin/students/${student.id}/enrollments`);
        if (response.ok) {
          const result = await response.json();
          studentEnrollments = result.enrollments || [];
        }
      } catch (err) {
        console.error('Failed to load enrollments:', err);
      } finally {
        loadingEnrollments = false;
      }
    }

    function closeModal() {
      selectedStudent = null;
      studentEnrollments = [];
    }

    function formatDateTime(dateStr) {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }
  </script>
  
  <div class="max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-lg font-semibold text-gray-800">Students</h3>
        <div class="text-sm text-gray-500">
          {#if searchQuery.trim()}
            Showing {startIndex}-{endIndex} of {total} result{total === 1 ? '' : 's'}
          {:else}
            Showing {startIndex}-{endIndex} of {total} total student{total === 1 ? '' : 's'}
          {/if}
        </div>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="mb-4">
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          bind:value={searchQuery}
          on:keydown={handleKeydown}
          placeholder="Search by name or email (press Enter)..."
          class="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
        />
        {#if searchQuery.trim()}
          <button
            on:click={clearSearch}
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        {/if}
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
            <th class="text-left px-4 py-3">GHL</th>
          </tr>
        </thead>
  
        <tbody>
          {#if students.length === 0}
            <tr>
              <td class="px-4 py-6 text-center text-gray-500" colspan="5">
                {searchQuery.trim() ? 'No students match your search.' : 'No students found.'}
              </td>
            </tr>
          {:else}
            {#each students as s}
              <tr
                class="border-t last:border-b hover:bg-orange-50 transition-colors cursor-pointer"
                on:click={() => openStudentDetails(s)}
              >
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
                  {#if s.ghl_contact_id}
                    <a
                      href="https://app.gohighlevel.com/v2/location/Wpw7KRwapxKDboseXO64/contacts/detail/{s.ghl_contact_id}"
                      target="_blank"
                      rel="noopener noreferrer"
                      on:click={(e) => e.stopPropagation()}
                      class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                    >
                      View
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  {:else}
                    <span class="text-xs text-gray-400">—</span>
                  {/if}
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    {#if totalPages > 1}
      <div class="mt-4 flex items-center justify-between">
        <div class="text-sm text-gray-600">
          Page {page} of {totalPages}
        </div>
        <div class="flex gap-2">
          {#if page > 1}
            <button
              on:click={() => goTo(page - 1)}
              class="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium"
            >
              ← Previous
            </button>
          {/if}
          {#if page < totalPages}
            <button
              on:click={() => goTo(page + 1)}
              class="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium"
            >
              Next →
            </button>
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <!-- Student Details Panel -->
  {#if selectedStudent}
    <div
      class="fixed right-0 top-0 h-full w-[500px] bg-white shadow-2xl overflow-y-auto z-50 border-l border-gray-200"
      transition:fade
      style="animation: slideInRight 0.3s ease-out;"
    >
        <!-- Panel Header -->
        <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              {#if selectedStudent.profile_pic}
                <img src={selectedStudent.profile_pic} alt="avatar" class="w-12 h-12 rounded-full object-cover" />
              {:else}
                <div class="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-semibold text-lg uppercase">
                  {avatarInitial(selectedStudent.full_name)}
                </div>
              {/if}
              <div>
                <h3 class="text-lg font-bold text-gray-900">{selectedStudent.full_name}</h3>
                <p class="text-sm text-gray-600">{selectedStudent.email}</p>
              </div>
            </div>
            <button
              on:click={closeModal}
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {#if selectedStudent.ghl_contact_id}
            <a
              href="https://app.gohighlevel.com/v2/location/Wpw7KRwapxKDboseXO64/contacts/detail/{selectedStudent.ghl_contact_id}"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open in GHL
            </a>
          {/if}
        </div>

        <!-- Panel Content -->
        <div class="px-6 py-6">
          <!-- Student Info -->
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p class="text-sm font-semibold text-gray-700 mb-1">Level</p>
              <p class="text-base text-gray-900">{selectedStudent.level_key}</p>
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-700 mb-1">Timezone</p>
              <p class="text-base text-gray-900">{selectedStudent.tz}</p>
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-700 mb-1">Onboarding Status</p>
              <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass(selectedStudent.onboarding_status)}`}>
                {selectedStudent.onboarding_status}
              </span>
            </div>
          </div>

          <!-- Booked Classes -->
          <div>
            <h4 class="text-base font-semibold text-gray-900 mb-3">Booked Classes</h4>

            {#if loadingEnrollments}
              <div class="text-center py-8">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                <p class="text-sm text-gray-600 mt-2">Loading classes...</p>
              </div>
            {:else if studentEnrollments.length === 0}
              <div class="bg-gray-50 rounded-lg p-6 text-center">
                <p class="text-sm text-gray-600">No booked classes</p>
              </div>
            {:else}
              <div class="space-y-3">
                {#each studentEnrollments as enrollment}
                  <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <h5 class="font-medium text-gray-900 mb-1">{enrollment.class_title}</h5>
                        <div class="space-y-1 text-sm text-gray-600">
                          <p>
                            <span class="font-medium">Date:</span> {formatDateTime(enrollment.starts_at)}
                          </p>
                          {#if enrollment.teacher}
                            <p>
                              <span class="font-medium">Teacher:</span> {enrollment.teacher}
                            </p>
                          {/if}
                          <p>
                            <span class="font-medium">Duration:</span> {enrollment.duration_minutes} minutes
                          </p>
                        </div>
                      </div>
                      <div>
                        <span
                          class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            enrollment.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            enrollment.status === 'reserved' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {enrollment.status}
                        </span>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>

        <!-- Panel Footer -->
        <div class="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
          <button
            on:click={closeModal}
            class="w-full px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
    </div>
  {/if}

  <style>
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
      }
      to {
        transform: translateX(0);
      }
    }
  </style>
