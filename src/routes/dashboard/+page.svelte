<script>
  export let data;
</script>

<div class="min-h-screen bg-orange-50 text-gray-800">
  <header
    class="bg-white shadow-sm py-4 px-6 flex justify-between items-center"
  >
    <h1 class="text-lg font-semibold text-orange-600">Expat Spanish Lessons</h1>
    <a
      href="/api/logout"
      class="text-sm text-gray-500 hover:text-orange-500 transition">Logout</a
    >
  </header>

  <main class="flex flex-col md:flex-row gap-8 p-8 max-w-6xl mx-auto">
    <div class="flex-1 space-y-6">
      <div class="bg-white p-6 rounded-xl border border-orange-100 shadow-sm">
        <h2 class="text-2xl font-semibold text-gray-800">
          👋 Hola, {data.user.name}
        </h2>
        <p class="text-sm text-gray-600 mt-1">Level: {data.user.level}</p>
      </div>

      <div class="bg-white p-6 rounded-xl border border-orange-100 shadow-sm">
        <h3 class="font-semibold text-gray-800 mb-3">My Course</h3>
        <a
          href="https://expatspanishlessons.app.clientclub.net/login"
          target="_blank"
          rel="noopener noreferrer"
          class="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 px-4 rounded-lg transition inline-flex items-center justify-center"
        >
          Resume Lesson
        </a>
      </div>
    </div>

    <!-- Book Live Classes -->
    <div class="bg-white p-6 rounded-xl border border-orange-100 shadow-sm">
      <h3 class="font-semibold text-gray-800 mb-2">Book a Live Class</h3>
      <p class="text-sm text-gray-600 mb-4">
        Choose one of the available calendars for your level.
      </p>

      {#if data.calendars.length > 0}
        <div class="space-y-2">
          {#each data.calendars as c}
            <a
              href={c.link}
              target="_blank"
              rel="noopener noreferrer"
              class="block text-center bg-orange-50 border border-orange-200 hover:bg-orange-100 text-orange-700 py-2 rounded-lg text-sm font-medium transition"
            >
              {c.name}
            </a>
          {/each}
        </div>
      {:else}
        <p class="text-sm text-gray-500 italic">
          No calendars available for your level.
        </p>
      {/if}
    </div>

    <div
      class="flex-1 bg-white p-6 rounded-xl border border-orange-100 shadow-sm"
    >
      <h3 class="font-semibold text-gray-800 mb-4">Your Scheduled Sessions</h3>
      {#if data.appointments.length > 0}
        <ul class="space-y-3">
          {#each data.appointments as a}
            <li class="p-4 border border-orange-100 rounded-lg bg-orange-50">
              <p class="font-medium text-gray-800">{a.title}</p>
              <p class="text-sm text-gray-500">{a.startTime} (CST)</p>
              <div class="flex gap-3 mt-3">
                <a
                  href={a.address}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-orange-600 hover:underline text-sm">Join</a
                >
                <a
                  href={a.cancelLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-gray-600 hover:text-orange-600 text-sm">Cancel</a
                >
              </div>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="text-sm text-gray-500 italic">No sessions scheduled.</p>
      {/if}
    </div>
  </main>
</div>
