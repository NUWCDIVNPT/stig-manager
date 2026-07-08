<!-- Horizontal toolbar of list actions shown above a table. Slot in
     ActionButton items, separated by <div class="toolbar-divider" /> (styled
     here); a <div class="toolbar-spacer" /> pushes what follows to the end. -->
<template>
  <div class="action-toolbar">
    <slot />
  </div>
</template>

<style scoped>
.action-toolbar {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.75rem;
  background: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  flex-wrap: wrap;
}

:slotted(.toolbar-divider) {
  width: 1px;
  height: 1.6rem;
  background: var(--color-border-default);
  margin: 0 0.1rem;
}

:slotted(.toolbar-spacer) {
  flex: 1;
}
</style>
