<script setup>
/** Optional payload shown when tabs are opened from a selection. */
defineProps({
  payload: { type: Object, default: null },
})
</script>

<template>
  <section class="h-full overflow-auto p-4">
    <h1 class="text-xl font-semibold mb-2">Home</h1>
    <p class="opacity-80">This is a placeholder Home panel. Replace with whatever you want on the default page.</p>

    <div v-if="payload" class="mt-4 text-xs opacity-75">
      <p class="mb-1">Opened from selection:</p>
      <pre class="p-2 rounded bg-black/10 overflow-auto">{{ payload }}</pre>
    </div>
  </section>
</template>
