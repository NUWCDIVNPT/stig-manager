<script setup>
import { computed } from 'vue'
import RuleDiffPanel from '../../../components/common/RuleDiffPanel.vue'

const props = defineProps({
  diffRow: {
    type: Object,
    default: null,
  },
  diffDetail: {
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
  status: {
    type: String,
    default: 'ready',
  },
  error: {
    type: Object,
    default: null,
  },
})

const panelStatus = computed(() => {
  if (props.status === 'loading' || props.status === 'error' || props.status === 'idle') {
    return props.status
  }
  return props.diffRow ? 'ready' : 'idle'
})

const patches = computed(() => props.diffDetail ?? {})
</script>

<template>
  <RuleDiffPanel
    :patches="patches"
    :status="panelStatus"
    :error="error"
  >
    <template #header>
      <div class="diff-detail-header">
        <div class="diff-detail-header__title">
          Detailed changes
        </div>
        <div v-if="diffRow" class="diff-detail-header__sub">
          <span class="mono">{{ diffRow.stigId }}</span>
        </div>
      </div>
    </template>
  </RuleDiffPanel>
</template>

<style scoped>
.diff-detail-header__title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-text-primary);
}
.diff-detail-header__sub {
  font-size: 1.1rem;
  color: var(--color-text-dim);
  margin-top: 0.25rem;
}
.mono {
  font-family: monospace;
}
.sep {
  margin: 0 0.5rem;
}
</style>
