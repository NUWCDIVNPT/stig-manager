<script setup>
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import { computed, ref, watch } from 'vue'
import AclStateIcon from '../../../../components/common/AclStateIcon.vue'
import StatusFooter from '../../../../components/common/StatusFooter.vue'
import { fetchEffectiveAclByCollectionUser } from '../../../../shared/api/grantsApi.js'
import { useAsyncState } from '../../../../shared/composables/useAsyncState.js'
import { useTableFooterActions } from '../../../../shared/composables/useTableFooterActions.js'
import { compactTablePt } from '../../../../shared/lib/dataTablePt.js'
import { getDefaultAccessForRole } from '../../lib/aclRules.js'
import { granteeLabel } from '../../lib/grantsUsers.js'

const props = defineProps({
  collectionId: {
    type: [String, Number],
    required: true,
  },
  user: {
    type: Object,
    default: null,
  },
  roleId: {
    type: [Number, String],
    default: null,
  },
})

const visible = defineModel('visible', { type: Boolean, default: false })

// Handle errors locally so a 422 (user has no direct or group grant) shows an
// in-modal message rather than the global error modal.
const { state: acl, isLoading, error, execute } = useAsyncState(
  () => fetchEffectiveAclByCollectionUser(props.collectionId, props.user?.userId),
  { initialState: [], immediate: false, onError: null },
)

const aclDt = ref()

const defaultAccess = computed(() => getDefaultAccessForRole(props.roleId))

const displayAcl = computed(() => (acl.value ?? []).map(row => ({
  assetName: row.asset?.name ?? '',
  benchmarkId: row.benchmarkId ?? '',
  access: row.access,
  sources: (row.aclSources ?? []).map(source => granteeLabel(source.grantee)).join(', '),
})))

const { onFooterAction } = useTableFooterActions(aclDt, { onRefresh: execute })

const tablePt = compactTablePt({ bodyFontSize: '0.9rem' })

// Clear prior results on every open/user change so a reopened drawer never
// flashes the previous user's access before the new fetch resolves.
watch([visible, () => props.user?.userId], ([isVisible, userId]) => {
  acl.value = []
  if (isVisible && userId) {
    execute()
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

      <DataTable
        v-else
        ref="aclDt"
        :value="displayAcl"
        :loading="isLoading"
        size="small"
        scrollable
        scroll-height="flex"
        sort-field="assetName"
        :sort-order="1"
        :virtual-scroller-options="{ itemSize: 41, delay: 0 }"
        class="acl-table"
        :pt="tablePt"
      >
        <template #empty>
          No effective access.
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
            :refresh-loading="isLoading"
            :total-count="displayAcl.length"
            total-label="rows"
            @action="onFooterAction"
          />
        </template>
      </DataTable>
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
  font-size: 2rem;
  color: var(--color-text-dim);
}

.title-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.title-main {
  font-weight: 700;
  font-size: 1.6rem;
}

.title-sub {
  font-size: 1.1rem;
  color: var(--color-text-dim);
}

.modal-body {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
}

.acl-table {
  flex: 1 1 auto;
  min-height: 0;
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  overflow: hidden;
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
