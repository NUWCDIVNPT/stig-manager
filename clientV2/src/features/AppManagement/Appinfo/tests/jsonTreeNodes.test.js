import { describe, expect, it } from 'vitest'
import {
  buildChildNodes,
  buildJsonTreeNodes,
  leafDisplay,
  sizeBadge,
} from '../lib/adapters/jsonTreeNodes.js'

describe('buildJsonTreeNodes', () => {
  it('creates top-level nodes without materializing children', () => {
    const nodes = buildJsonTreeNodes({
      version: '1.6.15',
      collections: { 12: { name: 'A' } },
      empty: {},
    })

    expect(nodes).toHaveLength(3)
    expect(nodes[0]).toMatchObject({ key: 'version', label: 'version', leaf: true })
    expect(nodes[1]).toMatchObject({ key: 'collections', leaf: false, children: undefined })
    expect(nodes[2].leaf).toBe(true)
  })

  it('returns no nodes for a missing report', () => {
    expect(buildJsonTreeNodes(null)).toEqual([])
  })
})

describe('buildChildNodes', () => {
  it('materializes children lazily with dotted key paths', () => {
    const [node] = buildJsonTreeNodes({ requests: { totalRequests: 383, operationIds: {} } })

    const children = buildChildNodes(node)

    expect(children).toHaveLength(2)
    expect(children[0]).toMatchObject({ key: 'requests.totalRequests', leaf: true })
    expect(node.children).toBe(children)
    // Second call reuses the built children
    expect(buildChildNodes(node)).toBe(children)
  })

  it('indexes array items', () => {
    const [node] = buildJsonTreeNodes({ cpus: [{ model: 'Xeon' }, { model: 'Xeon' }] })

    const children = buildChildNodes(node)

    expect(children.map(c => c.label)).toEqual(['0', '1'])
    expect(children[0].key).toBe('cpus.0')
  })
})

describe('leafDisplay and sizeBadge', () => {
  it('renders typed values', () => {
    const [str, num, bool, nil, emptyObj, emptyArr] = buildJsonTreeNodes({
      s: 'text',
      n: 42,
      b: true,
      z: null,
      o: {},
      a: [],
    })

    expect(leafDisplay(str.data)).toBe('"text"')
    expect(leafDisplay(num.data)).toBe('42')
    expect(leafDisplay(bool.data)).toBe('true')
    expect(leafDisplay(nil.data)).toBe('null')
    expect(leafDisplay(emptyObj.data)).toBe('{}')
    expect(leafDisplay(emptyArr.data)).toBe('[]')
  })

  it('renders container size badges', () => {
    const [obj, arr] = buildJsonTreeNodes({ o: { a: 1, b: 2, c: 3 }, a: [1, 2, 3, 4, 5] })

    expect(sizeBadge(obj.data)).toBe('{3}')
    expect(sizeBadge(arr.data)).toBe('[5]')
  })
})
