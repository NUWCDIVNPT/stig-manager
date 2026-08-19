import { onMounted, ref } from 'vue'
import { useAsyncState } from '../../../../shared/composables/useAsyncState.js'
import { useCurrentUser } from '../../../../shared/composables/useCurrentUser.js'
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
// list, the selected job's runs, and the selected run's output. Reads and
// mutations both run through useAsyncState (loading/error handling, global
// error modal); a mutation resolves truthy on success and null on failure so
// callers can decide whether to close a dialog. Every call is elevated with
// the current user's admin privilege.
export function useServiceJobs() {
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
    // Each line carries the API's own seq (ascending emission order; the spec's
    // JobRunOutput schema omits it but getOutputByRun always sends it) — used
    // as-is so Seq agrees with the Timestamp order and the legacy grid.
    async (runId, opts) => (await fetchRunOutput(runId, { elevate: elevate(), signal: opts?.signal })) ?? [],
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
  const { isLoading: saving, execute: saveJob } = useAsyncState(
    async (payload) => {
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
    },
    { immediate: false },
  )

  const { execute: removeJob } = useAsyncState(
    async (job) => {
      await deleteJob(job.jobId, { elevate: elevate() })
      if (selectedJob.value?.jobId === job.jobId) {
        selectedJob.value = null
        clearRuns()
      }
      await loadJobs()
      return true
    },
    { immediate: false },
  )

  const { execute: runNow } = useAsyncState(
    async (job) => {
      await runJobNow(job.jobId, { elevate: elevate() })
      // A new run appears immediately; loadJobs refreshes the list
      // (runCount/lastRun) and, for the tracked selection, the runs panel.
      await loadJobs()
      return true
    },
    { immediate: false },
  )

  const { execute: removeRun } = useAsyncState(
    async (run) => {
      await deleteRun(run.runId, { elevate: elevate() })
      if (selectedRun.value?.runId === run.runId) {
        selectedRun.value = null
        output.value = []
      }
      // The jobs grid's runCount/lastRun are server-computed; loadJobs refreshes
      // them and reloads the runs panel for the tracked selection.
      await loadJobs()
      return true
    },
    { immediate: false },
  )

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
    saving,
    saveJob,
    removeJob,
    runNow,
    removeRun,
  }
}
