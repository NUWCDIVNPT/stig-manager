<script setup>
// Row for a grid's Search/Filter/Columns controls, used when its header or action bar has no room
// (Findings, Collection Manage tabs). The default slot stretches (search); #end holds the buttons.
defineProps({
  // Push everything right with a capped search instead of stretching it across the row
  compact: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div class="grid-toolbar" :class="{ 'grid-toolbar--compact': compact }">
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
  --checklist-control-height: 2.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.75rem;
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

.grid-toolbar--compact {
  justify-content: flex-end;
}

.grid-toolbar--compact .grid-toolbar__main {
  flex: 0 1 clamp(14rem, 25%, 22rem);
}

.grid-toolbar__end {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}
</style>
