<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Select from 'primevue/select'
import { ref } from 'vue'
import AclStateIcon from '../../../../components/common/AclStateIcon.vue'
import StatusFooter from '../../../../components/common/StatusFooter.vue'
import { useTableFooterActions } from '../../../../shared/composables/useTableFooterActions.js'
import { compactTablePt } from '../../../../shared/lib/dataTablePt.js'
import { resourceSortKey } from '../../lib/aclRules.js'
import AclResourceDisplay from './AclResourceDisplay.vue'

defineProps({
  // rules is the items in the table
  rules: {
    type: Array,
    default: () => [],
  },
  // used for if we need to allow none, read only or read / write role id 1 doesn't get none
  accessOptions: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['accessChange'])

const selectedRules = defineModel('selection', { type: Array, default: () => [] })

const rulesDt = ref()
const { onFooterAction } = useTableFooterActions(rulesDt)
const tablePt = compactTablePt({ bodyFontSize: '0.9rem', footer: 'divider' })
</script>

<template>
  <DataTable
    ref="rulesDt"
    v-model:selection="selectedRules"
    :value="rules"
    :loading="loading"
    selection-mode="multiple"
    :meta-key-selection="false"
    size="small"
    scrollable
    scroll-height="flex"
    :sort-field="resourceSortKey"
    :sort-order="1"
    :virtual-scroller-options="{ itemSize: 41, delay: 0 }"
    class="rules-table"
    :pt="tablePt"
  >
    <template #empty>
      No ACL rules.
    </template>
    <Column header="Resource" sortable :sort-field="resourceSortKey" :export-field="resourceSortKey">
      <template #body="{ data }">
        <AclResourceDisplay :rule="data" />
      </template>
    </Column>
    <Column header="Access" field="access" sortable style="width: 140px">
      <template #body="{ data }">
        <Select
          :model-value="data.access"
          :options="accessOptions"
          option-label="label"
          option-value="value"
          class="access-select"
          @update:model-value="value => emit('accessChange', { rule: data, access: value })"
          @click.stop
        >
          <template #value>
            <AclStateIcon :access="data.access" />
          </template>
          <template #option="{ option }">
            <AclStateIcon :access="option.value" />
            <span class="access-option-label">{{ option.label }}</span>
          </template>
        </Select>
      </template>
    </Column>
    <template #footer>
      <StatusFooter
        :show-refresh="false"
        :total-count="rules.length"
        total-label="rules"
        @action="onFooterAction"
      />
    </template>
  </DataTable>
</template>

<style scoped>
.rules-table {
  flex: 1 1 auto;
  min-height: 0;
}

/* Inline access editor: keep it compact and chrome-free so the colored Tag reads as the value. */
.access-select {
  background: transparent;
  border: none;
}

.access-option-label {
  margin-left: 0.5rem;
  color: var(--color-text-dim);
}
</style>
