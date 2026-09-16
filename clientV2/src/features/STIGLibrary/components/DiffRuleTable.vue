<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref } from 'vue'
import CatBadge from '../../../components/common/CatBadge.vue'
import ChangedPropertyChip from '../../../components/common/ChangedPropertyChip.vue'
import HelpIcon from '../../../components/common/HelpIcon.vue'
import RuleIdDiffSpan from '../../../components/common/RuleIdDiffSpan.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'
import { useGridDensity } from '../../../shared/composables/useGridDensity.js'
import { severityMap } from '../../../shared/lib/checklistUtils.js'
import { catLabel } from '../../../shared/lib/exportCells.js'
import { TOOLTIPS } from '../../../shared/lib/tooltips.js'
import { paneColumnPt, paneTablePt } from '../tablePt.js'

const props = defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  viewRev: {
    type: String,
    default: null,
  },
  compareRev: {
    type: String,
    default: null,
  },
  selectedKey: {
    type: String,
    default: null,
  },
})
const emit = defineEmits(['select-row'])

const exportCat = ({ data }) => catLabel(data)

const dataTableRef = ref(null)
const { itemSize, cellLineHeight } = useGridDensity('stig-library-rules')

const selectedRow = computed(() =>
  props.selectedKey ? props.rows.find(r => r.key === props.selectedKey) ?? null : null,
)

const dataTablePt = paneTablePt

function onRowClick(event) {
  emit('select-row', event.data)
}
</script>

<template>
  <DataTable
    ref="dataTableRef"
    :value="rows"
    :selection="selectedRow"
    selection-mode="single"
    data-key="key"
    export-filename="Changed Rules"
    scrollable
    scroll-height="flex"
    :virtual-scroller-options="{ itemSize, showLoader: true }"
    striped-rows
    resizable-columns
    class="diff-rule-table"
    :style="{ '--item-size': `${itemSize}px`, '--cell-line-height': cellLineHeight }"
    :pt="dataTablePt"
    @row-click="onRowClick"
  >
    <Column header="STIG ID" field="stigId" sortable :style="{ width: '15rem' }" :pt="paneColumnPt.left">
      <template #body="{ data }">
        <span class="stiglib-cell-text">{{ data.stigId }}</span>
      </template>
    </Column>
    <Column
      field="leftRule"
      export-header="Left rule"
      :style="{ width: '16rem', minWidth: '15rem' }"
      :pt="paneColumnPt.left"
    >
      <template #header>
        <span class="diff-col-header">
          Rule in <span class="stiglib-rev stiglib-rev--del">{{ compareRev ?? 'compared' }}</span>
        </span>
      </template>
      <template #body="{ data }">
        <span class="stiglib-cell-text">
          <RuleIdDiffSpan v-if="data.leftRule" :id="data.leftRule" side="del" />
          <span v-else class="stiglib-cell-text--dim">—</span>
        </span>
      </template>
    </Column>
    <Column
      field="rightRule"
      export-header="Right rule"
      :style="{ width: '16rem', minWidth: '15rem' }"
      :pt="paneColumnPt.left"
    >
      <template #header>
        <span class="diff-col-header">
          Rule in <span class="stiglib-rev stiglib-rev--add">{{ viewRev ?? 'viewed' }}</span>
        </span>
      </template>
      <template #body="{ data }">
        <span class="stiglib-cell-text">
          <RuleIdDiffSpan v-if="data.rightRule" :id="data.rightRule" side="add" />
          <span v-else class="stiglib-cell-text--dim">—</span>
        </span>
      </template>
    </Column>
    <Column header="CAT" field="cat" :export-value="exportCat" :style="{ width: '5rem' }" :pt="paneColumnPt.center">
      <template #body="{ data }">
        <CatBadge v-if="data.cat" :category="severityMap[data.cat] ?? 3" variant="label" />
      </template>
    </Column>
    <Column field="changed" export-header="Changed properties" :style="{ minWidth: '16rem' }" :pt="paneColumnPt.left">
      <template #header>
        Changed properties
        <HelpIcon :content="TOOLTIPS.rulePropertyDiffs" />
      </template>
      <template #body="{ data }">
        <div class="chip-row">
          <ChangedPropertyChip
            v-for="prop in data.changed"
            :key="prop"
            :name="prop"
          />
        </div>
      </template>
    </Column>
    <template #empty>
      <div class="stiglib-empty">
        No changed rules between these revisions.
      </div>
    </template>
    <template #footer>
      <StatusFooter
        :total-count="rows.length"
        :dt="dataTableRef"
        total-label="changed rules"
        :show-refresh="false"
        :show-export="true"
      />
    </template>
  </DataTable>
</template>

<style scoped>
.diff-rule-table {
  flex: 1;
  min-height: 0;
  height: 100%;
}

.diff-col-header {
  white-space: nowrap;
}

.chip-row {
  display: flex;
  gap: 0.3rem;
  flex-wrap: wrap;
}
</style>
