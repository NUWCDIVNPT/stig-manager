import { computed, toValue } from 'vue'
import { EMPTY_METRICS } from '../emptyMetrics.js'
import { useCollectionCora } from './useCollectionCora.js'
import { useCollectionProgress } from './useCollectionProgress.js'
import { useCollectionStats } from './useCollectionStats.js'

/**
 * Derives the Progress, CORA and stats panel inputs from a metrics summary ref.
 *
 * Before the first response lands the panels are fed zeroed metrics so their
 * layout renders at full size; `pending` tells value-bearing panels to show
 * placeholders instead of the zeros. During refetches the previous response
 * stays in place so the panels never collapse.
 *
 * @param {import('vue').MaybeRefOrGetter<object|null>} metrics - /metrics/summary response, null until loaded
 */
export function useMetricsPanels(metrics) {
  const pending = computed(() => toValue(metrics) == null)
  const displayMetrics = computed(() => toValue(metrics) ?? EMPTY_METRICS)
  const { stats: progressStats } = useCollectionProgress(displayMetrics)
  const { coraData } = useCollectionCora(displayMetrics)
  const { inventory, findings, ages } = useCollectionStats(displayMetrics)

  return { pending, progressStats, coraData, inventory, findings, ages }
}
