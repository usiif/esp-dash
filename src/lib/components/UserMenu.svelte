<script>
    import { onMount, onDestroy } from 'svelte';
    import { fade } from 'svelte/transition';
  
    export let user = {};
  
    let open = false;
    let _clickHandler;
  
    const displayName = user.full_name || user.first_name || user.name || 'Student';
    const initial = displayName?.slice(0, 1).toUpperCase() ?? 'S';
  
    // register click-outside only on client
    onMount(() => {
      _clickHandler = (e) => {
        if (!open) return;
        const target = e.target;
        if (!target) {
          open = false;
          return;
        }
        const inside = typeof target.closest === 'function' && target.closest('.user-menu-root');
        if (!inside) open = false;
      };
      document.addEventListener('click', _clickHandler);
    });
  
    onDestroy(() => {
      if (_clickHandler) document.removeEventListener('click', _clickHandler);
    });
  </script>
  
  <style>
    .avatar-initial {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 9999px;
      background-color: #fff7ed; /* orange-50 */
      color: #c2410c; /* orange-600/700 */
      font-weight: 600;
      font-size: 0.9rem;
    }
  
    .menu-card {
      background: white;
      border-radius: 10px;
      box-shadow: 0 8px 20px rgba(14, 20, 26, 0.06);
      padding: 8px 6px;
      min-width: 170px;
    }
  
    .menu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 7px 10px;
      border-radius: 8px;
      color: #374151; /* gray-700 */
      font-size: 15px;
      line-height: 1.2;
      text-decoration: none;
    }
  
    .menu-item:hover {
      background: #fff7f0;
    }
  
    .icon-sm {
      width: 17px;
      height: 17px;
      flex-shrink: 0;
    }
  </style>
  
  <div class="user-menu-root relative" aria-haspopup="true" aria-expanded={open}>
    <button
      type="button"
      class="flex items-center gap-2 w-full focus:outline-none cursor-pointer hover:bg-gray-50 rounded-md p-2 transition-colors"
      on:click={() => (open = !open)}
      aria-label="Open user menu"
    >
      {#if user.profile_pic}
        <img
          src={user.profile_pic}
          alt="Avatar"
          class="w-8 h-8 rounded-full object-cover"
          on:error={(e) => { e.target.style.display = 'none'; }}
        />
      {:else}
        <div class="avatar-initial" aria-hidden="true">{initial}</div>
      {/if}

      <div class="flex-1 text-left">
        <p class="text-sm font-medium text-gray-900">{displayName}</p>
      </div>

      <!-- small gray arrow (pointing up when open) -->
      <svg class="w-4 h-4 text-gray-400 transition-transform" class:rotate-180={open} viewBox="0 0 20 20" fill="none">
        <path d="M6 8l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    {#if open}
      <div
        class="absolute left-0 right-0 bottom-full mb-2 z-50"
        transition:fade={{ duration: 120 }}
      >
        <div class="menu-card" role="menu" aria-orientation="vertical">
          <a
            href="/profile"
            class="menu-item"
            role="menuitem"
            on:click={() => (open = false)}
          >
            <svg class="icon-sm text-orange-500" viewBox="0 0 24 24" fill="none">
              <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M20 21v-1a4 4 0 00-4-4H8a4 4 0 00-4 4v1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Profile</span>
          </a>
  
          <a
            href="/api/logout"
            class="menu-item mt-1"
            role="menuitem"
            on:click={() => (open = false)}
          >
            <svg class="icon-sm text-gray-500" viewBox="0 0 24 24" fill="none">
              <path d="M16 17l5-5-5-5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M21 12H9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 19H6a2 2 0 01-2-2V7a2 2 0 012-2h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Logout</span>
          </a>
        </div>
      </div>
    {/if}
  </div>
  