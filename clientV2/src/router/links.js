import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLabelFilterQuery } from '../shared/composables/useLabelFilterQuery.js'
import { pickLabelFilterQuery } from '../shared/lib/labelFilters.js'

// `to` with the label filter added when it stays in the same collection and the target shows it
// (meta.labelFilter not false). `to.query` holds the target's own keys.
function withLabelFilter(router, to, fromCollectionId, labelQuery) {
  const target = router.resolve(to)
  const carriesLabelFilter = target.params.collectionId !== undefined
    && String(target.params.collectionId) === String(fromCollectionId)
    && target.meta.labelFilter !== false
  return { ...to, query: { ...(carriesLabelFilter ? labelQuery : {}), ...to.query } }
}

// Location for `to` from the current route
export function linkTo(router, to) {
  const from = router.currentRoute.value
  return withLabelFilter(router, to, from.params.collectionId, pickLabelFilterQuery(from.query))
}

// linkTo for links built per grid row: depends only on the collection and label filter,
// so a selection change in the URL doesn't re-render every row's link
export function useLinkTo() {
  const router = useRouter()
  const route = useRoute()
  const collectionId = computed(() => route.params.collectionId)
  const { labelFilterParams } = useLabelFilterQuery()
  return to => withLabelFilter(router, to, collectionId.value, labelFilterParams.value)
}
