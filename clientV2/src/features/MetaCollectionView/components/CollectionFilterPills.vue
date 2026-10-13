<script setup>
import { computed } from 'vue'
import BreadcrumbFilter from '../../../components/common/BreadcrumbFilter.vue'
import { isActive, valuesFilter } from '../../../shared/lib/columnFilters.js'
import MetaMetricsFilter from '../../CollectionMetrics/components/MetaMetricsFilter.vue'
import { useMetaCollectionFilter } from '../composables/useMetaCollectionFilter.js'

// Collections page filter shown after the breadcrumb.
const { collectionFilter, selectedCollectionIds } = useMetaCollectionFilter()
const isFiltered = computed(() => isActive(collectionFilter.value))
</script>

<template>
  <BreadcrumbFilter
    :active="isFiltered"
    hint="Include or exclude collections. Applies to the metrics and every tab on this page."
    clear-label="Clear collection filter"
    @clear="collectionFilter = valuesFilter()"
  >
    <MetaMetricsFilter
      v-model="collectionFilter"
      @update:effective-collection-ids="selectedCollectionIds = $event"
    />
  </BreadcrumbFilter>
</template>
