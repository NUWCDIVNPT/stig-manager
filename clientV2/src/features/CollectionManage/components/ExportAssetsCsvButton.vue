<script setup>
import { saveAs } from 'file-saver-es'
import Dialog from 'primevue/dialog'
import { ref } from 'vue'
import { apiCall } from '../../../shared/api/apiClient.js'
import { useGlobalError } from '../../../shared/composables/useGlobalError.js'
import {
  ASSET_FIELDS,
  formatAssetsForCsv,
  generateCsv,
  mapAssetToLabel,
} from '../../../shared/csv.js'
import { filenameEscaped } from '../../../shared/lib.js'
import { importDialogPt } from '../../ImportWizard/lib/importDialogPt.js'

const props = defineProps({
  collectionId: { type: String, required: true },
  collectionName: { type: String, default: '' },
  selectedAssets: { type: Array, default: () => [] },
})

const { triggerError } = useGlobalError()

const exporting = ref(false)

function downloadCsv(content, collectionName) {
  const date = new Date().toISOString().split('T')[0]
  const filename = filenameEscaped(`assets-${collectionName}-${date}.csv`)
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, filename)
}

async function handleExport() {
  if (exporting.value) {
    return
  }
  exporting.value = true
  try {
    const [assets, labels] = await Promise.all([
      apiCall('getAssets', { collectionId: props.collectionId, projection: 'stigs' }),
      apiCall('getCollectionLabels', { collectionId: props.collectionId }),
    ])

    let filtered = assets
    if (props.selectedAssets?.length > 0) {
      const selectedIds = new Set(props.selectedAssets.map(a => a.assetId))
      filtered = assets.filter(a => selectedIds.has(a.assetId))
    }

    const rows = formatAssetsForCsv(mapAssetToLabel(filtered, labels))
    const csv = generateCsv(rows, ASSET_FIELDS, '\n')
    downloadCsv(csv, props.collectionName)
  }
  catch (e) {
    triggerError(e)
  }
  finally {
    exporting.value = false
  }
}
</script>

<template>
  <button
    type="button"
    class="action-btn"
    :disabled="exporting"
    title="Export assets to CSV"
    @click="handleExport"
  >
    <i class="pi pi-download icon-blue" /> Export Assets CSV
  </button>

  <Dialog
    :visible="exporting"
    modal
    :closable="false"
    :close-on-escape="false"
    :draggable="false"
    :pt="importDialogPt"
    :style="{ width: 'min(360px, 92vw)' }"
    header="Exporting Assets"
  >
    <div class="progress-body">
      <i class="pi pi-spin pi-spinner spinner-icon" />
      <div class="progress-text">
        Generating CSV, please do not refresh.
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  color: var(--color-text-default);
  font-size: 0.92rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.45rem 0.7rem;
  border-radius: 4px;
  transition: background-color 0.1s, color 0.1s;
}

.action-btn:hover:not(:disabled) {
  background: var(--color-background-subtle);
  color: var(--color-text-bright);
}

.action-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.action-btn i.icon-blue {
  color: #60a5fa;
}

.progress-body {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.25rem 0;
}

.spinner-icon {
  font-size: 1.6rem;
  color: var(--color-action-blue-dark);
}

.progress-text {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-text-primary);
}
</style>
