<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAsyncData } from '../../../shared/composables/useAsyncData.js'
import { fetchAsset } from '../api/assetReviewApi.js'
import ChecklistInfo from './ChecklistInfo.vue'
import ReviewForm from './ReviewForm.vue'
import ReviewResources from './ReviewResources.vue'
import RuleInfo from './RuleInfo.vue'

const props = defineProps({
  assetId: {
    type: [String, Number],
    default: null,
  },
  collectionLabels: {
    type: Array,
    default: () => [],
  },
})

const route = useRoute()
// Use prop if provided, otherwise fall back to route param
const assetId = computed(() => props.assetId || route.params.assetId)

const { data: asset, isLoading, errorMessage: error, execute: loadAsset } = useAsyncData(
  () => fetchAsset(assetId.value),
)

watch(assetId, loadAsset, { immediate: true })

// Calculate contrasting text color for a hex background
function getContrastColor(hexColor) {
  if (!hexColor) {
    return '#ffffff'
  }
  const hex = hexColor.replace('#', '')
  const r = Number.parseInt(hex.substr(0, 2), 16)
  const g = Number.parseInt(hex.substr(2, 2), 16)
  const b = Number.parseInt(hex.substr(4, 2), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? '#1a1a1a' : '#ffffff'
}

// Expose asset for parent components (e.g., breadcrumb)
defineExpose({ asset })

// Resolve asset labelIds to full label objects with name and color
const resolvedLabels = computed(() => {
  if (!asset.value?.labelIds?.length || !props.collectionLabels?.length) {
    return []
  }
  const labelMap = new Map(props.collectionLabels.map(l => [l.labelId, l]))
  return asset.value.labelIds
    .map(id => labelMap.get(id))
    .filter(Boolean)
    .map(label => ({
      ...label,
      bgColor: label.color ? `#${label.color}` : '#3b82f6',
      textColor: getContrastColor(label.color),
    }))
})
</script>

<template>
  <div class="asset-review">
    <div v-if="isLoading" class="asset-review__loading">
      Loading asset details...
    </div>
    <div v-else-if="error" class="asset-review__error">
      {{ error || 'Error loading asset' }}
    </div>
    <div v-else-if="asset" class="asset-review__content">
      <header class="asset-review__header">
        <div class="asset-review__header-main">
          <div class="asset-review__header-info">
            <div class="asset-review__title-row">
              <h1 class="asset-review__title">
                {{ asset.name }}
              </h1>
              <div v-if="resolvedLabels.length" class="asset-review__labels">
                <span
                  v-for="label in resolvedLabels"
                  :key="label.labelId"
                  class="asset-label"
                  :style="{ backgroundColor: label.bgColor, color: label.textColor }"
                >
                  {{ label.name }}
                </span>
              </div>
            </div>
            <div class="asset-review__meta">
              <span class="asset-review__meta-item">
                <i class="pi pi-hashtag" />
                {{ asset.assetId }}
              </span>
              <span v-if="asset.ip" class="asset-review__meta-item">
                <i class="pi pi-globe" />
                {{ asset.ip }}
              </span>
              <span v-if="asset.fqdn" class="asset-review__meta-item">
                <i class="pi pi-server" />
                {{ asset.fqdn }}
              </span>
              <span v-if="asset.mac" class="asset-review__meta-item">
                <i class="pi pi-wifi" />
                {{ asset.mac }}
              </span>
              <span v-if="asset.description" class="asset-review__meta-item asset-review__description">
                <i class="pi pi-info-circle" />
                {{ asset.description }}
              </span>
            </div>
          </div>
          <div class="asset-review__header-actions">
            <button type="button" class="action-btn" title="Import checklist">
              <i class="pi pi-upload" />
              <span>Import</span>
            </button>
            <button type="button" class="action-btn" title="Export checklist">
              <i class="pi pi-download" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </header>

      <div class="asset-review__grid">
        <section class="grid-column">
          <ChecklistInfo />
        </section>

        <section class="grid-column">
          <RuleInfo />
        </section>

        <section class="grid-column split-column">
          <div class="split-row">
            <ReviewResources />
          </div>
          <div class="split-row">
            <ReviewForm />
          </div>
        </section>
      </div>
    </div>
    <div v-else class="asset-review__empty">
      Asset not found.
    </div>
  </div>
</template>

<style scoped>
.asset-review {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #000000;
  color: #e4e4e7;
}

.asset-review__content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.asset-review__header {
  flex: 0 0 auto;
  padding: 0.75rem 1rem;
  background-color: #1f1f1f;
  border-bottom: 1px solid #3a3d40;
}

.asset-review__header-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.asset-review__header-info {
  flex: 1;
  min-width: 0;
}

.asset-review__title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}

.asset-review__title {
  font-size: 1.1rem;
  margin: 0;
  font-weight: 600;
}

.asset-review__labels {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.asset-label {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.5rem;
  background-color: #3b82f6;
  color: #fff;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 600;
}

.asset-review__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  color: #a6adba;
  font-size: 0.8rem;
}

.asset-review__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.asset-review__meta-item i {
  font-size: 0.75rem;
  opacity: 0.7;
}

.asset-review__description {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.asset-review__header-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.75rem;
  background-color: #2a2a2a;
  border: 1px solid #3a3d40;
  border-radius: 4px;
  color: #e4e4e7;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover {
  background-color: #3a3d40;
  border-color: #4a4d50;
}

.action-btn i {
  font-size: 0.85rem;
}

.asset-review__grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  overflow: hidden;
}

.grid-column {
  min-width: 0;
  height: 100%;
  overflow: hidden;
}

.split-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.split-row {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.asset-review__loading,
.asset-review__error,
.asset-review__empty {
  padding: 2rem;
  text-align: center;
  color: #a6adba;
}

.asset-review__error {
  color: #f16969;
}
</style>
