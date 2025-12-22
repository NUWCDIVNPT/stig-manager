<script setup>
import Chart from 'primevue/chart'
import { computed, inject, ref } from 'vue'
import { useCollectionMetricsSummaryQuery } from '../queries/metricsQueries.js'

const props = defineProps({
  collectionId: {
    type: [String, Number],
    required: true,
  },
})

const oidcWorker = inject('worker')
const token = computed(() => oidcWorker.token)

const { metrics, isLoading, errorMessage } = useCollectionMetricsSummaryQuery({
  collectionId: computed(() => props.collectionId),
  token,
})

// Chart Data
const chartData = computed(() => {
  if (!metrics.value?.metrics) { return null }

  const assessed = metrics.value.metrics.assessed || 0
  const total = metrics.value.metrics.assessments || 0
  const unassessed = total - assessed

  return {
    labels: ['Assessed', 'Unassessed'],
    datasets: [
      {
        data: [assessed, unassessed],
        backgroundColor: ['#3b82f6', '#3a3d40'],
        hoverBackgroundColor: ['#2563eb', '#27272a'],
        borderWidth: 0,
      },
    ],
  }
})

const chartOptions = ref({
  cutout: '70%',
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      enabled: true,
    },
  },
  maintainAspectRatio: false,
  responsive: true,
})

// Computed properties for the UI
const assessedPercent = computed(() => {
  if (!metrics.value?.metrics?.assessments) { return 0 }
  const total = metrics.value.metrics.assessments
  const assessed = metrics.value.metrics.assessed
  return Math.round((assessed / total) * 100)
})

const coraRisk = computed(() => {
  // Placeholder logic, actual calculation depends on business rules
  // Assuming 'Very High' if any CAT 1 findings for now, or just using a static value if not provided
  // The JSON provided doesn't have a direct 'coraRisk' field, so I'll derive or placeholder it.
  // User screenshot shows "100.0% Very High".
  // I'll calculate a simple risk score based on findings.
  const findings = metrics.value?.metrics?.findings || {}
  const total = (findings.high || 0) + (findings.medium || 0) + (findings.low || 0)
  if (total === 0) { return { score: '0%', label: 'Low', class: 'risk-low' } }

  if (findings.high > 0) { return { score: '100%', label: 'Very High', class: 'risk-critical' } }
  if (findings.medium > 0) { return { score: '75%', label: 'High', class: 'risk-high' } }
  return { score: '25%', label: 'Medium', class: 'risk-medium' }
})
</script>

<template>
  <div class="data-pane">
    <div v-if="isLoading" class="loading-state">
      Loading metrics...
    </div>
    <div v-else-if="errorMessage" class="error-state">
      {{ errorMessage }}
    </div>
    <div v-else-if="metrics" class="dashboard-grid">
      <!-- Progress Card -->
      <div class="card progress-card">
        <h3 class="card-title">
          Progress
        </h3>
        <div class="donut-container">
          <div class="chart-wrapper">
            <Chart type="doughnut" :data="chartData" :options="chartOptions" class="h-full w-full" />
            <div class="donut-center-text">
              <div class="donut-value">
                {{ assessedPercent }}%
              </div>
              <div class="donut-label">
                Assessed
              </div>
            </div>
          </div>
          <div class="legend">
            <div class="legend-item">
              <span class="dot dot-blue" />
              <span>Assessed: {{ metrics.metrics.assessed }}</span>
            </div>
            <div class="legend-item">
              <span class="dot dot-gray" />
              <span>Total: {{ metrics.metrics.assessments }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- CORA / Risk Card -->
      <div class="card risk-card">
        <h3 class="card-title">
          CORA Risk
        </h3>
        <div class="risk-content">
          <div class="risk-badge" :class="coraRisk.class">
            <div class="risk-score">
              {{ coraRisk.score }}
            </div>
            <div class="risk-label">
              {{ coraRisk.label }}
            </div>
          </div>
          <div class="risk-breakdown">
            <div class="stat-row">
              <span class="cat-label cat-1">CAT 1</span>
              <span class="stat-value">{{ metrics.metrics.findings.high || 0 }}</span>
            </div>
            <div class="stat-row">
              <span class="cat-label cat-2">CAT 2</span>
              <span class="stat-value">{{ metrics.metrics.findings.medium || 0 }}</span>
            </div>
            <div class="stat-row">
              <span class="cat-label cat-3">CAT 3</span>
              <span class="stat-value">{{ metrics.metrics.findings.low || 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Inventory Card -->
      <div class="card inventory-card">
        <h3 class="card-title">
          Inventory
        </h3>
        <div class="inventory-grid">
          <div class="stat-box">
            <div class="stat-number">
              {{ metrics.assets }}
            </div>
            <div class="stat-label">
              Assets
            </div>
          </div>
          <div class="stat-box">
            <div class="stat-number">
              {{ metrics.stigs }}
            </div>
            <div class="stat-label">
              STIGs
            </div>
          </div>
          <div class="stat-box">
            <div class="stat-number">
              {{ metrics.checklists }}
            </div>
            <div class="stat-label">
              Checklists
            </div>
          </div>
        </div>
      </div>

      <!-- Findings Card -->
      <div class="card findings-card">
        <h3 class="card-title">
          Findings
        </h3>
        <div class="findings-grid">
          <div class="finding-box high">
            <div class="finding-count">
              {{ metrics.metrics.findings.high || 0 }}
            </div>
            <div class="finding-label">
              CAT 1
            </div>
          </div>
          <div class="finding-box medium">
            <div class="finding-count">
              {{ metrics.metrics.findings.medium || 0 }}
            </div>
            <div class="finding-label">
              CAT 2
            </div>
          </div>
          <div class="finding-box low">
            <div class="finding-count">
              {{ metrics.metrics.findings.low || 0 }}
            </div>
            <div class="finding-label">
              CAT 3
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.data-pane {
  height: 100%;
  overflow-y: auto;
  padding: 0.5rem;
  background-color: #18181b;
  color: #e4e4e7;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 0.5rem;
  height: 100%;
}

.card {
  background-color: #1f1f1f;
  border: 1px solid #3a3d40;
  border-radius: 6px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  height: 180px;
  overflow: hidden;
}

.card-title {
  margin: 0 0 0.5rem 0;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #a6adba;
  font-weight: 600;
}

/* Progress Card - More Compact */
.progress-card {
  flex-shrink: 0;
}

.donut-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.25rem 0;
}

.chart-wrapper {
  position: relative;
  height: 100px;
  width: 100px;
  flex-shrink: 0;
}

.donut-center-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}

.donut-value {
  font-size: 1rem;
  font-weight: 700;
  color: #3b82f6;
  line-height: 1;
}

.donut-label {
  font-size: 0.55rem;
  color: #a6adba;
}

.legend {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.7rem;
  flex: 1;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-blue { background-color: #3b82f6; }
.dot-gray { background-color: #3a3d40; }

/* Risk Card */
.risk-card {
  flex-shrink: 0;
}

.risk-content {
  display: flex;
  align-items: stretch;
  gap: 0.5rem;
}

.risk-badge {
  flex: 1;
  padding: 0.75rem 0.5rem;
  border-radius: 6px;
  text-align: center;
  background-color: #3a3d40;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.risk-critical { background-color: rgba(241, 105, 105, 0.2); color: #f16969; border: 1px solid #f16969; }
.risk-high { background-color: rgba(255, 203, 87, 0.2); color: #ffcb57; border: 1px solid #ffcb57; }
.risk-medium { background-color: rgba(59, 130, 246, 0.2); color: #3b82f6; border: 1px solid #3b82f6; }
.risk-low { background-color: rgba(92, 209, 139, 0.2); color: #5cd18b; border: 1px solid #5cd18b; }

.risk-score {
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1;
}

.risk-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  font-weight: 600;
  margin-top: 0.25rem;
}

.risk-breakdown {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  justify-content: center;
  min-width: 70px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  align-items: center;
  gap: 0.5rem;
}

.cat-label {
  padding: 0.1rem 0.25rem;
  border-radius: 3px;
  font-size: 0.6rem;
  font-weight: 700;
  color: #111;
  flex-shrink: 0;
}

.stat-value {
  font-weight: 600;
}

.cat-1 { background-color: #f16969; }
.cat-2 { background-color: #ffcb57; }
.cat-3 { background-color: #a6adba; }

/* Inventory Card */
.inventory-card {
  flex-shrink: 0;
}

.inventory-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.4rem;
}

.stat-box {
  background-color: #d4a574;
  padding: 0.5rem 0.3rem;
  border-radius: 4px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.stat-number {
  font-size: 1.1rem;
  font-weight: 700;
  color: #111;
  line-height: 1;
}

.stat-label {
  font-size: 0.65rem;
  color: #111;
  margin-top: 0.2rem;
  font-weight: 600;
}

/* Findings Card */
.findings-card {
  flex-shrink: 0;
}

.findings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.4rem;
}

.finding-box {
  padding: 0.5rem 0.3rem;
  border-radius: 4px;
  text-align: center;
  color: #111;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.finding-box.high { background-color: #f16969; }
.finding-box.medium { background-color: #ffcb57; }
.finding-box.low { background-color: #a6adba; }

.finding-count {
  font-size: 1.1rem;
  font-weight: 800;
  line-height: 1;
}

.finding-label {
  font-size: 0.65rem;
  font-weight: 600;
  margin-top: 0.2rem;
}

.loading-state, .error-state {
  padding: 2rem;
  text-align: center;
  color: #a6adba;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-state {
  color: #f16969;
}
</style>
