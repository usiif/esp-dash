<script>
  import UserMenu from '$lib/components/UserMenu.svelte';
  export let data;
  const user = data.user;

  const initial =
    user.full_name?.slice(0, 1)?.toUpperCase() ||
    user.first_name?.slice(0, 1)?.toUpperCase() ||
    "S";
</script>

<svelte:head>
  <title>My Profile - Expat Spanish Lessons</title>
</svelte:head>

<div class="min-h-screen bg-orange-50 text-gray-800">
  <!-- NAVBAR -->
  <header class="bg-white shadow-sm py-3 px-6 flex justify-between items-center">
    <h1 class="text-md font-semibold text-orange-600">Expat Spanish Lessons</h1>

    <UserMenu user={user} />
  </header>

  <main class="max-w-6xl mx-auto p-6 space-y-6">
    <!-- TOP: Full-width Profile Card -->
    <section class="bg-white p-6 rounded-lg shadow-sm border border-orange-100">
      <div class="flex items-center gap-6">
        {#if user.profile_pic}
          <img src={user.profile_pic} alt="avatar" class="w-24 h-24 rounded-full object-cover" />
        {:else}
          <div class="w-24 h-24 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-semibold text-4xl uppercase">
            {initial}
          </div>
        {/if}

        <div class="flex-1">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-2xl font-semibold text-gray-800">{user.full_name || user.first_name}</div>
              <div class="text-sm text-gray-500">{user.email}</div>
            </div>

            <div class="ml-4 flex items-center gap-3">
              <a
                href="/dashboard"
                class="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded shadow-sm text-sm transition"
              >
                ← Dashboard
              </a>

              
            </div>
          </div>

          <div class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div class="text-xs text-gray-500">Course Level</div>
              <div class="mt-1 text-sm text-gray-700">{user.level_key ?? '—'}</div>
            </div>

            <div>
              <div class="text-xs text-gray-500">Timezone</div>
              <div class="mt-1 text-sm text-gray-700">{user.tz ?? '—'}</div>
            </div>

           
          </div>
        </div>
      </div>
    </section>

    <!-- BOTTOM: Two cards (Payments | Support) -->
    <section class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Payments -->
      <div class="bg-white p-6 rounded-lg shadow-sm border border-orange-100 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="text-lg font-semibold text-gray-800">My Payments</h3>
              <div class="text-xs text-gray-500">Billing & invoices</div>
            </div>

            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
              🚧 Coming soon
            </span>
          </div>

          <p class="text-sm text-gray-600 mb-4">
            We’re building a billing area where you can view your payments, and download receipts.
            For now, contact our billing team if you need anything.
          </p>
        </div>
      </div>

      <!-- Support -->
      <div class="bg-white p-6 rounded-lg shadow-sm border border-orange-100 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="text-lg font-semibold text-gray-800">Support Requests</h3>
              <div class="text-xs text-gray-500">Help, tickets & messages</div>
            </div>

            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
              🚧 Coming soon
            </span>
          </div>

          <p class="text-sm text-gray-600 mb-4">
            You’ll be able to see your open support requests here and track replies. For now, contact us directly.
          </p>


        </div>
      </div>
    </section>
  </main>
</div>
