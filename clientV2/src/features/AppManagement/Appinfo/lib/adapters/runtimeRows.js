/**
 * Row builders for the Node.js tab, mirroring the legacy client's container:
 * an Environment key-value grid plus CPU/Memory/OS grids and a summary line.
 */

export function buildCpuRows(cpus) {
  return (cpus ?? []).map((item, index) => ({ cpu: index, ...item }))
}

export function buildNodejsSummary(nodejs) {
  return {
    version: nodejs?.version ?? '',
    uptime: Number(nodejs?.uptime ?? 0),
  }
}
