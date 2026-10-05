<script setup>
import { toRefs } from 'vue'
import HelpIcon from '../../../components/common/HelpIcon.vue'
import { TOOLTIPS } from '../../../shared/lib/tooltips.js'

const props = defineProps({
  coraData: {
    type: Object,
    required: false,
    default: null,
  },
})

const { coraData } = toRefs(props)

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
</script>

<template>
  <div class="cora-card metric-card large">
    <div class="metric-header">
      <div class="title-container">
        <h2 class="metric-title">
          CORA
        </h2>
        <HelpIcon v-if="coraData" :content="TOOLTIPS.cora.html" tip-class="sm-cora-tip" />
      </div>
    </div>

    <div v-if="coraData" class="cora-content">
      <div class="breakdown-section">
        <h3 class="subsection-title">
          OPEN OR UNASSESSED
        </h3>

        <div class="cora-row sm-cat1-row">
          <div class="row-content">
            <span class="cora-cat-label">CAT 1</span>
            <span class="cora-cat-count">{{ coraData.catI.toFixed(0) }}</span>
          </div>
        </div>
        <div class="cora-row sm-cat2-row">
          <div class="row-content">
            <span class="cora-cat-label">CAT 2</span>
            <span class="cora-cat-count">{{ coraData.catII.toFixed(0) }}</span>
          </div>
        </div>
        <div class="cora-row sm-cat3-row">
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
@import './metrics.css';

.metric-header {
  margin-bottom: 8px;
}

.cora-content {
  display: flex;
  gap: 12px;
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
  font-size: var(--text-sm);
  text-transform: uppercase;
  color: var(--color-text-dim);
  margin: 0 0 3px 0;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.cora-row {
  display: flex;
  border-radius: 5px;
  border: 1px solid var(--color-border-default);
  color: var(--color-text-dark);
  height: 22px;
}

.title-container {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sm-cat1-row {
  background-color: var(--color-cat1);
}
.sm-cat2-row {
  background-color: var(--color-cat2);
}
.sm-cat3-row {
  background-color: var(--color-cat3);
}

.row-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  padding: 0 6px;
}

.cora-cat-label {
  font-weight: 600;
  font-size: var(--text-md);
}

.cora-cat-count {
  font-weight: 700;
  font-size: var(--text-md);
}
.cora-risk-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px solid var(--color-border-default);
  min-width: 110px;
  text-align: center;
}

.risk-label {
  font-size: var(--text-sm);
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 3px;
}

.risk-score {
  font-size: var(--text-display);
  font-weight: 800;
  line-height: 1;
  margin-bottom: 3px;
}

.risk-rating {
  font-size: var(--text-sm);
  font-weight: 800;
  text-transform: uppercase;
}
</style>
