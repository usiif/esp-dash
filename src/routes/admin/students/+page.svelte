<svelte:head>
	<title>Students - Expat Spanish Lessons</title>
</svelte:head>


<script>
    import { fade } from 'svelte/transition';

    export let data;
    const students = data.students || [];
    const page = data.page || 1;
    const per_page = data.per_page || 50;
    const total = data.total || 0;

    const totalPages = Math.max(1, Math.ceil(total / per_page));
    const startIndex = total === 0 ? 0 : (page - 1) * per_page + 1;
    const endIndex = Math.min(total, (page - 1) * per_page + students.length);

    let selectedStudent = null;
    let studentEnrollments = [];
    let loadingEnrollments = false;

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

    // Simpler navigation that works better with Firefox
    function goTo(p) {
      if (p < 1 || p > totalPages) return;
      window.location.href = pageUrl(p);
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

  <!-- Student Details Modal -->
  {#if selectedStudent}
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      on:click={closeModal}
      transition:fade
    >
      <div
        class="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        on:click|stopPropagation
      >
        <!-- Modal Header -->
        <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
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

        <!-- Modal Content -->
        <div class="px-6 py-4">
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

        <!-- Modal Footer -->
        <div class="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          <button
            on:click={closeModal}
            class="w-full px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  {/if}
