import { ref } from 'vue'
import { valuesFilter } from '../../../shared/lib/columnFilters.js'

// Collections page filter, shared by the breadcrumb picker (MenuBar) and the page.
// In memory only (not the URL or storage): a bookmarked exclude filter could only be
// resolved to ids after the full collection list loads, holding up the page's first
// fetches, and an include filter can run to MAX_SENT_IDS ids. Module state so the two
// can share it; the page resets it on unmount so each visit starts unfiltered and no
// stale collection ids are sent.
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
