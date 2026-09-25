<script setup>
import rejectIcon from '../../../assets/reject.png'
import unsubmitIcon from '../../../assets/save-icon-60.svg'

import acceptedIcon from '../../../assets/star.svg'
import submitIcon from '../../../assets/submit.svg'
import ColumnToggle from '../../../components/common/ColumnToggle.vue'
import DensityControls from '../../../components/common/DensityControls.vue'
import GridSearch from '../../../components/common/GridSearch.vue'

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
const searchFilter = defineModel('searchFilter', { type: String, default: '' })

function onAction(actionType) {
  emit('bulk-action', actionType)
}
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

      <GridSearch v-model="searchFilter" class="rule-table__search" label="Search reviews" />

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
        <DensityControls grid-key="collection-rule-table" />
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
  flex-shrink: 0;
  margin-left: auto;
}

.rule-table__search {
  flex: 0 1 16rem;
  min-width: 8rem;
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
  flex: 0 0 auto;
  min-width: 0;
}

.rule-table__title {
  margin: 0;
  font-size: var(--text-md);
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
  font-size: var(--text-md);
  font-weight: 600;
}

.toolbar-btn-icon {
  width: 14px;
  height: 14px;
  margin-right: 0.3rem;
  object-fit: contain;
}

.toolbar-btn__icon-font {
  font-size: var(--text-md);
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
</style>
