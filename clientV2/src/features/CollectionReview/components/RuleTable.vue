<script setup>
import { computed, ref } from 'vue'
import { useGridDensity } from '../../../shared/composables/useGridDensity.js'
import RuleTableGrid from './RuleTableGrid.vue'
import RuleTableHeader from './RuleTableHeader.vue'

const props = defineProps({
  gridData: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  selectedRuleId: {
    type: String,
    default: null,
  },
  collectionId: {
    type: String,
    default: null,
  },
  fieldSettings: {
    type: Object,
    default: null,
  },
  canAccept: {
    type: Boolean,
    default: false,
  },
  isSaving: {
    type: Boolean,
    default: false,
  },
  selection: {
    type: Array,
    default: () => [],
  },
  actionStates: {
    type: Object,
    default: () => ({
      accept: false,
      reject: false,
      submit: false,
      unsubmit: false,
      batchEdit: false,
    }),
  },
})

const emit = defineEmits(['review-saved', 'update:selection', 'bulk-action'])

const { lineClamp, itemSize } = useGridDensity('collection-rule-table', 1, 12, 24)

const TOGGLEABLE_COLUMNS = [
  { field: 'labels', header: 'Labels' },
  { field: 'detail', header: 'Detail' },
  { field: 'comment', header: 'Comment' },
  { field: 'user', header: 'User' },
  { field: 'time', header: 'Time' },
]

const selectedColumns = ref([...TOGGLEABLE_COLUMNS])
const visibleFields = computed(() => new Set(selectedColumns.value.map(c => c.field)))
</script>

<template>
  <div
    class="rule-table"
    :style="{ '--line-clamp': lineClamp, '--item-size': `${itemSize}px` }"
  >
    <RuleTableHeader
      v-model:selected-columns="selectedColumns"
      :selected-rule-id="selectedRuleId"
      :toggleable-columns="TOGGLEABLE_COLUMNS"
      :action-states="actionStates"
      :can-accept="canAccept"
      @bulk-action="(action) => emit('bulk-action', action)"
    />
    <RuleTableGrid
      :grid-data="gridData"
      :is-loading="isLoading"
      :visible-fields="visibleFields"
      :collection-id="collectionId"
      :selected-rule-id="selectedRuleId"
      :field-settings="fieldSettings"
      :can-accept="canAccept"
      :selection="props.selection"
      @review-saved="(r) => emit('review-saved', r)"
      @update:selection="(val) => emit('update:selection', val)"
    />

    <div v-if="isSaving" class="rule-table__mask" aria-busy="true">
      <i class="pi pi-spin pi-spinner rule-table__mask-spinner" />
    </div>
  </div>
</template>

<style scoped>
.rule-table {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background-subtle);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  overflow: hidden;
}

.rule-table__mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--color-background-darkest) 25%, transparent);
  backdrop-filter: blur(1px);
  z-index: 10;
  cursor: wait;
}

.rule-table__mask-spinner {
  font-size: 2rem;
  color: var(--color-text-bright);
}
</style>
