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
  margin-bottom: 5px
}

.help-icon {
  color: #a1a1aa;
  cursor: pointer;
}
.help-icon:hover {
  color: #e4e4e7;
}

.cora-card {
  height: 200px; /* fix when we known what we want */
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
  font-size: 1rem;
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
  font-size: 1.1rem;
}

.cora-cat-count {
  font-weight: 600;
  font-size: 1.25rem;
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
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 4px;
}

.risk-score {
  font-size: 2.5rem;
  font-weight: 800;
  color: white;
  line-height: 1;
  margin-bottom: 4px;
}

.risk-rating {
  font-size: 1.1rem;
  font-weight: 600;
  text-transform: uppercase;
  color: white;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 2px 10px;
  border-radius: 20px;
}
</style>
