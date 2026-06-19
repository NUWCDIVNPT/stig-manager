import { describe, expect, it } from 'vitest'
import { formatSchedule } from '../Configuration/scheduleFormat.js'

describe('formatSchedule', () => {
  it('returns "Not scheduled" for missing or empty events', () => {
    expect(formatSchedule(undefined)).toBe('Not scheduled')
    expect(formatSchedule(null)).toBe('Not scheduled')
    expect(formatSchedule([])).toBe('Not scheduled')
  })

  it('formats a recurring event with a singular unit', () => {
    const events = [{ type: 'recurring', enabled: true, interval: { field: 'day', value: 1 } }]
    expect(formatSchedule(events)).toBe('Every 1 day (enabled)')
  })

  it('pluralizes the unit when the interval value is not 1', () => {
    const events = [{ type: 'recurring', enabled: false, interval: { field: 'hour', value: 3 } }]
    expect(formatSchedule(events)).toBe('Every 3 hours (disabled)')
  })

  it('formats a one-time event', () => {
    const events = [{ type: 'once', enabled: true, starts: '2025-01-01' }]
    expect(formatSchedule(events)).toBe('Once at 2025-01-01 (enabled)')
  })

  it('joins multiple events with "; "', () => {
    const events = [
      { type: 'recurring', enabled: true, interval: { field: 'day', value: 1 } },
      { type: 'once', enabled: false, starts: '2025-06-19' },
    ]
    expect(formatSchedule(events)).toBe('Every 1 day (enabled); Once at 2025-06-19 (disabled)')
  })
})
