<script setup>
import Panel from 'primevue/panel'

defineProps({
  title: { type: String, required: true },
  // For bodies holding deployment-defined content of any length (welcome
  // message, manager list): scroll at the row height instead of growing the row.
  scroll: { type: Boolean, default: false },
})

const scrollPt = { content: { class: 'sm-scrollbar-thin' } }
</script>

<template>
  <Panel class="home-panel" :class="{ 'home-panel--scroll': scroll }" :pt="scroll ? scrollPt : undefined">
    <template #header="{ id }">
      <h2 :id="id" class="card-title">
        {{ title }}
      </h2>
    </template>
    <slot />
  </Panel>
</template>

<style scoped>
/* Legacy home widgets have a header band a shade lighter than the body; the
   Material Panel header is transparent by default. Panel reads these tokens. */
.home-panel {
  --p-panel-background: var(--color-background-dark);
  --p-panel-border-color: var(--color-border-default);
  --p-panel-header-background: var(--color-background-light);
  --p-panel-header-padding: 0.6rem 1.25rem;
  --p-panel-header-border-width: 0 0 1px 0;
  --p-panel-header-border-color: var(--color-border-default);
  --p-panel-header-border-radius: var(--p-panel-border-radius) var(--p-panel-border-radius) 0 0;
  --p-panel-content-padding: 1rem 1.25rem 1.25rem;
}

.card-title {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-primary-highlight);
}

/* The grid stretches every panel to its row height. This flex chain passes
   that height down through Panel's wrappers so a scrolling body can fill it. */
.home-panel,
.home-panel :deep(.p-panel-content-container),
.home-panel :deep(.p-panel-content-wrapper),
.home-panel :deep(.p-panel-content) {
  display: flex;
  flex-direction: column;
}

.home-panel :deep(.p-panel-content-container),
.home-panel :deep(.p-panel-content-wrapper),
.home-panel :deep(.p-panel-content) {
  flex-grow: 1;
}

.home-panel :deep(.p-panel-content) {
  gap: 1.25rem;
}

/* Size containment keeps the body from contributing its content height to
   the grid row; min-height keeps some of it visible when nothing else in the
   row is taller. */
.home-panel--scroll :deep(.p-panel-content) {
  contain: size;
  min-height: 18rem;
  overflow-y: auto;
}
</style>
