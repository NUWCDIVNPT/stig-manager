<script setup>
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import { computed, watch } from 'vue'
import StatusFooter from '../../../../components/common/StatusFooter.vue'
import { useAsyncState } from '../../../../shared/composables/useAsyncState.js'
import { formatDateTimeString } from '../../../../shared/lib.js'
import { secondaryBtnPt } from '../../../ImportWizard/lib/importDialogPt.js'
import { fetchTaskOutput, taskNameToPathParam } from '../../api/tasksManageApi.js'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  collectionId: {
    type: String,
    required: true,
  },
  task: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:visible'])

const localVisible = computed({
  get: () => props.visible,
  set: v => emit('update:visible', v),
})

const { state: output, isLoading, execute: loadOutput } = useAsyncState(
  () => fetchTaskOutput(props.collectionId, taskNameToPathParam(props.task?.name)),
  { initialState: [], immediate: false },
)

watch(() => props.visible, (open) => {
  if (open && props.task) {
    loadOutput()
  }
})

function handleFooterAction(action) {
  if (action === 'refresh') {
    loadOutput()
  }
}

const dialogPt = {
  root: { style: 'background: var(--color-background-dark); border: 1px solid var(--color-border-default); border-radius: 8px; color: var(--color-text-primary); display: flex; flex-direction: column; overflow: hidden;' },
  header: { style: 'background: var(--color-background-dark); padding: 0; border-bottom: 1px solid var(--color-border-default); flex-shrink: 0;' },
  content: { style: 'background: var(--color-background-dark); padding: 0; flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column;' },
  footer: { style: 'flex-shrink: 0; padding: 0; border: none;' },
  closeButton: { style: 'color: var(--color-text-dim);' },
}

const tablePt = {
  root: { style: 'background-color: var(--color-background-dark);' },
  wrapper: { style: 'background-color: var(--color-background-dark); flex: 1 1 auto; display: flex; flex-direction: column;' },
  tbody: { style: 'background-color: var(--color-background-dark);' },
  footer: { style: 'padding: 0; border: none;' },
}

const borderPt = { headerCell: { style: 'border-right: 1px solid var(--color-border-default)' } }
</script>

<template>
  <Dialog
    v-model:visible="localVisible"
    modal
    :draggable="false"
    :style="{ width: 'min(1000px, 96vw)', height: '78vh', maxHeight: '820px', minHeight: '420px' }"
    :pt="dialogPt"
  >
    <template #header>
      <div class="modal-header">
        <div class="modal-header-icon">
          <i class="pi pi-list" />
        </div>
        <div>
          <div class="modal-header-title">
            Task Output
          </div>
        </div>
      </div>
    </template>

    <div class="modal-body">
      <DataTable
        :value="output"
        data-key="seq"
        scrollable
        scroll-height="flex"
        resizable-columns
        column-resize-mode="fit"
        :loading="isLoading"
        class="flex-fill"
        :pt="tablePt"
      >
        <Column field="seq" header="Seq" sortable :pt="borderPt" style="width: 56px;" />
        <Column field="ts" header="Timestamp" sortable :pt="borderPt" style="width: 170px;">
          <template #body="{ data }">
            {{ formatDateTimeString(data.ts) }}
          </template>
        </Column>
        <Column field="task" header="Task" sortable :pt="borderPt" style="width: 140px;" />
        <Column field="type" header="Type" sortable :pt="borderPt" style="width: 90px;">
          <template #body="{ data }">
            {{ data.type }}
          </template>
        </Column>
        <Column field="message" header="Message" :pt="borderPt" style="min-width: 320px;">
          <template #body="{ data }">
            <span class="message-cell" :title="data.message">{{ data.message }}</span>
          </template>
        </Column>

        <template #empty>
          No output recorded for this task.
        </template>

        <template #footer>
          <StatusFooter
            :refresh-loading="isLoading"
            :total-count="output.length"
            :show-export="false"
            total-label="entries"
            @action="handleFooterAction"
          />
        </template>
      </DataTable>
    </div>

    <template #footer>
      <div class="modal-footer">
        <Button label="Close" :pt="secondaryBtnPt" @click="localVisible = false" />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.modal-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.1rem;
}

.modal-header-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-action-blue-dark) 20%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-action-blue-dark) 40%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-action-blue-dark);
  flex-shrink: 0;
}

.modal-header-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text-bright);
  line-height: 1.25;
}

.modal-body {
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 1rem 1.1rem;
  display: flex;
}

.flex-fill {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
}

.message-cell {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.1rem;
}
</style>
