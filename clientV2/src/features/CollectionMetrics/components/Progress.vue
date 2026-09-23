<script setup>
import Chart from 'primevue/chart'
import { computed } from 'vue'

const props = defineProps({
  stats: {
    type: Object,
    required: false,
    default: null,
  },
})

const colors = {
  unassessed: 'var(--metrics-status-chart-unassessed)',
  assessed: 'var(--metrics-status-chart-assessed)',
  submitted: 'var(--metrics-status-chart-submitted)',
  accepted: 'var(--metrics-status-chart-accepted)',
  rejected: 'var(--metrics-status-chart-rejected)',
  text: 'var(--color-text-primary)',
}

// Helper to resolve CSS variables for Chart.js (Canvas) which doesn't support var()
const resolveColor = (colorVar) => {
  if (!colorVar || !colorVar.startsWith('var(')) {
    return colorVar
  }
  const varName = colorVar.match(/var\(([^)]+)\)/)?.[1]
  if (!varName) {
    return colorVar
  }
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
}

const getPct = (val) => {
  if (!props.stats || !props.stats.counts?.total) {
    return 0
  }
  return (val / props.stats.counts.total) * 100
}

const legendRows = computed(() => {
  if (!props.stats) {
    return []
  }
  const c = props.stats.counts
  return [
    { label: 'Unassessed', value: c.unassessed, color: colors.unassessed },
    { label: 'Assessed', value: c.assessed, color: colors.assessed },
    { label: 'Submitted', value: c.submitted, color: colors.submitted },
    { label: 'Accepted', value: c.accepted, color: colors.accepted },
    { label: 'Rejected', value: c.rejected, color: colors.rejected },
  ]
})

const statRows = computed(() => {
  if (!props.stats) {
    return []
  }
  const c = props.stats.counts
  const f = props.stats.formatted
  return [
    { label: 'ASSESSED', value: c.assessed, formatted: f.assessed, color: colors.assessed },
    { label: 'SUBMITTED', value: c.submitted, formatted: f.submitted, color: colors.submitted },
    { label: 'ACCEPTED', value: c.accepted, formatted: f.accepted, color: colors.accepted },
    { label: 'REJECTED', value: c.rejected, formatted: f.rejected, color: colors.rejected },
  ]
})

const chartData = computed(() => {
  if (!props.stats) {
    return null
  }

  return {
    labels: ['Unassessed', 'Assessed', 'Submitted', 'Accepted', 'Rejected'],
    datasets: [
      {
        data: [
          props.stats.counts.unassessed,
          props.stats.counts.assessed,
          props.stats.counts.submitted,
          props.stats.counts.accepted,
          props.stats.counts.rejected,
        ],
        backgroundColor: [
          resolveColor(colors.unassessed),
          resolveColor(colors.assessed),
          resolveColor(colors.submitted),
          resolveColor(colors.accepted),
          resolveColor(colors.rejected),
        ],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  }
})

const chartOptions = {
  cutout: '50%',
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      enabled: true,
    },
  },
  responsive: true,
  maintainAspectRatio: false,
}
</script>

<template>
  <div v-if="stats" class="metric-card large">
    <div class="metric-header">
      <h2 class="metric-title">
        Progress
      </h2>
    </div>

    <div class="main-content">
      <div class="chart-container">
        <Chart type="doughnut" :data="chartData" :options="chartOptions" class="chart" />
      </div>

      <div class="summary">
        <div class="overall-pct">
          {{ stats.formatted.overall }}% Assessed
        </div>
        <div class="legend-list">
          <div v-for="row in legendRows" :key="row.label" class="legend-item">
            <span class="legend-chip" :style="{ backgroundColor: row.color }">{{ row.label }}</span>
            <span class="count">{{ row.value }}</span>
          </div>
          <div class="legend-item legend-item--total">
            <span class="legend-chip legend-chip--total">Total Checks</span>
            <span class="count">{{ stats.counts.total }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="stats-grid">
      <div v-for="row in statRows" :key="row.label" class="stat-item">
        <div class="stat-label">
          {{ row.label }}
        </div>
        <div class="stat-box">
          <div
            class="stat-bar"
            :style="{ width: `${getPct(row.value)}%`, backgroundColor: row.color }"
          />
          <div class="stat-value">
            {{ row.formatted }}
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="metric-card large">
    <div class="metric-header">
      <h2 class="metric-title">
        Progress
      </h2>
    </div>
  </div>
</template>

<style scoped>
@import './metrics.css';

.metric-header {
  margin-bottom: 4px;
}

.main-content {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 10px;
}

.chart-container {
  width: 160px;
  height: 160px;
  flex-shrink: 0;
}

.chart {
  width: 100%;
  height: 100%;
}

.summary {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.overall-pct {
  font-size: var(--text-xl);
  font-weight: 600;
  text-align: center;
}

.legend-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

/* Filled label chip on the left, count in the open on the right */
.legend-item {
  display: grid;
  grid-template-columns: 6.5rem 1fr;
  align-items: center;
  gap: 0.75rem;
}

.legend-chip {
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--color-text-bright);
  border: 1px solid var(--color-border-default);
  border-radius: 3px;
  padding: 1px 6px;
  white-space: nowrap;
}

.legend-chip--total {
  background-color: transparent;
  border-color: transparent;
  padding-left: 0;
}

.count {
  font-weight: 600;
  text-align: right;
}

/* Compact status bars, laid out as label-over-bar columns like the legacy panel */
.stats-grid {
  display: flex;
  justify-content: space-around;
  gap: 6px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.stat-label {
  font-size: var(--text-sm);
  font-weight: 600;
  text-transform: uppercase;
}

.stat-box {
  width: 5.5rem;
  height: 1.6rem;
  border: 1px solid var(--color-border-default);
  border-radius: 3px;
  position: relative;
  overflow: hidden;
  /* Own stacking context so the animated bar is clipped by the rounded corners */
  isolation: isolate;
}

.stat-bar {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  transition: width 0.5s ease;
  z-index: 0;
}

.stat-value {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 4px;
  font-size: var(--text-md);
  font-style: italic;
  font-weight: 600;
}
</style>
