<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref } from 'vue'
import ActionButton from '../../../components/common/ActionButton.vue'
import ClassificationBadge from '../../../components/common/ClassificationBadge.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'
import { paneColumnPt, paneTablePt } from '../tablePt.js'
import EarlierRevisionsPills from './EarlierRevisionsPills.vue'

const props = defineProps({
  benchmarks: {
    type: Array,
    default: () => [],
  },
  selectedId: {
    type: String,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: Object,
    default: null,
  },
  itemSize: {
    type: Number,
    default: 72,
  },
  lineClamp: {
    type: Number,
    default: 2,
  },
  totalCount: {
    type: Number,
    default: null,
  },
})

const emit = defineEmits(['select', 'back', 'retry'])

const filter = defineModel('filter', { type: String, default: '' })

const dataTableRef = ref(null)

// The pane is too narrow for a column header, and the single column needs no
// label or sort, so the header row is suppressed and the filter lives in the
// sub-bar above the table.
const dataTablePt = {
  ...paneTablePt(),
  thead: { style: { display: 'none' } },
}

const columnPt = paneColumnPt()

const selectedRow = computed(() =>
  props.selectedId ? props.benchmarks.find(b => b.benchmarkId === props.selectedId) ?? null : null,
)

const total = computed(() => props.totalCount ?? props.benchmarks.length)
const filteredCount = computed(() =>
  filter.value && total.value !== props.benchmarks.length ? props.benchmarks.length : null,
)

function onRowClick(event) {
  emit('select', event.data)
}

function onFooterAction(key) {
  if (key === 'export') {
    dataTableRef.value?.exportCSV()
  }
}

function clearFilter() {
  filter.value = ''
}
</script>

<template>
  <div class="stiglib-panel">
    <header class="stiglib-panel__header benchmarks-pane__header">
      <ActionButton
        icon="pi pi-arrow-left icon-grey"
        title="Back to the full STIG list"
        @click="emit('back')"
      >
        Benchmarks
      </ActionButton>
    </header>

    <div class="stiglib-subbar">
      <div class="stiglib-search">
        <i class="pi pi-search stiglib-search__icon" />
        <input
          v-model="filter"
          type="text"
          class="stiglib-search__input"
          placeholder="Filter by title or ID…"
        >
        <button
          v-if="filter"
          type="button"
          class="stiglib-search__clear"
          aria-label="Clear filter"
          @click="clearFilter"
        >
          <i class="pi pi-times" />
        </button>
      </div>
    </div>

    <div v-if="error" class="stiglib-state stiglib-state--error">
      <i class="pi pi-exclamation-triangle" />
      <span>{{ error.message ?? 'Could not load benchmarks.' }}</span>
      <button type="button" class="stiglib-retry" @click="emit('retry')">
        Retry
      </button>
    </div>

    <div v-else class="stiglib-panel__body">
      <DataTable
        ref="dataTableRef"
        :value="benchmarks"
        :loading="loading"
        :selection="selectedRow"
        selection-mode="single"
        data-key="benchmarkId"
        scrollable
        scroll-height="flex"
        :virtual-scroller-options="{ itemSize, showLoader: true }"
        striped-rows
        export-filename="stig-library-benchmarks"
        class="benchmarks-table"
        :style="{ '--line-clamp': lineClamp, '--item-size': `${itemSize}px` }"
        :pt="dataTablePt"
        @row-click="onRowClick"
      >
        <Column field="title" :style="{ minWidth: '11rem' }" :pt="columnPt">
          <template #body="{ data }">
            <div class="bm-cell">
              <div class="bm-cell__title" :title="data.title">
                {{ data.title }}
              </div>
              <div class="bm-cell__id-row">
                <span class="bm-cell__id">{{ data.benchmarkId }}</span>
                <ClassificationBadge v-if="data.marking" :level="data.marking" />
              </div>
              <div class="bm-cell__meta-row">
                <span class="bm-cell__meta">
                  {{ data.lastRevisionStr }} · {{ data.ruleCount }} rules · {{ data.lastRevisionDate }}
                </span>
                <EarlierRevisionsPills :revisions="data.revisionStrs" :max="2" />
              </div>
            </div>
          </template>
        </Column>

        <template #empty>
          <div class="stiglib-empty">
            {{ filter ? 'No benchmarks match this filter.' : 'No benchmarks available.' }}
          </div>
        </template>

        <template #footer>
          <StatusFooter
            :total-count="total"
            :filtered-count="filteredCount"
            total-label="benchmarks"
            :show-refresh="false"
            :show-export="true"
            @action="onFooterAction"
          />
        </template>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
@import "../styles/stigLibrary.css";

/* The header is a single action: the button supplies its own padding. */
.benchmarks-pane__header {
  padding: 0.15rem 0.35rem;
}

.benchmarks-table {
  flex: 1;
  min-height: 0;
  height: 100%;
}

.bm-cell {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
  padding: 0.25rem 0;
}

.bm-cell__title {
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--color-text-primary);
  display: -webkit-box;
  line-clamp: var(--line-clamp, 2);
  -webkit-line-clamp: var(--line-clamp, 2);
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.bm-cell__id-row {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.bm-cell__id {
  font-family: monospace;
  font-size: 1rem;
  color: var(--color-text-dim);
}

.bm-cell__meta-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.1rem;
}

.bm-cell__meta {
  font-size: 1rem;
  color: var(--color-text-dim);
}
</style>
