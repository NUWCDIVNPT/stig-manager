<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getHttpStatus } from '../../../shared/api/apiClient.js'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useCurrentUser } from '../../../shared/composables/useCurrentUser.js'
import { useDebouncedRef } from '../../../shared/composables/useDebouncedRef.js'
import { defaultFieldSettings } from '../../../shared/lib/reviewFormUtils.js'
import { useRecentViews } from '../../NavRail/composables/useRecentViews.js'
import {
  fetchAsset,
  fetchCollection,
  fetchStigRevisions,
} from '../api/assetReviewApi.js'
import { useChecklistData } from '../composables/useChecklistData.js'
import { useReviewActions } from '../composables/useReviewActions.js'
import { useRuleDetail } from '../composables/useRuleDetail.js'
import ChecklistGrid from './ChecklistGrid.vue'
import RuleInfo from './RuleInfo.vue'

const route = useRoute()
const router = useRouter()
const { addView, removeView } = useRecentViews()
const { getCollectionRoleId } = useCurrentUser()

const collectionId = computed(() => route.params.collectionId)
const assetId = computed(() => route.params.assetId)
const benchmarkId = computed(() => route.params.benchmarkId)
const revisionStr = computed(() => route.params.revisionStr)

// Fatal route-level error handler.
// Only used for fetchAsset and fetchCollection — the two resources that define
// whether this page is accessible at all. Any error on these → redirect.
function handleRouteError(err) {
  const status = getHttpStatus(err)
  const isPrivilegeError = err.body?.error === 'User has insufficient privilege to complete this request.'
  if (status === 404 || status === 403 || status === 400 || isPrivilegeError) {
    removeView(key => key.includes(`:${collectionId.value}:${assetId.value}`))
    router.push({ name: 'not-found', params: { pathMatch: route.path.substring(1).split('/') } })
  }
  else {
    // Unexpected error on a critical resource → also treat as inaccessible
    removeView(key => key.includes(`:${collectionId.value}:${assetId.value}`))
    router.push({ name: 'not-found', params: { pathMatch: route.path.substring(1).split('/') } })
  }
}

const { state: asset, isLoading, error, execute: loadAsset } = useAsyncState(
  () => fetchAsset(assetId.value),
  { immediate: false, onError: handleRouteError },
)

const { state: collection, execute: loadCollection } = useAsyncState(
  () => fetchCollection(collectionId.value),
  { immediate: false, onError: handleRouteError },
)

watch(assetId, () => {
  if (assetId.value) {
    loadAsset()
  }
}, { immediate: true })

watch(collectionId, () => {
  if (collectionId.value) {
    loadCollection()
  }
}, { immediate: true })

const fieldSettings = computed(() => collection.value?.settings?.fields ?? defaultFieldSettings)
const statusSettings = computed(() => collection.value?.settings?.status ?? {
  canAccept: false,
  minAcceptGrant: 4,
  resetCriteria: 'result',
})

const roleId = computed(() => getCollectionRoleId(collectionId.value))
const canAccept = computed(() =>
  statusSettings.value.canAccept && roleId.value >= statusSettings.value.minAcceptGrant,
)

const { state: stigRevisions, execute: loadStigRevisions } = useAsyncState(
  () => fetchStigRevisions(benchmarkId.value),
  { immediate: false, initialState: [] },
)

const revisionInfo = computed(() => {
  const rs = revisionStr.value
  if (!rs) {
    return null
  }
  const match = rs.match(/^V(\d+)R(\d+)$/)
  if (!match) {
    return { display: rs }
  }
  const version = match[1]
  const release = match[2]
  const rev = stigRevisions.value?.find(r => r.revisionStr === rs)
  const benchmarkDate = rev?.benchmarkDate
    ? new Date(rev.benchmarkDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : null
  return {
    display: benchmarkDate ? `Version ${version} Release ${release} (${benchmarkDate})` : `Version ${version} Release ${release}`,
    version,
    release,
    benchmarkDate,
  }
})

const {
  accessMode,
  checklistData,
  isChecklistLoading,
  checklistError,
  gridData,
  loadChecklist,
  loadAllReviews,
  upsertReview,
} = useChecklistData({ collectionId, assetId, benchmarkId, revisionStr })

const {
  selectedRuleId,
  selectedChecklistItem,
  ruleContent,
  isRuleLoading,
  ruleContentError,
  currentReview,
  reviewHistory,
  selectRule,
  clearSelectedRule,
} = useRuleDetail({ collectionId, assetId, benchmarkId, revisionStr, checklistData })

const {
  isSaving,
  saveError,
  clearSaveError,
  saveFullReview,
  saveStatusAction,
} = useReviewActions({ collectionId, assetId }, { gridData, upsertReview, selectedRuleId, currentReview })

watch([benchmarkId, revisionStr, asset], () => {
  clearSelectedRule()
  if (benchmarkId.value && revisionStr.value && asset.value) {
    if (!stigRevisions.value?.length) {
      loadStigRevisions()
    }
    loadChecklist()
    loadAllReviews()
  }
}, { immediate: true })

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

// If the checklist fetch fails (e.g. bad benchmarkId/revisionStr), remove the
// recent view entry so the nav rail doesn't pin a broken route.
watch(checklistError, (err) => {
  if (err) {
    removeView(key => key.includes(`:${collectionId.value}:${assetId.value}`))
  }
})

function onRowSave({ ruleId, result, detail, comment, status }) {
  saveFullReview(ruleId, { result, detail, comment, status })
}

function onStatusAction({ ruleId, actionType }) {
  saveStatusAction(ruleId, actionType)
}

function onGridRefresh() {
  loadChecklist()
  loadAllReviews()
}

const searchFilter = useDebouncedRef('', 220)
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
      <div v-if="checklistError" class="asset-review__checklist-error">
        <i class="pi pi-exclamation-triangle" />
        <span>Could not load checklist: {{ checklistError.message || 'Unknown error' }}</span>
        <button class="asset-review__retry-btn" @click="loadChecklist">
          Retry
        </button>
      </div>

      <Splitter
        v-else
        :pt="{
          gutter: { style: 'background: var(--color-border-dark)' },
          root: { style: 'border: none; background: transparent' },
        }"
        style="height: 100%"
      >
        <SplitterPanel :size="75" :min-size="40">
          <ChecklistGrid
            :grid-data="gridData"
            :is-loading="isChecklistLoading"
            :selected-rule-id="selectedRuleId"
            :access-mode="accessMode"
            :revision-info="revisionInfo"
            :asset="asset"
            :field-settings="fieldSettings"
            :can-accept="canAccept"
            :is-saving="isSaving"
            :save-error="saveError"
            :search-filter="searchFilter"
            :current-review="currentReview"
            :review-history="reviewHistory"
            @update:search-filter="searchFilter = $event"
            @select-rule="selectRule"
            @row-save="onRowSave"
            @status-action="onStatusAction"
            @refresh="onGridRefresh"
            @clear-save-error="clearSaveError"
          />
        </SplitterPanel>
        <SplitterPanel :size="25" :min-size="20">
          <RuleInfo
            :rule-content="ruleContent"
            :is-loading="isRuleLoading"
            :rule-content-error="ruleContentError"
            :selected-checklist-item="selectedChecklistItem"
            @retry="selectRule(selectedRuleId)"
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

.asset-review__content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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

.asset-review__checklist-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: color-mix(in srgb, var(--color-text-error, #e74c3c) 12%, var(--color-background-dark));
  border-bottom: 1px solid color-mix(in srgb, var(--color-text-error, #e74c3c) 40%, transparent);
  color: var(--color-text-error, #e74c3c);
  font-size: 1rem;
  flex-shrink: 0;
}

.asset-review__checklist-error .pi {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.asset-review__retry-btn {
  margin-left: auto;
  background: none;
  border: 1px solid var(--color-text-error, #e74c3c);
  color: var(--color-text-error, #e74c3c);
  border-radius: 4px;
  padding: 0.15rem 0.6rem;
  cursor: pointer;
  font-size: 1rem;
  flex-shrink: 0;
  opacity: 0.85;
  transition: opacity 0.15s;
}

.asset-review__retry-btn:hover {
  opacity: 1;
}
</style>
