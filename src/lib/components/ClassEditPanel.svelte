<script>
    import { createEventDispatcher } from 'svelte';
  
    export let panelData = null;
    export let panelMode = 'event'; // 'event' | 'date'
    export let teachers = []; // array of { id, full_name, email }
    export let classTypes = []; // array of class type templates

    const dispatch = createEventDispatcher();

    // Tab state for event mode
    let activeTab = 'info'; // 'info' | 'students'

    // Enrolled students data
    let enrolledStudents = [];
    let loadingStudents = false;

    // Fetch enrolled students when class is selected
    async function fetchEnrolledStudents() {
      if (!panelData?.id) {
        enrolledStudents = [];
        return;
      }

      loadingStudents = true;
      try {
        const response = await fetch(`/api/classes/${panelData.id}/enrollments`);
        if (response.ok) {
          const data = await response.json();
          enrolledStudents = data.enrollments || [];
        } else {
          console.error('Failed to fetch enrollments');
          enrolledStudents = [];
        }
      } catch (err) {
        console.error('Error fetching enrollments:', err);
        enrolledStudents = [];
      } finally {
        loadingStudents = false;
      }
    }

    async function updateAttendanceStatus(enrollmentId, newStatus) {
      try {
        const response = await fetch(`/api/enrollments/${enrollmentId}/attendance`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attendance_status: newStatus })
        });

        if (response.ok) {
          // Update local state
          enrolledStudents = enrolledStudents.map(e =>
            e.id === enrollmentId ? { ...e, attendance_status: newStatus } : e
          );
        } else {
          console.error('Failed to update attendance status');
        }
      } catch (err) {
        console.error('Error updating attendance status:', err);
      }
    }

    function handleClassTypeChange(e) {
      const classTypeId = e.target.value;
      if (!classTypeId) return;

      const classType = classTypes.find(ct => ct.id === classTypeId);
      if (!classType) return;

      // Auto-populate fields from class type template
      panelData = {
        ...panelData,
        class_type_id: classType.id,
        title: classType.title,
        description: classType.description || panelData.description,
        duration_minutes: classType.default_duration_minutes,
        capacity: classType.default_capacity,
        levels: [...classType.default_levels],
        zoom_link: classType.default_zoom_link || panelData.zoom_link,
        teacher_id: classType.teacher_id || panelData.teacher_id
      };
    }
  
    function close() {
      dispatch('close');
    }
  
    function switchToEvent(ev) {
      panelMode = 'event';
      panelData = ev;
      activeTab = 'info';
    }
  
    function handleSave() {
      console.log('Save clicked', panelData);
      dispatch('save', panelData);
    }

    function handleDelete() {
      console.log('Delete clicked', panelData);
      dispatch('delete', panelData);
    }
  
    $: if (panelMode === 'event' && panelData?.id) {
      // Reset to info tab when opening a new event
      activeTab = 'info';
      // Fetch enrolled students
      fetchEnrolledStudents();
    }
  </script>
  
  <div class="fixed inset-0 z-[100] flex">
    <div class="absolute inset-0 bg-black/30" on:click={close}></div>
  
    <aside class="ml-auto w-full sm:w-[480px] bg-white shadow-2xl border-l flex flex-col overflow-hidden relative">
      <!-- Header -->
      <div class="flex items-start justify-between gap-3 p-6 border-b flex-shrink-0">
        <div>
          {#if panelMode === 'event'}
            <h2 class="text-lg font-semibold">{panelData.id === null ? 'Create Class' : 'Edit Class'}</h2>
            {#if panelData.id !== null}
              <div class="text-sm text-gray-500">Class ID: {panelData.id}</div>
            {/if}
          {:else}
            <h2 class="text-lg font-semibold">Events on {new Date(panelData.date).toLocaleDateString()}</h2>
            <div class="text-sm text-gray-500">{panelData.events.length} event(s)</div>
          {/if}
        </div>
        <button class="text-gray-600 hover:text-gray-900" on:click={close} aria-label="Close details">✕</button>
      </div>
  
      <!-- Tab Navigation (only in event mode) -->
      {#if panelMode === 'event'}
        <div class="flex border-b flex-shrink-0">
          <button 
            class="flex-1 px-6 py-3 text-sm font-medium transition-colors"
            class:text-orange-600={activeTab === 'info'}
            class:border-b-2={activeTab === 'info'}
            class:border-orange-600={activeTab === 'info'}
            class:text-gray-600={activeTab !== 'info'}
            on:click={() => activeTab = 'info'}
          >
            Class Info
          </button>
          <button 
            class="flex-1 px-6 py-3 text-sm font-medium transition-colors"
            class:text-orange-600={activeTab === 'students'}
            class:border-b-2={activeTab === 'students'}
            class:border-orange-600={activeTab === 'students'}
            class:text-gray-600={activeTab !== 'students'}
            on:click={() => activeTab = 'students'}
          >
            Students ({enrolledStudents.length})
          </button>
        </div>
      {/if}
  
      <!-- Content -->
      <div class="flex-1 overflow-auto p-6">
        {#if panelMode === 'event'}
          {#if activeTab === 'info'}
            <!-- Class Info Form -->
            <form on:submit|preventDefault={handleSave} class="space-y-4">
              <!-- Class Type (Template) - Only show when creating new class -->
              {#if panelData.id === null}
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Class Type (Template)</label>
                  <select
                    value={panelData.class_type_id || ''}
                    on:change={handleClassTypeChange}
                    class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
                  >
                    <option value="">— Select a template (optional) —</option>
                    {#each classTypes as classType}
                      <option value={classType.id}>{classType.title}</option>
                    {/each}
                  </select>
                  <p class="text-xs text-gray-500 mt-1">Select a template to auto-fill class details</p>
                </div>
              {/if}

              <!-- Title -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  bind:value={panelData.title}
                  class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Class title"
                />
              </div>
  
              <!-- Description -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  bind:value={panelData.description}
                  rows="3"
                  class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Class description"
                ></textarea>
              </div>
  
              <!-- Start Date & Time -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
                <input 
                  type="datetime-local" 
                  bind:value={panelData.start}
                  class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
  
              <!-- Duration -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input 
                  type="number" 
                  bind:value={panelData.duration_minutes}
                  class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="60"
                />
              </div>
  
              <!-- Teacher -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
                <select
                  bind:value={panelData.teacher_id}
                  class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
                >
                  <option value={null}>— No teacher assigned —</option>
                  {#each teachers as teacher}
                    <option value={teacher.id}>{teacher.full_name || teacher.email}</option>
                  {/each}
                </select>
              </div>
  
              <!-- Levels -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Levels (comma-separated)</label>
                <input 
                  type="text" 
                  value={(panelData.levels && panelData.levels.join(', ')) || ''}
                  on:input={(e) => {
                    const val = e.target.value;
                    panelData.levels = val ? val.split(',').map(s => s.trim()).filter(Boolean) : [];
                  }}
                  class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Beginner, Intermediate, Advanced"
                />
              </div>
  
              <!-- Capacity -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input 
                  type="number" 
                  bind:value={panelData.capacity}
                  class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="0"
                />
              </div>
  
              <!-- Zoom Link -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Zoom Link</label>
                <input 
                  type="url" 
                  bind:value={panelData.zoom_link}
                  class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="https://zoom.us/j/..."
                />
              </div>
  
              <!-- Recording Link -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Recording Link</label>
                <input 
                  type="url" 
                  bind:value={panelData.recording_link}
                  class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="https://..."
                />
              </div>
  
              <!-- Notes -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea 
                  bind:value={panelData.notes}
                  rows="4"
                  class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Additional notes..."
                ></textarea>
              </div>
            </form>
          {:else if activeTab === 'students'}
            <!-- Students List -->
            <div class="space-y-3">
              <div class="mb-4">
                <h3 class="text-sm font-semibold text-gray-700">Enrolled Students</h3>
                <p class="text-xs text-gray-500">
                  {enrolledStudents.length} / {panelData.capacity || 0} capacity
                </p>
              </div>

              {#if loadingStudents}
                <div class="text-center py-8 text-gray-400 text-sm">
                  Loading students...
                </div>
              {:else if enrolledStudents.length === 0}
                <div class="text-center py-8 text-gray-400 text-sm">
                  No students enrolled yet
                </div>
              {:else}
                {#each enrolledStudents as enrollment}
                  <div class="flex items-center gap-3 p-3 border rounded hover:bg-gray-50">
                    <!-- Avatar/Initial -->
                    <div class="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {enrollment.student?.first_name?.charAt(0) || '?'}
                    </div>

                    <!-- Info -->
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-medium text-gray-900">
                        {enrollment.student?.first_name || 'Unknown'} {enrollment.student?.last_name || ''}
                      </div>
                      <div class="text-xs text-gray-500">{enrollment.student?.email || 'No email'}</div>
                    </div>

                    <!-- Attendance Status Dropdown -->
                    <div class="flex-shrink-0">
                      <select
                        value={enrollment.attendance_status || ''}
                        on:change={(e) => updateAttendanceStatus(enrollment.id, e.target.value || null)}
                        class="px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-orange-500 cursor-pointer"
                      >
                        <option value="">Not Set</option>
                        <option value="attended">Attended</option>
                        <option value="no-show">No Show</option>
                        <option value="excused">Excused</option>
                      </select>
                    </div>
                  </div>
                {/each}
              {/if}
            </div>
          {/if}
        {:else}
          <!-- Date view: list of events -->
          <div class="space-y-2">
            {#each panelData.events as ev}
              <div class="p-3 border rounded hover:bg-gray-50">
                <div class="flex items-center justify-between">
                  <div class="font-semibold text-sm">{ev.title}</div>
                  <div class="text-xs text-gray-500">{new Date(ev.start).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</div>
                </div>
                <div class="text-xs text-gray-500">{(ev.levels && ev.levels.join(', ')) ?? '—'}</div>
                {#if ev.teacher}
                  <div class="text-xs text-gray-500">Teacher: {ev.teacher}</div>
                {/if}
                <div class="mt-2 text-sm text-gray-600">{ev.notes ?? ''}</div>
                <div class="mt-2 text-right">
                  <button class="px-2 py-1 text-xs rounded bg-white border hover:bg-gray-50" on:click={() => switchToEvent(ev)}>Edit</button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
  
      <!-- Footer with action buttons (only in event mode) -->
      {#if panelMode === 'event'}
        <div class="border-t p-6 flex gap-3 flex-shrink-0">
          {#if panelData.id !== null}
            <!-- Delete button (only for existing classes) -->
            <button
              type="button"
              on:click={handleDelete}
              class="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50 cursor-pointer"
              title="Delete class"
            >
              Delete
            </button>
          {/if}
          <div class="flex-1"></div>
          <button
            type="button"
            on:click={handleSave}
            class="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 font-medium cursor-pointer"
          >
            Save Changes
          </button>
          <button
            type="button"
            on:click={close}
            class="px-4 py-2 border rounded-md hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      {/if}
    </aside>
  </div>