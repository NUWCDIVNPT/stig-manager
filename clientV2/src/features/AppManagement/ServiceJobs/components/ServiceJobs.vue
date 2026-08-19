<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { ref } from 'vue'
import DeleteModal from '../../../../components/common/DeleteModal.vue'
import { useServiceJobs } from '../composables/useServiceJobs.js'
import { formatDateTime } from '../lib/serviceJobsFormat.js'
import { splitterPt } from '../lib/serviceJobsPt.js'
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
  saving,
  saveJob,
  removeJob,
  runNow,
  removeRun,
} = useServiceJobs()

const propsModalVisible = ref(false)
const editingJob = ref(null)

const removeModalVisible = ref(false)
const jobToRemove = ref(null)

const runNowVisible = ref(false)
const jobToRun = ref(null)

const deleteRunVisible = ref(false)
const runToDelete = ref(null)

function onCreate() {
  editingJob.value = null
  propsModalVisible.value = true
}

function onModify(job) {
  editingJob.value = job
  propsModalVisible.value = true
}

async function onSaveJob(payload) {
  const ok = await saveJob(payload)
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

function onDeleteRun(run) {
  runToDelete.value = run
  deleteRunVisible.value = true
}

function confirmDeleteRun() {
  if (runToDelete.value) {
    removeRun(runToDelete.value)
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
          @delete-run="onDeleteRun"
        />
      </SplitterPanel>
    </Splitter>

    <JobPropertiesModal
      v-model:visible="propsModalVisible"
      :job="editingJob"
      :saving="saving"
      @save="onSaveJob"
    />

    <DeleteModal
      v-model:visible="removeModalVisible"
      title="Remove Job"
      :message="jobToRemove ? `Remove “${jobToRemove.name}”? This also removes the job's scheduled events and run output.` : ''"
      confirm-label="Remove"
      @confirm="confirmRemove"
    />

    <DeleteModal
      v-model:visible="runNowVisible"
      title="Run Job Now"
      :message="jobToRun ? `Start “${jobToRun.name}” now? It will run once immediately, outside its schedule.` : ''"
      confirm-label="Run Now"
      confirm-severity="primary"
      @confirm="confirmRunNow"
    />

    <DeleteModal
      v-model:visible="deleteRunVisible"
      title="Delete Run"
      :message="runToDelete ? `Delete the run started ${formatDateTime(runToDelete.created)}? Its output is also removed.` : ''"
      confirm-label="Delete"
      @confirm="confirmDeleteRun"
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
