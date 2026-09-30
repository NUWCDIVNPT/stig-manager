<script setup>
import { computed } from 'vue'
import ActionButton from '../../../components/common/ActionButton.vue'
import DensityControls from '../../../components/common/DensityControls.vue'
import GridFilterButton from '../../../components/common/GridFilterButton.vue'
import GridSearch from '../../../components/common/GridSearch.vue'
import RevisionSelect from './RevisionSelect.vue'

const props = defineProps({
  revisions: {
    type: Array,
    default: () => [],
  },
  revisionsLoading: {
    type: Boolean,
    default: false,
  },
  viewRev: {
    type: String,
    default: null,
  },
  compareRev: {
    type: String,
    default: null,
  },
  // filterColumns and valueOptions from the pane's useGridSearch
  filterColumns: {
    type: Array,
    default: () => [],
  },
  valueOptions: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits([
  'change-view-rev',
  'change-compare-rev',
])
const search = defineModel('search', { type: String, default: '' })
const filters = defineModel('filters', { type: Array, default: () => [] })

const diffMode = computed(() => !!props.compareRev)
const hasOtherRevisions = computed(() => (props.revisions ?? []).length > 1)

function onChangeViewRev(rev) {
  emit('change-view-rev', rev)
}

function onChangeCompareRev(rev) {
  emit('change-compare-rev', rev)
}
</script>

<template>
  <div class="stiglib-subbar">
    <RevisionSelect
      label="Viewing:"
      :options="revisions"
      :model-value="viewRev"
      :exclude-value="compareRev"
      :disabled="revisionsLoading"
      @update:model-value="onChangeViewRev"
    />
    <template v-if="hasOtherRevisions">
      <RevisionSelect
        label="Compare with:"
        :options="revisions"
        :model-value="compareRev"
        :exclude-value="viewRev"
        allow-none
        none-label="— None (view mode) —"
        :disabled="revisionsLoading"
        @update:model-value="onChangeCompareRev"
      />
      <ActionButton
        v-if="diffMode"
        icon="pi pi-times icon-grey"
        title="Return to single-revision view"
        @click="onChangeCompareRev(null)"
      >
        Exit diff
      </ActionButton>
    </template>
    <div class="stiglib-panel__spacer" />
    <div class="rule-pane-toolbar__search">
      <GridSearch v-model="search" class="rule-pane-toolbar__input" label="Search rules" placeholder="Search rules..." />
      <GridFilterButton v-model="filters" :columns="filterColumns" :value-options="valueOptions" />
    </div>
    <DensityControls grid-key="stig-library-rules" />
  </div>
</template>

<style scoped>
.rule-pane-toolbar__search {
  --checklist-control-height: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 0 1 32rem;
  min-width: 18rem;
}

.rule-pane-toolbar__input {
  flex: 1;
  min-width: 0;
}
</style>
