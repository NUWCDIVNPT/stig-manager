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
import { buildEventPayload, defaultSchedule, hydrateSchedule, isSystemJob as isSystemJobRecord, splitTasks } from '../lib/serviceJobsFormat.js'
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
// System jobs have fixed name/description/tasks; only the schedule is editable.
const isSystemJob = computed(() => isEdit.value && isSystemJobRecord(props.job))

const name = ref('')
const description = ref('')
const activeTab = ref('tasks')
const tasksModel = ref([[], []])
const schedule = ref(defaultSchedule())

// Task catalog, loaded from /jobs/tasks the first time the modal is opened and
// reused thereafter. Errors render inline with a Retry button (onError: null).
const { isLoading: tasksLoading, error: tasksError, execute: loadTasks } = useAsyncState(
  opts => fetchTasks({ elevate: isAdmin.value, signal: opts?.signal }),
  { initialState: [], immediate: false, onError: null },
)

// Fetch the catalog and partition it into the PickList's available/assigned
// columns; shared by the open-watch and the error Retry button so a recovered
// load failure repopulates the list.
async function loadAndSplitTasks() {
  const catalog = await loadTasks()
  tasksModel.value = splitTasks(catalog ?? [], props.job)
}

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
  await loadAndSplitTasks()
})

// A job requires at least one task (JobTaskListCreate minItems: 1). System jobs
// keep their fixed name/tasks, so only the schedule matters there.
const selectedTaskIds = computed(() => tasksModel.value[1].map(t => t.taskId))
// A chosen schedule must yield a valid event; guards against saving with an
// invalid start date-time or a cleared repeat interval, which buildEventPayload
// resolves to null.
const scheduleValid = computed(() => schedule.value.frequency === 'none' || buildEventPayload(schedule.value) != null)
const isValid = computed(() => {
  if (!scheduleValid.value) {
    return false
  }
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
            maxlength="45"
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
              <Button label="Retry" icon="pi pi-refresh" size="small" severity="secondary" @click="loadAndSplitTasks" />
            </div>
            <!-- System jobs have a fixed task set; only the schedule is editable. -->
            <div v-else-if="isSystemJob" class="readonly-tasks">
              <p class="readonly-note">
                <i class="pi pi-lock" /> This is a system job. Its tasks are fixed and cannot be changed.
              </p>
              <ul class="task-readonly-list">
                <li v-for="task in tasksModel[1]" :key="task.taskId" class="task-readonly-item">
                  <i class="pi pi-cog" />
                  <div class="task-readonly-text">
                    <span class="task-readonly-name">{{ task.name }}</span>
                    <span class="task-readonly-desc">{{ task.description }}</span>
                  </div>
                </li>
              </ul>
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
  font-size: 1rem;
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

.readonly-tasks {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
}

.readonly-note {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1rem;
  color: var(--color-text-dim);
  font-style: italic;
}

.task-readonly-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.task-readonly-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.75rem;
  background: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
}

.task-readonly-item i {
  font-size: 1.1rem;
  color: var(--color-text-dim);
  flex-shrink: 0;
}

.task-readonly-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.task-readonly-name {
  font-weight: 600;
  color: var(--color-text-primary);
}

.task-readonly-desc {
  font-size: 1rem;
  color: var(--color-text-dim);
}

.modal-footer {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.9rem 1.1rem;
  justify-content: flex-end;
}
</style>
