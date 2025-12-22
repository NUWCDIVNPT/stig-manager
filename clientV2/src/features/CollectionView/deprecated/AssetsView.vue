<script setup>
defineProps({
  collectionId: {
    type: [String, Number],
    required: true,
  },
  assets: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <div class="assets-view">
    <div v-if="assets.length === 0" class="empty-state">
      No Assets available.
    </div>
    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Asset Name</th>
            <th>IP</th>
            <th>FQDN</th>
            <th>Assessments</th>
            <th>Pass</th>
            <th>Fail</th>
            <th>Findings (H/M/L)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="asset in assets" :key="asset.assetId">
            <td class="primary-cell">
              {{ asset.name }}
            </td>
            <td>{{ asset.ip || '—' }}</td>
            <td>{{ asset.fqdn || '—' }}</td>
            <td>{{ asset.metrics?.assessments ?? 0 }}</td>
            <td>{{ asset.metrics?.results?.pass ?? 0 }}</td>
            <td>{{ asset.metrics?.results?.fail ?? 0 }}</td>
            <td>
              <span class="chip chip--high">{{ asset.metrics?.findings?.high ?? 0 }}</span>
              <span class="chip chip--medium">{{ asset.metrics?.findings?.medium ?? 0 }}</span>
              <span class="chip chip--low">{{ asset.metrics?.findings?.low ?? 0 }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.assets-view {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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
</style>
