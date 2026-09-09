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
  <div class="stiglib-panel">
    <header class="stiglib-panel__header">
      <i class="pi pi-file-edit diff-detail__icon" />
      <span class="stiglib-panel__title">Detailed changes</span>
      <span v-if="diffRow" class="stiglib-chip">{{ diffRow.stigId }}</span>
      <div class="stiglib-panel__spacer" />
      <span v-if="compareRev && viewRev" class="diff-detail__revs">
        <span class="diff-detail__rev diff-detail__rev--del">{{ compareRev }}</span>
        <i class="pi pi-arrow-right diff-detail__arrow" />
        <span class="diff-detail__rev diff-detail__rev--add">{{ viewRev }}</span>
      </span>
    </header>

    <div class="stiglib-panel__body stiglib-panel__body--scroll sm-scrollbar-thin">
      <RuleDiffPanel
        :patches="patches"
        :status="panelStatus"
        :error="error"
      />
    </div>
  </div>
</template>

<style scoped>
@import "../styles/stigLibrary.css";

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

.diff-detail__rev {
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  font-family: monospace;
  font-size: 1.05rem;
}

.diff-detail__rev--del {
  background: var(--color-diff-inline-del-bg);
  color: var(--color-diff-inline-del-text);
}

.diff-detail__rev--add {
  background: var(--color-diff-inline-add-bg);
  color: var(--color-diff-inline-add-text);
}

.diff-detail__arrow {
  color: var(--color-text-dim);
  font-size: 0.9rem;
}
</style>
