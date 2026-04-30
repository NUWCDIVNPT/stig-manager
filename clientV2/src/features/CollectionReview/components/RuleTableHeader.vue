<script setup>
import lineHeightDown from '../../../assets/line-height-down.svg'
import lineHeightUp from '../../../assets/line-height-up.svg'
import rejectIcon from '../../../assets/reject.png'
import unsubmitIcon from '../../../assets/save-icon-60.svg'

import acceptedIcon from '../../../assets/star.svg'
import submitIcon from '../../../assets/submit.svg'
import ColumnToggle from '../../../components/common/ColumnToggle.vue'
import { useGridDensity } from '../../../shared/composables/useGridDensity.js'

defineProps({
  selectedRuleId: {
    type: String,
    default: null,
  },
  toggleableColumns: {
    type: Array,
    required: true,
  },
  actionStates: {
    type: Object,
    required: true,
  },
  canAccept: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['bulk-action'])

const selectedColumns = defineModel('selectedColumns', { type: Array, required: true })

function onAction(actionType) {
  emit('bulk-action', actionType)
}

const { lineClamp, increaseRowHeight, decreaseRowHeight } = useGridDensity('collection-rule-table', 1, 12, 24)
</script>

<template>
  <div class="rule-table-header">
    <div class="rule-table-header__content">
      <!-- Header Title -->
      <div class="rule-table__title-row">
        <h2 class="rule-table__title">
          Reviews of {{ selectedRuleId ?? '—' }}
        </h2>
      </div>

      <div class="rule-table__right-controls">
        <!-- Toolbar actions -->
        <div class="rule-table__action-controls">
          <button
            v-if="canAccept" type="button" class="toolbar-btn" :disabled="!actionStates.accept"
            @click="onAction('accept')"
          >
            <img :src="acceptedIcon" alt="" class="toolbar-btn-icon">
            <span class="toolbar-btn__label">Accept</span>
          </button>

          <button
            v-if="canAccept" type="button" class="toolbar-btn" :disabled="!actionStates.reject"
            @click="onAction('reject')"
          >
            <img :src="rejectIcon" alt="" class="toolbar-btn-icon">
            <span class="toolbar-btn__label">Reject</span>
          </button>

          <div class="toolbar-divider" />

          <button
            type="button" class="toolbar-btn" :disabled="!actionStates.submit"
            @click="onAction('submit')"
          >
            <img :src="submitIcon" alt="" class="toolbar-btn-icon">
            <span class="toolbar-btn__label">Submit</span>
          </button>

          <button
            type="button" class="toolbar-btn" :disabled="!actionStates.unsubmit"
            @click="onAction('unsubmit')"
          >
            <img :src="unsubmitIcon" alt="" class="toolbar-btn-icon">
            <span class="toolbar-btn__label">Unsubmit</span>
          </button>

          <div class="toolbar-divider" />

          <button
            type="button" class="toolbar-btn" :disabled="!actionStates.batchEdit"
            @click="onAction('batchEdit')"
          >
            <i class="pi pi-pencil toolbar-btn__icon-font" />
            <span class="toolbar-btn__label">Batch edit</span>
          </button>
        </div>

        <!-- Columns -->
        <ColumnToggle v-model="selectedColumns" :columns="toggleableColumns" />

        <!-- Density -->
        <div class="rule-table__density-controls">
          <span class="rule-table__density-label">Density</span>
          <button
            class="rule-table__icon-btn" title="Decrease row height" :disabled="lineClamp <= 1"
            @click="decreaseRowHeight"
          >
            <img :src="lineHeightDown" alt="Decrease row height">
          </button>
          <button
            class="rule-table__icon-btn" title="Increase row height" :disabled="lineClamp >= 10"
            @click="increaseRowHeight"
          >
            <img :src="lineHeightUp" alt="Increase row height">
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rule-table-header {
  --checklist-control-height: 2.42rem;
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background: linear-gradient(180deg, var(--color-background-light), var(--color-background-dark));
  border-bottom: 1px solid var(--color-border-default);
  flex-shrink: 0;
}

.rule-table-header__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 0.75rem;
}

.rule-table__right-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rule-table__action-controls {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.rule-table__title-row {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex: 1;
  min-width: 0;
}

.rule-table__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toolbar-btn {
  display: inline-flex;
  align-items: center;
  height: var(--checklist-control-height);
  padding: 0.35rem 0.75rem;
  color: var(--color-text-bright);
  background: color-mix(in srgb, var(--color-background-light) 45%, transparent);
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.12s ease;
}

.toolbar-btn__label {
  font-size: 1.02rem;
  font-weight: 600;
}

.toolbar-btn-icon {
  width: 14px;
  height: 14px;
  margin-right: 0.3rem;
  object-fit: contain;
}

.toolbar-btn__icon-font {
  font-size: 0.9rem;
  margin-right: 0.3rem;
}

.toolbar-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-text-dim) 25%, transparent);
}

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.toolbar-divider {
  width: 1px;
  height: 1.8rem;
  background: var(--color-border-default);
  margin: 0 0.25rem;
}

/* Density Controls modeled directly after CollectionChecklistGridHeader */
.rule-table__density-controls {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.3rem 0.2rem 0.65rem;
  border: 1px solid color-mix(in srgb, var(--color-border-default) 85%, transparent);
  border-radius: 5px;
  background: color-mix(in srgb, var(--color-background-light) 45%, transparent);
  height: var(--checklist-control-height);
}

.rule-table__density-label {
  font-size: 0.98rem;
  font-weight: 600;
  color: var(--color-text-bright);
  margin-right: 0.2rem;
}

.rule-table__icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--color-background-light) 25%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-border-light) 40%, transparent);
  border-radius: 5px;
  margin: 0 0.1rem;
  width: 2.1rem;
  height: 2.1rem;
  padding: 0;
  cursor: pointer;
  opacity: 0.9;
}

.rule-table__icon-btn:hover:not(:disabled) {
  opacity: 1;
  border-color: var(--color-border-default);
  background: color-mix(in srgb, var(--color-background-light) 75%, transparent);
}

.rule-table__icon-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.rule-table__icon-btn img {
  width: 15px;
  height: 15px;
}
</style>
