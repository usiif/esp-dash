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

  function getQuestionTypeShort(type) {
    const labels = {
      'mcq': 'MCQ',
      'fill_in': 'FIB',
      'open_ended': 'Open'
    };
    return labels[type] || type;
  }

  function parseErrors(errors) {
    if (!errors) return [];

    if (Array.isArray(errors)) {
      return errors.map(err => {
        if (typeof err === 'object' && err.reason) {
          return err.reason;
        }
        return typeof err === 'string' ? err : JSON.stringify(err);
      });
    }

    if (typeof errors === 'string') {
      try {
        const parsed = JSON.parse(errors);
        if (Array.isArray(parsed)) {
          return parsed.map(err => {
            if (typeof err === 'object' && err.reason) {
              return err.reason;
            }
            return typeof err === 'string' ? err : JSON.stringify(err);
          });
        }
        return [parsed];
      } catch {
        return [errors];
      }
    }

    if (typeof errors === 'object') {
      if (errors.reason) {
        return [errors.reason];
      }
      return Object.values(errors).map(v => typeof v === 'string' ? v : JSON.stringify(v));
    }

    return [];
  }
</script>

<svelte:head>
  <title>Placement Quiz - {data.session.name || data.session.email}</title>
</svelte:head>

<div class="min-h-screen py-8 px-4">
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h1 class="text-2xl font-bold text-gray-900 mb-1">{data.session.name || 'Anonymous'}</h1>
          <p class="text-sm text-gray-500">{data.session.email}</p>
          <div class="mt-3 flex items-center gap-3 text-xs text-gray-500">
            <span>Started {formatDate(data.session.started_at)}</span>
            {#if data.session.finished_at}
              <span>•</span>
              <span>Finished {formatDate(data.session.finished_at)}</span>
            {/if}
          </div>
        </div>
        {#if data.session.final_level}
          <div class="flex-shrink-0 text-center px-6 py-3 bg-orange-50 rounded-lg border border-orange-200">
            <div class="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">Final Level</div>
            <div class="text-3xl font-bold text-orange-600">{data.session.final_level}</div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Level Attempts -->
    {#if data.levelAttempts.length === 0}
      <div class="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <p class="text-gray-400">No level attempts found</p>
      </div>
    {:else}
      <div class="space-y-4">
        {#each data.levelAttempts as attempt}
          <div class="bg-gray-50 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <!-- Level Header -->
            <div class="bg-white px-4 py-3 border-b border-gray-200">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                    <span class="text-white font-bold text-lg">{attempt.level}</span>
                  </div>
                  {#if attempt.ai_decision}
                    <span class="px-3 py-1 rounded-full text-sm font-semibold" class:bg-green-100={attempt.ai_decision === 'pass'} class:text-green-700={attempt.ai_decision === 'pass'} class:bg-red-100={attempt.ai_decision === 'fail'} class:text-red-700={attempt.ai_decision === 'fail'}>
                      {attempt.ai_decision.toUpperCase()}
                    </span>
                  {/if}
                </div>

                {#if attempt.percentage !== null && attempt.percentage !== undefined}
                  <div class="flex items-baseline gap-2">
                    <div class="text-3xl font-bold text-gray-900">{attempt.percentage.toFixed(0)}%</div>
                    <div class="text-sm text-gray-500">({attempt.total_score || 0}/{attempt.max_score || 0})</div>
                  </div>
                {/if}
              </div>
            </div>

          <!-- Answers Table -->
          {#if attempt.answers.length > 0}
            <div class="overflow-x-auto">
              <table class="w-full bg-white">
                <thead>
                  <tr class="border-b border-gray-200">
                    <th class="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase w-10">#</th>
                    <th class="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase w-16">Type</th>
                    <th class="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Question</th>
                    <th class="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Response</th>
                    <th class="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Feedback</th>
                    <th class="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase w-20">Score</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  {#each attempt.answers as answer, idx}
                    {@const errorList = parseErrors(answer.errors)}
                    {@const isCorrect = answer.score === answer.max_score}
                    {@const isWrong = answer.score === 0}
                    <tr class="hover:bg-gray-50 transition-colors">
                      <td class="px-3 py-2 text-sm text-gray-400 font-medium">{idx + 1}</td>
                      <td class="px-3 py-2">
                        <span class="inline-block px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">
                          {getQuestionTypeShort(answer.question_type)}
                        </span>
                      </td>
                      <td class="px-3 py-2 text-sm text-gray-900 font-medium">
                        <div>{answer.prompt}</div>
                      </td>
                      <td class="px-3 py-2 text-sm">
                        <div class:text-gray-900={answer.user_response} class:text-gray-400={!answer.user_response}>
                          {answer.user_response || 'No response'}
                        </div>
                      </td>
                      <td class="px-3 py-2 text-xs">
                        {#if errorList.length > 0}
                          <div class="space-y-1">
                            {#each errorList as error}
                              <div class="flex gap-1.5 text-red-600">
                                <svg class="w-3 h-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                                </svg>
                                <span>{error}</span>
                              </div>
                            {/each}
                          </div>
                        {:else if isCorrect}
                          <div class="flex items-center gap-1.5 text-green-600">
                            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                            <span>Correct</span>
                          </div>
                        {:else}
                          <span class="text-gray-400">—</span>
                        {/if}
                      </td>
                      <td class="px-3 py-2 text-center">
                        {#if answer.score !== null && answer.score !== undefined}
                          <div class="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-sm font-bold" class:bg-green-100={isCorrect} class:text-green-700={isCorrect} class:bg-red-100={isWrong} class:text-red-700={isWrong} class:bg-orange-100={!isCorrect && !isWrong} class:text-orange-700={!isCorrect && !isWrong}>
                            {answer.score}/{answer.max_score}
                          </div>
                        {:else}
                          <span class="text-gray-400">—</span>
                        {/if}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {:else}
            <div class="p-6 text-center bg-white">
              <p class="text-gray-400 text-sm">No answers recorded</p>
            </div>
          {/if}
        </div>
      {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
