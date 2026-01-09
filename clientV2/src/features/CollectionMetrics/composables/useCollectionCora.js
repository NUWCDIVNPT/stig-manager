import { computed, unref } from 'vue'
import { calculateCora } from '../../../shared/lib'

export function useCollectionCora(metrics) {
  const coraData = computed(() => {
    return calculateCora(unref(metrics)) // unref because metrics is a ref and calculateCora expects an object not something.value?
  })

  return {
    coraData,
  }
}
