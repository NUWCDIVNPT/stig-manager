import { apiCall } from '../../../../shared/api/apiClient.js'

// Service Jobs administration lives behind the elevated /jobs endpoints. Callers
// pass `elevate` from the current user's admin privilege (mirroring the legacy
// admin tab); the API still independently enforces the stig-manager:op scope.

export function fetchJobs({ elevate, signal } = {}) {
  return apiCall('getJobs', { elevate }, undefined, { signal })
}

export function fetchJob(jobId, { elevate, signal } = {}) {
  return apiCall('getJob', { jobId, elevate }, undefined, { signal })
}

// body is a JobCreate: { name, description?, tasks: [taskId...], event? }
export function createJob(body, { elevate } = {}) {
  return apiCall('postJob', { elevate }, body)
}

// body is a JobUpdate (partial): any of { name, description, tasks, event }
export function patchJob(jobId, body, { elevate } = {}) {
  return apiCall('patchJob', { jobId, elevate }, body)
}

// Removing a job also removes its scheduled events and run output.
export function deleteJob(jobId, { elevate } = {}) {
  return apiCall('deleteJob', { jobId, elevate })
}

export function fetchRunsByJob(jobId, { elevate, signal } = {}) {
  return apiCall('getRunsByJob', { jobId, elevate }, undefined, { signal })
}

// Kicks off an out-of-schedule run; resolves to { runId }.
export function runJobNow(jobId, { elevate } = {}) {
  return apiCall('runImmediateJob', { jobId, elevate })
}

export function deleteRun(runId, { elevate } = {}) {
  return apiCall('deleteRunById', { runId, elevate })
}

// Full run output; pass afterSeq to fetch only lines after a sequence number.
export function fetchRunOutput(runId, { elevate, afterSeq, signal } = {}) {
  const params = { runId, elevate }
  if (afterSeq != null) {
    params['after-seq'] = afterSeq
  }
  return apiCall('getOutputByRun', params, undefined, { signal })
}

// Catalog of tasks that can be assigned to a job.
export function fetchTasks({ elevate, signal } = {}) {
  return apiCall('getAllTasks', { elevate }, undefined, { signal })
}
