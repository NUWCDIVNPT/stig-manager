import { describe, expect, it } from 'vitest'
import {
  buildKeyValueRows,
  buildMysqlSummary,
  buildMysqlTableRows,
} from '../lib/adapters/mysqlRows.js'
import { buildCpuRows, buildNodejsSummary } from '../lib/adapters/runtimeRows.js'
import { formatUptime } from '../lib/appInfoFormatters.js'

const mysql = {
  version: '8.0.36',
  tables: {
    asset: { rowCount: 100, dataLength: 16384, indexLength: 32768, tableCollation: 'utf8mb4_0900_ai_ci' },
    review: { rowCount: 5000, dataLength: 1048576, indexLength: 524288 },
  },
  variables: { innodb_buffer_pool_size: 134217728, version_compile_os: 'Linux' },
  status: { Uptime: 90061, Threads_connected: 3 },
}

describe('buildMysqlTableRows', () => {
  it('flattens keyed tables', () => {
    const rows = buildMysqlTableRows(mysql)

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({ tableName: 'asset', rowCount: 100 })
  })

  it('returns no rows for a missing section', () => {
    expect(buildMysqlTableRows(null)).toEqual([])
  })
})

describe('buildMysqlSummary', () => {
  it('totals lengths and extracts version and uptime', () => {
    expect(buildMysqlSummary(mysql)).toEqual({
      dataLength: 16384 + 1048576,
      indexLength: 32768 + 524288,
      version: '8.0.36',
      uptime: 90061,
    })
  })
})

describe('buildKeyValueRows', () => {
  it('maps an object to key/value rows', () => {
    expect(buildKeyValueRows({ a: 1, b: 'two' })).toEqual([
      { key: 'a', value: 1 },
      { key: 'b', value: 'two' },
    ])
  })

  it('returns no rows for a missing object', () => {
    expect(buildKeyValueRows(null)).toEqual([])
  })
})

describe('buildCpuRows', () => {
  it('adds the cpu index to each entry', () => {
    const rows = buildCpuRows([{ model: 'Xeon', speed: 2400 }, { model: 'Xeon', speed: 2400 }])

    expect(rows).toEqual([
      { cpu: 0, model: 'Xeon', speed: 2400 },
      { cpu: 1, model: 'Xeon', speed: 2400 },
    ])
  })

  it('returns no rows for a missing array', () => {
    expect(buildCpuRows(null)).toEqual([])
  })
})

describe('buildNodejsSummary', () => {
  it('extracts version and uptime', () => {
    expect(buildNodejsSummary({ version: 'v20.11.1', uptime: 3661 })).toEqual({
      version: 'v20.11.1',
      uptime: 3661,
    })
  })
})

describe('formatUptime', () => {
  it('renders days/hours/minutes/seconds', () => {
    expect(formatUptime(90061)).toBe('1d 1h 1m 1s')
    expect(formatUptime(0)).toBe('0d 0h 0m 0s')
  })
})
