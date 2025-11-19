<script setup>
import { computed } from 'vue'

// assets are the metrics for each asset in the collection
const props = defineProps({
  assets: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  collectionName: {
    type: String,
    default: '',
  },
})

const hasAssets = computed(() => props.assets?.length > 0)
</script>

<template>
  <div class="asset-table">
    <h2 class="asset-table__title">
      Assets in {{ collectionName || 'Collection' }}
    </h2>

    <p v-if="isLoading" class="asset-table__state">
      Loading asset details…
    </p>

    <p v-else-if="errorMessage" class="asset-table__state asset-table__state--error">
      {{ errorMessage }}
    </p>

    <p v-else-if="!hasAssets" class="asset-table__state">
      No asset metrics available for this collection.
    </p>

    <div v-else class="asset-table__wrapper">
      <table class="asset-table__table">
        <thead>
          <tr>
            <th scope="col">
              Asset
            </th>
            <th scope="col">
              IP
            </th>
            <th scope="col">
              FQDN
            </th>
            <th scope="col">
              Assessments
            </th>
            <th scope="col">
              Pass
            </th>
            <th scope="col">
              Fail
            </th>
            <th scope="col">
              Findings (H/M/L)
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="asset in assets" :key="asset.assetId">
            <td>
              <div class="asset-table__primary">
                <p class="asset-table__name">
                  {{ asset.name || 'Unnamed Asset' }}
                </p>
                <p class="asset-table__subtext">
                  ID: {{ asset.assetId }}
                </p>
              </div>
            </td>
            <td>{{ asset.ip || '—' }}</td>
            <td>{{ asset.fqdn || '—' }}</td>
            <td>{{ asset.metrics?.assessments ?? 0 }}</td>
            <td>{{ asset.metrics?.results?.pass ?? 0 }}</td>
            <td>{{ asset.metrics?.results?.fail ?? 0 }}</td>
            <td>
              <span class="asset-table__chip asset-table__chip--high">{{ asset.metrics?.findings?.high ?? 0 }}</span>
              <span class="asset-table__chip asset-table__chip--medium">{{ asset.metrics?.findings?.medium ?? 0 }}</span>
              <span class="asset-table__chip asset-table__chip--low">{{ asset.metrics?.findings?.low ?? 0 }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.asset-table {
  margin-top: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.asset-table__title {
  font-size: 1.1rem;
  font-weight: 600;
}

.asset-table__wrapper {
  overflow-x: auto;
  border-radius: 0.5rem;
  border: 1px solid color-mix(in srgb, var(--sm-panel-border, #3a3d40) 65%, transparent);
}

.asset-table__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.asset-table__table th,
.asset-table__table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid color-mix(in srgb, var(--sm-panel-border, #3a3d40) 35%, transparent);
}

.asset-table__table thead {
  background-color: color-mix(in srgb, var(--sm-panel-surface, #1f2125) 70%, transparent);
}

.asset-table__state {
  margin: 0.5rem 0 1rem;
  color: var(--sm-muted-text, #a6adba);
}

.asset-table__state--error {
  color: #f16969;
}

.asset-table__primary {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.asset-table__name {
  font-weight: 600;
  margin: 0;
}

.asset-table__subtext {
  margin: 0;
  font-size: 0.8rem;
  color: var(--sm-muted-text, #a6adba);
}

.asset-table__chip {
  display: inline-flex;
  min-width: 1.75rem;
  justify-content: center;
  padding: 0.15rem 0.35rem;
  border-radius: 0.45rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #111;
  margin-right: 0.35rem;
}

.asset-table__chip--high {
  background-color: #ff7e67;
}

.asset-table__chip--medium {
  background-color: #ffcb57;
}

.asset-table__chip--low {
  background-color: #5cd18b;
}
</style>
