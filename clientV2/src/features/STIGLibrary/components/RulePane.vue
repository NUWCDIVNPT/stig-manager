<script setup>
import { computed } from 'vue'
import DiffRuleTable from './DiffRuleTable.vue'
import RulePaneHeader from './RulePaneHeader.vue'
import RulePaneToolbar from './RulePaneToolbar.vue'
import ViewRuleTable from './ViewRuleTable.vue'

const props = defineProps({
  benchmark: {
    type: Object,
    default: null,
  },
  viewRev: {
    type: String,
    default: null,
  },
  compareRev: {
    type: String,
    default: null,
  },
  revisions: {
    type: Array,
    default: () => [],
  },
  revisionsLoading: {
    type: Boolean,
    default: false,
  },
  rules: {
    type: Array,
    default: () => [],
  },
  rulesLoading: {
    type: Boolean,
    default: false,
  },
  rulesError: {
    type: Object,
    default: null,
  },
  diffRows: {
    type: Array,
    default: () => [],
  },
  diffStatus: {
    type: String,
    default: 'idle',
  },
  diffError: {
    type: Object,
    default: null,
  },
  selectedRuleId: {
    type: String,
    default: null,
  },
  selectedDiffRowKey: {
    type: String,
    default: null,
  },
})

const emit = defineEmits([
  'change-view-rev',
  'change-compare-rev',
  'select-rule',
  'select-diff-row',
  'close',
  'retry-rules',
  'retry-diff',
])

const diffMode = computed(() => !!props.compareRev)

const bodyState = computed(() => {
  if (diffMode.value) {
    if (props.diffStatus === 'loading') {
      return 'loading'
    }
    if (props.diffStatus === 'error') {
      return 'error'
    }
    if (props.diffStatus === 'idle') {
      return 'idle'
    }
    return 'ready'
  }
  if (props.rulesLoading) {
    return 'loading'
  }
  if (props.rulesError) {
    return 'error'
  }
  if (!props.rules?.length) {
    return 'empty'
  }
  return 'ready'
})

const bodyError = computed(() => (diffMode.value ? props.diffError : props.rulesError))
</script>

<template>
  <section class="rule-pane">
    <RulePaneHeader :benchmark="benchmark" @close="emit('close')" />
    <RulePaneToolbar
      :revisions="revisions"
      :revisions-loading="revisionsLoading"
      :view-rev="viewRev"
      :compare-rev="compareRev"
      @change-view-rev="rev => emit('change-view-rev', rev)"
      @change-compare-rev="rev => emit('change-compare-rev', rev)"
    />
    <div class="rule-pane__body">
      <div v-if="bodyState === 'loading'" class="rule-pane__state">
        <i class="pi pi-spin pi-spinner" />
        <span>Loading…</span>
      </div>
      <div v-else-if="bodyState === 'error'" class="rule-pane__state rule-pane__state--error">
        <i class="pi pi-exclamation-triangle" />
        <span>{{ bodyError?.message ?? 'Could not load rules.' }}</span>
        <button
          type="button"
          class="rule-pane__retry"
          @click="emit(diffMode ? 'retry-diff' : 'retry-rules')"
        >
          Retry
        </button>
      </div>
      <div v-else-if="bodyState === 'empty'" class="rule-pane__state">
        <span>No rules in this revision.</span>
      </div>
      <template v-else>
        <DiffRuleTable
          v-if="diffMode"
          :rows="diffRows"
          :selected-key="selectedDiffRowKey"
          @select-row="row => emit('select-diff-row', row)"
        />
        <ViewRuleTable
          v-else
          :rules="rules"
          :selected-rule-id="selectedRuleId"
          @select-rule="rule => emit('select-rule', rule)"
        />
      </template>
    </div>
  </section>
</template>

<style scoped>
.rule-pane {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.rule-pane__body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.rule-pane__state {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  color: var(--color-text-dim);
  font-style: italic;
}

.rule-pane__state--error {
  color: var(--color-text-error);
}

.rule-pane__retry {
  margin-left: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 3px;
  border: 1px solid var(--color-border-default);
  background-color: var(--color-background-subtle);
  color: var(--color-text-primary);
  cursor: pointer;
  font-style: normal;
}

.rule-pane__retry:hover {
  background-color: var(--color-bg-hover);
}
</style>
