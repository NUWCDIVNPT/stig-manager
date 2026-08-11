/** Locale-formatted number for report cells; nullish/non-numbers render as '0'. */
export function formatNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n.toLocaleString() : '0'
}

/** Seconds -> "1d 2h 3m 4s", matching the legacy client's uptimeString. */
export function formatUptime(uptime) {
  const days = Math.floor(uptime / 86400)
  uptime %= 86400
  const hours = Math.floor(uptime / 3600)
  uptime %= 3600
  const minutes = Math.floor(uptime / 60)
  const seconds = Math.floor(uptime % 60)
  return `${days}d ${hours}h ${minutes}m ${seconds}s`
}
