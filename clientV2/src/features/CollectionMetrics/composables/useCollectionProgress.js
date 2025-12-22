import { computed, unref } from 'vue'
import { formatPercent } from '../../../shared/lib.js'

export function useCollectionProgress(metrics) {
  const stats = computed(() => {
    const m = unref(metrics)?.metrics
    if (!m) {
      return null
    }

    const assessments = m.assessments || 0
    const assessed = m.assessed || 0
    const saved = m.statuses?.saved || 0
    const otherResults = m.results?.other || 0
    const submitted = m.statuses?.submitted || 0
    const accepted = m.statuses?.accepted || 0
    const rejected = m.statuses?.rejected || 0

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
