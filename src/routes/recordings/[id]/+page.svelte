<script>
  export let data;

  const recording = data.recording;

  // Format date in CST
  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Chicago',
      timeZoneName: 'short'
    });
  }

  // Format duration
  function formatDuration(minutes) {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${mins} min`;
    }
    return `${mins} minutes`;
  }
</script>

<svelte:head>
  <title>{recording.classes?.title || 'Class Recording'} — ESPL</title>
</svelte:head>

<style>
  video::-webkit-media-controls-panel {
    background-image: linear-gradient(transparent, rgba(0,0,0,0.5));
  }

  video::-webkit-media-controls-play-button,
  video::-webkit-media-controls-timeline,
  video::-webkit-media-controls-current-time-display,
  video::-webkit-media-controls-time-remaining-display,
  video::-webkit-media-controls-volume-slider,
  video::-webkit-media-controls-mute-button,
  video::-webkit-media-controls-fullscreen-button {
    filter: brightness(1.2);
  }
</style>

<div class="min-h-screen bg-gray-50 flex flex-col">
  <!-- Header -->
  <header class="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 shadow-sm">
    <div class="max-w-[1800px] mx-auto flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
          <span class="text-white font-bold text-xl">E</span>
        </div>
        <div>
          <div class="text-gray-900 font-semibold">Expat Spanish Lessons</div>
          <div class="text-xs text-gray-500">Class Recording</div>
        </div>
      </div>
      <a
        href="https://expatspanishlessons.com"
        target="_blank"
        class="text-sm text-gray-600 hover:text-orange-500 transition-colors"
      >
        expatspanishlessons.com
      </a>
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-1 flex bg-white">
    <div class="max-w-[1800px] mx-auto w-full grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-0">
      <!-- Video Player (Theater Mode) -->
      <div class="relative bg-black flex items-center justify-center">
        {#if recording.videoUrl}
          <video
            controls
            controlsList="nodownload"
            class="w-full h-full max-h-[calc(100vh-60px)]"
            preload="metadata"
          >
            <source src={recording.videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        {:else}
          <div class="text-center p-12">
            <p class="text-gray-500">Video not available</p>
          </div>
        {/if}
      </div>

      <!-- Sidebar Info Panel -->
      <div class="bg-gray-50 border-l border-gray-200 overflow-y-auto max-h-[calc(100vh-60px)]">
        <div class="p-6 space-y-6">
          <!-- Title -->
          <div>
            <h1 class="text-xl font-bold text-gray-900 leading-tight">
              {recording.classes?.title || 'Spanish Class'}
            </h1>
          </div>

          <!-- Meta Info -->
          <div class="space-y-3 text-sm text-gray-600 pb-6 border-b border-gray-200">
            <div class="flex items-start gap-2">
              <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span class="leading-tight">{formatDate(recording.zoom_start_time)}</span>
            </div>
            {#if recording.zoom_duration_minutes}
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formatDuration(recording.zoom_duration_minutes)}</span>
              </div>
            {/if}
          </div>

          <!-- Teacher -->
          {#if recording.classes?.teacher}
            <div class="flex items-start gap-3 pb-6 border-b border-gray-200">
              <div class="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold flex-shrink-0 text-lg">
                {recording.classes.teacher.full_name.charAt(0)}
              </div>
              <div>
                <div class="font-semibold text-gray-900">{recording.classes.teacher.full_name}</div>
                <div class="text-sm text-gray-600">Spanish Teacher</div>
              </div>
            </div>
          {/if}

          <!-- Topic -->
          {#if recording.classes?.topic}
            <div>
              <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Topic</div>
              <div class="text-sm text-gray-900">{recording.classes.topic}</div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </main>
</div>
