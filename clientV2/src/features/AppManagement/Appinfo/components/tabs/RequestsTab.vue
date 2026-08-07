<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { computed, ref, watch } from 'vue'
import {
  buildOperationDetails,
  buildOperationRows,
  buildRequestsSummary,
  buildUsernameLookup,
} from '../../lib/adapters/requestRows.js'
import OperationClientsTable from '../requests/OperationClientsTable.vue'
import OperationErrorsTable from '../requests/OperationErrorsTable.vue'
import OperationProjectionsTable from '../requests/OperationProjectionsTable.vue'
import OperationsTable from '../requests/OperationsTable.vue'
import OperationUsersTable from '../requests/OperationUsersTable.vue'

const props = defineProps({
  requests: { type: Object, default: null },
  users: { type: Object, default: null },
})

const selectedOperation = ref(null)

// A new report invalidates the selected operation and its child tables
watch(() => props.requests, () => {
  selectedOperation.value = null
})

const operationRows = computed(() => buildOperationRows(props.requests))
const summary = computed(() => (props.requests ? buildRequestsSummary(props.requests) : null))
const usernameLookup = computed(() => buildUsernameLookup(props.users))

const details = computed(() =>
  selectedOperation.value
    ? buildOperationDetails(selectedOperation.value, usernameLookup.value)
    : { users: [], clients: [], errors: [], projections: [] },
)

const splitterPt = {
  root: { style: 'border: none; background: transparent; height: 100%;' },
  gutter: { style: 'background: var(--color-border-dark);' },
}

const bottomSplitterPt = {
  root: { style: 'border: none; background: transparent; height: 100%; min-width: max-content;' },
  gutter: { style: 'width: 8px; background: var(--color-background-darkest); border-left: 1px solid var(--color-border-default); border-right: 1px solid var(--color-border-default);' },
}
</script>

<template>
  <Splitter layout="vertical" :pt="splitterPt">
    <SplitterPanel :size="65" :min-size="20" class="requests-panel">
      <OperationsTable
        v-model:selection="selectedOperation"
        :rows="operationRows"
        :summary="summary"
      />
    </SplitterPanel>

    <SplitterPanel :size="35" :min-size="15" class="requests-panel bottom-row-panel">
      <Splitter :pt="bottomSplitterPt">
        <SplitterPanel :size="16" :min-size="10" class="requests-panel subpanel-table">
          <OperationUsersTable :rows="details.users" />
        </SplitterPanel>
        <SplitterPanel :size="16" :min-size="10" class="requests-panel subpanel-table">
          <OperationClientsTable :rows="details.clients" />
        </SplitterPanel>
        <SplitterPanel :size="16" :min-size="10" class="requests-panel subpanel-table">
          <OperationErrorsTable :rows="details.errors" />
        </SplitterPanel>
        <SplitterPanel :size="52" :min-size="15" class="requests-panel subpanel-table subpanel-table--projections">
          <OperationProjectionsTable :rows="details.projections" />
        </SplitterPanel>
      </Splitter>
    </SplitterPanel>
  </Splitter>
</template>

<style scoped>
.requests-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.bottom-row-panel {
  overflow-x: auto;
  overflow-y: hidden;
}

.subpanel-table {
  min-width: 15rem;
  max-width: none;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  overflow: hidden;
}

.subpanel-table--projections {
  min-width: 38rem;
  max-width: none;
}
</style>
