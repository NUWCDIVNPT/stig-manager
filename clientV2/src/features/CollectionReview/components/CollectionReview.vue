<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import RuleInfo from '../../../components/common/RuleInfo.vue'
import { getHttpStatus } from '../../../shared/api/apiClient.js'
import { fetchCollection } from '../../../shared/api/collectionsApi.js'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useCurrentUser } from '../../../shared/composables/useCurrentUser.js'
import { defaultFieldSettings, statusPayloadForAction } from '../../../shared/lib/reviewFormUtils.js'
import { useRecentViews } from '../../NavRail/composables/useRecentViews.js'
import { fetchAssetsByCollectionStig, fetchCollectionChecklist, fetchReviewsByRule, fetchRule, postReviewBatch } from '../api/collectionReviewApi.js'
import { useReviewActionAvailability } from '../composables/useReviewActionAvailability.js'
import BatchEditModal from './BatchEditModal.vue'
import CollectionChecklistGrid from './CollectionChecklistGrid.vue'
import RejectReasonModal from './RejectReasonModal.vue'
import RuleTable from './RuleTable.vue'

const route = useRoute()
const router = useRouter()
const { addView, removeView } = useRecentViews()
const { getCollectionRoleId } = useCurrentUser()

const collectionId = computed(() => route.params.collectionId)
const benchmarkId = computed(() => route.params.benchmarkId)
const revisionStr = computed(() => route.params.revisionStr)

function recentViewKey(cId = collectionId.value, bId = benchmarkId.value) {
  return `collection-review:${cId}:${bId}`
}

function handleRouteError(err) {
  const status = getHttpStatus(err)
  const isPrivilegeError = err.body?.error === 'User has insufficient privilege to complete this request.'
  if (status === 404 || status === 403 || status === 400 || isPrivilegeError) {
    removeView(key => key.includes(`:${collectionId.value}:${benchmarkId.value}`))
    router.push({ name: 'not-found', params: { pathMatch: route.path.substring(1).split('/') } })
  }
}
const { state: collection, execute: loadCollection } = useAsyncState(
  () => fetchCollection(collectionId.value),
  { immediate: false, initialState: null, onError: handleRouteError },
)

const fieldSettings = computed(() => collection.value?.settings?.fields ?? defaultFieldSettings)
const statusSettings = computed(() => collection.value?.settings?.status)

const roleId = computed(() => getCollectionRoleId(collectionId.value))
const canAccept = computed(() =>
  statusSettings.value?.canAccept
  && statusSettings.value?.minAcceptGrant !== undefined
  && roleId.value >= statusSettings.value.minAcceptGrant,
)

const { state: gridData, isLoading: isChecklistLoading, error: checklistError, execute: loadChecklist } = useAsyncState(
  () => fetchCollectionChecklist(collectionId.value, benchmarkId.value, revisionStr.value),
  { immediate: false, initialState: [] },
)

const { state: assets, execute: loadAssets } = useAsyncState(
  () => fetchAssetsByCollectionStig(collectionId.value, benchmarkId.value),
  { immediate: false, initialState: [] },
)

const assetCount = computed(() => assets.value?.length ?? 0)

const selectedRuleId = ref(null)

const {
  state: ruleContent,
  isLoading: isRuleLoading,
  error: ruleContentError,
  execute: loadRuleContent,
} = useAsyncState(
  ruleId => fetchRule(benchmarkId.value, revisionStr.value, ruleId),
  { immediate: false, initialState: null, onError: null },
)

const {
  state: reviewsData,
  isLoading: isReviewsLoading,
  execute: loadReviews,
} = useAsyncState(
  ruleId => fetchReviewsByRule(collectionId.value, ruleId),
  { immediate: false, initialState: [], onError: null },
)

const mergedReviewsData = computed(() => {
  const allAssets = assets.value || []
  const reviews = reviewsData.value || []
  const ruleId = selectedRuleId.value
  const reviewLookup = new Map(reviews.map(r => [r.assetId, r]))
  return allAssets.map((asset) => {
    const base = {
      assetId: asset.assetId,
      assetName: asset.name,
      assetLabels: asset.assetLabels ?? [],
      access: asset.access,
      ruleId,
    }
    const review = reviewLookup.get(asset.assetId)
    return review ? { ...base, ...review } : base
  })
})

watch(collectionId, () => {
  if (collectionId.value) {
    loadCollection()
  }
}, { immediate: true })

watch([collectionId, benchmarkId, revisionStr], () => {
  if (collectionId.value && benchmarkId.value && revisionStr.value) {
    loadChecklist()
    loadAssets()
  }
}, { immediate: true })

watch(
  [collection, () => route.params.benchmarkId, () => route.params.revisionStr],
  ([c]) => {
    if (c?.name && route.params.benchmarkId) {
      addView({
        key: recentViewKey(collectionId.value, route.params.benchmarkId),
        url: route.fullPath,
        label: `${c.name} / ${route.params.benchmarkId}`,
        type: 'collection-review',
      })
    }
  },
)

// If the checklist fetch fails (e.g. bad benchmarkId/revisionStr), remove the
// recent view entry so the nav rail doesn't pin a broken route.
watch(checklistError, (err) => {
  if (err) {
    removeView(recentViewKey())
  }
})

// makes sure selectged is always valid or we pick first item
watch(gridData, (data) => {
  if (!data?.length) {
    selectedRuleId.value = null
    return
  }
  const stillValid = selectedRuleId.value && data.some(r => r.ruleId === selectedRuleId.value)
  if (!stillValid) {
    selectedRuleId.value = data[0].ruleId
  }
})
// load data when we have a selected rule and collection/benchmarkid/revisionstr
watch(selectedRuleId, (ruleId) => {
  if (!ruleId) {
    return
  }
  if (benchmarkId.value && revisionStr.value) {
    loadRuleContent(ruleId)
  }
  if (collectionId.value) {
    loadReviews(ruleId)
  }
})

function onSelectRule(ruleId) {
  selectedRuleId.value = ruleId
}

const showRuleLoading = computed(() => isRuleLoading.value && !ruleContent.value)
const showReviewsLoading = computed(() => isReviewsLoading.value)

const selectedAssetIds = ref(new Set())

const selectedRows = computed({
  get: () => {
    const ids = selectedAssetIds.value
    if (!ids.size) {
      return []
    }
    return mergedReviewsData.value.filter(r => ids.has(r.assetId))
  },
  set: (rows) => {
    selectedAssetIds.value = new Set((rows || []).map(r => r.assetId))
  },
})

const { actionStates } = useReviewActionAvailability(selectedRows, fieldSettings)

// clearing selected rows when we change ruleid
watch(selectedRuleId, () => {
  selectedAssetIds.value = new Set()
})

function upsertReview(assetId, updated) {
  if (!reviewsData.value) {
    return
  }
  const idx = reviewsData.value.findIndex(r => r.assetId === assetId)
  if (idx === -1) {
    reviewsData.value = [...reviewsData.value, { ...updated, assetId }]
  }
  else {
    const merged = { ...reviewsData.value[idx], ...updated, assetId }
    reviewsData.value = [
      ...reviewsData.value.slice(0, idx),
      merged,
      ...reviewsData.value.slice(idx + 1),
    ]
  }
}

function onReviewSaved(review) {
  upsertReview(review.assetId, review)
}

const isBulkSaving = ref(false)

const rejectModalVisible = ref(false)
const batchEditModalVisible = ref(false)
const pendingRejectRows = ref([])

async function runBulkAction(actionType, rows, rejectText) {
  if (!rows?.length) { return }
  const status = statusPayloadForAction(actionType, rejectText)
  if (status === null) { return }
  isBulkSaving.value = true
  try {
    await postReviewBatch(collectionId.value, {
      source: { review: { status } },
      assets: { assetIds: rows.map(r => r.assetId) },
      rules: { ruleIds: [selectedRuleId.value] },
    })
    if (selectedRuleId.value) { await loadReviews(selectedRuleId.value) }
  }
  finally {
    isBulkSaving.value = false
  }
}

function onBulkAction(actionType) {
  const rows = selectedRows.value
  if (!rows?.length) { return }
  if (actionType === 'batchEdit') {
    batchEditModalVisible.value = true
    return
  }
  if (actionType === 'reject') {
    pendingRejectRows.value = [...rows]
    rejectModalVisible.value = true
    return
  }
  runBulkAction(actionType, rows)
}

function onRejectConfirm(text) {
  const rows = pendingRejectRows.value
  pendingRejectRows.value = []
  if (!rows.length) { return }
  runBulkAction('reject', rows, text)
}

function onRejectCancel() {
  pendingRejectRows.value = []
}

async function onBatchEditConfirm(payload) {
  const rows = selectedRows.value
  if (!rows?.length) { return }
  isBulkSaving.value = true
  try {
    await postReviewBatch(collectionId.value, {
      source: { review: payload },
      assets: { assetIds: rows.map(r => r.assetId) },
      rules: { ruleIds: [selectedRuleId.value] },
    })
    if (selectedRuleId.value) { await loadReviews(selectedRuleId.value) }
  }
  finally {
    isBulkSaving.value = false
  }
}
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
        <SplitterPanel :size="75" :min-size="40">
          <Splitter
            layout="vertical"
            :pt="{
              gutter: { style: 'background: var(--color-border-dark)' },
              root: { style: 'border: none; background: transparent' },
            }"
            style="height: 100%"
          >
            <SplitterPanel :size="50" :min-size="20">
              <CollectionChecklistGrid
                :grid-data="gridData ?? []"
                :is-loading="isChecklistLoading"
                :selected-rule-id="selectedRuleId"
                :asset-count="assetCount"
                @select-rule="onSelectRule"
                @refresh="loadChecklist"
              />
            </SplitterPanel>
            <SplitterPanel :size="50" :min-size="20">
              <RuleTable
                v-model:selection="selectedRows"
                :grid-data="mergedReviewsData"
                :is-loading="showReviewsLoading"
                :selected-rule-id="selectedRuleId"
                :collection-id="collectionId"
                :field-settings="fieldSettings"
                :can-accept="canAccept"
                :is-saving="isBulkSaving"
                :action-states="actionStates"
                @review-saved="onReviewSaved"
                @bulk-action="onBulkAction"
              />
            </SplitterPanel>
          </Splitter>
        </SplitterPanel>

        <SplitterPanel :size="25" :min-size="20">
          <RuleInfo
            :rule-content="ruleContent"
            :is-loading="showRuleLoading"
            :rule-content-error="ruleContentError"
          />
        </SplitterPanel>
      </Splitter>
    </div>

    <RejectReasonModal
      v-model:visible="rejectModalVisible"
      :count="pendingRejectRows.length"
      @confirm="onRejectConfirm"
      @cancel="onRejectCancel"
    />

    <BatchEditModal
      v-model:visible="batchEditModalVisible"
      :rows="selectedRows"
      :field-settings="fieldSettings"
      @confirm="onBatchEditConfirm"
    />
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
  display: flex;
  flex-direction: column;
}
</style>
