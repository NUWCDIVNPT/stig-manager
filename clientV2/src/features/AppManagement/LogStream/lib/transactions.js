// Pure helpers for the "API Transactions" grid. Mirrors the legacy client's
// SM.LogStream transaction handling: deriving a browser name from a user-agent,
// building a grid row from a `transaction` frame, and pairing separate
// `request`/`response` frames into one row. Kept DOM/Vue-free for unit testing.

const BROWSERS = [
  { name: 'Chrome', regex: /Chrome\/([0-9.]+$)/ },
  { name: 'Firefox', regex: /Firefox\/([0-9.]+$)/ },
  // A space after the version keeps this from overlapping the trailing .*Safari
  // (which the linter flags as super-linear backtracking).
  { name: 'Safari', regex: /Version\/([0-9.]+) .*Safari/ },
  { name: 'Edge', regex: /Edg\/([0-9.]+$)/ },
]

// User-agent string to a short "Name/version", matching SM.LogStream.GetBrowser.
export function getBrowser(userAgent) {
  if (!userAgent) {
    return 'Unknown/0'
  }
  for (const browser of BROWSERS) {
    const match = userAgent.match(browser.regex)
    if (match) {
      return `${browser.name}/${match[1]}`
    }
  }
  return 'Unknown/0'
}

// Complete row from a single `transaction` frame (request+response merged).
export function transactionRow(logObj) {
  const data = logObj.data
  return {
    requestId: data.request.requestId,
    timestamp: logObj.date,
    source: data.request.source,
    user: data.request.headers?.accessToken?.preferred_username,
    browser: getBrowser(data.request.headers['user-agent']),
    url: `${data.request.method} ${data.request.url}`,
    status: `${data.response.status}`,
    length: data.response.headers?.['content-length'],
    duration: data.operationStats.durationMs,
    operationId: data.operationStats.operationId,
  }
}

// Partial row from a `request` frame, held until its `response` arrives.
export function requestRow(logObj) {
  const data = logObj.data
  return {
    requestId: data.requestId,
    timestamp: logObj.date,
    source: data.source,
    user: data.headers?.accessToken?.preferred_username,
    browser: getBrowser(data.headers['user-agent']),
    url: `${data.method} ${data.url}`,
  }
}

// Merges a `response` frame into its pending request row, returning a new row.
export function applyResponse(row, logObj) {
  const data = logObj.data
  return {
    ...row,
    status: `${data.status}`,
    length: data.headers?.['content-length'],
    duration: data.operationStats.durationMs,
    operationId: data.operationStats.operationId,
  }
}

// CSS class for the colored HTTP-status badge, matching the legacy renderer.
export function statusClass(status) {
  const code = Number(status)
  if (code >= 200 && code <= 299) {
    return 'sm-http-status-200'
  }
  if (code >= 300 && code <= 399) {
    return 'sm-http-status-300'
  }
  if (code >= 400 && code <= 499) {
    return 'sm-http-status-400'
  }
  if (code >= 500 && code <= 599) {
    return 'sm-http-status-500'
  }
  return ''
}
