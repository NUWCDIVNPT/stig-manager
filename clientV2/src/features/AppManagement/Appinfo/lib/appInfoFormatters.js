const BINARY_BYTE_UNITS = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

/** Binary-prefixed byte sizes (KiB/MiB), matching the legacy AppInfo grids. */
export function formatBytesBinary(bytes, decimals = 2) {
  if (!+bytes) { return '0 Bytes' }
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${BINARY_BYTE_UNITS[i]}`
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
