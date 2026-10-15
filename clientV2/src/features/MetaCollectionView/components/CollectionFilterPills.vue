<script setup>
import { computed } from 'vue'
import BreadcrumbFilter from '../../../components/common/BreadcrumbFilter.vue'
import { isActive } from '../../../shared/lib/columnFilters.js'
import MetaMetricsFilter from '../../CollectionMetrics/components/MetaMetricsFilter.vue'
import { useMetaCollectionFilter } from '../composables/useMetaCollectionFilter.js'

// Collections page filter shown after the breadcrumb.
const { collectionFilter, selectedCollectionIds, reset } = useMetaCollectionFilter()
const isFiltered = computed(() => isActive(collectionFilter.value))

// The picker emits a fresh empty array on mount; skip that no-op so the page's
// watchers on the ids do not refetch.
function setSelectedCollectionIds(ids) {
  if (ids.length || selectedCollectionIds.value.length) {
    selectedCollectionIds.value = ids
  }
}
</script>

<template>
  <BreadcrumbFilter
    :active="isFiltered"
    hint="Include or exclude collections. Applies to the metrics and every tab on this page."
    clear-label="Clear collection filter"
    @clear="reset"
  >
    <MetaMetricsFilter
      v-model="collectionFilter"
      @update:effective-collection-ids="setSelectedCollectionIds"
    />
  </BreadcrumbFilter>
</template>
