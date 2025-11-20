<script>
  import { page } from '$app/stores';
  import UserMenu from './UserMenu.svelte';

  export let user = null;

  $: pathname = $page.url.pathname;

  let mobileMenuOpen = false;
</script>

<!-- Mobile Header (visible on small screens) -->
<div class="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-40">
  <div class="flex items-center justify-between px-4 py-3">
    <span class="text-lg font-semibold text-orange-600">📚 ESPL</span>
    <button
      on:click={() => mobileMenuOpen = !mobileMenuOpen}
      class="p-2 text-gray-600 hover:text-gray-900"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  </div>

  <!-- Mobile Menu Dropdown -->
  {#if mobileMenuOpen}
    <div class="border-t border-gray-200 pb-3">
      <a
        href="/dashboard"
        class="block px-4 py-2 text-sm font-medium"
        class:bg-orange-50={pathname === '/dashboard'}
        class:text-orange-600={pathname === '/dashboard'}
        class:text-gray-700={pathname !== '/dashboard'}
        on:click={() => mobileMenuOpen = false}
      >
        🏠 Dashboard
      </a>
      <a
        href="/classes"
        class="block px-4 py-2 text-sm font-medium"
        class:bg-orange-50={pathname === '/classes'}
        class:text-orange-600={pathname === '/classes'}
        class:text-gray-700={pathname !== '/classes'}
        on:click={() => mobileMenuOpen = false}
      >
        📅 Browse Classes
      </a>
      <a
        href="/recordings"
        class="block px-4 py-2 text-sm font-medium"
        class:bg-orange-50={pathname === '/recordings'}
        class:text-orange-600={pathname === '/recordings'}
        class:text-gray-700={pathname !== '/recordings'}
        on:click={() => mobileMenuOpen = false}
      >
        📹 Recordings
      </a>
      <a
        href="/help"
        class="block px-4 py-2 text-sm font-medium text-gray-700"
        on:click={() => mobileMenuOpen = false}
      >
        ❓ Help
      </a>
      {#if user}
        <div class="border-t border-gray-200 mt-2 pt-2 px-4">
          <UserMenu {user} />
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Desktop Sidebar (visible on large screens) -->
<aside class="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-56 lg:bg-white lg:border-r lg:border-gray-200 lg:z-40">
  <!-- Logo -->
  <div class="flex items-center h-14 px-4 border-b border-gray-200">
    <span class="text-lg font-semibold text-orange-600">📚 ESPL</span>
  </div>

  <!-- Navigation -->
  <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
    <a
      href="/dashboard"
      class="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-colors"
      class:bg-orange-50={pathname === '/dashboard'}
      class:text-orange-600={pathname === '/dashboard'}
      class:text-gray-700={pathname !== '/dashboard'}
      class:hover:bg-gray-50={pathname !== '/dashboard'}
    >
      <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
      Dashboard
    </a>

    <a
      href="/classes"
      class="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-colors"
      class:bg-orange-50={pathname === '/classes'}
      class:text-orange-600={pathname === '/classes'}
      class:text-gray-700={pathname !== '/classes'}
      class:hover:bg-gray-50={pathname !== '/classes'}
    >
      <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      Browse Classes
    </a>

    <a
      href="/recordings"
      class="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-colors"
      class:bg-orange-50={pathname === '/recordings'}
      class:text-orange-600={pathname === '/recordings'}
      class:text-gray-700={pathname !== '/recordings'}
      class:hover:bg-gray-50={pathname !== '/recordings'}
    >
      <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      Recordings
    </a>

    <a
      href="/help"
      class="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-colors text-gray-700 hover:bg-gray-50"
    >
      <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Help
    </a>
  </nav>

  <!-- User Profile at Bottom -->
  {#if user}
    <div class="border-t border-gray-200 p-3">
      <UserMenu {user} />
    </div>
  {/if}
</aside>
