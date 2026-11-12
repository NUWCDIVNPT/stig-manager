/**
 * Format a task's schedule events into a human-readable summary, e.g.
 * "Every 1 day (disabled); Once at 2025-01-01 (enabled)" or "Not scheduled".
 */
export function formatSchedule(events) {
  if (!events || events.length === 0) {
    return 'Not scheduled'
  }
  return events.map((event) => {
    const status = event.enabled ? 'enabled' : 'disabled'
    if (event.type === 'recurring') {
      const { field, value } = event.interval
      const unit = Number(value) === 1 ? field : `${field}s`
      return `Every ${value} ${unit} (${status})`
    }
    return `Once at ${event.starts} (${status})`
  }).join('; ')
}
