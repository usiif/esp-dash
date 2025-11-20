<script>
  import StudentNav from '$lib/components/StudentNav.svelte';
  import Onboarding from '$lib/components/onboarding.svelte';

  export let data;
</script>

<svelte:head>
  <title>Past Recordings — ESPL</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <StudentNav user={data.user} />
  <Onboarding {data} />

  <!-- Main Content with padding for desktop sidebar -->
  <main class="lg:ml-56 p-4 sm:p-6 max-w-6xl">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-2 mb-1">
        <h1 class="text-2xl font-bold text-gray-900">Past Recordings</h1>
        {#if data.user.level}
          <span class="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">
            {data.user.level}
          </span>
        {/if}
      </div>
      <p class="text-sm text-gray-600">Watch recordings from your past classes</p>
    </div>

    <!-- Recordings Grid -->
    {#if data.pastClasses.length === 0}
      <div class="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <p class="text-gray-500 text-sm">No past classes yet</p>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each data.pastClasses as classData (classData.enrollment_id)}
          <div class="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-orange-300 transition-colors">
            <!-- Thumbnail / Header -->
            <div class="bg-gradient-to-br from-gray-100 to-gray-200 p-6 relative">
              <div class="flex items-center justify-center h-24">
                {#if classData.class.recording_link}
                  <div class="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                    </svg>
                  </div>
                {:else}
                  <div class="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                    <svg class="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                {/if}
              </div>

              <!-- Attendance Badge -->
              {#if classData.attendance_status}
                <div class="absolute top-3 right-3">
                  <span
                    class="px-2 py-1 text-xs font-medium rounded"
                    class:bg-green-100={classData.attendance_status === 'attended'}
                    class:text-green-700={classData.attendance_status === 'attended'}
                    class:bg-red-100={classData.attendance_status === 'no-show'}
                    class:text-red-700={classData.attendance_status === 'no-show'}
                    class:bg-blue-100={classData.attendance_status === 'excused'}
                    class:text-blue-700={classData.attendance_status === 'excused'}
                  >
                    {classData.attendance_status === 'attended' ? 'Attended' :
                     classData.attendance_status === 'no-show' ? 'No Show' : 'Excused'}
                  </span>
                </div>
              {/if}
            </div>

            <!-- Content -->
            <div class="p-4">
              <h3 class="font-bold text-gray-900 text-base mb-2">{classData.class.title}</h3>

              <div class="space-y-1 text-sm text-gray-600 mb-4">
                <p>
                  {new Date(classData.class.start).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
                {#if classData.class.teacher}
                  <p class="text-xs text-gray-500">with {classData.class.teacher}</p>
                {/if}
              </div>

              <!-- Action Button -->
              {#if classData.class.recording_link}
                <a
                  href={classData.class.recording_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="block w-full px-4 py-2.5 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 text-center transition-colors"
                >
                  <div class="flex items-center justify-center gap-2">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                    </svg>
                    Watch Recording
                  </div>
                </a>
              {:else}
                <div class="w-full px-4 py-2.5 bg-gray-100 text-gray-500 text-sm text-center rounded border border-gray-200">
                  No recording available
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </main>
</div>
