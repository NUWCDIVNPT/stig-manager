<script setup>
import ClassificationBadge from '../../../components/common/ClassificationBadge.vue'

defineProps({
  benchmark: {
    type: Object,
    default: null,
  },
})

defineEmits(['close'])
</script>

<template>
  <header v-if="benchmark" class="rule-pane-header">
    <div class="rule-pane-header__title">
      <div class="rule-pane-header__name" :title="benchmark.title">
        {{ benchmark.title }}
      </div>
      <div class="rule-pane-header__id-row">
        <span class="rule-pane-header__id">{{ benchmark.benchmarkId }}</span>
        <ClassificationBadge v-if="benchmark.marking" :level="benchmark.marking" />
      </div>
    </div>
    <button
      type="button"
      class="rule-pane-header__close"
      title="Close benchmark"
      @click="$emit('close')"
    >
      <i class="pi pi-times" />
    </button>
  </header>
</template>

<style scoped>
.rule-pane-header {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem 0.9rem;
  border-bottom: 1px solid var(--color-border-default);
  background-color: var(--color-background-subtle);
}

.rule-pane-header__title {
  flex: 1;
  min-width: 0;
}

.rule-pane-header__name {
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rule-pane-header__id-row {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.15rem;
}

.rule-pane-header__id {
  font-family: monospace;
  font-size: 1.1rem;
  color: var(--color-text-dim);
}

.rule-pane-header__close {
  background: transparent;
  border: none;
  color: var(--color-text-dim);
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
}

.rule-pane-header__close:hover {
  background-color: var(--color-bg-hover);
  color: var(--color-text-primary);
}
</style>
