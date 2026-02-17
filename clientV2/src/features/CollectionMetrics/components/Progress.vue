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
      <span class="overall-pct">{{ stats.formatted.overall }}% Assessed</span>
    </div>

    <div class="main-content">
      <div class="chart-container">
        <Chart type="doughnut" :data="chartData" :options="chartOptions" class="chart" />
      </div>

      <div class="legend-list">
        <div class="legend-item">
          <div class="indicator" :style="{ backgroundColor: colors.unassessed }" />
          <span class="label">Unassessed</span>
          <span class="count">{{ stats.counts.unassessed }}</span>
        </div>
        <div class="legend-item">
          <div class="indicator" :style="{ backgroundColor: colors.assessed }" />
          <span class="label">Assessed</span>
          <span class="count">{{ stats.counts.assessed }}</span>
        </div>
        <div class="legend-item">
          <div class="indicator" :style="{ backgroundColor: colors.submitted }" />
          <span class="label">Submitted</span>
          <span class="count">{{ stats.counts.submitted }}</span>
        </div>
        <div class="legend-item">
          <div class="indicator" :style="{ backgroundColor: colors.accepted }" />
          <span class="label">Accepted</span>
          <span class="count">{{ stats.counts.accepted }}</span>
        </div>
        <div class="legend-item">
          <div class="indicator" :style="{ backgroundColor: colors.rejected }" />
          <span class="label">Rejected</span>
          <span class="count">{{ stats.counts.rejected }}</span>
        </div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-box">
        <div
          class="stat-bar"
          :style="{ width: `${getPct(stats.counts.assessed)}%`, backgroundColor: colors.assessed }"
        />
        <div class="stat-content">
          <div class="stat-label">
            ASSESSED
          </div>
          <div class="stat-value">
            {{ stats.formatted.assessed }}
          </div>
        </div>
      </div>
      <div class="stat-box">
        <div
          class="stat-bar"
          :style="{ width: `${getPct(stats.counts.submitted)}%`, backgroundColor: colors.submitted }"
        />
        <div class="stat-content">
          <div class="stat-label">
            SUBMITTED
          </div>
          <div class="stat-value">
            {{ stats.formatted.submitted }}
          </div>
        </div>
      </div>
      <div class="stat-box">
        <div
          class="stat-bar"
          :style="{ width: `${getPct(stats.counts.accepted)}%`, backgroundColor: colors.accepted }"
        />
        <div class="stat-content">
          <div class="stat-label">
            ACCEPTED
          </div>
          <div class="stat-value">
            {{ stats.formatted.accepted }}
          </div>
        </div>
      </div>
      <div class="stat-box">
        <div
          class="stat-bar"
          :style="{ width: `${getPct(stats.counts.rejected)}%`, backgroundColor: colors.rejected }"
        />
        <div class="stat-content">
          <div class="stat-label">
            REJECTED
          </div>
          <div class="stat-value">
            {{ stats.formatted.rejected }}
          </div>
        </div>
      </div>
    </div>

    <div class="total-footer">
      <div class="total-label">
        Total Checks
      </div>
      <div class="total-value">
        {{ stats.counts.total }}
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
  margin-bottom: 15px;
}

.overall-pct {
  font-size: 1.65rem;
  font-weight: 600;
}

.main-content {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 10px;
}

.chart-container {
  width: 150px;
  height: 150px;
}

.chart {
  width: 100%;
  height: 100%;
}

.legend-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 1.25rem;
  border-radius: 6px;
  padding: 3px 12px;
  background-color: var(--color-background-subtle);
}

.indicator {
  width: 4px;
  height: 16px;
  border-radius: 2px;
  margin-right: 10px;
}

.label {
  flex: 1;
}

.count {
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-bottom: 8px;
  text-align: center;
}

.stat-box {
  background-color: var(--color-background-subtle);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.stat-bar {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  opacity: 0.;
  transition: width 0.5s ease;
  z-index: 0;
}

.stat-content {
  position: relative;
  z-index: 1;
  padding: 12px;
}

.stat-label {
  font-size: 1.1rem;
  font-weight: 600;
  text-transform: uppercase;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
}

.total-footer {
  background-color: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-radius: 8px;
  padding: 8px;
  text-align: center;
}

.total-label {
  font-size: 1.1rem;
  color: var(--color-text-dim);
  margin-bottom: 0.25rem;
}

.total-value {
  font-size: 1.65rem;
  font-weight: 600;
}
</style>
