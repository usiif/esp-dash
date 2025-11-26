<script>
  import { fade, fly } from 'svelte/transition';

  let { userName = '', userEmail = '', userId = '' } = $props();

  let isOpen = $state(false);
  let category = $state('');
  let subject = $state('');
  let message = $state('');
  let isSubmitting = $state(false);
  let successMessage = $state('');
  let errorMessage = $state('');
  let showNotification = $state(false);

  // Show notification after 5 seconds, hide after 35 seconds (30 seconds visible)
  $effect.root(() => {
    const showTimer = setTimeout(() => {
      showNotification = true;
    }, 5000);

    const hideTimer = setTimeout(() => {
      showNotification = false;
    }, 35000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  });

  const categories = [
    { value: 'help', label: 'I need help' },
    { value: 'feature', label: 'I have an idea' },
    { value: 'feedback', label: 'I have feedback' },
    { value: 'bug', label: 'Something is broken' },
    { value: 'other', label: 'Something else' }
  ];

  function toggleForm() {
    isOpen = !isOpen;
    showNotification = false; // Hide notification when opening form
    // Reset form when closing
    if (!isOpen) {
      category = '';
      subject = '';
      message = '';
      successMessage = '';
      errorMessage = '';
    }
  }

  function dismissNotification() {
    showNotification = false;
  }

  async function submitForm() {
    if (!category || !subject.trim() || !message.trim() || isSubmitting) return;

    isSubmitting = true;
    errorMessage = '';
    successMessage = '';

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: category,
          subject: subject.trim(),
          message: message.trim(),
          userName: userName,
          userEmail: userEmail,
          userId: userId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Show success message
      successMessage = 'Message sent successfully! We\'ll get back to you soon.';
      subject = '';
      message = '';

      // Close form after 2 seconds
      setTimeout(() => {
        toggleForm();
      }, 2000);

    } catch (err) {
      console.error('Error sending message:', err);
      errorMessage = 'Failed to send message. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<!-- Notification Tooltip -->
{#if showNotification && !isOpen}
  <div
    class="fixed bottom-24 right-6 bg-white rounded-lg shadow-xl p-4 w-80 max-w-[calc(100vw-3rem)] z-50"
    transition:fly={{ y: 10, duration: 300 }}
  >
    <button
      on:click={dismissNotification}
      class="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      aria-label="Dismiss notification"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <div class="flex items-start gap-3 mb-3">
      <img
        src="/Amy-avatar.png"
        alt="Amy"
        class="w-16 h-16 object-cover flex-shrink-0"
      />
      <p class="text-sm text-gray-800 pt-2">
        <span class="font-medium">Hola, {userName}!</span><br/>
        Do you need any help?
      </p>
    </div>

    <div class="flex gap-2">
      <button
        on:click={toggleForm}
        class="flex-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Yes
      </button>
      <button
        on:click={dismissNotification}
        class="flex-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
      >
        No, thank you
      </button>
    </div>
  </div>
{/if}

<!-- Support Bubble Button -->
{#if !isOpen}
  <button
    on:click={toggleForm}
    class="fixed bottom-6 right-6 w-14 h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-50"
    transition:fade
    aria-label="Contact support"
  >
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  </button>
{/if}

<!-- Support Form -->
{#if isOpen}
  <div
    class="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-lg shadow-2xl border border-gray-200 z-50"
    transition:fly={{ y: 20, duration: 200 }}
  >
    <!-- Header -->
    <div class="bg-orange-500 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <h3 class="font-semibold text-sm">Get in Touch</h3>
      </div>
      <button
        on:click={toggleForm}
        class="text-white hover:text-gray-200 transition-colors"
        aria-label="Close form"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Form Content -->
    <div class="p-4">
      {#if successMessage}
        <div class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p class="text-sm text-green-700 flex items-center gap-2">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            {successMessage}
          </p>
        </div>
      {/if}

      {#if errorMessage}
        <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-600">{errorMessage}</p>
        </div>
      {/if}

      <form on:submit|preventDefault={submitForm} class="space-y-4">
        <!-- Category Dropdown -->
        <div>
          <label for="category" class="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category"
            bind:value={category}
            disabled={isSubmitting}
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="" disabled>Select a category</option>
            {#each categories as cat}
              <option value={cat.value}>{cat.label}</option>
            {/each}
          </select>
        </div>

        <!-- Subject Field -->
        <div>
          <label for="subject" class="block text-sm font-medium text-gray-700 mb-1">
            Subject
          </label>
          <input
            id="subject"
            type="text"
            bind:value={subject}
            placeholder="What can we help you with?"
            disabled={isSubmitting}
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        <!-- Message Field -->
        <div>
          <label for="message" class="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            id="message"
            bind:value={message}
            placeholder="Tell us more about your question or issue..."
            rows="5"
            disabled={isSubmitting}
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          ></textarea>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          disabled={!subject.trim() || !message.trim() || isSubmitting}
          class="w-full px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {#if isSubmitting}
            <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sending...
          {:else}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Send Message
          {/if}
        </button>
      </form>

      <p class="text-xs text-gray-500 text-center mt-4">
        We typically respond within 24 hours
      </p>
    </div>
  </div>
{/if}
