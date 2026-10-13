<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useLabelFilterQuery } from '../../shared/composables/useLabelFilterQuery.js'
import BreadcrumbFilter from './BreadcrumbFilter.vue'
import MetricsFilter from './MetricsFilter.vue'

// Collection label filter shown after the breadcrumb; reads and writes the route query.
const route = useRoute()
const collectionId = computed(() => route.params.collectionId)
const { selectedLabelNames } = useLabelFilterQuery()
const isFiltered = computed(() => selectedLabelNames.value.length > 0)

const hint = computed(() => {
  const scope = 'Applies to every collection tab and Collection Review.'
  if (!isFiltered.value) {
    return `Show only assets with selected labels. ${scope}`
  }
  const names = selectedLabelNames.value.map(name => name ?? 'No label').join(', ')
  return `Showing assets labeled: ${names}. ${scope}`
})
</script>

<template>
  <BreadcrumbFilter :active="isFiltered" :hint="hint" clear-label="Clear label filter" @clear="selectedLabelNames = []">
    <MetricsFilter v-model="selectedLabelNames" :collection-id="collectionId" />
  </BreadcrumbFilter>
</template>
