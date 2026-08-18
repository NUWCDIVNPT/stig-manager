import { describe, expect, it } from 'vitest'
import {
  buildEventPayload,
  createdByLabel,
  defaultSchedule,
  formatDateTime,
  formatDuration,
  hydrateSchedule,
  isSystemJob,
  runDuration,
  runStateMeta,
  scheduleSummary,
  splitTasks,
} from '../lib/serviceJobsFormat.js'

describe('formatDateTime', () => {
  it('returns a dash for absent or invalid values', () => {
    expect(formatDateTime(null)).toBe('-')
    expect(formatDateTime(undefined)).toBe('-')
    expect(formatDateTime('not a date')).toBe('-')
  })

  it('renders a valid instant with a timezone suffix', () => {
    const out = formatDateTime('2026-05-01T13:30:00.000Z')
    expect(out).toMatch(/2026-05-01 \d{2}:\d{2}:\d{2} \S+/)
  })
})

describe('defaultSchedule', () => {
  it('defaults to an enabled daily recurrence', () => {
    const s = defaultSchedule()
    expect(s.frequency).toBe('recurring')
    expect(s.intervalValue).toBe(1)
    expect(s.intervalField).toBe('day')
    expect(s.enabled).toBe(true)
    expect(s.startDate).toBeInstanceOf(Date)
    expect(s.startTime).toBeInstanceOf(Date)
  })

  it('returns a fresh object each call', () => {
    expect(defaultSchedule()).not.toBe(defaultSchedule())
  })
})

describe('hydrateSchedule', () => {
  it('treats a missing event as manual-only', () => {
    expect(hydrateSchedule(undefined).frequency).toBe('none')
    expect(hydrateSchedule(null).frequency).toBe('none')
  })

  it('expands a recurring event, defaulting enabled to true', () => {
    const s = hydrateSchedule({
      type: 'recurring',
      interval: { value: '3', field: 'week' },
      starts: '2026-05-01T09:30:00.000Z',
    })
    expect(s.frequency).toBe('recurring')
    expect(s.intervalValue).toBe(3)
    expect(s.intervalField).toBe('week')
    expect(s.enabled).toBe(true)
    expect(s.startDate.toISOString()).toBe('2026-05-01T09:30:00.000Z')
  })

  it('preserves a disabled recurring event', () => {
    const s = hydrateSchedule({
      type: 'recurring',
      interval: { value: '1', field: 'day' },
      starts: '2026-05-01T00:00:00.000Z',
      enabled: false,
    })
    expect(s.enabled).toBe(false)
  })

  it('expands a one-time event', () => {
    const s = hydrateSchedule({ type: 'once', starts: '2026-05-01T00:00:00.000Z' })
    expect(s.frequency).toBe('once')
    expect(s.startDate.toISOString()).toBe('2026-05-01T00:00:00.000Z')
  })
})

describe('schedule round-trip (hydrate <-> buildEventPayload)', () => {
  it('rebuilds an equivalent recurring event', () => {
    const event = {
      type: 'recurring',
      interval: { value: '2', field: 'hour' },
      starts: '2026-05-01T14:00:00.000Z',
      enabled: true,
    }
    const rebuilt = buildEventPayload(hydrateSchedule(event))
    expect(rebuilt.type).toBe('recurring')
    expect(rebuilt.interval).toEqual({ value: '2', field: 'hour' })
    expect(rebuilt.enabled).toBe(true)
    // starts collapses to local wall-clock; assert it stays a valid ISO instant.
    expect(Number.isNaN(new Date(rebuilt.starts).getTime())).toBe(false)
  })

  it('round-trips a manual-only job back to null', () => {
    expect(buildEventPayload(hydrateSchedule(null))).toBeNull()
  })
})

describe('splitTasks', () => {
  const catalog = [
    { taskId: 1, name: 'Alpha', description: 'a' },
    { taskId: 2, name: 'Beta', description: 'b' },
    { taskId: 3, name: 'Gamma', description: 'c' },
  ]

  it('puts every task in available when the job has none assigned', () => {
    const [available, assigned] = splitTasks(catalog, { tasks: [] })
    expect(available).toHaveLength(3)
    expect(assigned).toHaveLength(0)
  })

  it('moves assigned tasks out of available and preserves their order', () => {
    const [available, assigned] = splitTasks(catalog, { tasks: [{ taskId: 3 }, { taskId: 1 }] })
    expect(assigned.map(t => t.taskId)).toEqual([3, 1])
    expect(available.map(t => t.taskId)).toEqual([2])
  })

  it('passes the job task list through as-is (getJob already joins name + description)', () => {
    const jobTasks = [{ taskId: 2, name: 'Beta', description: 'b' }]
    const [available, assigned] = splitTasks(catalog, { tasks: jobTasks })
    expect(assigned).toBe(jobTasks)
    expect(available.map(t => t.taskId)).toEqual([1, 3])
  })

  it('tolerates a null job', () => {
    const [available, assigned] = splitTasks(catalog, null)
    expect(available).toHaveLength(3)
    expect(assigned).toHaveLength(0)
  })
})

describe('runDuration', () => {
  it('returns elapsed ms between created and updated', () => {
    const run = {
      state: 'completed',
      created: '2026-05-01T00:00:00.000Z',
      updated: '2026-05-01T00:00:03.500Z',
    }
    expect(runDuration(run)).toBe(3500)
  })

  it('returns null for a still-running run', () => {
    expect(runDuration({ state: 'running', created: '2026-05-01T00:00:00.000Z' })).toBeNull()
  })

  it('returns null for a missing run', () => {
    expect(runDuration(null)).toBeNull()
  })
})

describe('buildEventPayload', () => {
  it('returns null for a missing schedule or "none" frequency', () => {
    expect(buildEventPayload(null)).toBeNull()
    expect(buildEventPayload({ frequency: 'none' })).toBeNull()
  })

  it('returns null when the start date-time is absent or invalid', () => {
    // Manual DatePicker text entry can yield an Invalid Date; combineDateTime
    // guards against a toISOString throw by resolving to null.
    const base = { frequency: 'once', startTime: new Date('2026-05-01T09:00:00Z') }
    expect(buildEventPayload({ ...base, startDate: new Date('not a date') })).toBeNull()
    expect(buildEventPayload({ ...base, startDate: null })).toBeNull()
  })

  it('builds a one-time event with a valid ISO start', () => {
    const event = buildEventPayload({
      frequency: 'once',
      startDate: new Date('2026-05-01T00:00:00Z'),
      startTime: new Date('2026-05-01T09:30:00Z'),
    })
    expect(event.type).toBe('once')
    expect(Number.isNaN(new Date(event.starts).getTime())).toBe(false)
  })

  it('builds a recurring event, stringifying the interval value', () => {
    const event = buildEventPayload({
      frequency: 'recurring',
      intervalValue: 3,
      intervalField: 'week',
      startDate: new Date('2026-05-01T00:00:00Z'),
      startTime: new Date('2026-05-01T09:30:00Z'),
      enabled: false,
    })
    expect(event.type).toBe('recurring')
    expect(event.interval).toEqual({ value: '3', field: 'week' })
    expect(event.enabled).toBe(false)
  })
})

describe('scheduleSummary', () => {
  it('reports "Not scheduled" for a missing or unknown event', () => {
    expect(scheduleSummary(null)).toBe('Not scheduled')
    expect(scheduleSummary({ type: 'weird' })).toBe('Not scheduled')
  })

  it('capitalizes the interval field for a recurring event', () => {
    expect(scheduleSummary({ type: 'recurring', interval: { value: '3', field: 'day' } }))
      .toBe('Every 3 Day(s)')
  })

  it('reports "Once" for a one-time event', () => {
    expect(scheduleSummary({ type: 'once' })).toBe('Once')
  })
})

describe('formatDuration', () => {
  it('returns a dash for a null duration', () => {
    expect(formatDuration(null)).toBe('-')
  })

  it('renders sub-second durations in ms', () => {
    expect(formatDuration(500)).toBe('500 ms')
  })

  it('renders sub-minute durations to one decimal second', () => {
    expect(formatDuration(1200)).toBe('1.2s')
  })

  it('renders minute-plus durations as "Xm Ys"', () => {
    expect(formatDuration(184000)).toBe('3m 4s')
  })
})

describe('isSystemJob', () => {
  it('treats reserved ids below 100 as system jobs', () => {
    expect(isSystemJob({ jobId: 1 })).toBe(true)
    expect(isSystemJob({ jobId: 99 })).toBe(true)
  })

  it('treats ids of 100 or above as non-system jobs', () => {
    expect(isSystemJob({ jobId: 100 })).toBe(false)
    expect(isSystemJob({ jobId: 250 })).toBe(false)
  })

  it('does not flag an absent job', () => {
    expect(isSystemJob(null)).toBe(false)
    expect(isSystemJob(undefined)).toBe(false)
  })
})

describe('runStateMeta', () => {
  it('returns the matching meta for a known state', () => {
    expect(runStateMeta('completed').label).toBe('Completed')
    expect(runStateMeta('completed').severity).toBe('success')
  })

  it('falls back to "Never run" for an unknown or absent state', () => {
    expect(runStateMeta('bogus').label).toBe('Never run')
    expect(runStateMeta(undefined).label).toBe('Never run')
  })
})

describe('createdByLabel', () => {
  it('returns the owner username when present', () => {
    expect(createdByLabel({ createdBy: { username: 'alice' } })).toBe('alice')
  })

  it('reports "system" when createdBy is null or the job is absent', () => {
    expect(createdByLabel({ createdBy: null })).toBe('system')
    expect(createdByLabel(null)).toBe('system')
  })
})
