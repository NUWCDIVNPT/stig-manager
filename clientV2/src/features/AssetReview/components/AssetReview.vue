<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useDebouncedRef } from '../../../shared/composables/useDebouncedRef.js'
import { useGlobalError } from '../../../shared/composables/useGlobalError.js'
import { useRecentViews } from '../../../shared/composables/useRecentViews.js'
import {
  fetchAsset,
  fetchCollectionLabels,
} from '../api/assetReviewApi.js'
import { useReviewWorkspace } from '../composables/useReviewWorkspace.js'
import ChecklistGrid from './ChecklistGrid.vue'
import RuleDetailPanel from './RuleDetailPanel.vue'

const route = useRoute()
const router = useRouter()
const { addView, removeView } = useRecentViews()

const collectionId = computed(() => route.params.collectionId)
const assetId = computed(() => route.params.assetId)
const benchmarkId = computed(() => route.params.benchmarkId)
const revisionStr = computed(() => route.params.revisionStr)

// Fetch Asset Details
const { state: asset, isLoading, error, execute: loadAsset } = useAsyncState(
  () => fetchAsset(assetId.value),
  {
    immediate: false,
    onError: (err) => {
      const isPrivilegeError = err.body?.error === 'User has insufficient privilege to complete this request.'
      if (isPrivilegeError) {
        removeView(key => key.includes(`:${collectionId.value}:${assetId.value}`))
        router.push({ name: 'not-found', params: { pathMatch: route.path.substring(1).split('/') } })
      }
      else {
        const { triggerError } = useGlobalError()
        triggerError(err)
      }
    },
  },
)

// Fetch Collection Labels (for coloring)
const { state: collectionLabels, execute: loadCollectionLabels } = useAsyncState(
  () => fetchCollectionLabels(collectionId.value),
  { initialState: [], immediate: false },
)

// Review workspace composable
const workspace = useReviewWorkspace({ collectionId, assetId, benchmarkId, revisionStr })

// Update recent views when asset loads or params change
watch(
  [asset, () => route.params.benchmarkId, () => route.params.revisionStr],
  ([a]) => {
    if (a?.name && route.params.benchmarkId) {
      addView({
        key: `review:${collectionId.value}:${assetId.value}:${route.params.benchmarkId}`,
        url: route.fullPath,
        label: `${a.name} / ${route.params.benchmarkId}`,
        type: 'asset-review',
      })
    }
  },
)

// Initial Data Load
watch([assetId, collectionId], () => {
  asset.value = null
  if (assetId.value) {
    loadAsset()
  }
  if (collectionId.value) {
    loadCollectionLabels()
    workspace.loadWorkspace()
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

// Grid mode event handlers
function onRowSave({ ruleId, result, detail, comment, status }) {
  workspace.saveFullReview(ruleId, { result, detail, comment, status })
}

function onStatusAction({ ruleId, actionType }) {
  workspace.saveStatusAction(ruleId, actionType)
}

function onGridRefresh() {
  workspace.loadChecklist()
  workspace.loadAllReviews()
}

// Search filter
const searchFilter = useDebouncedRef('', 250)
const searchInput = ref(null)

function clearSearch() {
  searchFilter.value = ''
  searchInput.value?.focus()
}

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
          <div class="search-reviews">
            <i class="pi pi-search search-reviews__icon" />
            <input
              ref="searchInput"
              v-model="searchFilter"
              type="text"
              class="search-reviews__input"
              placeholder="Search reviews..."
            >
            <i
              v-if="searchFilter"
              class="pi pi-times search-reviews__clear"
              @click="clearSearch"
            />
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
      <Splitter
        :pt="{
          gutter: { style: 'background: var(--color-border-dark)' },
          root: { style: 'border: none; background: transparent' },
        }"
        style="height: 100%"
      >
        <SplitterPanel :size="65" :min-size="30">
          <ChecklistGrid
            :grid-data="workspace.gridData.value"
            :is-loading="workspace.isChecklistLoading.value"
            :selected-rule-id="workspace.selectedRuleId.value"
            :access-mode="workspace.accessMode.value"
            :revision-info="workspace.revisionInfo.value"
            :field-settings="workspace.fieldSettings.value"
            :can-accept="workspace.canAccept.value"
            :is-saving="workspace.isSaving.value"
            :search-filter="searchFilter"
            @select-rule="workspace.selectRule"
            @row-save="onRowSave"
            @status-action="onStatusAction"
            @refresh="onGridRefresh"
          />
        </SplitterPanel>
        <SplitterPanel :size="35" :min-size="20">
          <RuleDetailPanel
            :rule-content="workspace.ruleContent.value"
            :is-rule-loading="workspace.isRuleLoading.value"
            :selected-checklist-item="workspace.selectedChecklistItem.value"
            :current-review="workspace.currentReview.value"
            :review-history="workspace.reviewHistory.value"
          />
        </SplitterPanel>
      </Splitter>
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
  padding: 0.35rem 0.75rem;
  background-color: var(--color-background-dark);
  border-bottom: 1px solid var(--color-border-default);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
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
  margin-bottom: 0.35rem;
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
  color: var(--color-text-bright);
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 600;
}

.asset-review__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  color: var(--color-text-dim);
  font-size: 1rem;
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
  border-color: var(--color-border-default);
}

.action-btn i {
  font-size: 0.85rem;
}

.search-reviews {
  display: flex;
  align-items: center;
  position: relative;
  margin-right: 0.5rem;
}

.search-reviews__icon {
  position: absolute;
  left: 0.6rem;
  color: var(--color-text-dim);
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
  color: var(--color-text-dim);
}

.search-reviews__input:focus {
  border-color: var(--color-primary-highlight);
  background-color: var(--color-background-dark);
}

.search-reviews__clear {
  position: absolute;
  right: 0.5rem;
  color: var(--color-text-dim);
  font-size: 0.75rem;
  cursor: pointer;
}

.search-reviews__clear:hover {
  color: var(--color-text-primary);
}

.search-reviews__input:not(:placeholder-shown) {
  padding-right: 1.75rem;
}

.asset-review__content {
  flex: 1;
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
  color: var(--color-text-error);
}
</style>
