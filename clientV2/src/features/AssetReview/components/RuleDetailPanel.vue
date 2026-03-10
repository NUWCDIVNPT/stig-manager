<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import ReviewResources from './ReviewResources.vue'
import RuleInfo from './RuleInfo.vue'

defineProps({
  ruleContent: {
    type: Object,
    default: null,
  },
  isRuleLoading: {
    type: Boolean,
    default: false,
  },
  selectedChecklistItem: {
    type: Object,
    default: null,
  },
  currentReview: {
    type: Object,
    default: null,
  },
  reviewHistory: {
    type: Array,
    default: () => [],
  },
  selectedRuleId: {
    type: String,
    default: null,
  },
})
</script>

<template>
  <Splitter
    layout="vertical"
    :pt="{
      gutter: { style: 'background: var(--color-border-dark)' },
      root: { style: 'border: none; background: transparent' },
    }"
    style="height: 100%"
  >
    <SplitterPanel :size="60" :min-size="20">
      <RuleInfo
        :rule-content="ruleContent"
        :is-loading="isRuleLoading"
        :selected-checklist-item="selectedChecklistItem"
      />
    </SplitterPanel>
    <SplitterPanel :size="40" :min-size="20">
      <ReviewResources
        :current-review="currentReview"
        :review-history="reviewHistory"
        :selected-rule-id="selectedRuleId"
      />
    </SplitterPanel>
  </Splitter>
</template>
