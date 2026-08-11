<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import { computed, ref, watch } from 'vue'
import { useAsyncState } from '../../../../shared/composables/useAsyncState.js'
import { useCurrentUser } from '../../../../shared/composables/useCurrentUser.js'
import { primaryBtnPt, secondaryBtnPt } from '../../../../shared/lib/dialogPt.js'
import { inputTextPt, tabListPt, tabPanelPt, tabPanelsPt, tabPt, tabsPt } from '../../../../shared/lib/formPt.js'
import { fetchTasks } from '../api/serviceJobsApi.js'
import { buildEventPayload } from '../lib/serviceJobsFormat.js'
import ScheduleForm from './schedule/ScheduleForm.vue'
import TaskPickList from './schedule/TaskPickList.vue'

const props = defineProps({
  visible: { type: Boolean, required: true },
  // Job being edited, or null when creating.
  job: { type: Object, default: null },
  // True while the parent is persisting a save.
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['update:visible', 'save'])

const { isAdmin } = useCurrentUser()

const localVisible = computed({
  get: () => props.visible,
  set: v => emit('update:visible', v),
})

const isEdit = computed(() => props.job != null)
// System jobs (jobId < 100) have fixed name/description/tasks; only the
// schedule is editable.
const isSystemJob = computed(() => isEdit.value && Number(props.job.jobId) < 100)

const name = ref('')
const description = ref('')
const activeTab = ref('tasks')
const tasksModel = ref([[], []])
const schedule = ref(defaultSchedule())

function defaultSchedule() {
  return {
    frequency: 'recurring',
    intervalValue: 1,
    intervalField: 'day',
    startDate: new Date(),
    startTime: new Date(),
    enabled: true,
  }
}

// Task catalog, loaded from /jobs/tasks the first time the modal is opened and
// reused thereafter. Errors render inline with a Retry button (onError: null).
const { isLoading: tasksLoading, error: tasksError, execute: loadTasks } = useAsyncState(
  opts => fetchTasks({ elevate: isAdmin.value, signal: opts?.signal }),
  { initialState: [], immediate: false, onError: null },
)

// Reset the form whenever the modal opens, then split the task catalog into
// available vs. already-assigned based on the job's tasks.
watch(() => props.visible, async (open) => {
  if (!open) {
    return
  }
  activeTab.value = 'tasks'
  const job = props.job
  name.value = job?.name ?? ''
  description.value = job?.description ?? ''
  schedule.value = hydrateSchedule(job?.event)
  tasksModel.value = [[], []]

  const catalog = await loadTasks()
  hydrateTasks(catalog ?? [])
})

function hydrateTasks(catalog) {
  // The job's own task list carries the assignment order; keep it. The event
  // payload sends task ids, so we track full task objects only for display.
  const catalogById = new Map(catalog.map(t => [t.taskId, t]))
  const assigned = (props.job?.tasks ?? []).map(
    t => catalogById.get(t.taskId) ?? { taskId: t.taskId, name: t.name, description: '' },
  )
  const assignedIds = new Set(assigned.map(t => t.taskId))
  const available = catalog.filter(t => !assignedIds.has(t.taskId))
  tasksModel.value = [available, assigned]
}

function hydrateSchedule(event) {
  if (!event) {
    return { ...defaultSchedule(), frequency: 'none' }
  }
  const base = defaultSchedule()
  base.frequency = event.type
  if (event.starts) {
    base.startDate = new Date(event.starts)
    base.startTime = new Date(event.starts)
  }
  if (event.type === 'recurring') {
    base.intervalValue = Number(event.interval?.value ?? 1)
    base.intervalField = event.interval?.field ?? 'day'
    base.enabled = event.enabled !== false
  }
  return base
}

// A job requires at least one task (JobTaskListCreate minItems: 1). System jobs
// keep their fixed name/tasks, so only the schedule matters there.
const selectedTaskIds = computed(() => tasksModel.value[1].map(t => t.taskId))
const isValid = computed(() => {
  if (isSystemJob.value) {
    return true
  }
  return !!name.value.trim() && selectedTaskIds.value.length > 0
})

function close() {
  emit('update:visible', false)
}

// Builds the JobCreate/JobUpdate payload; the parent owns the API call and
// closes the modal on success.
function onSave() {
  if (!isValid.value || props.saving) {
    return
  }
  emit('save', {
    jobId: props.job?.jobId ?? null,
    isSystemJob: isSystemJob.value,
    name: name.value.trim(),
    description: description.value.trim(),
    taskIds: selectedTaskIds.value,
    event: buildEventPayload(schedule.value),
  })
}

const dialogPt = {
  root: { style: 'background: var(--color-background-dark); border: 1px solid var(--color-border-default); border-radius: 8px; color: var(--color-text-primary); display: flex; flex-direction: column; overflow: hidden;' },
  header: { style: 'background: var(--color-background-dark); padding: 0; border-bottom: 1px solid var(--color-border-default); flex-shrink: 0;' },
  content: { style: 'background: var(--color-background-dark); padding: 0; flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column;' },
  footer: { style: 'flex-shrink: 0; padding: 0; border: none;' },
  closeButton: { style: 'color: var(--color-text-dim);' },
}
</script>

<template>
  <Dialog
    v-model:visible="localVisible"
    modal
    :draggable="false"
    :style="{ width: '820px', maxWidth: '95vw', height: '640px', maxHeight: '95vh' }"
    :pt="dialogPt"
  >
    <template #header>
      <div class="modal-header">
        <div class="modal-header-icon">
          <i class="pi pi-wrench" />
        </div>
        <div class="modal-header-title">
          {{ isEdit ? `Job Properties${isSystemJob ? ' (system job)' : ''}` : 'Create New Job' }}
        </div>
      </div>
    </template>

    <div class="form-body">
      <div class="fields-row">
        <div class="labeled-field">
          <label class="flabel" for="job-name">Name <span class="req-star">*</span></label>
          <InputText
            id="job-name"
            v-model="name"
            :disabled="isSystemJob"
            :pt="inputTextPt"
            maxlength="255"
            placeholder="Enter a job name..."
            autocomplete="off"
          />
        </div>
        <div class="labeled-field">
          <label class="flabel" for="job-description">Description</label>
          <InputText
            id="job-description"
            v-model="description"
            :disabled="isSystemJob"
            :pt="inputTextPt"
            maxlength="255"
            placeholder="Enter a job description..."
            autocomplete="off"
          />
        </div>
      </div>

      <Tabs v-model:value="activeTab" :pt="tabsPt">
        <TabList :pt="tabListPt">
          <Tab value="tasks" :pt="tabPt">
            <i class="pi pi-cog tab-icon" /> Tasks
          </Tab>
          <Tab value="schedule" :pt="tabPt">
            <i class="pi pi-calendar tab-icon" /> Schedule
          </Tab>
        </TabList>
        <TabPanels :pt="tabPanelsPt">
          <TabPanel value="tasks" :pt="tabPanelPt">
            <div v-if="tasksLoading" class="tab-status">
              <i class="pi pi-spin pi-spinner" /> Loading tasks...
            </div>
            <div v-else-if="tasksError" class="tab-status tab-status--error">
              <i class="pi pi-exclamation-triangle" />
              <span>Could not load tasks.</span>
              <Button label="Retry" icon="pi pi-refresh" size="small" severity="secondary" @click="loadTasks" />
            </div>
            <TaskPickList v-else v-model="tasksModel" />
          </TabPanel>
          <TabPanel value="schedule" :pt="tabPanelPt">
            <ScheduleForm v-model="schedule" />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>

    <template #footer>
      <div class="modal-footer">
        <Button label="Cancel" :pt="secondaryBtnPt" :disabled="saving" @click="close" />
        <Button label="Save" :pt="primaryBtnPt" :loading="saving" :disabled="!isValid || tasksLoading" @click="onSave" />
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
}

.form-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem 1.25rem 0.75rem;
  flex: 1;
  min-height: 0;
}

.fields-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem 1rem;
}

.labeled-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 0;
}

.flabel {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.req-star {
  color: var(--color-text-error);
}

.tab-icon {
  margin-right: 0.4rem;
}

.tab-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  flex: 1;
  font-size: 1.05rem;
  color: var(--color-text-dim);
}

.tab-status--error {
  color: var(--color-text-primary);
}

.tab-status--error .pi-exclamation-triangle {
  color: var(--color-text-error);
  font-size: 1.3rem;
}

.modal-footer {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.9rem 1.1rem;
  justify-content: flex-end;
}
</style>
