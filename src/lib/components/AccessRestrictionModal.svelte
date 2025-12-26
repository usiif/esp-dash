<script>
  let { accessLevel } = $props();

  // Determine the message based on access level
  const isOnlineOnly = accessLevel === 'online_only';
  const isEnrollmentDeposit = accessLevel === 'enrollment_deposit';
</script>

{#if isOnlineOnly || isEnrollmentDeposit}
  <!-- Fixed overlay that covers full screen except sidebar -->
  <div class="fixed inset-y-0 right-0 left-0 lg:left-56 z-40 backdrop-blur-[2px] bg-black/30 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
      <!-- Header -->
      <div class="px-8 py-6 border-b border-gray-200">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900">Access Restricted</h2>
        </div>
      </div>

      <!-- Content -->
      <div class="px-8 py-6">
        {#if isOnlineOnly}
          <div class="mb-6">
            <p class="text-gray-700 text-lg leading-relaxed mb-4">
              Your current plan includes <strong>online materials only</strong> and does not include live class access.
            </p>
            <p class="text-gray-600">
              To book live classes and interact with our teachers in real-time, please contact us to upgrade your account.
            </p>
          </div>

          <div class="flex flex-col gap-3">
            <a
              href="mailto:support@expatspanishlessons.com"
              class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Us to Upgrade
            </a>
          </div>
        {:else if isEnrollmentDeposit}
          <div class="mb-6">
            <p class="text-gray-700 text-lg leading-relaxed mb-4">
              Thank you for your enrollment deposit! Your account is currently in the <strong>enrollment queue</strong>.
            </p>
            <p class="text-gray-600">
              We'll notify you by email as soon as spots open up in your level. You'll then be able to book live classes.
            </p>
          </div>

          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="text-sm text-blue-900">
                <strong>We'll let you know when spots open.</strong> In the meantime, you can explore the online materials.
              </p>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
