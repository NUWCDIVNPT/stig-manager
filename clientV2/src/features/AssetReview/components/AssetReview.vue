<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { computed, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'
import RuleInfo from '../../../components/common/RuleInfo.vue'
import { notFoundLocation } from '../../../router/notFound.js'
import { getHttpStatus } from '../../../shared/api/apiClient.js'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useCurrentUser } from '../../../shared/composables/useCurrentUser.js'
import { useQuerySelection } from '../../../shared/composables/useQuerySelection.js'
import { useStigRevisions } from '../../../shared/composables/useStigRevisions.js'
import { useTours } from '../../../shared/composables/useTours.js'
import { getRevisionInfo } from '../../../shared/lib/checklistUtils.js'
import { defaultFieldSettings } from '../../../shared/lib/reviewFormUtils.js'
import { useRecentViews } from '../../NavRail/composables/useRecentViews.js'
import {
  fetchAsset,
  fetchCollection,
} from '../api/assetReviewApi.js'
import { useChecklistData } from '../composables/useChecklistData.js'
import { useRuleDetail } from '../composables/useRuleDetail.js'
import AssetChecklistGrid from './AssetChecklistGrid.vue'

const route = useRoute()
const router = useRouter()
const { addView, removeView } = useRecentViews()
const { getCollectionRoleId } = useCurrentUser()
const { offerTourWhen } = useTours()

const collectionId = computed(() => route.params.collectionId)
const assetId = computed(() => route.params.assetId)
const benchmarkId = computed(() => route.params.benchmarkId)
const revisionStr = computed(() => route.params.revisionStr)

// Fatal route-level error handler.
// Only used for fetchAsset and fetchCollection — the two resources that define
// whether this page is accessible at all. Any error on these → redirect.
function redirectToNotFound() {
  removeView(key => key.includes(`:${collectionId.value}:${assetId.value}`))
  router.replace(notFoundLocation(route))
}

function handleRouteError(err) {
  const status = getHttpStatus(err)
  if (status === 404 || status === 403 || status === 400) {
    redirectToNotFound()
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
    // Clear first so the header does not show the previous asset while this one loads
    asset.value = null
    loadAsset()
  }
}, { immediate: true })

// The URL's collection drives settings, role and save targets, so an asset from another collection is a bad URL
watch([asset, collectionId], ([a, cId]) => {
  if (a && String(a.collection?.collectionId) !== String(cId)) {
    redirectToNotFound()
  }
})

watch(collectionId, () => {
  if (collectionId.value) {
    loadCollection()
  }
}, { immediate: true })

const fieldSettings = computed(() => collection.value?.settings?.fields ?? defaultFieldSettings)
const statusSettings = computed(() => collection.value?.settings?.status ?? {
  canAccept: false,
  minAcceptGrant: 4,
})

const roleId = computed(() => getCollectionRoleId(collectionId.value))
const canAccept = computed(() =>
  statusSettings.value.canAccept && roleId.value >= statusSettings.value.minAcceptGrant,
)

const { revisions: stigRevisions } = useStigRevisions({ benchmarkId, revisionStr, onUnknown: redirectToNotFound })

const revisionInfo = computed(() => getRevisionInfo(revisionStr.value, stigRevisions.value, collectionId.value))

const {
  accessMode,
  checklistData,
  isChecklistLoading,
  checklistError,
  gridData,
  ruleLookupMap,
  loadChecklist,
  upsertReview,
} = useChecklistData({ assetId, benchmarkId, revisionStr })

const {
  selectedRuleId,
  selectedChecklistItem,
  ruleContent,
  isRuleLoading,
  ruleContentError,
  selectRule,
  // Kept in ?ruleId (like Collection Review), so Back, reload, links and the Findings shield select the rule;
  // the grid replaces a stale one with its first rule once the checklist loads
} = useRuleDetail({ ruleLookupMap, collectionId, assetId, benchmarkId, revisionStr, selectedRuleId: useQuerySelection('ruleId') })

// assetId is included because the router reuses this component when only the
// asset changes (Recent views, Back/Forward); without it the grid would keep
// the previous asset's rows while saves target the new asset.
watch([assetId, benchmarkId, revisionStr], () => {
  checklistData.value = []
  if (benchmarkId.value && revisionStr.value) {
    loadChecklist()
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

// The tour points at the checklist and Rule panels, so it waits for them.
offerTourWhen('assetReview', () => Boolean(asset.value && gridData.value?.length))

function mergeReview(review) {
  upsertReview(review.ruleId, review)
}

function onGridRefresh() {
  loadChecklist()
}

const checklistGrid = ref(null)

onBeforeRouteLeave(() => !checklistGrid.value?.blockIfUnsaved())

// The router reuses this view across assets, and each rule click rewrites
// ?ruleId, so only a change of path can be leaving the open review.
onBeforeRouteUpdate((to, from) => to.path === from.path || !checklistGrid.value?.blockIfUnsaved())
</script>

<template>
  <div class="asset-review">
    <div v-if="error" class="asset-review__error">
      {{ error || 'Error loading asset' }}
    </div>
    <!-- Keep the grid mounted while the asset loads; child components tolerate a null asset -->
    <div v-else-if="asset || isLoading" class="asset-review__content">
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
          <AssetChecklistGrid
            ref="checklistGrid"
            data-tour="asset-review-checklist"
            :grid-data="gridData"
            :is-checklist-loading="isChecklistLoading"
            :selected-rule-id="selectedRuleId"
            :asset="asset"
            :revision-info="revisionInfo"
            :access-mode="accessMode"
            :select-rule="selectRule"
            :rule-lookup-map="ruleLookupMap"
            :field-settings="fieldSettings"
            :can-accept="canAccept"
            :collection-id="collectionId"
            :asset-id="assetId"
            @review-saved="mergeReview"
            @review-loaded="mergeReview"
            @refresh="onGridRefresh"
          />
        </SplitterPanel>
        <SplitterPanel :size="25" :min-size="20">
          <RuleInfo
            data-tour="asset-review-rule"
            :rule-content="ruleContent"
            :is-loading="isRuleLoading"
            :rule-content-error="ruleContentError"
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
  font-size: var(--text-md);
  flex-shrink: 0;
}

.asset-review__checklist-error .pi {
  font-size: var(--text-lg);
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
  font-size: var(--text-md);
  flex-shrink: 0;
  opacity: 0.85;
  transition: opacity 0.15s;
}

.asset-review__retry-btn:hover {
  opacity: 1;
}
</style>
