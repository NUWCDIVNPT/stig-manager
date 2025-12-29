<script setup>
import Chart from 'primevue/chart'
import { computed, defineProps, toRefs } from 'vue'

const props = defineProps({
  stats: {
    type: Object,
    required: false,
    default: null,
  },
})

const { stats } = toRefs(props)

const colors = {
  unassessed: 'var(--metrics-status-chart-unassessed)',
  assessed: 'var(--metrics-status-chart-assessed)',
  submitted: 'var(--metrics-status-chart-submitted)',
  accepted: 'var(--metrics-status-chart-accepted)',
  rejected: 'var(--metrics-status-chart-rejected)',
  text: '#e4e4e7',
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
  if (!stats.value || !stats.value.counts?.total) {
    return 0
  }
  return (val / stats.value.counts.total) * 100
}

const chartData = computed(() => {
  if (!stats.value) {
    return null
  }

  return {
    labels: ['Unassessed', 'Assessed', 'Submitted', 'Accepted', 'Rejected'],
    datasets: [
      {
        data: [
          stats.value.counts.unassessed,
          stats.value.counts.assessed,
          stats.value.counts.submitted,
          stats.value.counts.accepted,
          stats.value.counts.rejected,
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
  <div v-if="stats" class="progress-card">
    <div class="header">
      <h2 class="title">
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
          <div class="stat-value" :style="{ color: colors.assessed }">
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
          <div class="stat-value" :style="{ color: colors.submitted }">
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
          <div class="stat-value" :style="{ color: colors.accepted }">
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
          <div class="stat-value" :style="{ color: colors.rejected }">
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
</template>

<style scoped>
.progress-card {
  background-color: #18181b;
  color: #e4e4e7;
  border-radius: 20px;
  padding: 25px;
  width: 100%;
  max-width: 450px;
  min-width: 350px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.overall-pct {
  font-size: 20px;
  font-weight: 600;
  color: white;
}

.main-content {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 10px;
}

.chart-container {
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  position: relative;
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
  font-size: 14px;
  position: relative;
  border-radius: 6px;
  padding: 3px 12px;
  background-color: rgba(255, 255, 255, 0.03);
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
  background-color: rgba(255, 255, 255, 0.03);
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
  font-size: 12px;
  text-transform: uppercase;
  color: #a1a1aa;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
}

.total-footer {
  background-color: #26262b;
  border: 1px solid #3f3f46;
  border-radius: 8px;
  padding: 8px;
  text-align: center;
}

.total-label {
  font-size: 12px;
  color: #a1a1aa;
  margin-bottom: 0.25rem;
}

.total-value {
  font-size: 18px;
  font-weight: 600;
  color: white;
}
</style>
