<script>
  export let data;

  // Format date
  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  // Format duration
  function formatDuration(minutes) {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }
</script>

<svelte:head>
  <title>Class Recordings — ESPL</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Main Content -->
  <main class="p-4 sm:p-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Class Recordings</h1>
      <p class="text-gray-600">Watch past class recordings and review notes</p>
    </div>

    <!-- Recordings List -->
    {#if data.recordings.length === 0}
      <div class="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <p class="text-gray-600">No recordings available yet</p>
      </div>
    {:else}
      <div class="space-y-8">
        {#each data.recordings as recording (recording.id)}
          <div class="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <!-- Class Info Header -->
            <div class="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
              <h2 class="text-2xl font-bold mb-2">
                {recording.classes?.title || 'Spanish Class'}
              </h2>
              <div class="flex flex-wrap items-center gap-4 text-orange-50">
                <div class="flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatDate(recording.zoom_start_time)}</span>
                </div>
                {#if recording.classes?.teacher}
                  <div class="flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>{recording.classes.teacher.full_name}</span>
                  </div>
                {/if}
                {#if recording.zoom_duration_minutes}
                  <div class="flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{formatDuration(recording.zoom_duration_minutes)}</span>
                  </div>
                {/if}
              </div>
              {#if recording.classes?.topic}
                <p class="mt-3 text-orange-100">
                  <span class="font-semibold">Topic:</span> {recording.classes.topic}
                </p>
              {/if}
            </div>

            <!-- Video Player -->
            {#if recording.videoUrl}
              <div class="bg-black">
                <video
                  controls
                  class="w-full max-h-[600px]"
                  preload="metadata"
                >
                  <source src={recording.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            {:else}
              <div class="bg-gray-100 p-12 text-center">
                <p class="text-gray-500">Video not available</p>
              </div>
            {/if}

            <!-- Notes Section -->
            {#if recording.notes}
              <div class="p-6 space-y-6">
                <!-- Summary -->
                {#if recording.notes.summary}
                  <div>
                    <h3 class="text-lg font-bold text-gray-900 mb-2">Summary</h3>
                    <p class="text-gray-700 leading-relaxed">{recording.notes.summary}</p>
                  </div>
                {/if}

                <!-- Key Points -->
                {#if recording.notes.key_points && recording.notes.key_points.length > 0}
                  <div>
                    <h3 class="text-lg font-bold text-gray-900 mb-3">Key Points</h3>
                    <ul class="space-y-2">
                      {#each recording.notes.key_points as point}
                        <li class="flex items-start gap-3">
                          <svg class="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                          </svg>
                          <span class="text-gray-700">{point}</span>
                        </li>
                      {/each}
                    </ul>
                  </div>
                {/if}

                <!-- Objectives -->
                {#if recording.notes.objectives && recording.notes.objectives.length > 0}
                  <div>
                    <h3 class="text-lg font-bold text-gray-900 mb-3">Learning Objectives</h3>
                    <ul class="space-y-2">
                      {#each recording.notes.objectives as objective}
                        <li class="flex items-start gap-3">
                          <svg class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clip-rule="evenodd" />
                          </svg>
                          <span class="text-gray-700">{objective}</span>
                        </li>
                      {/each}
                    </ul>
                  </div>
                {/if}

                <!-- New Vocabulary -->
                {#if recording.notes.new_vocabulary && recording.notes.new_vocabulary.length > 0}
                  <div>
                    <h3 class="text-lg font-bold text-gray-900 mb-3">New Vocabulary</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {#each recording.notes.new_vocabulary as vocab}
                        <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <div class="font-bold text-orange-900 text-lg mb-1">{vocab.term}</div>
                          <div class="text-gray-700 text-sm mb-2">{vocab.meaning}</div>
                          {#if vocab.example_sentence}
                            <div class="text-gray-600 text-sm italic">
                              "{vocab.example_sentence}"
                            </div>
                          {/if}
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}

                <!-- Practice Questions -->
                {#if recording.notes.practice_questions && recording.notes.practice_questions.length > 0}
                  <div>
                    <h3 class="text-lg font-bold text-gray-900 mb-3">Practice Questions</h3>
                    <div class="space-y-3">
                      {#each recording.notes.practice_questions as question, idx}
                        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div class="flex items-start gap-3">
                            <div class="bg-gray-200 text-gray-700 font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm">
                              {idx + 1}
                            </div>
                            <div class="flex-1">
                              {#if question.type}
                                <span class="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded mb-2">
                                  {question.type}
                                </span>
                              {/if}
                              <p class="text-gray-700">{question.prompt}</p>
                            </div>
                          </div>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            {/if}

            <!-- Transcript -->
            {#if recording.transcript_text}
              <div class="border-t border-gray-200 p-6">
                <h3 class="text-lg font-bold text-gray-900 mb-3">Chat Transcript</h3>
                <div class="bg-gray-50 rounded-lg p-4">
                  <pre class="text-sm text-gray-700 whitespace-pre-wrap font-mono">{recording.transcript_text}</pre>
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </main>
</div>
