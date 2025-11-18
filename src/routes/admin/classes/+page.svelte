<script>
    import TwoWeekDashboard from '$lib/components/TwoWeekDashboard.svelte';
    import ClassEditPanel from '$lib/components/ClassEditPanel.svelte';
    export let data;
  
    let events = data.events || [];
  
    // panel state
    let panelOpen = false;
    let panelMode = 'event'; // 'event' | 'date'
    let panelData = null;
  
    // toast state
    let showToast = false;
    let toastMessage = '';
    let toastType = 'success'; // 'success' | 'error'

    // confirmation dialog state
    let showConfirmDialog = false;
    let confirmDialogData = null;
  
    function showSuccessToast(message) {
      toastMessage = message;
      toastType = 'success';
      showToast = true;
      setTimeout(() => showToast = false, 3000);
    }
  
    function showErrorToast(message) {
      toastMessage = message;
      toastType = 'error';
      showToast = true;
      setTimeout(() => showToast = false, 4000);
    }
  
    function handleOpen(e) {
      panelMode = 'event';
      panelData = e.detail;
      panelOpen = true;
    }
  
    function handleMore(e) {
      panelMode = 'date';
      panelData = e.detail; // { date, events }
      panelOpen = true;
    }
  
    async function handleCreate(e) {
      const startsAt = e.detail.date; // ISO string
      console.log('Opening new class form for:', startsAt);

      // Create a temporary event object (not saved to DB yet)
      // Convert ISO string to datetime-local format for the input
      const dateObj = new Date(startsAt);
      const localDatetime = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);

      const tempEvent = {
        id: null, // null indicates this is a new unsaved class
        title: 'New Class',
        description: '',
        start: localDatetime,
        duration_minutes: 60,
        capacity: 10,
        levels: [],
        teacher: null,
        teacher_id: null,
        zoom_link: '',
        recording_link: '',
        notes: '',
        color: '#ea580c'
      };

      // Open the panel to edit the new class
      panelMode = 'event';
      panelData = tempEvent;
      panelOpen = true;
    }
  
    function closePanel() {
      panelOpen = false;
      panelData = null;
    }
  
    async function handleSave(e) {
      const classData = e.detail;
      console.log('Saving class data:', classData);

      try {
        // Determine if this is a new class (id is null) or an update
        const isNewClass = classData.id === null;
        const endpoint = isNewClass ? '/api/classes/create' : '/api/classes/update';

        // Convert datetime-local to ISO for API
        const startsAtIso = new Date(classData.start).toISOString();

        const payload = isNewClass
          ? {
              title: classData.title,
              description: classData.description,
              starts_at: startsAtIso,
              duration_minutes: classData.duration_minutes,
              teacher_id: classData.teacher_id,
              levels: classData.levels,
              capacity: classData.capacity,
              zoom_link: classData.zoom_link,
              recording_link: classData.recording_link,
              notes: classData.notes,
              class_type_id: classData.class_type_id,
            }
          : {
              id: classData.id,
              title: classData.title,
              description: classData.description,
              start: classData.start,
              duration_minutes: classData.duration_minutes,
              teacher_id: classData.teacher_id,
              levels: classData.levels,
              capacity: classData.capacity,
              zoom_link: classData.zoom_link,
              recording_link: classData.recording_link,
              notes: classData.notes,
              class_type_id: classData.class_type_id,
            };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok) {
          console.error('Failed to save:', result.error);
          showErrorToast('Failed to save class: ' + (result.error || 'Unknown error'));
          return;
        }

        if (isNewClass) {
          // Add the new event to the local events array
          events = [...events, result.event];
          console.log('Class created successfully:', result.event);
          showSuccessToast('Class created successfully!');
        } else {
          // Update the event in the local events array
          const index = events.findIndex(ev => ev.id === result.event.id);
          if (index !== -1) {
            events[index] = result.event;
            events = events; // Trigger reactivity
          }
          console.log('Class saved successfully:', result.event);
          showSuccessToast('Class saved successfully!');
        }

        closePanel();

      } catch (err) {
        console.error('Error saving class:', err);
        showErrorToast('Failed to save class. Please try again.');
      }
    }
  
    // Handle filter changes - filters are applied client-side via matchesFilter in component
    function handleFilterChange(e) {
      console.log('filters', e.detail);
    }
  
    function handleRangeChange(e) {
      console.log('rangeChange', e.detail);
    }

    function handleDelete(e) {
      const classData = e.detail;
      console.log('Delete requested for:', classData);

      // Show confirmation dialog
      confirmDialogData = classData;
      showConfirmDialog = true;
    }

    async function confirmDelete() {
      if (!confirmDialogData || !confirmDialogData.id) {
        showErrorToast('Cannot delete: Invalid class data');
        showConfirmDialog = false;
        return;
      }

      try {
        const response = await fetch('/api/classes/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: confirmDialogData.id,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          console.error('Failed to delete:', result.error);
          showErrorToast('Failed to delete class: ' + (result.error || 'Unknown error'));
          showConfirmDialog = false;
          return;
        }

        // Remove the event from the local events array
        events = events.filter(ev => ev.id !== confirmDialogData.id);

        console.log('Class deleted successfully:', confirmDialogData.id);
        showSuccessToast('Class deleted successfully!');
        showConfirmDialog = false;
        confirmDialogData = null;
        closePanel();

      } catch (err) {
        console.error('Error deleting class:', err);
        showErrorToast('Failed to delete class. Please try again.');
        showConfirmDialog = false;
      }
    }

    function cancelDelete() {
      showConfirmDialog = false;
      confirmDialogData = null;
    }
  </script>
  
  <svelte:head>
    <title>Admin — Classes</title>
  </svelte:head>
  
  <div class="h-screen bg-orange-50 flex flex-col overflow-hidden">
    <div class="flex-shrink-0 max-w-7xl w-full mx-auto px-6 py-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-semibold">📋 Classes dashboard</h1>
        <div class="text-sm text-gray-600">Two-week control view — click an event to open details</div>
  
  <style>
    @keyframes slide-in {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  
    .animate-slide-in {
      animation: slide-in 0.3s ease-out;
    }
  </style>
      </div>
    </div>
  
    <div class="flex-1 max-w-7xl w-full mx-auto px-6 pb-6 overflow-hidden">
      <TwoWeekDashboard
        {events}
        calendarHeight="100%"
        on:open={handleOpen}
        on:more={handleMore}
        on:create={handleCreate}
        on:filterChange={handleFilterChange}
        on:rangeChange={handleRangeChange}
      />
    </div>
  
    <!-- Toast Notification -->
    {#if showToast}
      <div class="fixed top-6 right-6 z-[200] animate-slide-in">
        <div class="bg-white rounded-lg shadow-lg border-l-4 p-4 min-w-[300px] max-w-md"
             class:border-green-500={toastType === 'success'}
             class:border-red-500={toastType === 'error'}>
          <div class="flex items-start gap-3">
            {#if toastType === 'success'}
              <svg class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            {:else}
              <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            {/if}
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900">{toastMessage}</p>
            </div>
            <button on:click={() => showToast = false} class="text-gray-400 hover:text-gray-600 flex-shrink-0">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    {/if}
  
    {#if panelOpen}
      <ClassEditPanel
        {panelData}
        {panelMode}
        teachers={data.teachers}
        classTypes={data.classTypes}
        on:close={closePanel}
        on:save={handleSave}
        on:delete={handleDelete}
      />
    {/if}

    <!-- Confirmation Dialog -->
    {#if showConfirmDialog}
      <div class="fixed inset-0 z-[150] flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" on:click={cancelDelete}></div>

        <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 animate-slide-in">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Delete Class?</h3>
          <p class="text-sm text-gray-600 mb-6">
            Are you sure you want to delete "<strong>{confirmDialogData?.title || 'this class'}</strong>"?
            This action cannot be undone.
          </p>

          <div class="flex gap-3 justify-end">
            <button
              type="button"
              on:click={cancelDelete}
              class="px-4 py-2 border rounded-md hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              on:click={confirmDelete}
              class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 cursor-pointer"
            >
              Delete Class
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>