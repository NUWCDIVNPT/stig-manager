<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Popover from 'primevue/popover'
import { computed, ref } from 'vue'
import librarySvg from '../../../assets/library.svg'
import shieldGreenCheck from '../../../assets/shield-green-check.svg'
import ActionButton from '../../../components/common/ActionButton.vue'
import ActionToolbar from '../../../components/common/ActionToolbar.vue'
import ClassificationBadge from '../../../components/common/ClassificationBadge.vue'
import ColumnSearchFilter from '../../../components/common/ColumnSearchFilter.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'
import { useTableFooterActions } from '../../../shared/composables/useTableFooterActions.js'
import { compactTablePt } from '../../../shared/lib/dataTablePt.js'

const props = defineProps({
  stigs: {
    type: Array,
    required: true,
  },
  selection: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:selection', 'import', 'remove-stig', 'remove-revision', 'open-library', 'refresh'])

const dataTableRef = ref(null)

const selectedStigs = computed({
  get: () => props.selection ?? [],
  set: value => emit('update:selection', value ?? []),
})

const benchmarkIdFilter = ref('')
const titleFilter = ref('')

const filteredData = computed(() => {
  const idTerm = benchmarkIdFilter.value.trim().toLowerCase()
  const titleTerm = titleFilter.value.trim().toLowerCase()
  return props.stigs
    .filter((s) => {
      if (idTerm && !s.benchmarkId?.toLowerCase().includes(idTerm)) {
        return false
      }
      if (titleTerm && !s.title?.toLowerCase().includes(titleTerm)) {
        return false
      }
      return true
    })
    // materialize collectionCount/earlierRevisions so those columns' fields
    // sort and export; rows become shallow copies, which dataKey-based
    // selection tolerates
    .map(s => ({
      ...s,
      collectionCount: s.collectionIds?.length ?? 0,
      earlierRevisions: s.revisionStrs?.slice(1).join(', ') ?? '',
    }))
})

const filtersActive = computed(() => filteredData.value.length !== props.stigs.length)

const tablePt = {
  ...compactTablePt({ bodyFontSize: '1rem' }),
  bodyRow: { style: 'cursor: pointer;' },
}
const borderPt = { headerCell: { style: 'border-right: 1px solid var(--color-border-default)' } }
const centerBorderPt = { ...borderPt, columnHeaderContent: { style: 'justify-content: center;' } }
const centerWrappedBorderPt = { ...borderPt, columnHeaderContent: { style: 'justify-content: center; flex-wrap: wrap;' } }

function formatEarlierRevisions(revs) {
  if (!revs || revs.length <= 1) {
    return '—'
  }
  const earlier = revs.slice(1)
  const shown = earlier.slice(0, 3)
  const overflow = earlier.length - shown.length
  return shown.join(', ') + (overflow > 0 ? ` (+${overflow})` : '')
}

const { onFooterAction } = useTableFooterActions(dataTableRef, { onRefresh: () => emit('refresh') })

// ── Toolbar ───────────────────────────────────────────────────────────────────
const revMenuRef = ref(null)

const singleSelection = computed(() =>
  props.selection?.length === 1 ? props.selection[0] : null,
)

const noSelection = computed(() => !props.selection?.length)

const hasMultipleRevisions = computed(() =>
  (singleSelection.value?.revisionStrs?.length ?? 0) > 1,
)

// Revision menu only for a single STIG with multiple revisions
const showRevDropdown = computed(() => !!singleSelection.value && hasMultipleRevisions.value)

const removeButtonLabel = computed(() => {
  const n = props.selection?.length ?? 0
  if (n === 0) {
    return 'Remove'
  }
  if (n > 1) {
    return `Remove STIG (${n})`
  }
  return 'Remove STIG'
})

// Falls back to revisionStrs when projection=revisions data is unavailable
const revisionItems = computed(() => {
  const sel = singleSelection.value
  if (!sel) {
    return []
  }
  return sel.revisions ?? sel.revisionStrs?.map(s => ({ revisionStr: s, collectionIds: [] })) ?? []
})

function formatRevLabel(revStr) {
  const m = revStr?.match(/^V(\d+)R([\d.]+)$/)
  return m ? `Version ${m[1]} Release ${m[2]}` : revStr
}

function onRevSelect(revisionStr) {
  revMenuRef.value?.hide()
  emit('remove-revision', singleSelection.value, revisionStr)
}

function onRemoveAll() {
  revMenuRef.value?.hide()
  emit('remove-stig', [singleSelection.value])
}
</script>

<template>
  <div class="stig-list">
    <ActionToolbar>
      <ActionButton icon="pi pi-upload icon-green" @click="emit('import')">
        Import STIG
      </ActionButton>
      <div class="toolbar-divider" />

      <!-- Plain remove: zero selection, multi-selection, or single STIG with one revision -->
      <ActionButton
        v-if="!showRevDropdown"
        icon="pi pi-trash icon-red"
        :disabled="noSelection"
        @click="emit('remove-stig', props.selection)"
      >
        {{ removeButtonLabel }}
      </ActionButton>

      <!-- Revision menu: single STIG with multiple revisions -->
      <div v-else class="rev-dropdown">
        <button class="rev-dropdown__trigger" @click="revMenuRef?.toggle($event)">
          <i class="pi pi-trash icon-red" />
          Remove Revision
          <i class="pi pi-chevron-down rev-dropdown__chevron" />
        </button>
        <Popover ref="revMenuRef" :pt="{ root: { class: 'stig-rev-popover' } }">
          <ul class="rev-menu">
            <li
              v-for="rev in revisionItems"
              :key="rev.revisionStr"
              class="rev-menu__item"
              @click="onRevSelect(rev.revisionStr)"
            >
              <i class="pi pi-trash rev-menu__icon" />
              <span class="rev-menu__label">{{ formatRevLabel(rev.revisionStr) }}</span>
              <span v-if="rev.revisionStr === singleSelection.lastRevisionStr" class="rev-badge rev-badge--latest">
                latest
              </span>
              <span v-if="rev.collectionIds?.length" class="rev-badge rev-badge--pinned">
                <i class="pi pi-link" /> pinned
              </span>
            </li>
            <li role="separator" class="rev-menu__sep" />
            <li class="rev-menu__item rev-menu__item--all" @click="onRemoveAll">
              <i class="pi pi-trash rev-menu__icon" />
              Remove all revisions
            </li>
          </ul>
        </Popover>
      </div>

      <div class="toolbar-divider" />
      <ActionButton
        :disabled="!singleSelection"
        title="Open this STIG in the library"
        @click="emit('open-library')"
      >
        <img :src="librarySvg" class="toolbar-svg-icon" alt="">
        Open Library
      </ActionButton>
    </ActionToolbar>

    <div class="table-container">
      <DataTable
        ref="dataTableRef"
        v-model:selection="selectedStigs"
        :value="filteredData"
        selection-mode="multiple"
        :meta-key-selection="false"
        data-key="benchmarkId"
        :loading="loading"
        sort-field="benchmarkId"
        :sort-order="1"
        scrollable
        scroll-height="flex"
        :virtual-scroller-options="{ itemSize: 29 }"
        resizable-columns
        column-resize-mode="fit"
        export-filename="stig-manager-stigs"
        class="flex-fill"
        :table-style="{ 'min-width': '75rem' }"
        :pt="tablePt"
      >
        <template #empty>
          No STIGs found.
        </template>

        <Column selection-mode="multiple" style="width: 1%;" />

        <Column
          field="benchmarkId"
          sortable
          :pt="borderPt"
          style="width: 17%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;"
        >
          <template #header>
            <div class="column-header-with-filter">
              Benchmark ID
              <ColumnSearchFilter v-model="benchmarkIdFilter" placeholder="Search ID..." />
            </div>
          </template>
          <template #body="{ data }">
            <div class="benchmark-id-cell">
              <span :title="data.benchmarkId">{{ data.benchmarkId }}</span>
              <ClassificationBadge v-if="data.marking" :level="data.marking" />
            </div>
          </template>
        </Column>

        <Column
          field="title"
          sortable
          :pt="borderPt"
          style="width: 32%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;"
        >
          <template #header>
            <div class="column-header-with-filter">
              Title
              <ColumnSearchFilter v-model="titleFilter" placeholder="Search title..." />
            </div>
          </template>
          <template #body="{ data }">
            <span :title="data.title">{{ data.title || '—' }}</span>
          </template>
        </Column>

        <Column
          field="status"
          sortable
          :pt="centerBorderPt"
          style="width: 7%; text-align: center;"
        >
          <template #header>
            <span style="display: inline-block; text-align: center; width: 100%;">
              Status
            </span>
          </template>
          <template #body="{ data }">
            <span :class="{ 'dim-value': !data.status }">{{ data.status || '—' }}</span>
          </template>
        </Column>

        <Column
          field="lastRevisionStr"
          sortable
          :pt="centerWrappedBorderPt"
          style="width: 7%; text-align: center;"
        >
          <template #header>
            <span style="display: inline-block; text-align: center; line-height: 1.1; white-space: normal; width: 100%;">
              Latest Revision
            </span>
          </template>
          <template #body="{ data }">
            {{ data.lastRevisionStr || '—' }}
          </template>
        </Column>

        <Column
          field="lastRevisionDate"
          sortable
          :pt="centerWrappedBorderPt"
          style="width: 8%; text-align: center;"
        >
          <template #header>
            <span style="display: inline-block; text-align: center; line-height: 1.1; white-space: normal; width: 100%;">
              Revision Date
            </span>
          </template>
          <template #body="{ data }">
            <span class="dim-value">{{ data.lastRevisionDate || '—' }}</span>
          </template>
        </Column>

        <Column
          field="earlierRevisions"
          sortable
          :pt="centerWrappedBorderPt"
          style="width: 10%; text-align: center;"
        >
          <template #header>
            <span style="display: inline-block; text-align: center; line-height: 1.1; white-space: normal; width: 100%;">
              Earlier Revisions
            </span>
          </template>
          <template #body="{ data }">
            <span :class="{ 'dim-value': !data.revisionStrs || data.revisionStrs.length <= 1 }">
              {{ formatEarlierRevisions(data.revisionStrs) }}
            </span>
          </template>
        </Column>

        <Column
          field="ruleCount"
          sortable
          :pt="centerBorderPt"
          style="width: 6%; text-align: center;"
        >
          <template #header>
            <span style="display: inline-block; text-align: center; width: 100%;">
              Rules
            </span>
          </template>
          <template #body="{ data }">
            {{ data.ruleCount ?? '—' }}
          </template>
        </Column>

        <Column
          field="collectionCount"
          sortable
          :pt="centerBorderPt"
          style="width: 7%; text-align: center;"
        >
          <template #header>
            <span style="display: inline-block; text-align: center; width: 100%;">
              Collections
            </span>
          </template>
          <template #body="{ data }">
            <span :class="{ 'dim-value': !data.collectionCount }">
              {{ data.collectionCount }}
            </span>
          </template>
        </Column>

        <template #footer>
          <StatusFooter
            :refresh-loading="loading"
            :total-count="stigs.length"
            :filtered-count="filtersActive ? filteredData.length : null"
            total-label="STIGs"
            :total-icon-src="shieldGreenCheck"
            @action="onFooterAction"
          />
        </template>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.stig-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0.5rem;
  min-width: 0;
}

.table-container {
  flex: 1;
  min-height: 0;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  user-select: none;
}

.flex-fill {
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

.column-header-with-filter {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.benchmark-id-cell {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  overflow: hidden;
}

.benchmark-id-cell > span {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  min-width: 0;
}

.dim-value {
  color: var(--color-text-dim);
}

.toolbar-svg-icon {
  width: 1.1rem;
  height: 1.1rem;
}

.rev-dropdown {
  display: inline-flex;
  align-items: center;
}

.rev-dropdown__trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.7rem;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--color-text-default);
  font-size: 1.05rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.1s;
}

.rev-dropdown__trigger:hover {
  background: var(--color-background-subtle);
}

.rev-dropdown__chevron {
  font-size: 1rem;
  color: var(--color-text-dim);
}
</style>

<style>
.stig-rev-popover {
  background: var(--color-background-dark) !important;
  border: 1px solid var(--color-border-default) !important;
  border-radius: 8px !important;
  padding: 0.35rem !important;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45) !important;
  min-width: 26rem;
}

.rev-menu {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.rev-menu__item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.8rem;
  border-radius: 6px;
  cursor: pointer;
  color: var(--color-text-primary);
  font-size: 1.05rem;
  transition: background 0.1s;
  user-select: none;
}

.rev-menu__item:hover {
  background: var(--color-background-light);
}

.rev-menu__icon {
  color: var(--color-action-red);
  font-size: 1rem;
  flex-shrink: 0;
}

.rev-menu__label {
  flex: 1;
  white-space: nowrap;
}

.rev-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 1rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.rev-badge--latest {
  background: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  color: var(--color-text-dim);
}

.rev-badge--pinned {
  background: color-mix(in srgb, var(--color-action-blue) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-action-blue) 35%, transparent);
  color: var(--color-action-blue);
}

.rev-menu__sep {
  height: 1px;
  background: var(--color-border-default);
  margin: 0.2rem 0;
}

.rev-menu__item--all {
  color: var(--color-action-red);
}
</style>
