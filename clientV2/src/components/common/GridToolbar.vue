<script setup>
// Slim row under a grid header for its search and filter controls. The default slot
// stretches (search box); #end holds the buttons (Filter, Columns).
</script>

<template>
  <div class="grid-toolbar">
    <div class="grid-toolbar__main">
      <slot />
    </div>
    <div v-if="$slots.end" class="grid-toolbar__end">
      <slot name="end" />
    </div>
  </div>
</template>

<style scoped>
.grid-toolbar {
  --checklist-control-height: 1.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.75rem;
  background: var(--color-background-dark);
  border-bottom: 1px solid var(--color-border-default);
  flex-shrink: 0;
}

.grid-toolbar__main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.grid-toolbar__main > * {
  flex: 1;
  min-width: 0;
}

.grid-toolbar__end {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}
</style>
