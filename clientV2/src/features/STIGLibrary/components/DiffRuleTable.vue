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

const SEVERITY_TO_CAT = { high: 1, medium: 2, low: 3 }

const dataTableRef = ref(null)
const { itemSize } = useGridDensity('stig-library-rules-v2', 2, 6, 15)

const selectedRow = computed(() =>
  props.selectedKey ? props.rows.find(r => r.key === props.selectedKey) ?? null : null,
)

const columnPt = {
  center: paneColumnPt('center'),
  left: paneColumnPt('left'),
}

const dataTablePt = paneTablePt()

function onRowClick(event) {
  emit('select-row', event.data)
}

function onFooterAction(key) {
  if (key === 'export') {
    dataTableRef.value?.exportCSV()
  }
}
</script>

<template>
  <DataTable
    ref="dataTableRef"
    :value="rows"
    :selection="selectedRow"
    selection-mode="single"
    data-key="key"
    scrollable
    scroll-height="flex"
    :virtual-scroller-options="{ itemSize, showLoader: true }"
    striped-rows
    resizable-columns
    export-filename="stig-library-revision-diff"
    class="diff-rule-table"
    :style="{ '--item-size': `${itemSize}px` }"
    :pt="dataTablePt"
    @row-click="onRowClick"
  >
    <Column header="STIG ID" field="stigId" sortable :style="{ width: '15rem' }" :pt="columnPt.left">
      <template #body="{ data }">
        <span class="cell-text">{{ data.stigId }}</span>
      </template>
    </Column>
    <Column :style="{ width: '16rem', minWidth: '15rem' }" :pt="columnPt.left">
      <template #header>
        <span class="diff-col-header">
          Rule in <span class="diff-col-header__rev diff-col-header__rev--del">{{ compareRev ?? 'compared' }}</span>
        </span>
      </template>
      <template #body="{ data }">
        <span class="cell-text">
          <RuleIdDiffSpan v-if="data.leftRule" :id="data.leftRule" side="del" />
          <span v-else class="cell-text--dim">—</span>
        </span>
      </template>
    </Column>
    <Column :style="{ width: '16rem', minWidth: '15rem' }" :pt="columnPt.left">
      <template #header>
        <span class="diff-col-header">
          Rule in <span class="diff-col-header__rev diff-col-header__rev--add">{{ viewRev ?? 'viewed' }}</span>
        </span>
      </template>
      <template #body="{ data }">
        <span class="cell-text">
          <RuleIdDiffSpan v-if="data.rightRule" :id="data.rightRule" side="add" />
          <span v-else class="cell-text--dim">—</span>
        </span>
      </template>
    </Column>
    <Column header="Cat" :style="{ width: '5rem' }" :pt="columnPt.center">
      <template #body="{ data }">
        <CatBadge v-if="data.cat" :category="SEVERITY_TO_CAT[data.cat] ?? 3" variant="label" />
      </template>
    </Column>
    <Column :style="{ minWidth: '16rem' }" :pt="columnPt.left">
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
        total-label="changed rules"
        :show-refresh="false"
        :show-export="true"
        @action="onFooterAction"
      />
    </template>
  </DataTable>
</template>

<style scoped>
@import "../styles/stigLibrary.css";

.diff-rule-table {
  flex: 1;
  min-height: 0;
  height: 100%;
}

.diff-col-header {
  white-space: nowrap;
}

.diff-col-header__rev {
  font-family: monospace;
  padding: 0 0.25rem;
  border-radius: 3px;
}

.diff-col-header__rev--del {
  background: var(--color-diff-inline-del-bg);
  color: var(--color-diff-inline-del-text);
}

.diff-col-header__rev--add {
  background: var(--color-diff-inline-add-bg);
  color: var(--color-diff-inline-add-text);
}

.chip-row {
  display: flex;
  gap: 0.3rem;
  flex-wrap: wrap;
}
</style>
