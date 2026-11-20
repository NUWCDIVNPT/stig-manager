<script setup>
import botIcon from '../../assets/bot2.svg'
import overrideIcon from '../../assets/override2.svg'
import userIcon from '../../assets/user.svg'
import { severityMap } from '../../shared/lib/checklistUtils.js'
import CatBadge from './CatBadge.vue'
import ResultBadge from './ResultBadge.vue'
import StatusBadge from './StatusBadge.vue'

// A Filter button value drawn as its checklist grid cell. Columns take it through
// REVIEW_FILTER_OPTIONS (reviewFilterOptions.js).
defineProps({
  // { value, name } from the Filter button
  option: {
    type: Object,
    required: true,
  },
  kind: {
    type: String,
    required: true,
    validator: v => ['cat', 'result', 'engine', 'status'].includes(v),
  },
})

const CAT_NUMBERS = new Set(Object.values(severityMap).map(String))
const RESULT_NAMES = { O: 'Open', NF: 'Not a Finding', NA: 'Not Applicable', NR: 'Not Reviewed', I: 'Informational' }
const ENGINE_ICONS = { engine: botIcon, override: overrideIcon, manual: userIcon }
const STATUSES = new Set(['saved', 'submitted', 'accepted', 'rejected'])

function catNumber(value) {
  const n = String(value).replace('CAT ', '')
  return CAT_NUMBERS.has(n) ? n : null
}
</script>

<template>
  <span class="review-filter-option" :class="{ 'review-filter-option--empty': option.value === '' }">
    <CatBadge v-if="kind === 'cat' && catNumber(option.value)" :category="catNumber(option.value)" variant="label" />
    <template v-else-if="kind === 'result' && RESULT_NAMES[option.value]">
      <ResultBadge :status="option.value" />
      <span>{{ RESULT_NAMES[option.value] }}</span>
    </template>
    <template v-else-if="kind === 'engine' && ENGINE_ICONS[option.value.toLowerCase()]">
      <img :src="ENGINE_ICONS[option.value.toLowerCase()]" alt="" class="review-filter-option__icon">
      <span>{{ option.name }}</span>
    </template>
    <template v-else-if="kind === 'status' && STATUSES.has(option.value.toLowerCase())">
      <StatusBadge :status="option.value" />
      <span>{{ option.name }}</span>
    </template>
    <span v-else>{{ option.name }}</span>
  </span>
</template>

<style scoped>
.review-filter-option {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.review-filter-option--empty {
  font-style: italic;
  color: var(--color-text-dim);
}

.review-filter-option__icon {
  width: 1.35rem;
  height: 1.35rem;
}
</style>
