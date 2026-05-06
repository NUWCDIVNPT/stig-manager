<script setup>
import { computed } from 'vue'
import { RULE_DIFF_PROPERTY_ORDER } from '../../shared/lib/ruleDiff.js'
import DiffPropertySection from './DiffPropertySection.vue'

const props = defineProps({
  patches: {
    type: Object,
    default: () => ({}),
  },
  propertyOrder: {
    type: Array,
    default: () => RULE_DIFF_PROPERTY_ORDER,
  },
  status: {
    type: String,
    default: 'ready',
    validator: value => ['idle', 'loading', 'ready', 'error'].includes(value),
  },
  error: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['retry'])

const orderedProperties = computed(() => {
  const available = new Set(Object.keys(props.patches).filter(k => props.patches[k]))
  const ordered = props.propertyOrder.filter(p => available.has(p))
  const extras = [...available].filter(p => !props.propertyOrder.includes(p))
  return [...ordered, ...extras]
})

const isEmpty = computed(() => orderedProperties.value.length === 0)
</script>

<template>
  <div class="rule-diff-panel">
    <header v-if="$slots.header" class="rule-diff-panel__header">
      <slot name="header" />
    </header>

    <div v-if="status === 'loading'" class="rule-diff-panel__state">
      <i class="pi pi-spin pi-spinner" />
      <span>Loading diff…</span>
    </div>

    <div v-else-if="status === 'error'" class="rule-diff-panel__state rule-diff-panel__state--error">
      <i class="pi pi-exclamation-triangle" />
      <span>{{ error?.message || 'Could not load diff.' }}</span>
      <button type="button" class="rule-diff-panel__retry" @click="emit('retry')">
        Retry
      </button>
    </div>

    <div v-else-if="status === 'idle'" class="rule-diff-panel__state">
      <span>Select a rule to see detailed changes.</span>
    </div>

    <div v-else-if="isEmpty" class="rule-diff-panel__state">
      <span>No tracked properties changed.</span>
    </div>

    <div v-else class="rule-diff-panel__sections">
      <DiffPropertySection
        v-for="prop in orderedProperties"
        :key="prop"
        :prop-name="prop"
        :patch="patches[prop]"
      />
    </div>
  </div>
</template>

<style scoped>
.rule-diff-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.5rem 0;
}

.rule-diff-panel__header {
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border-default);
}

.rule-diff-panel__sections {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.rule-diff-panel__state {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  color: var(--color-text-dim);
  font-style: italic;
}

.rule-diff-panel__state--error {
  color: var(--color-text-error);
}

.rule-diff-panel__retry {
  margin-left: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 3px;
  border: 1px solid var(--color-border-default);
  background-color: var(--color-background-subtle);
  color: var(--color-text-primary);
  cursor: pointer;
  font-style: normal;
}

.rule-diff-panel__retry:hover {
  background-color: var(--color-bg-hover);
}
</style>
