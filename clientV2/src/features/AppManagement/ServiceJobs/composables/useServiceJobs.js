import { onMounted, ref } from 'vue'
import { useAsyncState } from '../../../../shared/composables/useAsyncState.js'
import { useCurrentUser } from '../../../../shared/composables/useCurrentUser.js'
import { useGlobalError } from '../../../../shared/composables/useGlobalError.js'
import {
  createJob,
  deleteJob,
  deleteRun,
  fetchJobs,
  fetchRunOutput,
  fetchRunsByJob,
  patchJob,
  runJobNow,
} from '../api/serviceJobsApi.js'

// Orchestrates the master/detail data flow of the Service Jobs page: the jobs
// list, the selected job's runs, and the selected run's output. Reads run
// through useAsyncState (loading/error/abort handling, global error modal);
// mutations resolve to a boolean so callers can decide whether to close a
// dialog. Every call is elevated with the current user's admin privilege.
export function useServiceJobs() {
  const { triggerError } = useGlobalError()
  const { isAdmin } = useCurrentUser()
  const elevate = () => isAdmin.value

  const selectedJob = ref(null)
  const selectedRun = ref(null)

  const { state: jobs, isLoading: jobsLoading, execute: executeJobs } = useAsyncState(
    opts => fetchJobs({ elevate: elevate(), signal: opts?.signal }),
    { initialState: [], immediate: false },
  )

  const { state: runs, isLoading: runsLoading, execute: executeRuns } = useAsyncState(
    (jobId, opts) => fetchRunsByJob(jobId, { elevate: elevate(), signal: opts?.signal }),
    { initialState: [], immediate: false },
  )

  const { state: output, isLoading: outputLoading, execute: executeOutput } = useAsyncState(
    async (runId, opts) => {
      const lines = await fetchRunOutput(runId, { elevate: elevate(), signal: opts?.signal })
      // The API's JobRunOutput has no sequence field; derive one for keying and
      // display, matching the legacy grid's Seq column.
      return (lines ?? []).map((line, i) => ({ ...line, seq: i + 1 }))
    },
    { initialState: [], immediate: false },
  )

  async function loadJobs() {
    const result = await executeJobs()
    if (!result) {
      return
    }
    // Re-resolve the current selection against the fresh list so the runs panel
    // keeps tracking the same job across reloads.
    if (selectedJob.value) {
      const match = result.find(j => j.jobId === selectedJob.value.jobId)
      selectedJob.value = match ?? null
      if (match) {
        await loadRuns(match.jobId)
      }
      else {
        clearRuns()
      }
    }
  }

  async function selectJob(job) {
    selectedJob.value = job
    clearRuns()
    if (job) {
      await loadRuns(job.jobId)
    }
  }

  function loadRuns(jobId) {
    return executeRuns(jobId)
  }

  function clearRuns() {
    runs.value = []
    selectedRun.value = null
    output.value = []
  }

  async function selectRun(run) {
    selectedRun.value = run
    output.value = []
    if (run) {
      await executeOutput(run.runId)
    }
  }

  // payload: { jobId, isSystemJob, name, description, taskIds, event }
  async function saveJob(payload) {
    try {
      if (payload.jobId) {
        // System jobs have fixed name/description/tasks; only the schedule is
        // editable, so send just the event.
        const body = payload.isSystemJob
          ? { event: payload.event }
          : { name: payload.name, description: payload.description, tasks: payload.taskIds, event: payload.event }
        await patchJob(payload.jobId, body, { elevate: elevate() })
      }
      else {
        await createJob(
          { name: payload.name, description: payload.description, tasks: payload.taskIds, event: payload.event },
          { elevate: elevate() },
        )
      }
      await loadJobs()
      return true
    }
    catch (e) {
      triggerError(e)
      return false
    }
  }

  async function removeJob(job) {
    try {
      await deleteJob(job.jobId, { elevate: elevate() })
      if (selectedJob.value?.jobId === job.jobId) {
        selectedJob.value = null
        clearRuns()
      }
      await loadJobs()
      return true
    }
    catch (e) {
      triggerError(e)
      return false
    }
  }

  async function runNow(job) {
    try {
      await runJobNow(job.jobId, { elevate: elevate() })
      // A new run appears immediately; refresh both the list (runCount/lastRun)
      // and the runs panel.
      await loadJobs()
      if (selectedJob.value?.jobId === job.jobId) {
        await loadRuns(job.jobId)
      }
      return true
    }
    catch (e) {
      triggerError(e)
      return false
    }
  }

  async function removeRun(run) {
    try {
      await deleteRun(run.runId, { elevate: elevate() })
      runs.value = runs.value.filter(r => r.runId !== run.runId)
      if (selectedRun.value?.runId === run.runId) {
        selectedRun.value = null
        output.value = []
      }
      return true
    }
    catch (e) {
      triggerError(e)
      return false
    }
  }

  onMounted(loadJobs)

  return {
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
  }
}
