/**
 * PrimeVue Tree nodes for the JSON Tree tab. Children are built lazily on
 * expand because a full report can hold tens of thousands of values.
 */

function valueType(value) {
  if (value === null) {
    return 'null'
  }
  if (Array.isArray(value)) {
    return 'array'
  }
  return typeof value
}

function createNode(label, value, path) {
  const type = valueType(value)
  const isContainer = type === 'object' || type === 'array'
  const size = isContainer ? Object.keys(value).length : 0
  return {
    key: path,
    label,
    leaf: !isContainer || size === 0,
    data: { value, type, size },
    ...(isContainer && size > 0 ? { children: undefined } : {}),
  }
}

/** Top-level nodes for a report object. */
export function buildJsonTreeNodes(data) {
  if (data === null || typeof data !== 'object') {
    return []
  }
  return Object.entries(data).map(([key, value]) => createNode(key, value, key))
}

/** Builds and attaches a node's children in place; returns them. */
export function buildChildNodes(node) {
  if (node.children) {
    return node.children
  }
  const { value } = node.data
  node.children = Object.entries(value).map(([key, childValue]) =>
    createNode(key, childValue, `${node.key}.${key}`),
  )
  return node.children
}

/** Display text for a leaf value ('' for expandable containers). */
export function leafDisplay(data) {
  switch (data.type) {
    case 'string':
      return JSON.stringify(data.value)
    case 'null':
      return 'null'
    case 'object':
    case 'array':
      return data.size === 0 ? (data.type === 'array' ? '[]' : '{}') : ''
    default:
      return String(data.value)
  }
}

/** Size badge for containers: {3} for objects, [5] for arrays. */
export function sizeBadge(data) {
  if (data.size === 0) {
    return ''
  }
  return data.type === 'array' ? `[${data.size}]` : `{${data.size}}`
}
