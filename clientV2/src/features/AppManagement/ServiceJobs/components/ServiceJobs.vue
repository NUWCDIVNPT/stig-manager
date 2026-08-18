<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { ref } from 'vue'
import { useServiceJobs } from '../composables/useServiceJobs.js'
import { splitterPt } from '../lib/serviceJobsPt.js'
import ConfirmActionModal from './ConfirmActionModal.vue'
import JobPropertiesModal from './JobPropertiesModal.vue'
import JobsTable from './JobsTable.vue'
import RunsPanel from './runs/RunsPanel.vue'

const {
  jobs,
  jobsLoading,
  selectedJob,
  runs,
  runsLoading,
  output,
  outputLoading,
  loadJobs,
  selectJob,
  selectRun,
  saveJob,
  removeJob,
  runNow,
  removeRun,
} = useServiceJobs()

const propsModalVisible = ref(false)
const editingJob = ref(null)
const saving = ref(false)

const removeModalVisible = ref(false)
const jobToRemove = ref(null)

const runNowVisible = ref(false)
const jobToRun = ref(null)

function onCreate() {
  editingJob.value = null
  propsModalVisible.value = true
}

function onModify(job) {
  editingJob.value = job
  propsModalVisible.value = true
}

async function onSaveJob(payload) {
  saving.value = true
  const ok = await saveJob(payload)
  saving.value = false
  if (ok) {
    propsModalVisible.value = false
  }
}

function onRemove(job) {
  jobToRemove.value = job
  removeModalVisible.value = true
}

function confirmRemove() {
  if (jobToRemove.value) {
    removeJob(jobToRemove.value)
  }
}

function onRunNow(job) {
  jobToRun.value = job
  runNowVisible.value = true
}

function confirmRunNow() {
  if (jobToRun.value) {
    runNow(jobToRun.value)
  }
}
</script>

<template>
  <div class="service-jobs-container">
    <Splitter layout="vertical" class="service-jobs-splitter" :pt="splitterPt">
      <SplitterPanel :size="45" :min-size="20" class="splitter-panel">
        <JobsTable
          :jobs="jobs"
          :loading="jobsLoading"
          :selection="selectedJob"
          @update:selection="selectJob"
          @create="onCreate"
          @modify="onModify"
          @remove="onRemove"
          @run-now="onRunNow"
          @refresh="loadJobs"
        />
      </SplitterPanel>
      <SplitterPanel :size="55" :min-size="25" class="splitter-panel">
        <RunsPanel
          :runs="runs"
          :runs-loading="runsLoading"
          :output="output"
          :output-loading="outputLoading"
          @select-run="selectRun"
          @delete-run="removeRun"
        />
      </SplitterPanel>
    </Splitter>

    <JobPropertiesModal
      v-model:visible="propsModalVisible"
      :job="editingJob"
      :saving="saving"
      @save="onSaveJob"
    />

    <ConfirmActionModal
      v-model:visible="removeModalVisible"
      title="Remove Job"
      tone="danger"
      icon="pi pi-trash"
      :message="jobToRemove ? `Remove “${jobToRemove.name}”? This also removes the job's scheduled events and run output.` : ''"
      confirm-label="Remove"
      confirm-icon="pi pi-trash"
      @confirm="confirmRemove"
    />

    <ConfirmActionModal
      v-model:visible="runNowVisible"
      title="Run Job Now"
      tone="primary"
      icon="pi pi-play"
      :message="jobToRun ? `Start “${jobToRun.name}” now? It will run once immediately, outside its schedule.` : ''"
      confirm-label="Run Now"
      confirm-icon="pi pi-play"
      @confirm="confirmRunNow"
    />
  </div>
</template>

<style scoped>
.service-jobs-container {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 0.3rem;
  background-color: var(--color-background-darkest);
  color: var(--color-text-primary);
  overflow: hidden;
}

.service-jobs-splitter {
  flex-grow: 1;
  min-height: 0;
  overflow: hidden;
}

.splitter-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
}
</style>
