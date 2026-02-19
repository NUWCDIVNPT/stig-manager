<script setup>
import { computed } from 'vue'

const props = defineProps({
  riskRating: {
    type: String,
    required: true,
    validator: value => ['Very High', 'High', 'Moderate', 'Low', 'Very Low'].includes(value),
  },
  weightedAvg: {
    type: Number,
    required: true,
  },
})

const riskClass = computed(() => {
  switch (props.riskRating) {
    case 'Very High': return 'sm-cora-risk-very-high'
    case 'High': return 'sm-cora-risk-high'
    case 'Moderate': return 'sm-cora-risk-moderate'
    case 'Low': return 'sm-cora-risk-low'
    case 'Very Low': return 'sm-cora-risk-very-low'
    default: return ''
  }
})

const formattedScore = computed(() => (props.weightedAvg * 100).toFixed(1))
</script>

<template>
  <div
    class="cora-pct-badge"
    :class="[riskClass]"
    :title="riskRating"
  >
    {{ formattedScore }}
  </div>
</template>

<style scoped>
.cora-pct-badge {
  border-radius: 5px;
  outline: #bbb solid 1px;
  outline-offset: -1px;
  width: 35px;
  font-weight: 400;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 20px;
}
</style>
