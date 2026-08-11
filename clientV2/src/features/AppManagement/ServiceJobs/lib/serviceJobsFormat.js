// Display helpers for the Service Jobs feature. Pure formatting only — no API
// or business logic — so the table/modal components can stay presentational.

// Visual treatment for each run state. `severity` drives the state pill color;
// `icon` is a PrimeVue glyph. Unknown states fall back to `missing`.
export const RUN_STATE_META = {
  queued: { label: 'Queued', severity: 'neutral', icon: 'pi pi-clock' },
  running: { label: 'Running', severity: 'info', icon: 'pi pi-spin pi-spinner' },
  completed: { label: 'Completed', severity: 'success', icon: 'pi pi-check-circle' },
  failed: { label: 'Failed', severity: 'danger', icon: 'pi pi-times-circle' },
  canceled: { label: 'Canceled', severity: 'warn', icon: 'pi pi-ban' },
  missing: { label: 'Never run', severity: 'muted', icon: 'pi pi-minus-circle' },
}

export function runStateMeta(state) {
  return RUN_STATE_META[state] ?? RUN_STATE_META.missing
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

export function formatDateTime(value) {
  if (!value) {
    return '-'
  }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) {
    return '-'
  }
  return d.toLocaleString()
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
function combineDateTime(date, time) {
  const d = date instanceof Date ? date : new Date(date)
  const t = time instanceof Date ? time : new Date(time)
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    t.getHours(),
    t.getMinutes(),
    0,
  ).toISOString()
}

// Serialize the ScheduleForm model into a JobEventCreate (or null for "none").
export function buildEventPayload(schedule) {
  if (!schedule || schedule.frequency === 'none') {
    return null
  }
  const starts = combineDateTime(schedule.startDate, schedule.startTime)
  if (schedule.frequency === 'once') {
    return { type: 'once', starts }
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
