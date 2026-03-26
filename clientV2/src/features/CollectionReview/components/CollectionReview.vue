<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useCurrentUser } from '../../../shared/composables/useCurrentUser.js'
import { defaultFieldSettings } from '../../../shared/lib/reviewFormUtils.js'
import RuleInfo from '../../AssetReview/components/RuleInfo.vue'
import {
  fetchAssetsByBenchmark,
  fetchCollection,
  fetchCollectionChecklist,
  fetchReviewsByRule,
  fetchRuleContent,
  patchReview,
  putReview,
} from '../api/collectionReviewApi.js'
import CollectionAssetReviewsGrid from './CollectionAssetReviewsGrid.vue'
import CollectionChecklistGrid from './CollectionChecklistGrid.vue'

const route = useRoute()
const { getCollectionRoleId } = useCurrentUser()

const collectionId = computed(() => route.params.collectionId)
const benchmarkId = computed(() => route.params.benchmarkId)
const revisionStr = computed(() => route.params.revisionStr)

// --- Collection settings (for field settings, accept permissions) ---
const { state: collection, execute: loadCollection } = useAsyncState(
  () => fetchCollection(collectionId.value),
  { immediate: false },
)

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

// --- Checklist data (top grid) ---
const { state: checklistData, isLoading: isChecklistLoading, execute: loadChecklist } = useAsyncState(
  () => fetchCollectionChecklist(collectionId.value, benchmarkId.value, revisionStr.value),
  { initialState: [], immediate: false },
)

// --- Rule content for info panel ---
const selectedRuleId = ref(null)

const { state: ruleContent, isLoading: isRuleLoading, execute: loadRuleContent } = useAsyncState(
  () => fetchRuleContent(benchmarkId.value, revisionStr.value, selectedRuleId.value),
  { immediate: false, onError: null },
)

const selectedChecklistItem = computed(() => {
  if (!selectedRuleId.value || !checklistData.value?.length) {
    return null
  }
  return checklistData.value.find(r => r.ruleId === selectedRuleId.value) || null
})

// --- Asset list (fetched once per STIG, persists across rule selections) ---
const { state: assetsByBenchmark, isLoading: isAssetsLoading, execute: loadAssets } = useAsyncState(
  () => fetchAssetsByBenchmark(collectionId.value, benchmarkId.value),
  { initialState: [], immediate: false },
)

// --- Reviews for selected rule (fetched per rule selection) ---
const { state: reviewsByRule, isLoading: isReviewsLoading, execute: loadReviews } = useAsyncState(
  () => fetchReviewsByRule(collectionId.value, selectedRuleId.value),
  { initialState: [], immediate: false },
)

// --- Merged asset reviews (assets + reviews joined by assetId) ---
const mergedAssetReviews = computed(() => {
  const assets = assetsByBenchmark.value
  if (!assets?.length) {
    return []
  }

  const reviewMap = new Map()
  for (const review of (reviewsByRule.value || [])) {
    reviewMap.set(review.assetId, review)
  }

  return assets.map((asset) => {
    const review = reviewMap.get(asset.assetId)
    return {
      assetId: asset.assetId,
      assetName: review?.assetName || asset.name,
      assetLabels: review?.assetLabels || asset.assetLabels || [],
      access: asset.access || 'rw',
      ruleId: selectedRuleId.value,
      result: review?.result || null,
      detail: review?.detail || null,
      comment: review?.comment || null,
      resultEngine: review?.resultEngine || null,
      username: review?.username || null,
      touchTs: review?.touchTs || null,
      status: review?.status || null,
    }
  })
})

// --- Load data on route change ---
watch([collectionId, benchmarkId, revisionStr], () => {
  selectedRuleId.value = null
  ruleContent.value = null
  reviewsByRule.value = []
  if (collectionId.value) {
    loadCollection()
  }
  if (collectionId.value && benchmarkId.value && revisionStr.value) {
    loadChecklist()
    loadAssets()
  }
}, { immediate: true })

// --- Rule selection ---
function selectRule(ruleId) {
  if (selectedRuleId.value === ruleId) {
    return
  }
  selectedRuleId.value = ruleId
  if (ruleId && benchmarkId.value && revisionStr.value) {
    loadRuleContent()
  }
  if (ruleId && collectionId.value) {
    loadReviews()
  }
  else {
    reviewsByRule.value = []
  }
}

// --- Upsert review into local data after save ---
function upsertReview(assetId, review) {
  const idx = reviewsByRule.value.findIndex(r => r.assetId === assetId)
  if (idx !== -1) {
    reviewsByRule.value = [
      ...reviewsByRule.value.slice(0, idx),
      review,
      ...reviewsByRule.value.slice(idx + 1),
    ]
  }
  else {
    reviewsByRule.value = [...reviewsByRule.value, review]
  }
}

// --- Save handlers ---
const { isLoading: isSavingReview, execute: executeSave } = useAsyncState(
  async (assetId, ruleId, { result, detail, comment, status }) => {
    const body = {
      result,
      detail: detail ?? '',
      comment: comment ?? '',
      status: status || 'saved',
    }
    const updated = await putReview(collectionId.value, assetId, ruleId, body)
    upsertReview(assetId, updated)
    loadChecklist()
    return updated
  },
  { immediate: false },
)

const { isLoading: isSavingStatus, execute: executeStatusAction } = useAsyncState(
  async (assetId, ruleId, actionType) => {
    const statusMap = { accept: 'accepted', submit: 'submitted', unsubmit: 'saved' }
    const updated = await patchReview(collectionId.value, assetId, ruleId, { status: statusMap[actionType] })
    upsertReview(assetId, updated)
    loadChecklist()
    return updated
  },
  { immediate: false },
)

const isSaving = computed(() => isSavingReview.value || isSavingStatus.value)

// --- Event handlers for asset reviews grid ---
function onAssetReviewSave({ assetId, ruleId, result, detail, comment, status }) {
  executeSave(assetId, ruleId, { result, detail, comment, status })
}

function onAssetStatusAction({ assetId, ruleId, actionType }) {
  executeStatusAction(assetId, ruleId, actionType)
}

function refreshAssetReviews() {
  if (selectedRuleId.value && collectionId.value) {
    loadReviews()
  }
}

// --- Aggregate stats for checklist grid ---
const stats = computed(() => {
  const data = checklistData.value
  if (!data?.length) {
    return null
  }

  const results = { fail: 0, pass: 0, notapplicable: 0, other: 0 }
  const statuses = { saved: 0, submitted: 0, accepted: 0, rejected: 0 }

  for (const item of data) {
    results.fail += item.counts?.results?.fail || 0
    results.pass += item.counts?.results?.pass || 0
    results.notapplicable += item.counts?.results?.notapplicable || 0
    results.other += item.counts?.results?.other || 0
    statuses.saved += item.counts?.statuses?.saved || 0
    statuses.submitted += item.counts?.statuses?.submitted || 0
    statuses.accepted += item.counts?.statuses?.accepted || 0
    statuses.rejected += item.counts?.statuses?.rejected || 0
  }

  return { results, statuses, total: data.length }
})

const headerTitle = computed(() => `${benchmarkId.value} ${revisionStr.value}`)
</script>

<template>
  <div class="collection-review">
    <div class="collection-review__content">
      <Splitter
        :pt="{
          gutter: { style: 'background: var(--color-border-dark)' },
          root: { style: 'border: none; background: transparent' },
        }"
        style="height: 100%"
      >
        <!-- Left: Rule Table + Asset Reviews (vertical split) -->
        <SplitterPanel :size="70" :min-size="40">
          <Splitter
            layout="vertical"
            :pt="{
              gutter: { style: 'background: var(--color-border-dark)' },
              root: { style: 'border: none; background: transparent' },
            }"
            style="height: 100%"
          >
            <!-- Top: Rule Checklist Table -->
            <SplitterPanel :size="50" :min-size="20">
              <CollectionChecklistGrid
                :checklist-data="checklistData"
                :is-loading="isChecklistLoading"
                :selected-rule-id="selectedRuleId"
                :stats="stats"
                :header-title="headerTitle"
                @select-rule="selectRule"
                @refresh="loadChecklist"
              />
            </SplitterPanel>

            <!-- Bottom: Asset Reviews Table -->
            <SplitterPanel :size="50" :min-size="20">
              <CollectionAssetReviewsGrid
                :grid-data="mergedAssetReviews"
                :is-loading="isReviewsLoading || isAssetsLoading"
                :selected-rule-id="selectedRuleId"
                :field-settings="fieldSettings"
                :can-accept="canAccept"
                :is-saving="isSaving"
                @row-save="onAssetReviewSave"
                @status-action="onAssetStatusAction"
                @refresh="refreshAssetReviews"
              />
            </SplitterPanel>
          </Splitter>
        </SplitterPanel>

        <!-- Right: Rule Info Panel -->
        <SplitterPanel :size="30" :min-size="20">
          <RuleInfo
            :rule-content="ruleContent"
            :is-loading="isRuleLoading"
            :selected-checklist-item="selectedChecklistItem"
          />
        </SplitterPanel>
      </Splitter>
    </div>
  </div>
</template>

<style scoped>
.collection-review {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--color-background-darkest);
  color: var(--color-text-primary);
}

.collection-review__content {
  flex: 1;
  overflow: hidden;
}
</style>
