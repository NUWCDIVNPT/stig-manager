export const severityMap = { high: 1, medium: 2, low: 3 }

export const resultDisplayMap = {
  pass: 'NF',
  fail: 'O',
  notapplicable: 'NA',
  notchecked: 'NR',
  informational: 'I',
  unknown: 'NR',
  error: 'NR',
  notselected: 'NR',
  fixed: 'NF',
}

export function getResultDisplay(result) {
  if (!result) {
    return null
  }
  return resultDisplayMap[result] || 'NR'
}

export function getEngineDisplay(item) {
  if (item?.resultEngine) {
    if (item.resultEngine.overrides?.length) {
      return 'override'
    }
    return 'engine'
  }
  if (item?.result) {
    return 'manual'
  }
  return null
}

export function calculateChecklistStats(data) {
  if (!data?.length) {
    return null
  }

  const results = { pass: 0, fail: 0, notapplicable: 0, other: 0 }
  const engine = { manual: 0, engine: 0, override: 0 }
  const statuses = { saved: 0, submitted: 0, accepted: 0, rejected: 0 }

  for (const item of data) {
    if (item.result === 'pass') {
      results.pass++
    }
    else if (item.result === 'fail') {
      results.fail++
    }
    else if (item.result === 'notapplicable') {
      results.notapplicable++
    }
    else {
      results.other++
    }

    if (item.result) {
      if (!item.resultEngine) {
        engine.manual++
      }
      else if (item.resultEngine.overrides?.length) {
        engine.override++
      }
      else {
        engine.engine++
      }
    }

    const statusLabel = item.status?.label ?? item.status
    if (statusLabel && statuses[statusLabel] !== undefined) {
      statuses[statusLabel]++
    }
  }

  return { results, engine, statuses, total: data.length }
}
