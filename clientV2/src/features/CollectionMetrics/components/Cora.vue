<script setup>
import Popover from 'primevue/popover'
import { computed, defineProps, ref, toRefs } from 'vue'
import CoraTooltip from './CoraTooltip.vue'

const props = defineProps({
  metrics: {
    type: Object,
    required: false,
    default: null,
  },
})

const { metrics } = toRefs(props)

// Popover Logic
const op = ref()
const toggle = (event) => {
  op.value.toggle(event)
}

function getRiskClass(riskRating) {
  switch (riskRating) {
    case 'Very High':
      return 'sm-cora-risk-very-high'
    case 'High':
      return 'sm-cora-risk-high'
    case 'Moderate':
      return 'sm-cora-risk-moderate'
    case 'Low':
      return 'sm-cora-risk-low'
    case 'Very Low':
      return 'sm-cora-risk-very-low'
    default:
      return ''
  }
}

function calculateCoraRiskRating(mMetrics) {
  if (!mMetrics) {
    return null
  }

  const metrics = mMetrics.metrics || mMetrics

  const weights = {
    catI: 10,
    catII: 4,
    catIII: 1,
  }

  const assessments = metrics.assessmentsBySeverity || { high: 0, medium: 0, low: 0 }
  const assessed = metrics.assessedBySeverity || { high: 0, medium: 0, low: 0 }
  const findings = metrics.findings || { high: 0, medium: 0, low: 0 }

  // CAT I (High)
  const assignedHigh = assessments.high || 0
  const assessedHigh = assessed.high || 0
  const findingsHigh = findings.high || 0
  const rawCatI = assignedHigh > 0 ? ((assignedHigh - assessedHigh) + findingsHigh) / assignedHigh : 0

  // CAT II (Medium)
  const assignedMed = assessments.medium || 0
  const assessedMed = assessed.medium || 0
  const findingsMed = findings.medium || 0
  const rawCatII = assignedMed > 0 ? ((assignedMed - assessedMed) + findingsMed) / assignedMed : 0

  // CAT III (Low)
  const assignedLow = assessments.low || 0
  const assessedLow = assessed.low || 0
  const findingsLow = findings.low || 0
  const rawCatIII = assignedLow > 0 ? ((assignedLow - assessedLow) + findingsLow) / assignedLow : 0

  let totalWeight = 0
  let totalWeightedRisk = 0

  if (assignedHigh > 0) {
    totalWeightedRisk += rawCatI * weights.catI
    totalWeight += weights.catI
  }

  if (assignedMed > 0) {
    totalWeightedRisk += rawCatII * weights.catII
    totalWeight += weights.catII
  }

  if (assignedLow > 0) {
    totalWeightedRisk += rawCatIII * weights.catIII
    totalWeight += weights.catIII
  }

  const weightedAvg = totalWeight > 0 ? totalWeightedRisk / totalWeight : 0

  const weightedCatI = totalWeight > 0 && assignedHigh > 0 ? (rawCatI * weights.catI) / totalWeight : 0
  const weightedCatII = totalWeight > 0 && assignedMed > 0 ? (rawCatII * weights.catII) / totalWeight : 0
  const weightedCatIII = totalWeight > 0 && assignedLow > 0 ? (rawCatIII * weights.catIII) / totalWeight : 0

  let riskRating = ''
  const isVeryLowRisk = rawCatI === 0 && rawCatII === 0 && rawCatIII === 0
  const isLowRisk = rawCatI === 0 && rawCatII < 0.05 && rawCatIII < 0.05

  if (isVeryLowRisk) {
    riskRating = 'Very Low'
  }
  else if (isLowRisk) {
    riskRating = 'Low'
  }
  else if (weightedAvg >= 0.2) {
    riskRating = 'Very High'
  }
  else if (weightedAvg >= 0.1) {
    riskRating = 'High'
  }
  else if (weightedAvg > 0) {
    riskRating = 'Moderate'
  }

  return {
    weightedAvg: weightedAvg * 100,
    riskRating,
    catI: (assignedHigh - assessedHigh) + findingsHigh,
    catII: (assignedMed - assessedMed) + findingsMed,
    catIII: (assignedLow - assessedLow) + findingsLow,
    percentages: {
      catI: rawCatI,
      catII: rawCatII,
      catIII: rawCatIII,
    },
    weightedContributions: {
      catI: weightedCatI,
      catII: weightedCatII,
      catIII: weightedCatIII,
    },
  }
}

const coraData = computed(() => {
  if (!metrics.value) {
    return null
  }
  return calculateCoraRiskRating(metrics.value)
})
</script>

<template>
  <div v-if="coraData" class="cora-card">
    <div class="header">
      <div class="title-container">
        <h2 class="title">
          CORA
        </h2>
        <i
          class="pi pi-question-circle help-icon"
          @click="toggle"
        />
        <Popover ref="op">
          <CoraTooltip />
        </Popover>
      </div>
    </div>

    <div class="cora-content">
      <div class="breakdown-section">
        <h3 class="subsection-title">
          OPEN OR UNASSESSED
        </h3>

        <div class="cora-row">
          <div class="cora-bracket sm-cat1-bracket" />
          <div class="row-content">
            <span class="cora-cat-label">CAT 1</span>
            <span class="cora-cat-count">{{ coraData.catI.toFixed(0) }}</span>
          </div>
        </div>
        <div class="cora-row">
          <div class="cora-bracket sm-cat2-bracket" />
          <div class="row-content">
            <span class="cora-cat-label">CAT 2</span>
            <span class="cora-cat-count">{{ coraData.catII.toFixed(0) }}</span>
          </div>
        </div>
        <div class="cora-row">
          <div class="cora-bracket sm-cat3-bracket" />
          <div class="row-content">
            <span class="cora-cat-label">CAT 3</span>
            <span class="cora-cat-count">{{ coraData.catIII.toFixed(0) }}</span>
          </div>
        </div>
      </div>

      <div class="cora-risk-card" :class="getRiskClass(coraData.riskRating)">
        <div class="risk-label">
          CORA RISK
        </div>
        <div class="risk-score">
          {{ coraData.weightedAvg.toFixed(1) }}%
        </div>
        <div class="risk-rating">
          {{ coraData.riskRating.toUpperCase() }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #e4e4e7;
}

.help-icon {
  font-size: 1rem;
  color: #a1a1aa;
  cursor: pointer;
}
.help-icon:hover {
  color: #e4e4e7;
}

.cora-card {
  background-color: #18181b;
  color: #e4e4e7;
  border-radius: 20px;
  padding: 15px;
  width: 100%;
  max-width: 450px;
  min-width: 350px;
  height: 200px;
  display: flex;
  flex-direction: column;
}

.sm-cora-container {
  display: flex;
  justify-content: space-evenly;
}

.cora-content {
  display: flex;
  gap: 15px;
  align-items: stretch;
  flex: 1;
  overflow: hidden;
}

.breakdown-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  justify-content: center;
}

.subsection-title {
  font-size: 11px;
  text-transform: uppercase;
  color: #a1a1aa;
  margin: 0 0 4px 0;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.cora-row {
  display: flex;
  background-color: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  overflow: hidden;
  height: 32px;
}

.cora-bracket {
  width: 4px;
  height: 100%;
  flex-shrink: 0;
  border-top-left-radius: 6px;
  border-bottom-left-radius: 6px;
}

.title-container {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sm-cat1-bracket {
  background-color: var(--color-cat1);
}
.sm-cat2-bracket {
  background-color: var(--color-cat2);
}
.sm-cat3-bracket {
  background-color: var(--color-cat3);
}

.row-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  padding: 0 12px;
}

.cora-cat-label {
  font-weight: 700;
  font-size: 12px;
}

.cora-cat-count {
  font-weight: 700;
  font-size: 14px;
  color: white;
}

.cora-risk-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  min-width: 130px;
  text-align: center;
}

.risk-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 4px;
}

.risk-score {
  font-size: 28px;
  font-weight: 800;
  color: white;
  line-height: 1;
  margin-bottom: 4px;
}

.risk-rating {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: white;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 2px 10px;
  border-radius: 20px;
}

/* Dynamic Colors for Risk Card - handled in style.css */
</style>
