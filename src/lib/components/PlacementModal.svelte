<script>
  let { userName, userEmail } = $props();

  // Build the placement quiz URL with query parameters
  const placementUrl = `https://quizzes.expatspanishlessons.com/placement?name=${encodeURIComponent(userName)}&email=${encodeURIComponent(userEmail)}`;
</script>

<!-- Full screen modal with lightly dimmed background - cannot be closed -->
<div class="fixed inset-0 z-50 backdrop-blur-[2px] bg-black/10 flex items-center justify-center p-4">
  <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
    <!-- Header with gradient and quiz icon -->
    <div class="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6 rounded-t-2xl">
      <div class="flex items-center gap-4">
        <!-- Quiz/Clipboard Icon with filled style -->
        <div class="flex-shrink-0">
          <svg class="w-12 h-12 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
            <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
          </svg>
        </div>
        <div class="flex-1">
          <h2 class="text-3xl font-bold text-white">Let's Get Your Account Set Up</h2>
          <p class="text-orange-100 text-sm mt-1">Welcome, {userName}!</p>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="px-8 py-8">
      <div class="mb-6">
        <p class="text-gray-700 text-lg leading-relaxed mb-6">
          To unlock the correct course for you, we need to complete the <strong>Course Placement Quiz</strong> so that we know which course to assign to your account.
        </p>

        <!-- Time requirement -->
        <div class="bg-orange-50 border border-orange-200 rounded-lg p-5 mb-4">
          <h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How long does it take?
          </h4>
          <div class="space-y-2 text-gray-700">
            <div class="flex items-start gap-2">
              <span class="text-orange-600 font-bold mt-0.5">➜</span>
              <p>If you're a <strong>complete beginner</strong>, the placement takes <strong>1–2 minutes</strong>.</p>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-orange-600 font-bold mt-0.5">➜</span>
              <p>If you already have some Spanish, please allow <strong>10–15 minutes</strong> so you can take your time and get the most accurate result.</p>
            </div>
          </div>
        </div>

        <!-- Important reminder -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-5">
          <h4 class="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Important
          </h4>
          <div class="flex items-start gap-2 text-gray-700">
            <span class="text-blue-600 font-bold mt-0.5">➜</span>
            <p>Please make sure you have time to take the quiz to get the most accurate result.</p>
          </div>
        </div>
      </div>

      <!-- CTA Button -->
      <div class="text-center pt-2">
        <a
          href={placementUrl}
          class="inline-flex items-center gap-2 px-8 py-4 bg-orange-600 text-white text-lg font-semibold rounded-xl hover:bg-orange-700 transform hover:scale-105 transition-all shadow-lg hover:shadow-xl"
        >
          Start Course Placement Quiz
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
      </div>
    </div>
  </div>
</div>
