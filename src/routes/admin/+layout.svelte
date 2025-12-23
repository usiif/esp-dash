<script>
    import { page } from '$app/stores';
    import UserMenu from '$lib/components/UserMenu.svelte';
    let mobileOpen = false;
    $: pathname = $page.url.pathname;
  </script>
  
  <style>
    .sidebar {
      width: 240px;
    }
  </style>
  
  <div class="min-h-screen bg-orange-50 text-gray-800">
    <!-- mobile top bar -->
    <header class="bg-white shadow-sm py-3 px-4 flex items-center justify-between lg:hidden">
      <div class="flex items-center gap-3">
        <button
          class="p-2 rounded-md hover:bg-gray-100"
          on:click={() => (mobileOpen = !mobileOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          <svg class="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
        </button>
  
        <h1 class="text-sm font-semibold text-orange-600">Admin</h1>
      </div>
  
      <div><UserMenu user={$page.data.user ?? {}} /></div>
    </header>
  
    <div class="lg:flex">
      <!-- pinned left sidebar (desktop) -->
      <aside class="sidebar hidden lg:block bg-white p-4 border-r border-orange-50 h-screen sticky top-0">
        <div class="mb-6">
          <h2 class="text-sm font-semibold text-orange-600">Admin</h2>
        </div>
  
        <nav class="flex flex-col gap-1">
          <a href="/admin"
             class="px-3 py-2 rounded-md text-sm flex items-center gap-3 hover:bg-orange-50"
             class:bg-orange-50={pathname === '/admin'}
             class:text-orange-600={pathname === '/admin'}>
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M3 13h8V3H3v10zm10 8h8V3h-8v18z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span>Overview</span>
          </a>
  
          <a href="/admin/students"
             class="px-3 py-2 rounded-md text-sm flex items-center gap-3 hover:bg-orange-50"
             class:bg-orange-50={pathname.startsWith('/admin/students')}
             class:text-orange-600={pathname.startsWith('/admin/students')}>
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M12 12a4 4 0 100-8 4 4 0 000 8zm-9 9a9 9 0 1118 0H3z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span>Students</span>
          </a>

          <a href="/admin/classes"
             class="px-3 py-2 rounded-md text-sm flex items-center gap-3 hover:bg-orange-50"
             class:bg-orange-50={pathname.startsWith('/admin/classes')}
             class:text-orange-600={pathname.startsWith('/admin/classes')}>
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span>Classes</span>
          </a>

          <a href="/admin/placementquiz"
             class="px-3 py-2 rounded-md text-sm flex items-center gap-3 hover:bg-orange-50"
             class:bg-orange-50={pathname.startsWith('/admin/placementquiz')}
             class:text-orange-600={pathname.startsWith('/admin/placementquiz')}>
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span>Placement Quizzes</span>
          </a>
        </nav>
      </aside>
  
      <!-- mobile collapsible nav -->
      {#if mobileOpen}
        <div class="lg:hidden bg-white p-4 border-b border-orange-50">
          <nav class="flex flex-col gap-1">
            <a href="/admin" class="px-3 py-2 rounded-md text-sm flex items-center gap-3 hover:bg-orange-50">Overview</a>
            <a href="/admin/students" class="px-3 py-2 rounded-md text-sm flex items-center gap-3 hover:bg-orange-50">Students</a>
            <a href="/admin/classes" class="px-3 py-2 rounded-md text-sm flex items-center gap-3 hover:bg-orange-50">Classes</a>
            <a href="/admin/placementquiz" class="px-3 py-2 rounded-md text-sm flex items-center gap-3 hover:bg-orange-50">Placement Quizzes</a>
          </nav>
        </div>
      {/if}
  
      <!-- main content area (slot) -->
      <div class="flex-1 p-6 min-h-screen">
        <slot />
      </div>
    </div>
  </div>
  