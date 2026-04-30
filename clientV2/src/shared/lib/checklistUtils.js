import { ENGINE_TYPE, REVIEW_STATUS } from './reviewConstants.js'

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
      return ENGINE_TYPE.OVERRIDE
    }
    return ENGINE_TYPE.ENGINE
  }
  if (item?.result) {
    return ENGINE_TYPE.MANUAL
  }
  return null
}

export function calculateChecklistStats(data) {
  if (!data?.length) {
    return null
  }

  const results = { pass: 0, fail: 0, notapplicable: 0, other: 0 }
  const engine = { [ENGINE_TYPE.MANUAL]: 0, [ENGINE_TYPE.ENGINE]: 0, [ENGINE_TYPE.OVERRIDE]: 0 }
  const statuses = {
    [REVIEW_STATUS.SAVED]: 0,
    [REVIEW_STATUS.SUBMITTED]: 0,
    [REVIEW_STATUS.ACCEPTED]: 0,
    [REVIEW_STATUS.REJECTED]: 0,
  }

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
        engine[ENGINE_TYPE.MANUAL]++
      }
      else if (item.resultEngine.overrides?.length) {
        engine[ENGINE_TYPE.OVERRIDE]++
      }
      else {
        engine[ENGINE_TYPE.ENGINE]++
      }
    }

    const statusLabel = item.status?.label ?? item.status
    if (statusLabel && statuses[statusLabel] !== undefined) {
      statuses[statusLabel]++
    }
  }

  return { results, engine, statuses, total: data.length }
}

export function getRevisionInfo(revisionStr, revisionsArray) {
  if (!revisionStr) {
    return null
  }
  const match = revisionStr.match(/^V(\d+)R(\d+)$/)
  if (!match) {
    return { display: revisionStr }
  }
  const version = match[1]
  const release = match[2]
  const rev = revisionsArray?.find(r => r.revisionStr === revisionStr)
  const benchmarkDate = rev?.benchmarkDate
    ? new Date(rev.benchmarkDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : null
  return {
    display: benchmarkDate ? `Version ${version} Release ${release} (${benchmarkDate})` : `Version ${version} Release ${release}`,
    version,
    release,
    benchmarkDate,
  }
}
