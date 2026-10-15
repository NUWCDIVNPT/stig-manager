import { ref } from 'vue'
import { valuesFilter } from '../../../shared/lib/columnFilters.js'

// Collections page filter, shared by the breadcrumb picker (MenuBar) and the page.
// In memory only (not the URL or storage): a saved exclude filter would load every
// collection first. Module state so the two can share it; the page resets it on
// unmount so each visit starts unfiltered and no stale collection ids are sent.
const collectionFilter = ref(valuesFilter())
// Collection ids the filter resolves to (set by MetaMetricsFilter); empty means all
const selectedCollectionIds = ref([])

function reset() {
  collectionFilter.value = valuesFilter()
  selectedCollectionIds.value = []
}

export function useMetaCollectionFilter() {
  return { collectionFilter, selectedCollectionIds, reset }
}
