<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref } from 'vue'
import librarySvg from '../../../assets/library.svg'
import shieldGreenCheck from '../../../assets/shield-green-check.svg'
import ActionButton from '../../../components/common/ActionButton.vue'
import ClassificationBadge from '../../../components/common/ClassificationBadge.vue'
import ColumnSearchFilter from '../../../components/common/ColumnSearchFilter.vue'
import DensityControls from '../../../components/common/DensityControls.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'
import { useGridDensity } from '../../../shared/composables/useGridDensity.js'
import { fieldMatches } from '../../../shared/lib/searchUtils.js'
import { paneColumnPt, paneTablePt } from '../tablePt.js'
import EarlierRevisionsPills from './EarlierRevisionsPills.vue'

const props = defineProps({
  benchmarks: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: [Object, null],
    default: null,
  },
})

const emit = defineEmits(['select', 'refresh'])

const dataTableRef = ref(null)

const benchmarkIdFilter = ref('')
const titleFilter = ref('')

const filteredData = computed(() => {
  const idTerm = benchmarkIdFilter.value.trim().toLowerCase()
  const titleTerm = titleFilter.value.trim().toLowerCase()
  return (props.benchmarks ?? [])
    .filter((b) => {
      if (idTerm && !fieldMatches(b.benchmarkId, idTerm)) {
        return false
      }
      if (titleTerm && !fieldMatches(b.title, titleTerm)) {
        return false
      }
      return true
    })
    // materialize earlierRevisions so the column sorts and exports
    .map(b => ({ ...b, earlierRevisions: b.revisionStrs?.slice(1).join(', ') ?? '' }))
})

const filtersActive = computed(() => filteredData.value.length !== (props.benchmarks?.length ?? 0))

// 15px per rendered line of clamped text (1rem x 1.3 at the 11px root) + 6px
// cell padding, matching the Findings grids.
const { lineClamp, itemSize } = useGridDensity('stig-library-benchmarks', 2, 6, 15)

// Fixed layout so the flexible Title column yields to the sized columns.
const tablePt = {
  ...paneTablePt(),
  table: { style: { tableLayout: 'fixed', width: '100%' } },
}

const cellPt = paneColumnPt()
const centerCellPt = paneColumnPt('center')

function onRowClick(event) {
  emit('select', event.data)
}
</script>

<template>
  <div class="stiglib-panel">
    <header class="stiglib-panel__header">
      <span class="stiglib-panel__title">
        <img :src="librarySvg" class="stiglib-panel__title-icon" alt="">
        <span>STIG Library</span>
      </span>
      <span class="stiglib-panel__hint">Select a benchmark to browse its rules and compare revisions</span>
      <div class="stiglib-panel__spacer" />
      <ActionButton
        icon="pi pi-search-plus icon-grey"
        title="STIG content search — coming soon"
        disabled
      >
        Full search…
      </ActionButton>
      <DensityControls grid-key="stig-library-benchmarks" :default-line-clamp="2" />
    </header>

    <div v-if="error" class="stiglib-state stiglib-state--error">
      <i class="pi pi-exclamation-triangle" />
      <span>{{ error.message ?? 'Could not load benchmarks.' }}</span>
      <button type="button" class="stiglib-retry" @click="emit('refresh')">
        Retry
      </button>
    </div>

    <div v-else class="stiglib-panel__body">
      <DataTable
        ref="dataTableRef"
        :value="filteredData"
        :loading="loading"
        data-key="benchmarkId"
        sort-field="benchmarkId"
        :sort-order="1"
        scrollable
        scroll-height="flex"
        :virtual-scroller-options="{ itemSize, showLoader: true }"
        resizable-columns
        column-resize-mode="fit"
        striped-rows
        row-hover
        export-filename="stig-library-benchmarks"
        class="bm-list__table"
        :style="{ '--line-clamp': lineClamp, '--item-size': `${itemSize}px` }"
        :pt="tablePt"
        @row-click="onRowClick"
      >
        <Column
          field="benchmarkId"
          export-header="Benchmark ID"
          sortable
          :pt="cellPt"
          :style="{ width: '24rem', minWidth: '16rem' }"
        >
          <template #header>
            <div class="column-header-with-filter">
              Benchmark ID
              <ColumnSearchFilter v-model="benchmarkIdFilter" placeholder="Search ID..." />
            </div>
          </template>
          <template #body="{ data }">
            <div class="bm-list__id-cell">
              <span class="cell-text cell-text--clamped" :title="data.benchmarkId">{{ data.benchmarkId }}</span>
              <ClassificationBadge v-if="data.marking" :level="data.marking" />
            </div>
          </template>
        </Column>

        <Column
          field="title"
          export-header="Title"
          sortable
          :pt="cellPt"
          :style="{ minWidth: '20rem' }"
        >
          <template #header>
            <div class="column-header-with-filter">
              Title
              <ColumnSearchFilter v-model="titleFilter" placeholder="Search title..." />
            </div>
          </template>
          <template #body="{ data }">
            <span class="cell-text cell-text--clamped" :title="data.title">{{ data.title || '—' }}</span>
          </template>
        </Column>

        <Column
          field="lastRevisionStr"
          header="Latest"
          sortable
          :pt="centerCellPt"
          :style="{ width: '7rem', minWidth: '6rem', textAlign: 'center' }"
        >
          <template #body="{ data }">
            <span class="cell-text cell-text--mono">{{ data.lastRevisionStr || '—' }}</span>
          </template>
        </Column>

        <Column
          field="lastRevisionDate"
          header="Revision Date"
          sortable
          :pt="centerCellPt"
          :style="{ width: '10rem', minWidth: '8rem', textAlign: 'center' }"
        >
          <template #body="{ data }">
            <span class="cell-text cell-text--date">{{ data.lastRevisionDate || '—' }}</span>
          </template>
        </Column>

        <Column
          field="ruleCount"
          header="Rules"
          sortable
          :pt="centerCellPt"
          :style="{ width: '7rem', minWidth: '6rem', textAlign: 'center' }"
        >
          <template #body="{ data }">
            <span class="cell-count">{{ data.ruleCount ?? '—' }}</span>
          </template>
        </Column>

        <Column
          field="earlierRevisions"
          header="Earlier Revisions"
          sortable
          :pt="cellPt"
          :style="{ width: '16rem', minWidth: '12rem' }"
        >
          <template #body="{ data }">
            <EarlierRevisionsPills :revisions="data.revisionStrs" :max="4" />
          </template>
        </Column>

        <template #empty>
          <div class="stiglib-empty">
            {{ benchmarkIdFilter || titleFilter ? 'No benchmarks match the current filters.' : 'No benchmarks available.' }}
          </div>
        </template>

        <template #footer>
          <StatusFooter
            :dt="dataTableRef"
            :refresh-loading="loading"
            :total-count="benchmarks.length"
            :filtered-count="filtersActive ? filteredData.length : null"
            total-label="benchmarks"
            :total-icon-src="shieldGreenCheck"
            @refresh="emit('refresh')"
          />
        </template>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
@import "../styles/stigLibrary.css";

.bm-list__table {
  flex: 1;
  min-height: 0;
}

.column-header-with-filter {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.bm-list__id-cell {
  display: flex;
  align-items: flex-start;
  gap: 0.35rem;
  min-width: 0;
}

.bm-list__id-cell .cell-text {
  flex: 1 1 auto;
}

.cell-text--mono {
  display: inline-block;
  width: 100%;
  text-align: center;
  font-family: monospace;
}

.cell-text--date {
  display: inline-block;
  width: 100%;
  text-align: center;
  color: var(--color-text-dim);
  font-variant-numeric: tabular-nums;
}

.cell-count {
  display: inline-block;
  width: 100%;
  text-align: center;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: var(--color-text-bright);
}
</style>
