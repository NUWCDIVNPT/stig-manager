<script setup>
import Button from 'primevue/button'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import { computed, ref, watch } from 'vue'

import shieldIcon from '../../../../assets/shield-green-check.svg'
import LabelsRow from '../../../../components/columns/LabelsRow.vue'
import LabelChip from '../../../../components/common/Label.vue'
import PickListTable from '../../../../components/common/PickListTable.vue'
import { fetchCollectionLabels } from '../../../../shared/api/collectionsApi.js'
import { useGlobalError } from '../../../../shared/composables/useGlobalError.js'
import { normalizeColor } from '../../../../shared/lib/colorUtils.js'

import { primaryBtnPt, secondaryBtnPt } from '../../../../shared/lib/dialogPt.js'
import {
  fetchAssetsByLabel,
  fetchCollectionAssetsBasic,
  replaceLabelAssets,
} from '../../api/labelManageApi.js'
import { assetTextFilter as matchAsset, partitionAssets } from './tagAssets.js'

const props = defineProps({
  visible: { type: Boolean, required: true },
  collectionId: { type: String, required: true },
  label: { type: Object, default: null },
})

const emit = defineEmits(['update:visible', 'tagging-changed'])

const localVisible = computed({
  get: () => props.visible,
  set: v => emit('update:visible', v),
})

const { triggerError } = useGlobalError()

const VIRTUAL_SCROLLER_OPTIONS = { itemSize: 28 }

const isLoading = ref(false)
const saving = ref(false)
const pickerValue = ref([[], []])
const labelMap = ref(new Map())

const labelColor = computed(() => normalizeColor(props.label?.color, '#cccccc'))

const availableCount = computed(() => pickerValue.value[0].length)
const taggedCount = computed(() => pickerValue.value[1].length)

async function loadData() {
  pickerValue.value = [[], []]
  if (!props.label) {
    return
  }
  isLoading.value = true
  try {
    const [allAssets, taggedAssets, labels] = await Promise.all([
      fetchCollectionAssetsBasic(props.collectionId),
      fetchAssetsByLabel(props.collectionId, props.label.labelId),
      fetchCollectionLabels(props.collectionId),
    ])
    const map = new Map()
    for (const label of (labels ?? [])) {
      map.set(label.labelId, label)
    }
    labelMap.value = map

    pickerValue.value = partitionAssets(allAssets, taggedAssets, map)
  }
  catch (err) {
    triggerError(err)
  }
  finally {
    isLoading.value = false
  }
}

watch(() => props.visible, (open) => {
  if (open) {
    loadData()
  }
})

function close() {
  if (saving.value) {
    return
  }
  localVisible.value = false
}

async function onSave() {
  if (!props.label || saving.value) {
    return
  }
  saving.value = true
  try {
    const assetIds = pickerValue.value[1].map(a => String(a.assetId))
    await replaceLabelAssets(props.collectionId, props.label.labelId, assetIds)
    emit('tagging-changed')
    localVisible.value = false
  }
  catch (err) {
    triggerError(err)
  }
  finally {
    saving.value = false
  }
}

function assetTextFilter(item, text) {
  return matchAsset(item, text, labelMap.value)
}

const dialogPt = {
  root: { style: 'background: var(--color-background-dark); border: 1px solid var(--color-border-default); border-radius: 8px; color: var(--color-text-primary); display: flex; flex-direction: column; overflow: hidden;' },
  header: { style: 'background: var(--color-background-dark); padding: 0; border-bottom: 1px solid var(--color-border-default); flex-shrink: 0;' },
  content: { style: 'background: var(--color-background-dark); padding: 0; flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column;' },
  footer: { style: 'flex-shrink: 0; padding: 0; border: none;' },
  closeButton: { style: 'color: var(--color-text-dim);' },
}

const tablePt = {
  bodyRow: { style: 'font-size: 0.85rem;' },
  bodyCell: { style: 'padding: 0.15rem 0.5rem;' },
  headerCell: { style: 'padding: 0.3rem 0.5rem; font-size: 0.85rem;' },
}
</script>

<template>
  <Dialog
    v-model:visible="localVisible"
    modal
    :draggable="false"
    :style="{ width: 'min(940px, 96vw)', height: '74vh', maxHeight: '720px', minHeight: '480px' }"
    :pt="dialogPt"
  >
    <template #header>
      <div class="modal-header">
        <div class="modal-header-icon">
          <i class="pi pi-tags" />
        </div>
        <div>
          <div class="modal-header-title">
            Tag Assets
          </div>
          <div class="modal-header-sub">
            <LabelChip v-if="label" :value="label.name" :color="labelColor" />
            <span v-else>Select assets for this label</span>
          </div>
        </div>
      </div>
    </template>

    <div class="modal-body">
      <PickListTable
        :model-value="pickerValue"
        data-key="assetId"
        :show-source-filter="true"
        :show-target-filter="true"
        filter-by="name"
        source-filter-placeholder="Search available assets and labels..."
        target-filter-placeholder="Search tagged assets and labels..."
        :virtual-scroller-options="VIRTUAL_SCROLLER_OPTIONS"
        :text-filter-fn="assetTextFilter"
        :table-pt="tablePt"
        @update:model-value="pickerValue = $event"
      >
        <template #sourceheader>
          <span class="header-row">
            <span>Available <span class="header-count">({{ availableCount }})</span></span>
            <i v-if="isLoading" class="pi pi-spin pi-spinner header-spinner" />
          </span>
        </template>
        <template #targetheader>
          <span class="header-row">
            <span>Tagged <span class="header-count">({{ taggedCount }})</span></span>
            <i v-if="isLoading" class="pi pi-spin pi-spinner header-spinner" />
          </span>
        </template>
        <template #columns>
          <Column field="name" header="Asset" style="min-width: 120px; width: 35%;" :body-style="{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }">
            <template #body="{ data }">
              <span class="asset-name" :title="data.name">{{ data.name }}</span>
            </template>
          </Column>
          <Column header="Labels" style="min-width: 140px;">
            <template #body="{ data }">
              <LabelsRow :labels="data.labels" compact />
            </template>
          </Column>
          <Column header="STIGs" style="width: 70px;" :header-style="{ textAlign: 'center', justifyContent: 'center' }">
            <template #body="{ data }">
              <span class="asset-stig-count" style="justify-content: center;">
                <img :src="shieldIcon" class="asset-stig-icon" alt="">
                {{ data.stigCount }}
              </span>
            </template>
          </Column>
        </template>
      </PickListTable>
    </div>

    <template #footer>
      <div class="modal-footer">
        <Button label="Cancel" :pt="secondaryBtnPt" :disabled="saving" @click="close" />
        <Button label="Save" :pt="primaryBtnPt" :loading="saving" :disabled="isLoading" @click="onSave" />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.modal-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.1rem;
}

.modal-header-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-action-blue-dark) 20%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-action-blue-dark) 40%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-action-blue-dark);
  flex-shrink: 0;
}

.modal-header-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text-bright);
  line-height: 1.25;
}

.modal-header-sub {
  margin-top: 4px;
  display: flex;
  align-items: center;
  color: var(--color-text-dim);
}

.modal-body {
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 1rem 1.1rem;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
}

.header-count {
  font-weight: 500;
  color: var(--color-text-dim);
  font-size: 0.9em;
}

.header-spinner {
  color: var(--color-text-dim);
  font-size: 0.85rem;
}

.asset-name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.9rem;
}

.asset-stig-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.asset-stig-icon {
  width: 1.4rem;
  height: 1.4rem;
  display: block;
}

.modal-footer {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.65rem 1rem;
  justify-content: flex-end;
}
</style>
