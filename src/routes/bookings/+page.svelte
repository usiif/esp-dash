<script>
  import { fade } from 'svelte/transition';
  import StudentNav from '$lib/components/StudentNav.svelte';
  import Onboarding from '$lib/components/onboarding.svelte';

  export let data;

  let cancellingId = null;
  let showToast = false;
  let toastMessage = '';

  function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    const dayFormat = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
    return `${dayFormat} — ${time}`;
  }

  async function cancelBooking(enrollmentId) {
    if (cancellingId === enrollmentId) return;

    if (!confirm('Are you sure you want to cancel this booking?')) return;

    cancellingId = enrollmentId;

    try {
      const response = await fetch('/api/enrollments/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollment_id: enrollmentId })
      });

      const result = await response.json();

      if (!response.ok) {
        showToastMessage(result.error || 'Failed to cancel booking');
        cancellingId = null;
        return;
      }

      // Remove from local state
      data.upcomingBookings = data.upcomingBookings.filter(b => b.enrollment_id !== enrollmentId);
      showToastMessage('Booking cancelled successfully');
      cancellingId = null;

    } catch (err) {
      console.error('Error cancelling booking:', err);
      showToastMessage('Failed to cancel booking');
      cancellingId = null;
    }
  }

  function showToastMessage(message) {
    toastMessage = message;
    showToast = true;
    setTimeout(() => showToast = false, 3000);
  }
</script>

<svelte:head>
  <title>My Bookings — ESPL</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <StudentNav user={data.user} />
  <Onboarding {data} />

  <!-- Main Content with padding for desktop sidebar -->
  <main class="lg:ml-56 p-4 sm:p-6 max-w-6xl">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-2 mb-1">
        <h1 class="text-2xl font-bold text-gray-900">My Bookings</h1>
        {#if data.user.level}
          <span class="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">
            {data.user.level}
          </span>
        {/if}
      </div>
      <p class="text-sm text-gray-600">Your upcoming class enrollments</p>
    </div>

    <!-- Upcoming Bookings -->
    {#if data.upcomingBookings.length === 0}
      <div class="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p class="text-gray-600 mb-4">No upcoming bookings</p>
        <a href="/classes" class="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600">
          Browse Available Classes
        </a>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each data.upcomingBookings as booking (booking.enrollment_id)}
          <div class="bg-white border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors">
            <div class="flex flex-col gap-3">
              <!-- Header -->
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="font-bold text-gray-900 text-base">{booking.class.title}</h3>
                  <span class="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                    Booked
                  </span>
                </div>
                <p class="text-sm text-orange-600 font-medium mb-1">{formatDateTime(booking.class.start)}</p>
                {#if booking.class.teacher}
                  <p class="text-xs text-gray-500">with {booking.class.teacher}</p>
                {/if}
              </div>

              <!-- Details -->
              {#if booking.class.description}
                <p class="text-sm text-gray-600 line-clamp-2">{booking.class.description}</p>
              {/if}

              <div class="flex items-center gap-2 text-xs text-gray-500">
                <span>{booking.class.duration_minutes} min</span>
                {#if booking.class.levels && booking.class.levels.length > 0}
                  <span>•</span>
                  <span>{booking.class.levels.join(', ')}</span>
                {/if}
              </div>

              <!-- Actions -->
              <div class="flex gap-2 pt-2 border-t border-gray-200">
                {#if booking.class.zoom_link}
                  <a
                    href={booking.class.zoom_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex-1 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded hover:bg-orange-600 text-center"
                  >
                    Join Class
                  </a>
                {/if}
                <button
                  on:click={() => cancelBooking(booking.enrollment_id)}
                  disabled={cancellingId === booking.enrollment_id}
                  class="px-4 py-2 text-sm text-gray-600 hover:text-red-600 underline disabled:opacity-50"
                >
                  {cancellingId === booking.enrollment_id ? 'Cancelling...' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </main>

  <!-- Toast -->
  {#if showToast}
    <div class="fixed top-6 right-6 z-50 max-w-sm" transition:fade>
      <div class="bg-white rounded-lg shadow-lg border-l-4 border-orange-500 p-4">
        <p class="text-sm font-medium text-gray-900">{toastMessage}</p>
      </div>
    </div>
  {/if}
</div>
