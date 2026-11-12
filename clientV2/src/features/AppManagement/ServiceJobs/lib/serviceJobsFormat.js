// Display helpers for the Service Jobs feature. Pure formatting only — no API
// or business logic — so the table/modal components can stay presentational.
import { formatDateTimeString } from '../../../../shared/lib.js'

// Visual treatment for each run state. `severity` drives the state pill color;
// `icon` is a PrimeVue glyph. Unknown states fall back to `missing`.
export const RUN_STATE_META = {
  // TODO: queued/canceled never come from the API today (run_job writes only
  // running/completed/failed; getRunsByJob synthesizes shutdown) — revisit.
  queued: { label: 'Queued', severity: 'neutral', icon: 'pi pi-clock' },
  canceled: { label: 'Canceled', severity: 'warn', icon: 'pi pi-ban' },
  running: { label: 'Running', severity: 'info', icon: 'pi pi-spin pi-spinner' },
  completed: { label: 'Completed', severity: 'success', icon: 'pi pi-check-circle' },
  failed: { label: 'Failed', severity: 'danger', icon: 'pi pi-times-circle' },
  // Synthesized by the API for a run orphaned by a service restart; the legacy
  // client colors it the same as failed.
  shutdown: { label: 'Shutdown', severity: 'danger', icon: 'pi pi-power-off' },
  missing: { label: 'Never run', severity: 'muted', icon: 'pi pi-minus-circle' },
}

export function runStateMeta(state) {
  return RUN_STATE_META[state] ?? RUN_STATE_META.missing
}

// System-seeded jobs use reserved ids below 100. They have a fixed
// name/tasks (only the schedule is editable) and cannot be removed. Single
// source of truth shared by JobsTable's Remove-gating and the modal.
export function isSystemJob(job) {
  return Number(job?.jobId) < 100
}

// Display label for a job's owner; system jobs report createdBy: null.
export function createdByLabel(job) {
  return job?.createdBy?.username ?? 'system'
}

// e.g. "Every 1 Day(s)" / "Once" / "Not scheduled"
export function scheduleSummary(event) {
  if (!event) {
    return 'Not scheduled'
  }
  if (event.type === 'recurring') {
    const { value, field } = event.interval ?? {}
    return `Every ${value} ${capitalize(field)}(s)`
  }
  if (event.type === 'once') {
    return 'Once'
  }
  return 'Not scheduled'
}

// Local date-time with timezone, e.g. "2026-05-01 09:30:00 EDT" (matches the
// legacy grids' "Y-m-d H:i:s T"). Delegates to the shared formatter so dates
// read the same across the app; '-' for an absent/invalid value.
export function formatDateTime(value) {
  return formatDateTimeString(value) || '-'
}

// Elapsed ms between a run's start and end, or null while it is still running
// (an in-flight run has no meaningful duration yet).
export function runDuration(run) {
  if (!run || run.state === 'running') {
    return null
  }
  return new Date(run.updated) - new Date(run.created)
}

// Milliseconds between start and end, rendered compactly (e.g. "1.2s", "3m 4s").
export function formatDuration(ms) {
  if (ms == null) {
    return '-'
  }
  if (ms < 1000) {
    return `${ms} ms`
  }
  const seconds = ms / 1000
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`
  }
  const mins = Math.floor(seconds / 60)
  const rem = Math.round(seconds % 60)
  return `${mins}m ${rem}s`
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''
}

// Combine a date-part Date and a time-part Date into a single ISO timestamp.
// Returns null when either part is absent or an Invalid Date (the editable
// DatePicker allows manual text entry) so callers never hit toISOString throw.
function combineDateTime(date, time) {
  // Guard nullish parts explicitly: a cleared DatePicker yields null, and
  // new Date(null) is the epoch (not an Invalid Date), so the NaN check alone
  // would let it through as a bogus 1970 timestamp.
  if (date == null || time == null) {
    return null
  }
  const d = date instanceof Date ? date : new Date(date)
  const t = time instanceof Date ? time : new Date(time)
  if (Number.isNaN(d.getTime()) || Number.isNaN(t.getTime())) {
    return null
  }
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    t.getHours(),
    t.getMinutes(),
    0,
  ).toISOString()
}

// Blank ScheduleForm model used when creating a job.
export function defaultSchedule() {
  return {
    frequency: 'recurring',
    intervalValue: 1,
    intervalField: 'day',
    startDate: new Date(),
    startTime: new Date(),
    enabled: true,
  }
}

// Inverse of buildEventPayload: expand a JobEvent into the ScheduleForm model.
// No event means the job runs only when started manually ('none').
export function hydrateSchedule(event) {
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

// Split the task catalog into [available, assigned] for the PickList. getJob
// already returns each task with name + description and in run order, so the
// job's own task list is the assigned side as-is; available is the rest.
export function splitTasks(catalog, job) {
  const assigned = job?.tasks ?? []
  const assignedIds = new Set(assigned.map(t => t.taskId))
  const available = catalog.filter(t => !assignedIds.has(t.taskId))
  return [available, assigned]
}

// Serialize the ScheduleForm model into a JobEventCreate (or null for "none"
// / an incomplete start date-time / a cleared interval).
export function buildEventPayload(schedule) {
  if (!schedule || schedule.frequency === 'none') {
    return null
  }
  const starts = combineDateTime(schedule.startDate, schedule.startTime)
  if (!starts) {
    return null
  }
  if (schedule.frequency === 'once') {
    return { type: 'once', starts }
  }
  // InputNumber emits null when cleared; its :min only clamps typed values
  if (!Number.isInteger(schedule.intervalValue) || schedule.intervalValue < 1) {
    return null
  }
  return {
    type: 'recurring',
    interval: {
      value: String(schedule.intervalValue),
      field: schedule.intervalField,
    },
    starts,
    enabled: schedule.enabled,
  }
}

export const FREQUENCY_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Recurring', value: 'recurring' },
  { label: 'One Time', value: 'once' },
]

export const INTERVAL_FIELD_OPTIONS = [
  { label: 'Minute(s)', value: 'minute' },
  { label: 'Hour(s)', value: 'hour' },
  { label: 'Day(s)', value: 'day' },
  { label: 'Week(s)', value: 'week' },
  { label: 'Month(s)', value: 'month' },
]
