<script setup>
import { ref } from 'vue'

defineProps({
  collectionId: {
    type: [String, Number],
    required: true,
  },
  stigs: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['select-stig'])
const selectedId = ref(null)

function selectStig(benchmarkId) {
  selectedId.value = benchmarkId
  emit('select-stig', benchmarkId)
}
</script>

<template>
  <div class="stigs-view">
    <div v-if="stigs.length === 0" class="empty-state">
      No STIGs available.
    </div>
    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Benchmark ID</th>
            <th>Revision</th>
            <th>Assessments</th>
            <th>Pass</th>
            <th>Fail</th>
            <th>Findings (H/M/L)</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="stig in stigs"
            :key="stig.benchmarkId"
            :class="{ 'selected-row': selectedId === stig.benchmarkId }"
            @click="selectStig(stig.benchmarkId)"
          >
            <td class="primary-cell">
              {{ stig.benchmarkId }}
            </td>
            <td>{{ stig.revisionStr }}</td>
            <td>{{ stig.metrics?.assessments ?? 0 }}</td>
            <td>{{ stig.metrics?.results?.pass ?? 0 }}</td>
            <td>{{ stig.metrics?.results?.fail ?? 0 }}</td>
            <td>
              <span class="chip chip--high">{{ stig.metrics?.findings?.high ?? 0 }}</span>
              <span class="chip chip--medium">{{ stig.metrics?.findings?.medium ?? 0 }}</span>
              <span class="chip chip--low">{{ stig.metrics?.findings?.low ?? 0 }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.stigs-view {
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

.data-table tr {
  cursor: pointer;
  transition: background-color 0.15s;
}

.data-table tr:hover {
  background-color: #2a2a2a;
}

.selected-row {
  background-color: rgba(59, 130, 246, 0.15) !important;
  border-left: 3px solid #3b82f6;
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
