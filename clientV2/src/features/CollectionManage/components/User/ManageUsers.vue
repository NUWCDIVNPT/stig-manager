<script setup>
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Tooltip from 'primevue/tooltip'
import { computed, ref } from 'vue'
import { roleMap } from '../../../../components/common/grants/roleOptions.js'
import StatusFooter from '../../../../components/common/StatusFooter.vue'
import { useCollectionUsers } from '../../composables/useCollectionUsers.js'
import { getEffectiveUserDisplay } from '../../lib/grantsUsers.js'
import EffectiveAclModal from './EffectiveAclModal.vue'
import targetSvg from '../../../../assets/target.svg'

const props = defineProps({
  collectionId: {
    type: [String, Number],
    required: true,
  },
})

const vTooltip = Tooltip

const { users, isLoading, reload } = useCollectionUsers(() => props.collectionId)

const usersDt = ref()

const displayUsers = computed(() => (users.value ?? []).map((row) => {
  const display = getEffectiveUserDisplay(row)
  return {
    ...display,
    role: roleMap[display.roleId] || 'Unknown',
    granteeText: display.granteeLabels.join(', '),
  }
}))

const exportCSV = () => {
  usersDt.value?.exportCSV()
}

const onFooterAction = (key) => {
  if (key === 'refresh') {
    reload()
  }
  else if (key === 'export') {
    exportCSV()
  }
}

// Compact, flush-footer table styling via PassThrough (no scoped ::v-deep).
const tablePt = {
  root: { style: 'background: var(--p-datatable-row-background);' },
  tableContainer: { style: 'background: var(--p-datatable-row-background);' },
  footer: { style: 'padding: 0; border: none;' },
  column: {
    headerCell: { style: 'font-size: 1rem; font-weight: 600;' },
    bodyCell: { style: 'padding: 0.4rem 0.6rem;' },
  },
}

// Effective ACL drawer
const aclVisible = ref(false)
const selectedUser = ref(null)
const selectedRoleId = ref(null)

const openEffectiveAcl = (row) => {
  selectedUser.value = { userId: row.userId, displayName: row.displayName }
  selectedRoleId.value = row.roleId
  aclVisible.value = true
}
</script>

<template>
  <div class="manage-users">
    <div class="users-table-wrapper">
      <DataTable
        ref="usersDt"
        :value="displayUsers"
        :loading="isLoading"
        sort-field="displayName"
        :sort-order="1"
        size="medium"
        scrollable
        scroll-height="flex"
        :virtual-scroller-options="{ itemSize: 49, delay: 0 }"
        :pt="tablePt"
      >
        <template #empty>
          No effective users.
        </template>

        <Column field="displayName" header="User" sortable>
          <template #body="{ data }">
            <div class="user-cell">
              <i class="pi pi-user" />
              <div class="info-col">
                <span class="primary-text">{{ data.displayName }}</span>
                <span class="secondary-text">{{ data.username }}</span>
              </div>
            </div>
          </template>
        </Column>

        <Column field="granteeText" header="Grantee" sortable>
          <template #body="{ data }">
            <div class="grantee-list">
              <div
                v-for="(label, index) in data.granteeLabels"
                :key="index"
                class="grantee-item"
              >
                <i :class="label === 'Direct' ? 'pi pi-user' : 'pi pi-users'" />
                <span>{{ label }}</span>
              </div>
            </div>
          </template>
        </Column>

        <Column field="role" header="Role" sortable />

        <Column style="text-align: right">
          <template #body="{ data }">
            <div class="row-actions">
              <Button
                v-tooltip.top="'View effective access'"
                text
                rounded
                class="action-btn"
                @click="openEffectiveAcl(data)"
              >
                <img :src="targetSvg" class="action-svg" alt="Target" />
              </Button>
            </div>
          </template>
        </Column>

        <template #footer>
          <StatusFooter
            :refresh-loading="isLoading"
            :total-count="displayUsers.length"
            total-label="users"
            total-icon="pi pi-users"
            @action="onFooterAction"
          />
        </template>
      </DataTable>
    </div>

    <EffectiveAclModal
      v-model:visible="aclVisible"
      :collection-id="collectionId"
      :user="selectedUser"
      :role-id="selectedRoleId"
    />
  </div>
</template>

<style scoped>
.manage-users {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
}

.users-table-wrapper {
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  overflow: hidden;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-col {
  display: flex;
  flex-direction: column;
}

.primary-text {
  font-weight: 600;
  font-size: 0.92rem;
}

.secondary-text {
  color: var(--color-text-dim);
  font-size: 0.8rem;
}

.grantee-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.grantee-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
}

.row-actions {
  display: flex;
  gap: 0.25rem;
  justify-content: flex-end;
}

.action-btn {
  width: 2rem;
  height: 2rem;
  padding: 0;
}

.action-svg {
  width: 1.25rem;
  height: 1.25rem;
}
</style>
