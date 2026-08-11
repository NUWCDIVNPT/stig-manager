<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { ref } from 'vue'
import DeleteModal from '../../../../components/common/DeleteModal.vue'
import { useServiceJobs } from '../composables/useServiceJobs.js'
import { splitterPt } from '../lib/serviceJobsPt.js'
import JobPropertiesModal from './JobPropertiesModal.vue'
import JobsTable from './JobsTable.vue'
import RunsPanel from './runs/RunsPanel.vue'

const {
  jobs,
  jobsLoading,
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
  <div class="service-jobs-page">
    <div class="service-jobs-workspace">
      <div class="page-header">
        <div class="page-header-icon">
          <i class="pi pi-wrench" />
        </div>
        <div class="page-heading">
          <h2>Service Jobs</h2>
          <p>Schedule and monitor background maintenance jobs for this STIG Manager instance.</p>
        </div>
      </div>

      <Splitter layout="vertical" class="page-splitter" :pt="splitterPt">
        <SplitterPanel :size="45" :min-size="20" class="page-splitter-panel">
          <JobsTable
            :jobs="jobs"
            :loading="jobsLoading"
            @select="selectJob"
            @create="onCreate"
            @modify="onModify"
            @remove="onRemove"
            @run-now="onRunNow"
            @refresh="loadJobs"
          />
        </SplitterPanel>
        <SplitterPanel :size="55" :min-size="25" class="page-splitter-panel">
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
    </div>

    <JobPropertiesModal
      v-model:visible="propsModalVisible"
      :job="editingJob"
      :saving="saving"
      @save="onSaveJob"
    />

    <DeleteModal
      v-model:visible="removeModalVisible"
      title="Confirm remove action"
      :message="jobToRemove ? `Remove ${jobToRemove.name}? This removes the job's scheduled events and run output.` : ''"
      confirm-label="Remove"
      @confirm="confirmRemove"
    />

    <DeleteModal
      v-model:visible="runNowVisible"
      title="Confirm run action"
      :message="jobToRun ? `Run ${jobToRun.name} now?` : ''"
      confirm-label="Run Now"
      confirm-severity="primary"
      @confirm="confirmRunNow"
    />
  </div>
</template>

<style scoped>
.service-jobs-page {
  height: 100%;
  width: 100%;
  overflow: auto;
  padding: 0.8rem;
  background-color: var(--color-background-darkest);
  color: var(--color-text-primary);
}

.service-jobs-workspace {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  overflow: hidden;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 1.1rem;
  padding: 1rem 1.25rem;
  background: var(--color-background-subtle);
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  flex-shrink: 0;
}

.page-header-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.4rem;
  color: var(--color-primary-highlight);
  background: color-mix(in srgb, var(--color-action-blue-dark) 18%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-action-blue-dark) 35%, transparent);
}

.page-header h2 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text-bright);
}

.page-header p {
  margin: 0.35rem 0 0;
  color: var(--color-text-dim);
  font-size: 1.2rem;
}

.page-splitter {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.page-splitter-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  padding: 0.4rem 0;
}

.page-splitter-panel:first-child {
  padding-top: 0;
}

.page-splitter-panel:last-child {
  padding-bottom: 0;
}
</style>
