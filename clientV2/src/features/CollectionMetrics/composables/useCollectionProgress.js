import { computed, unref } from 'vue'
import { formatPercent } from '../../../shared/lib.js'

export function useCollectionProgress(metrics) {
  const stats = computed(() => {
    const m = unref(metrics)
    if (!m) {
      return null
    }

    console.log(m)
    const assessments = m.metrics.assessments
    const assessed = m.metrics.assessed
    const saved = m.metrics.statuses?.saved
    const otherResults = m.metrics.results?.other
    const submitted = m.metrics.statuses?.submitted
    const accepted = m.metrics.statuses?.accepted
    const rejected = m.metrics.statuses?.rejected

    // Calculate counts
    const counts = {
      unassessed: assessments - assessed,
      assessed: saved - otherResults,
      submitted,
      accepted,
      rejected,
      total: assessments,
    }

    // Calculate raw percentages
    const percentages = {
      overall: assessments ? (assessed / assessments) * 100 : 0,
    }
    // Calculate formatted strings
    const formatted = {
      overall: assessments ? (assessed / assessments * 100).toFixed(1) : '0.0',
      assessed: formatPercent(counts.assessed, counts.total),
      submitted: formatPercent(counts.submitted, counts.total),
      accepted: formatPercent(counts.accepted, counts.total),
      rejected: formatPercent(counts.rejected, counts.total),
    }

    return {
      counts,
      percentages,
      formatted,
    }
  })

  return {
    stats,
  }
}
