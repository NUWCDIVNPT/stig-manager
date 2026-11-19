<script setup>
import { computed } from 'vue'
import BreadcrumbFilter from '../../../components/common/BreadcrumbFilter.vue'
import MetaMetricsFilter from '../../CollectionMetrics/components/MetaMetricsFilter.vue'
import { useMetaCollectionFilter } from '../composables/useMetaCollectionFilter.js'

// Collections page filter shown after the breadcrumb; reads and writes the route query.
const { selectedCollectionIds } = useMetaCollectionFilter()
const isFiltered = computed(() => selectedCollectionIds.value.length > 0)
</script>

<template>
  <BreadcrumbFilter
    :active="isFiltered"
    hint="Show only selected collections. Applies to the metrics and every tab on this page."
    clear-label="Clear collection filter"
    @clear="selectedCollectionIds = []"
  >
    <MetaMetricsFilter v-model="selectedCollectionIds" />
  </BreadcrumbFilter>
</template>
