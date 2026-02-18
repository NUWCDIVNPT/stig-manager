<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useNavCache } from '../../../shared/composables/useNavCache.js'
import {
  fetchAsset,
  fetchCollectionLabels,
} from '../api/assetReviewApi.js'
import ChecklistInfo from './ChecklistInfo.vue'
import ReviewForm from './ReviewForm.vue'
import ReviewResources from './ReviewResources.vue'
import RuleInfo from './RuleInfo.vue'

const route = useRoute()
const navCache = useNavCache()

const collectionId = computed(() => route.params.collectionId)
const assetId = computed(() => route.params.assetId)

// Fetch Asset Details
const { state: asset, isLoading, errorMessage: error, execute: loadAsset } = useAsyncState(
  () => fetchAsset(assetId.value),
  { immediate: false },
)

// Fetch Collection Labels (for coloring)
const { state: collectionLabels, execute: loadCollectionLabels } = useAsyncState(
  () => fetchCollectionLabels(collectionId.value),
  { initialState: [], immediate: false },
)

// Update nav cache when asset loads
watch(asset, (a) => {
  if (a?.name) {
    navCache.setAssetName(assetId.value, a.name)
  }
})

// Initial Data Load
watch([assetId, collectionId], () => {
  if (assetId.value) {
    loadAsset()
  }
  if (collectionId.value) {
    loadCollectionLabels()
  }
}, { immediate: true })

// Label Resolution Logic
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

const resolvedLabels = computed(() => {
  if (!asset.value?.labelIds?.length || !collectionLabels.value?.length) {
    return []
  }
  const labelMap = new Map(collectionLabels.value.map(l => [l.labelId, l]))
  return asset.value.labelIds
    .map(id => labelMap.get(id))
    .filter(Boolean)
    .map(label => ({
      ...label,
      bgColor: label.color ? `#${label.color}` : '#3b82f6',
      textColor: getContrastColor(label.color),
    }))
})

// Expose asset
defineExpose({ asset })
</script>

<template>
  <div class="asset-review">
    <header class="asset-review__header">
      <div v-if="asset" class="asset-review__header-main">
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
          <!-- Search reviews input from CollectionView could be moved here if needed -->
          <div class="search-reviews">
            <i class="pi pi-search search-reviews__icon" />
            <input
              type="text"
              class="search-reviews__input"
              placeholder="Search reviews..."
            >
          </div>
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

    <div v-if="isLoading" class="asset-review__loading">
      Loading asset details...
    </div>
    <div v-else-if="error" class="asset-review__error">
      {{ error || 'Error loading asset' }}
    </div>
    <div v-else-if="asset" class="asset-review__content">
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
  background-color: var(--color-background-darkest);
  color: var(--color-text-primary);
}

.asset-review__header {
  flex: 0 0 auto;
  padding: 0.5rem 1rem;
  background-color: var(--color-background-dark);
  border-bottom: 1px solid var(--color-border-default);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Header Info Styles */
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
  background-color: var(--color-action-blue);
  color: #fff;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 600;
}

.asset-review__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  color: var(--color-text-dim);
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
  align-items: center;
}

/* Action Buttons */
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.75rem;
  background-color: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  color: var(--color-text-primary);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover {
  background-color: var(--color-bg-hover-strong);
  border-color: #4a4d50;
}

.action-btn i {
  font-size: 0.85rem;
}

/* Search Box */
.search-reviews {
  display: flex;
  align-items: center;
  position: relative;
  margin-right: 0.5rem;
}

.search-reviews__icon {
  position: absolute;
  left: 0.6rem;
  color: #6b7280;
  font-size: 0.85rem;
  pointer-events: none;
}

.search-reviews__input {
  background-color: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  color: var(--color-text-primary);
  font-size: 0.85rem;
  padding: 0.4rem 0.6rem 0.4rem 2rem;
  width: 180px;
  outline: none;
  transition: border-color 0.15s, background-color 0.15s;
}

.search-reviews__input::placeholder {
  color: #6b7280;
}

.search-reviews__input:focus {
  border-color: var(--color-primary-highlight);
  background-color: var(--color-background-dark);
}

/* Content Grid */
.asset-review__content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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
  color: var(--color-text-dim);
}

.asset-review__error {
  color: #f16969;
}
</style>
