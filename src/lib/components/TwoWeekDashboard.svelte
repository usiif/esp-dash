<script>
    import { createEventDispatcher } from 'svelte';
  
    // props
    export let events = []; // array of events: { id, title, start ISO, end ISO?, teacher, teacher_id?, levels (array), capacity, color, notes, zoom_link, recording_link }
    export let showTeacher = true; // still used for panel details if you want
    export let calendarHeight = 'calc(100vh - 220px)';
    export let weekSlideDays = 7; // slide by one week
  
    const dispatch = createEventDispatcher();
  
    // offset in days relative to monday anchor
    let offsetDays = 0;
  
    // filters removed for now
    // let selectedTeacher = 'all';
    // let selectedLevel = 'all';
  
    // helper: monday of any date
    function mondayOf(d) {
      const copy = new Date(d);
      const day = copy.getDay(); // 0=Sun..6
      const mondayShift = (day + 6) % 7;
      copy.setDate(copy.getDate() - mondayShift);
      copy.setHours(0,0,0,0);
      return copy;
    }
  
    function localDateKey(dateLike) {
      const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    }
  
    // build grid of 14 day objects (now accepts offset param so svelte tracks it)
    function buildGrid(referenceDate, offset = 0) {
      const start = mondayOf(referenceDate);
      start.setDate(start.getDate() + offset);
      const cells = [];
      for (let i = 0; i < 14; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        d.setHours(0,0,0,0);
        cells.push({ date: d, key: localDateKey(d), events: [] });
      }
      return cells;
    }
  
    // anchor = today midnight
    const anchor = (() => {
      const d = new Date();
      d.setHours(0,0,0,0);
      return d;
    })();
  
    // reactive grid depends on offsetDays now
    $: grid = buildGrid(anchor, offsetDays);
  
    // derive teacher list (for potential future use)
    $: teachers = (() => {
      const map = {};
      for (const e of events) if (e?.teacher) {
        const key = e.teacher_id ? `${e.teacher_id}||${e.teacher}` : e.teacher;
        map[key] = { name: e.teacher, id: e.teacher_id ?? null };
      }
      return Object.entries(map)
        .map(([k,v]) => ({ key: k, name: v.name, id: v.id }))
        .sort((a,b) => a.name.localeCompare(b.name));
    })();
  
    // map events into grid (we populate all events; filtering applied at render)
    $: if (grid && events) {
      const idx = {};
      grid.forEach((c,i)=> idx[c.key] = i);
      for (const c of grid) c.events = [];
      for (const ev of events) {
        if (!ev?.start) continue;
        const k = localDateKey(ev.start);
        const i = idx[k];
        if (i !== undefined) grid[i].events.push(ev);
      }
      for (const c of grid) c.events.sort((a,b)=> new Date(a.start) - new Date(b.start));
    }
  
    // controls
    function prev() {
      offsetDays -= weekSlideDays;
      dispatch('rangeChange', { offsetDays });
    }
    function next() {
      offsetDays += weekSlideDays;
      dispatch('rangeChange', { offsetDays });
    }
    function goToToday() {
      offsetDays = 0;
      dispatch('rangeChange', { offsetDays });
    }
  
    // helpers for UI
    function shortTime(iso) {
      if (!iso) return '';
      const d = new Date(iso);
      const hours = d.getHours();
      const minutes = d.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const displayMinutes = String(minutes).padStart(2, '0');
      return `${displayHours}:${displayMinutes}${ampm}`;
    }
  
    function openEvent(ev) {
      dispatch('open', ev);
    }
  
    function openMore(cell) {
      // dispatch all events for that date
      dispatch('more', { date: cell.date, events: cell.events });
    }
  
    function createClass(cell) {
      // Create a new empty class for this date at 9:00 AM
      const date = new Date(cell.date);
      date.setHours(9, 0, 0, 0);
      
      dispatch('create', { date: date.toISOString() });
    }
  
    function isTodayCell(cell) {
      return cell.key === localDateKey(new Date());
    }
  
    // filtering removed for now
    function matchesFilter(ev) {
      return true; // show all events
    }
  
    // deterministic color fallbacks
    function fallbackColor(ev) {
      if (ev?.color) return ev.color;
      if (ev?.levels && ev.levels.length) return levelColor(ev.levels[0]);
      if (ev?.teacher) return hashColor(ev.teacher);
      return '#ea580c';
    }
  
    function levelColor(label) {
      let h = 0;
      for (let i=0;i<label.length;i++) h = (h << 5) - h + label.charCodeAt(i);
      const hue = Math.abs(h) % 360;
      return `hsl(${hue} 78% 46%)`;
    }
    function hashColor(str) {
      let h = 0;
      for (let i=0;i<str.length;i++) h = (h << 5) - h + str.charCodeAt(i);
      const hue = Math.abs(h) % 360;
      return `hsl(${hue} 60% 40%)`;
    }
  
    // avatar helpers
    function initials(name) {
      if (!name) return '';
      const parts = name.trim().split(/\s+/);
      const first = (parts[0] || '').charAt(0).toUpperCase();
      const last = (parts.length > 1 ? parts[parts.length-1].charAt(0).toUpperCase() : '');
      return (first + last).slice(0,2);
    }
  </script>
  
  <!-- outer container: fixed height and no page overflow from inside this component -->
  <div class="w-full overflow-hidden" style="height: {calendarHeight};">
    <div class="bg-white rounded-lg shadow-sm border h-full flex flex-col overflow-hidden">
      <!-- header: controls only -->
      <div class="flex items-center justify-between gap-3 p-3 border-b flex-shrink-0">
        <div class="flex items-center gap-2">
          <button class="px-3 py-1 rounded border text-sm hover:bg-gray-50" on:click={prev} aria-label="Previous week">◀</button>
          <button class="px-3 py-1 rounded border text-sm hover:bg-gray-50" on:click={goToToday}>Today</button>
          <button class="px-3 py-1 rounded border text-sm hover:bg-gray-50" on:click={next} aria-label="Next week">▶</button>
  
          <div class="text-sm text-gray-600 ml-3 font-medium">
            {#if grid && grid.length}
              {new Date(grid[0].date).toLocaleDateString()} — {new Date(grid[13].date).toLocaleDateString()}
            {/if}
          </div>
        </div>
      </div>
  
      <!-- the compact two column grid (scrollable) -->
      <div class="flex gap-3 flex-1 overflow-hidden p-3">
        <!-- Week A -->
        <div class="flex-1 flex flex-col gap-2 overflow-hidden">
          <div class="text-xs font-semibold text-gray-500 mb-1 flex-shrink-0">Week A</div>
          <div class="space-y-2 overflow-auto" style="min-height:0;">
            {#each grid.slice(0,7) as cell (cell.key)}
              <div class="flex items-start gap-3 p-2 rounded border hover:shadow-sm"
                   class:is-today={isTodayCell(cell)}
                   role="group"
                   aria-current={isTodayCell(cell) ? 'date' : undefined}>
                <div class="w-14 flex-shrink-0 text-right text-xs text-gray-500">
                  <div class="font-semibold">{cell.date.toLocaleDateString(undefined, { weekday:'short' })}</div>
                  <div class="text-[11px]">{cell.date.toLocaleDateString(undefined, { month:'short', day:'numeric' })}</div>
                </div>
  
                <div class="flex-1 min-w-0">
                  <div class="flex flex-col gap-0.5">
                    <button
                      class="text-xs text-orange-500 hover:text-orange-600 font-medium cursor-pointer text-left"
                      on:click={() => createClass(cell)}
                      title="Create new class"
                    >
                      + Create Class
                    </button>

                    {#if cell.events.length > 0}
                      {#each cell.events.filter(matchesFilter) as ev (ev.id)}
                        <button class="flex items-center gap-2 w-full text-left rounded px-2 py-1 hover:bg-gray-50 h-7 cursor-pointer"
                                on:click={() => openEvent(ev)}
                                title={ev.title}>
                          <!-- colored dot -->
                          <div class="w-2 h-2 rounded-full flex-shrink-0"
                               style="background: {fallbackColor(ev)}">
                          </div>
  
                          <!-- time -->
                          <div class="text-xs text-gray-500 w-[52px] flex-shrink-0">{shortTime(ev.start)}</div>
  
                          <!-- title -->
                          <div class="flex-1 min-w-0 text-xs font-medium truncate">{ev.title}</div>
  
                          <!-- teacher initials -->
                          <div class="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold text-white flex-shrink-0"
                               style="background: {fallbackColor(ev)}">
                            {initials(ev.teacher)}
                          </div>
                        </button>
                      {/each}
  
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
  
        <!-- Week B -->
        <div class="flex-1 flex flex-col gap-2 overflow-hidden">
          <div class="text-xs font-semibold text-gray-500 mb-1 flex-shrink-0">Week B</div>
          <div class="space-y-2 overflow-auto" style="min-height:0;">
            {#each grid.slice(7,14) as cell (cell.key)}
              <div class="flex items-start gap-3 p-2 rounded border hover:shadow-sm"
                   class:is-today={isTodayCell(cell)}
                   role="group"
                   aria-current={isTodayCell(cell) ? 'date' : undefined}>
                <div class="w-14 flex-shrink-0 text-right text-xs text-gray-500">
                  <div class="font-semibold">{cell.date.toLocaleDateString(undefined, { weekday:'short' })}</div>
                  <div class="text-[11px]">{cell.date.toLocaleDateString(undefined, { month:'short', day:'numeric' })}</div>
                </div>
  
                <div class="flex-1 min-w-0">
                  <div class="flex flex-col gap-0.5">
                    <button
                      class="text-xs text-orange-500 hover:text-orange-600 font-medium cursor-pointer text-left"
                      on:click={() => createClass(cell)}
                      title="Create new class"
                    >
                      + Create Class
                    </button>

                    {#if cell.events.length > 0}
                      {#each cell.events.filter(matchesFilter) as ev (ev.id)}
                        <button class="flex items-center gap-2 w-full text-left rounded px-2 py-1 hover:bg-gray-50 h-7"
                                on:click={() => openEvent(ev)}
                                title={ev.title}>
                          <!-- time -->
                          <div class="text-xs text-gray-500 w-12 flex-shrink-0">{shortTime(ev.start)}</div>
  
                          <!-- title -->
                          <div class="flex-1 min-w-0 text-xs font-medium truncate">{ev.title}</div>
  
                          <!-- teacher initials -->
                          <div class="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold text-white flex-shrink-0"
                               style="background: {fallbackColor(ev)}">
                            {initials(ev.teacher)}
                          </div>
                        </button>
                      {/each}
  
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
  
      <!-- footer: compact hint -->
      <div class="p-3 border-t text-xs text-gray-500 flex-shrink-0">Showing all events; click an item to open details</div>
    </div>
  </div>
  
  <style>
    .is-today { box-shadow: 0 0 0 2px rgba(234,88,12,0.08); }
    /* keep styles tiny; layout handled by Tailwind classes */
  </style>