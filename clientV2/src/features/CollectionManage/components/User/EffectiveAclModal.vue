<script setup>
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import { computed, ref, watch } from 'vue'
import AclStateIcon from '../../../../components/common/AclStateIcon.vue'
import { granteeLabel } from '../../../../components/common/grants/granteeDisplay.js'
import GridFilterButton from '../../../../components/common/GridFilterButton.vue'
import StatusFooter from '../../../../components/common/StatusFooter.vue'
import { fetchEffectiveAclByCollectionUser } from '../../../../shared/api/grantsApi.js'
import { useAsyncState } from '../../../../shared/composables/useAsyncState.js'
import { useGridSearch } from '../../../../shared/composables/useGridSearch.js'
import { compactTablePt } from '../../../../shared/lib/dataTablePt.js'
import { rowHeightPx } from '../../../../shared/lib/rowHeights.js'
import { accessLabel, getDefaultAccessForRole } from '../../lib/aclRules.js'

const props = defineProps({
  collectionId: {
    type: [String, Number],
    required: true,
  },
  // the user to get the effective acl for and edit...
  user: {
    type: Object,
    default: null,
  },
  // the role id of the user to get the default access for
  roleId: {
    type: [Number, String],
    default: null,
  },
})

const ROW_HEIGHT = rowHeightPx('control')

const visible = defineModel('visible', { type: Boolean, default: false })

// Handle errors locally so a 422 (user has no direct or group grant) shows an
// in-modal message rather than the global error modal.
// also lifecycle hooks for fetching the effective acl for a user
const { state: acl, isLoading, error, execute } = useAsyncState(
  () => fetchEffectiveAclByCollectionUser(props.collectionId, props.user?.userId),
  { initialState: [], immediate: false, onError: null },
)

const aclDt = ref()

// get the default access for a user based on their role
const defaultAccess = computed(() => getDefaultAccessForRole(props.roleId))

// mapping users for the data table for ui display
const displayAcl = computed(() => (acl.value ?? []).map((row) => {
  const sourceList = (row.aclSources ?? []).map(source => granteeLabel(source.grantee))
  return {
    assetName: row.asset?.name ?? '',
    benchmarkId: row.benchmarkId ?? '',
    access: row.access,
    sourceList,
    sources: sourceList.join(', '),
  }
}))

const { filters: gridFilters, filteredRows, isFiltered, filterColumns, valueOptions, clear: clearFilters } = useGridSearch(displayAcl, [
  { field: 'assetName', header: 'Asset' },
  { field: 'benchmarkId', header: 'STIG', filterValues: r => r.benchmarkId },
  { field: 'access', header: 'Access', filterValues: r => accessLabel(r.access) },
  { field: 'sources', header: 'ACL Source', filterValues: r => r.sourceList, multiple: true },
])

const tablePt = compactTablePt()

// Clear prior results on every open/user change so a reopened drawer never flashes the previous user's access before the new fetch resolves.
watch([visible, () => props.user?.userId], ([isVisible, userId]) => {
  acl.value = []
  clearFilters()
  if (isVisible && userId) {
    execute() // fetcher..
  }
}, { immediate: true })
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :pt="{
      root: { style: 'width: 820px; max-width: 96vw; height: 640px;' },
      content: { style: 'flex: 1 1 auto; display: flex; flex-direction: column; overflow: hidden;' },
    }"
  >
    <template #header>
      <div class="modal-title">
        <i class="pi pi-user" />
        <div class="title-text">
          <span class="title-main">User: {{ user?.displayName }}</span>
          <span class="title-sub">Effective Access, default = {{ defaultAccess }}</span>
        </div>
      </div>
    </template>

    <div class="modal-body">
      <div v-if="error" class="acl-message">
        <i class="pi pi-info-circle" />
        <span>{{ error.message || 'Unable to load effective access for this user.' }}</span>
      </div>

      <div v-else class="acl-panel">
        <div class="panel-title">
          <i class="pi pi-shield" />
          <span>Effective Access</span>
          <span class="panel-title__end">
            <GridFilterButton v-model="gridFilters" :columns="filterColumns" :value-options="valueOptions" />
          </span>
        </div>
        <DataTable
          ref="aclDt"
          :value="filteredRows"
          :loading="isLoading"
          size="small"
          scrollable
          scroll-height="flex"
          sort-field="assetName"
          :sort-order="1"
          :virtual-scroller-options="{ itemSize: ROW_HEIGHT, delay: 0 }"
          export-filename="EffectiveGrants"
          class="acl-table"
          :pt="tablePt"
        >
          <template #empty>
            {{ isFiltered && displayAcl.length ? 'No rows match the filters.' : 'No effective access.' }}
          </template>
          <Column field="assetName" header="Asset" sortable />
          <Column field="benchmarkId" header="STIG" sortable />
          <Column field="access" header="Access" sortable>
            <template #body="{ data }">
              <AclStateIcon :access="data.access" />
            </template>
          </Column>
          <Column field="sources" header="ACL Source" />
          <template #footer>
            <StatusFooter
              :dt="aclDt"
              :refresh-loading="isLoading"
              :total-count="displayAcl.length"
              :filtered-count="isFiltered ? filteredRows.length : null"
              total-label="rows"
              @refresh="execute"
            />
          </template>
        </DataTable>
      </div>
    </div>

    <template #footer>
      <Button label="Close" icon="pi pi-times" @click="visible = false" />
    </template>
  </Dialog>
</template>

<style scoped>
.modal-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.modal-title i {
  font-size: var(--text-display);
  color: var(--color-text-dim);
}

.title-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.title-main {
  font-weight: 700;
  font-size: var(--text-2xl);
}

.title-sub {
  font-size: var(--text-lg);
  color: var(--color-text-dim);
}

.modal-body {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
}

.acl-panel {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  overflow: hidden;
}

.acl-table {
  flex: 1 1 auto;
  min-height: 0;
}

/* Matches the Service Jobs / Log Stream panel title bars; the Filter rides the right. */
.panel-title {
  --checklist-control-height: 1.9rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.5rem 0.3rem 0.75rem;
  font-size: var(--text-md);
  font-weight: 700;
  color: var(--color-text-bright);
  background: var(--color-background-subtle);
  border-bottom: 1px solid var(--color-border-default);
}

.panel-title__end {
  margin-left: auto;
  font-weight: 400;
}

.acl-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  color: var(--color-text-dim);
  border: 1px dashed var(--color-border-default);
  border-radius: 6px;
}
</style>
