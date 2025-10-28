<!-- <script setup>
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useAssetGridTable } from '../composeables/useAssetGridTable'

const selectedData = defineModel('selectedData', { default: {} })

const { items, labels, loading,  selectedAsset, metaKey } = useAssetGridTable({
  selectedCollection: selectedData,
})
</script>

<template>
  <div>
    <h3>Assets ({{ items.length }})</h3>
    <DataTable
      v-model:selection="selectedAsset"
      resizable-columns
      :value="items"
      :loading="loading"
      :meta-key-selection="metaKey"
      selection-mode="single"
      data-key="assetId"
      paginator
      :rows="5"
      show-gridlines
      style="min-width: 20rem"
    >
      <Column field="name" header="Name" />
      <Column header="Labels">
        <template #body="{ data }">
          <div v-if="labels && Array.isArray(data.labelIds) && data.labelIds.length" class="label-list">
            <template v-for="lid in data.labelIds" :key="lid">
              <span
                v-if="labels.get(lid)"
                class="sm-label-sprite"
                :style="{
                  backgroundColor: labels.get(lid).bgColor,
                  color: labels.get(lid).textColor,
                }"
              >
                {{ labels.get(lid).name }}
              </span>
            </template>
          </div>
        </template>
      </Column>
      <Column field="fqdn" header="FQDN" />
      <Column field="ip" header="IP" />
      <Column header="Benchmarks">
        <template #body="{ data }">
          <span v-if="Array.isArray(data.stigs) && data.stigs.length">
            <span v-for="(stig, idx) in data.stigs" :key="stig.benchmarkId"> {{ stig.benchmarkId }}<br v-if="idx < data.stigs.length - 1" /> </span>
          </span>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<style scoped>
/* Add custom styles if needed */
.label-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5em;
  align-items: center;
}
</style>

<style>
.sm-label-sprite {
  font-size: 85%;
  font-weight: 600;
  top: 0;
  padding: 0 8px;
  border-radius: 6px;
  white-space: nowrap;
}
</style> -->
