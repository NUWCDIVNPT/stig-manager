<script setup>
import { computed, inject } from 'vue'
import { useCollectionChecklistAssetsQuery } from '../queries/metricsQueries.js'

const props = defineProps({
  collectionId: {
    type: [String, Number],
    required: true,
  },
  benchmarkId: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['review-asset'])

const oidcWorker = inject('worker')
const token = computed(() => oidcWorker.token)

const { checklistAssets, isLoading, errorMessage } = useCollectionChecklistAssetsQuery({
  collectionId: computed(() => props.collectionId),
  benchmarkId: computed(() => props.benchmarkId),
  token,
})

function handleReviewClick(asset) {
  emit('review-asset', {
    assetId: asset.assetId,
    assetName: asset.name,
    benchmarkId: props.benchmarkId,
  })
}
</script>

<template>
  <div class="checklist-table">
    <div class="checklist-table__header">
      <h3>Checklists</h3>
      <span v-if="benchmarkId" class="benchmark-badge">{{ benchmarkId }}</span>
    </div>

    <div class="checklist-table__body">
      <div v-if="!benchmarkId" class="empty-state">
        Select a STIG to view checklists.
      </div>
      <div v-else-if="isLoading" class="loading-state">
        Loading checklists...
      </div>
      <div v-else-if="errorMessage" class="error-state">
        {{ errorMessage }}
      </div>
      <div v-else-if="checklistAssets.length === 0" class="empty-state">
        No checklists found for this STIG.
      </div>
      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th scope="col">
                Actions
              </th>
              <th>Asset Name</th>
              <th>IP</th>
              <th>Pass</th>
              <th>Fail</th>
              <th>Findings (H/M/L)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="asset in checklistAssets" :key="asset.assetId">
              <td>
                <button
                  type="button"
                  class="review-btn"
                  @click="handleReviewClick(asset)"
                >
                  Review
                </button>
              </td>
              <td class="primary-cell">
                {{ asset.name }}
              </td>
              <td>{{ asset.ip || '—' }}</td>
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
  </div>
</template>

<style scoped>
.checklist-table {
  background-color: #1f1f1f;
  border: 1px solid #3a3d40;
  border-radius: 4px;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.checklist-table__header {
  padding: 1rem;
  background-color: #262626;
  border-bottom: 1px solid #3a3d40;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.checklist-table__header h3 {
  margin: 0;
  color: #e4e4e7;
  font-size: 1.1rem;
}

.benchmark-badge {
  font-size: 0.8rem;
  background-color: #3a3d40;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  color: #a6adba;
}

.checklist-table__body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.empty-state, .loading-state, .error-state {
  padding: 2rem;
  text-align: center;
  color: #a6adba;
  font-style: italic;
}

.error-state {
  color: #f16969;
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

.review-btn {
  background-color: #3b82f6;
  color: #fff;
  border: none;
  padding: 0.35rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.15s;
}

.review-btn:hover {
  background-color: #2563eb;
}
</style>
