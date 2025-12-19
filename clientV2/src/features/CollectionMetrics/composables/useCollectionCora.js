import { computed, unref } from 'vue'
import { calculateCora } from '../../../shared/lib'

export function useCollectionCora(metrics) {
  const coraData = computed(() => {
    return calculateCora(unref(metrics))
  })

  return {
    coraData,
  }
}
