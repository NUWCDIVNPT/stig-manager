<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref } from 'vue'
import CatBadge from '../../../components/common/CatBadge.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'
import { useGridDensity } from '../../../shared/composables/useGridDensity.js'
import { useTableFooterActions } from '../../../shared/composables/useTableFooterActions.js'
import { severityMap } from '../../../shared/lib/checklistUtils.js'
import { paneColumnPt, paneTablePt } from '../tablePt.js'

const props = defineProps({
  rules: {
    type: Array,
    default: () => [],
  },
  selectedRuleId: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['select-rule'])

const dataTableRef = ref(null)
const { lineClamp, itemSize } = useGridDensity('stig-library-rules', 2, 6, 15)

const selectedRow = computed(() =>
  props.selectedRuleId ? props.rules.find(r => r.ruleId === props.selectedRuleId) ?? null : null,
)

const columnPt = {
  center: paneColumnPt('center'),
  left: paneColumnPt('left'),
}

const dataTablePt = paneTablePt()

const { onFooterAction } = useTableFooterActions(dataTableRef)

function onRowClick(event) {
  emit('select-rule', event.data)
}
</script>

<template>
  <DataTable
    ref="dataTableRef"
    :value="rules"
    :selection="selectedRow"
    selection-mode="single"
    data-key="ruleId"
    scrollable
    scroll-height="flex"
    :virtual-scroller-options="{ itemSize, showLoader: true }"
    striped-rows
    resizable-columns
    export-filename="stig-library-rules"
    class="view-rule-table"
    :style="{ '--line-clamp': lineClamp, '--item-size': `${itemSize}px` }"
    :pt="dataTablePt"
    @row-click="onRowClick"
  >
    <Column header="Cat" :style="{ width: '6.5rem', minWidth: '6.5rem' }" :pt="columnPt.center">
      <template #body="{ data }">
        <CatBadge :category="severityMap[data.severity] ?? 3" variant="label" />
      </template>
    </Column>
    <Column header="STIG ID" field="version" sortable :style="{ width: '12rem', minWidth: '10rem' }" :pt="columnPt.left">
      <template #body="{ data }">
        <span class="cell-text">{{ data.version }}</span>
      </template>
    </Column>
    <Column header="Group" field="groupId" sortable :style="{ width: '6rem', minWidth: '6rem' }" :pt="columnPt.left">
      <template #body="{ data }">
        <span class="cell-text">{{ data.groupId }}</span>
      </template>
    </Column>
    <Column header="Rule Id" field="ruleId" sortable :style="{ width: '15rem', minWidth: '14rem' }" :pt="columnPt.left">
      <template #body="{ data }">
        <span class="cell-text">{{ data.ruleId }}</span>
      </template>
    </Column>
    <Column header="Rule Title" field="title" sortable :style="{ minWidth: '16rem' }" :pt="columnPt.left">
      <template #body="{ data }">
        <span class="cell-text cell-text--clamped" :title="data.title">{{ data.title }}</span>
      </template>
    </Column>
    <template #empty>
      <div class="stiglib-empty">
        No rules in this revision.
      </div>
    </template>
    <template #footer>
      <StatusFooter
        :total-count="rules.length"
        total-label="rules"
        :show-refresh="false"
        :show-export="true"
        @action="onFooterAction"
      />
    </template>
  </DataTable>
</template>

<style scoped>
@import "../styles/stigLibrary.css";

.view-rule-table {
  flex: 1;
  min-height: 0;
  height: 100%;
}
</style>
