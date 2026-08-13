/**
 * Row builders for the MySQL tab, mirroring the legacy client's container:
 * a tables grid plus Variables/Status key-value grids and a summary line.
 */

export function buildMysqlTableRows(mysql) {
  const rows = []
  const tables = mysql?.tables ?? {}
  for (const tableName in tables) {
    rows.push({ tableName, ...tables[tableName] })
  }
  return rows
}

/** Generic object -> [{ key, value }] rows for the key-value grids. */
export function buildKeyValueRows(obj) {
  const rows = []
  for (const key in obj ?? {}) {
    rows.push({ key, value: obj[key] })
  }
  return rows
}

/** Totals and version/uptime for the tables grid title. */
export function buildMysqlSummary(mysql) {
  let dataLength = 0
  let indexLength = 0
  const tables = mysql?.tables ?? {}
  for (const tableName in tables) {
    dataLength += tables[tableName].dataLength ?? 0
    indexLength += tables[tableName].indexLength ?? 0
  }
  return {
    dataLength,
    indexLength,
    version: mysql?.version ?? '',
    uptime: Number(mysql?.status?.Uptime ?? 0),
  }
}
