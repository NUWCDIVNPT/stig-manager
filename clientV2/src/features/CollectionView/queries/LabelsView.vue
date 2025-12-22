<script setup>
defineProps({
  collectionId: {
    type: [String, Number],
    required: true,
  },
  labels: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <div class="labels-view">
    <div class="labels-grid-top">
      <div v-if="labels.length === 0" class="empty-state">
        No Labels available.
      </div>
      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Label Name</th>
              <th>Description</th>
              <th>Assets</th>
              <th>Findings (H/M/L)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="label in labels" :key="label.labelId">
              <td class="primary-cell">
                {{ label.name }}
              </td>
              <td>{{ label.description || '—' }}</td>
              <td>{{ label.metrics?.assets ?? 0 }}</td>
              <td>
                <span class="chip chip--high">{{ label.metrics?.findings?.high ?? 0 }}</span>
                <span class="chip chip--medium">{{ label.metrics?.findings?.medium ?? 0 }}</span>
                <span class="chip chip--low">{{ label.metrics?.findings?.low ?? 0 }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="labels-grid-bottom">
      <h4>Label Details</h4>
      <p>Select a label to view details (Placeholder)</p>
    </div>
  </div>
</template>

<style scoped>
.labels-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 1rem;
}

.labels-grid-top,
.labels-grid-bottom {
  flex: 1;
  background-color: #262626;
  border: 1px solid #3a3d40;
  border-radius: 4px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.labels-grid-bottom {
  padding: 1rem;
}

.empty-state {
  padding: 1rem;
  color: #a6adba;
  font-style: italic;
}

.table-wrapper {
  flex: 1;
  overflow: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table th,
.data-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #3a3d40;
}

.data-table th {
  background-color: #262626;
  position: sticky;
  top: 0;
  z-index: 1;
}

.primary-cell {
  font-weight: 600;
  color: #e4e4e7;
}

.chip {
  display: inline-flex;
  min-width: 1.5rem;
  justify-content: center;
  padding: 0.1rem 0.3rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #111;
  margin-right: 0.25rem;
}

.chip--high { background-color: #ff7e67; }
.chip--medium { background-color: #ffcb57; }
.chip--low { background-color: #5cd18b; }

h4 {
  margin-top: 0;
  color: #e4e4e7;
}

p {
  color: #a6adba;
}
</style>
