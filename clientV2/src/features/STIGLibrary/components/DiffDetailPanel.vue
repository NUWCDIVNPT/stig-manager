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
})

// A failed diff is reported (with Retry) by the rule pane body; this panel
// just goes idle rather than showing a second error.
const panelStatus = computed(() => {
  if (props.status === 'loading') {
    return 'loading'
  }
  return props.status === 'ready' && props.diffRow ? 'ready' : 'idle'
})

const patches = computed(() => props.diffDetail ?? {})
</script>

<template>
  <div class="stiglib-panel">
    <header class="stiglib-panel__header">
      <i class="pi pi-file-edit diff-detail__icon" />
      <span class="stiglib-panel__title">Detailed changes</span>
      <span v-if="diffRow" class="stiglib-chip">{{ diffRow.stigId }}</span>
      <div class="stiglib-panel__spacer" />
      <span v-if="compareRev && viewRev" class="diff-detail__revs">
        <span class="stiglib-rev stiglib-rev--del">{{ compareRev }}</span>
        <i class="pi pi-arrow-right diff-detail__arrow" />
        <span class="stiglib-rev stiglib-rev--add">{{ viewRev }}</span>
      </span>
    </header>

    <div class="stiglib-panel__body stiglib-panel__body--scroll sm-scrollbar-thin">
      <RuleDiffPanel
        :patches="patches"
        :status="panelStatus"
      />
    </div>
  </div>
</template>

<style scoped>
.diff-detail__icon {
  color: var(--color-primary-highlight);
  flex-shrink: 0;
}

.diff-detail__revs {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
}

.diff-detail__arrow {
  color: var(--color-text-dim);
  font-size: 0.9rem;
}
</style>
