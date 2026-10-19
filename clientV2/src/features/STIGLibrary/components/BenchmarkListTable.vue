<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref } from 'vue'
import librarySvg from '../../../assets/library.svg'
import shieldGreenCheck from '../../../assets/shield-green-check.svg'
import ActionButton from '../../../components/common/ActionButton.vue'
import ClassificationBadge from '../../../components/common/ClassificationBadge.vue'
import ColumnToggle from '../../../components/common/ColumnToggle.vue'
import DensityControls from '../../../components/common/DensityControls.vue'
import GridFilterButton from '../../../components/common/GridFilterButton.vue'
import GridSearch from '../../../components/common/GridSearch.vue'
import HighlightText from '../../../components/common/HighlightText.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'
import { useColumnVisibility } from '../../../shared/composables/useColumnVisibility.js'
import { useGridDensity } from '../../../shared/composables/useGridDensity.js'
import { useGridSearch } from '../../../shared/composables/useGridSearch.js'
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

// materialize earlierRevisions so the column sorts and exports
const rows = computed(() =>
  (props.benchmarks ?? []).map(b => ({ ...b, earlierRevisions: b.revisionStrs?.slice(1).join(', ') ?? '' })),
)

const { toggleableColumns, selectedColumns, visibleFields } = useColumnVisibility([
  { field: 'benchmarkId', header: 'Benchmark ID', locked: true },
  { field: 'title', header: 'Title' },
  { field: 'lastRevisionStr', header: 'Latest' },
  { field: 'lastRevisionDate', header: 'Revision Date' },
  { field: 'ruleCount', header: 'Rules' },
  { field: 'earlierRevisions', header: 'Earlier Revisions' },
], 'stigLibrary.columns')

const {
  term: searchTerm,
  filters: gridFilters,
  filteredRows,
  isFiltered,
  filterColumns,
  valueOptions,
  highlightTerm,
} = useGridSearch(rows, [
  { field: 'benchmarkId', header: 'Benchmark ID' },
  { field: 'title', header: 'Title' },
  { field: 'lastRevisionStr', header: 'Latest' },
  { field: 'earlierRevisions', header: 'Earlier Revisions' },
], { visibleFields })

// Row geometry lives in useGridDensity's table; .stiglib-cell-text reads its
// font size and line height from --cell-font-size / --cell-line-height.
const { itemSize, gridStyle } = useGridDensity('stig-library-benchmarks')

// Fixed layout so the flexible Title column yields to the sized columns.
const tablePt = {
  ...paneTablePt,
  table: { style: { tableLayout: 'fixed', width: '100%' } },
}

function onRowClick(event) {
  emit('select', event.data)
}
</script>

<template>
  <div class="stiglib-panel">
    <header class="stiglib-panel__header bm-list__header">
      <span class="stiglib-panel__title">
        <img :src="librarySvg" class="stiglib-panel__title-icon" alt="">
        <span>STIG Library</span>
      </span>
      <span class="stiglib-panel__hint">Select a benchmark to browse its rules and compare revisions</span>
      <div class="stiglib-panel__spacer" />
      <GridSearch v-model="searchTerm" class="bm-list__search" label="Search benchmarks" placeholder="Search benchmarks..." />
      <GridFilterButton v-model="gridFilters" :columns="filterColumns" :value-options="valueOptions" />
      <ColumnToggle v-model="selectedColumns" :columns="toggleableColumns" />
      <ActionButton
        icon="pi pi-search-plus icon-grey"
        title="STIG content search — coming soon"
        disabled
      >
        Full search…
      </ActionButton>
      <DensityControls grid-key="stig-library-benchmarks" />
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
        :value="filteredRows"
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
        :style="gridStyle"
        :pt="tablePt"
        @row-click="onRowClick"
      >
        <Column
          field="benchmarkId"
          header="Benchmark ID"
          sortable
          :pt="paneColumnPt.left"
          :style="{ width: '24rem', minWidth: '16rem' }"
        >
          <template #body="{ data }">
            <div class="bm-list__id-cell">
              <span class="stiglib-cell-text stiglib-cell-text--clamped" :title="data.benchmarkId"><HighlightText :text="data.benchmarkId" :term="highlightTerm('benchmarkId')" /></span>
              <ClassificationBadge v-if="data.marking" :level="data.marking" />
            </div>
          </template>
        </Column>

        <Column
          v-if="visibleFields.has('title')"
          field="title"
          header="Title"
          sortable
          :pt="paneColumnPt.left"
          :style="{ minWidth: '20rem' }"
        >
          <template #body="{ data }">
            <span class="stiglib-cell-text stiglib-cell-text--clamped" :title="data.title"><HighlightText :text="data.title || '—'" :term="highlightTerm('title')" /></span>
          </template>
        </Column>

        <Column
          v-if="visibleFields.has('lastRevisionStr')"
          field="lastRevisionStr"
          header="Latest"
          sortable
          :pt="paneColumnPt.center"
          :style="{ width: '7rem', minWidth: '6rem', textAlign: 'center' }"
        >
          <template #body="{ data }">
            <span class="stiglib-cell-text stiglib-cell-text--mono"><HighlightText :text="data.lastRevisionStr || '—'" :term="highlightTerm('lastRevisionStr')" /></span>
          </template>
        </Column>

        <Column
          v-if="visibleFields.has('lastRevisionDate')"
          field="lastRevisionDate"
          header="Revision Date"
          sortable
          :pt="paneColumnPt.center"
          :style="{ width: '10rem', minWidth: '8rem', textAlign: 'center' }"
        >
          <template #body="{ data }">
            <span class="stiglib-cell-text stiglib-cell-text--date">{{ data.lastRevisionDate || '—' }}</span>
          </template>
        </Column>

        <Column
          v-if="visibleFields.has('ruleCount')"
          field="ruleCount"
          header="Rules"
          sortable
          :pt="paneColumnPt.center"
          :style="{ width: '7rem', minWidth: '6rem', textAlign: 'center' }"
        >
          <template #body="{ data }">
            <span class="cell-count">{{ data.ruleCount ?? '—' }}</span>
          </template>
        </Column>

        <Column
          v-if="visibleFields.has('earlierRevisions')"
          field="earlierRevisions"
          header="Earlier Revisions"
          sortable
          :pt="paneColumnPt.left"
          :style="{ width: '16rem', minWidth: '12rem' }"
        >
          <template #body="{ data }">
            <EarlierRevisionsPills :revisions="data.revisionStrs" :max="4" />
          </template>
        </Column>

        <template #empty>
          <div class="stiglib-empty">
            {{ isFiltered && rows.length ? 'No benchmarks match the search.' : 'No benchmarks available.' }}
          </div>
        </template>

        <template #footer>
          <StatusFooter
            :dt="dataTableRef"
            :refresh-loading="loading"
            :total-count="benchmarks.length"
            :filtered-count="isFiltered ? filteredRows.length : null"
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
.bm-list__table {
  flex: 1;
  min-height: 0;
}

.bm-list__header {
  --checklist-control-height: 2rem;
}

.bm-list__search {
  flex: 0 1 18rem;
  min-width: 10rem;
}

.bm-list__id-cell {
  display: flex;
  align-items: flex-start;
  gap: 0.35rem;
  min-width: 0;
}

.bm-list__id-cell .stiglib-cell-text {
  flex: 1 1 auto;
}

.stiglib-cell-text--mono {
  display: inline-block;
  width: 100%;
  text-align: center;
  font-family: var(--font-mono);
}

.stiglib-cell-text--date {
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
