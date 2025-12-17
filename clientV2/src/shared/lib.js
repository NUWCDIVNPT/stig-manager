export function formatAge(dateString) {
  if (!dateString) {
    return '0 d'
  }
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return `${diffDays} d`
}

export function formatPercent(val, total) {
  if (!total) {
    return '0%'
  }
  const pct = (val / total) * 100
  if (pct > 0 && pct < 1) {
    return '<1%'
  }
  if (pct > 99 && pct < 100) {
    return '>99%'
  }
  return `${pct.toFixed(1)}%`
}
