<script setup>
import Popover from 'primevue/popover'
import { ref, toRefs } from 'vue'
import CoraTooltip from './CoraTooltip.vue'

const props = defineProps({
  coraData: {
    type: Object,
    required: false,
    default: null,
  },
})

const { coraData } = toRefs(props)

// Popover stuff
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
</script>

<template>
  <div class="cora-card metric-card large">
    <div class="metric-header">
      <div class="title-container">
        <h2 class="metric-title">
          CORA
        </h2>
        <i
          v-if="coraData"
          class="pi pi-question-circle help-icon"
          @click="toggle"
        />
        <Popover ref="op">
          <CoraTooltip />
        </Popover>
      </div>
    </div>

    <div v-if="coraData" class="cora-content">
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
@import './metrics.css';

.metric-header {
  margin-bottom: 8px;
}

.help-icon {
  color: var(--color-text-dim);
  cursor: pointer;
}
.help-icon:hover {
  color: var(--color-text-primary);
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
  font-size: 0.8rem;
  text-transform: uppercase;
  color: var(--color-text-dim);
  margin: 0 0 3px 0;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.cora-row {
  display: flex;
  background-color: var(--color-background-subtle);
  border-radius: 5px;
  overflow: hidden;
  height: 30px;
}

.cora-bracket {
  width: 4px;
  height: 100%;
  flex-shrink: 0;
  border-top-left-radius: 5px;
  border-bottom-left-radius: 5px;
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
  padding: 0 10px;
}

.cora-cat-label {
  font-weight: 700;
  font-size: 0.95rem;
}

.cora-cat-count {
  font-weight: 600;
  font-size: 1rem;
  color: var(--color-text-bright);
}
.cora-risk-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  min-width: 110px;
  text-align: center;
}

.risk-label {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-text-bright);
  margin-bottom: 3px;
}

.risk-score {
  font-size: 1.9rem;
  font-weight: 800;
  color: var(--color-text-bright);
  line-height: 1;
  margin-bottom: 3px;
}

.risk-rating {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-text-bright);
  background-color: rgba(0, 0, 0, 0.2);
  padding: 2px 8px;
  border-radius: 10px;
}
</style>
