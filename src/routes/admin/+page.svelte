<script>
    export let data;
  </script>

<svelte:head>
	<title>Admin - Expat Spanish Lessons</title>
</svelte:head>


  
  <div class="max-w-6xl mx-auto">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white p-5 rounded-lg shadow-sm border border-orange-100">
        <div class="text-sm text-gray-500">Students</div>
        <div class="text-2xl font-semibold mt-2">{data.totalStudents}</div>
      </div>
  
      <div class="bg-white p-5 rounded-lg shadow-sm border border-orange-100">
        <div class="text-sm text-gray-500">Active Sessions</div>
        <div class="text-2xl font-semibold mt-2">{data.activeSessions}</div>
      </div>
  
      <div class="bg-white p-5 rounded-lg shadow-sm border border-orange-100">
        <div class="text-sm text-gray-500">Pending Onboarding</div>
        <div class="text-2xl font-semibold mt-2">{data.pendingOnboarding}</div>
      </div>
    </div>
  </div>
  