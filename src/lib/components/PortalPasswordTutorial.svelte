<script>
  import { fade } from 'svelte/transition';

  let { portalMagic, onComplete } = $props();

  let isCompleting = false;

  async function markAsDone() {
    isCompleting = true;
    try {
      const response = await fetch('/api/portal-signup-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        console.error('Failed to mark portal signup as complete');
        isCompleting = false;
        return;
      }

      // Call the onComplete callback to reload or update the UI
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error('Error marking portal signup complete:', err);
      isCompleting = false;
    }
  }
</script>

<!-- Overlay with pointer to Online Courses -->
<div class="fixed inset-0 z-50 flex items-center justify-center p-4" transition:fade>
  <!-- Backdrop -->
  <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

  <!-- Tutorial Card -->
  <div class="relative max-w-md w-full" transition:fade>
    <div class="bg-white rounded-2xl shadow-2xl border-2 border-orange-400">
      <!-- Header -->
      <div class="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 rounded-t-2xl">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-bold text-white">Set Your Portal Password</h2>
            <p class="text-orange-100 text-sm mt-0.5">Quick setup required</p>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="px-6 py-5 space-y-4">
        <div>
          <p class="text-gray-700 text-base leading-relaxed mb-3">
            Before accessing your online courses, you need to create a password for the student portal.
          </p>
          <p class="text-gray-600 text-sm leading-relaxed">
            Click the link below to set up your password and access all course materials.
          </p>
        </div>

        <!-- Portal Magic Link -->
        <div class="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-xl p-4">
          <p class="text-xs font-semibold text-purple-900 uppercase tracking-wide mb-2">Your Portal Link</p>
          <a
            href={portalMagic}
            target="_blank"
            rel="noopener noreferrer"
            class="block px-4 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors text-center shadow-md hover:shadow-lg"
          >
            Create Portal Password
          </a>
        </div>

        <!-- Instructions -->
        <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 class="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            What to do:
          </h3>
          <ol class="text-sm text-gray-700 space-y-2 ml-1">
            <li class="flex items-start gap-2">
              <span class="font-bold text-orange-600 flex-shrink-0">1.</span>
              <span>Click <strong>Create Portal Password</strong></span>
            </li>
            <li class="flex items-start gap-2">
              <span class="font-bold text-orange-600 flex-shrink-0">2.</span>
              <span>Create a secure password when prompted</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="font-bold text-orange-600 flex-shrink-0">3.</span>
              <span>Come back here and click "I've Set My Password"</span>
            </li>
          </ol>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
        <button
          on:click={markAsDone}
          disabled={isCompleting}
          class="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCompleting ? 'Updating...' : "I've Set My Password"}
        </button>
        <p class="text-xs text-gray-500 text-center mt-2">
          Only click this after you've created your password
        </p>
      </div>
    </div>
  </div>
</div>
