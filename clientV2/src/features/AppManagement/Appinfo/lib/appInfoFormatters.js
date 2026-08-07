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

/** Bytes -> "1.23 MiB", matching the legacy client's formatBytes. */
export function formatBytes(bytes, decimals = 2) {
  if (!+bytes) {
    return '0 Bytes'
  }
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`
}
