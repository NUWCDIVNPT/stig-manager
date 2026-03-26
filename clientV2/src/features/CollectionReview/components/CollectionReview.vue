<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import RuleInfo from '../../AssetReview/components/RuleInfo.vue'
import { fetchCollectionChecklist, fetchRuleContent } from '../api/collectionReviewApi.js'
import CollectionChecklistGrid from './CollectionChecklistGrid.vue'

const route = useRoute()

const collectionId = computed(() => route.params.collectionId)
const benchmarkId = computed(() => route.params.benchmarkId)
const revisionStr = computed(() => route.params.revisionStr)

// --- Checklist data ---
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

// --- Load data on route change ---
watch([collectionId, benchmarkId, revisionStr], () => {
  selectedRuleId.value = null
  ruleContent.value = null
  if (collectionId.value && benchmarkId.value && revisionStr.value) {
    loadChecklist()
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
}

// --- Aggregate stats ---
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

            <!-- Bottom: Asset Reviews Table (placeholder) -->
            <SplitterPanel :size="50" :min-size="20">
              <div class="cr-panel">
                <div class="cr-panel__header">
                  <span v-if="selectedRuleId" class="cr-panel__title">
                    Reviews of {{ selectedRuleId }}
                  </span>
                  <span v-else class="cr-panel__title cr-panel__title--dim">
                    Select a rule to view reviews
                  </span>
                </div>

                <div class="cr-panel__toolbar">
                  <button type="button" class="cr-action-btn" disabled title="Accept">
                    <i class="pi pi-star" />
                    <span>Accept</span>
                  </button>
                  <button type="button" class="cr-action-btn" disabled title="Reject">
                    <i class="pi pi-ban" />
                    <span>Reject</span>
                  </button>
                  <span class="cr-toolbar__divider" />
                  <button type="button" class="cr-action-btn" disabled title="Submit">
                    <i class="pi pi-check" />
                    <span>Submit</span>
                  </button>
                  <button type="button" class="cr-action-btn" disabled title="Unsubmit">
                    <i class="pi pi-replay" />
                    <span>Unsubmit</span>
                  </button>
                  <span class="cr-toolbar__divider" />
                  <button type="button" class="cr-action-btn" disabled title="Batch edit">
                    <i class="pi pi-pencil" />
                    <span>Batch edit</span>
                  </button>
                </div>

                <div class="cr-panel__body">
                  <div class="cr-panel__placeholder">
                    <template v-if="selectedRuleId">
                      Asset reviews table
                    </template>
                    <template v-else>
                      Select a rule to view asset reviews
                    </template>
                  </div>
                </div>

                <div class="cr-panel__footer">
                  <div class="cr-panel__footer-left">
                    <button type="button" class="cr-footer-btn" title="Refresh" disabled>
                      <i class="pi pi-refresh" />
                    </button>
                    <button type="button" class="cr-footer-btn" title="Export CSV" disabled>
                      <i class="pi pi-download" />
                      <span>CSV</span>
                    </button>
                  </div>
                  <div class="cr-panel__footer-right">
                    <span class="cr-stat cr-stat--count" title="Reviews">
                      <span class="cr-stat__value">&mdash;</span>
                      <span class="cr-stat__label">reviews</span>
                    </span>
                  </div>
                </div>
              </div>
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

/* --- Reviews panel (bottom) --- */
.cr-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background-subtle);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  overflow: hidden;
}

.cr-panel__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  background-color: var(--color-background-dark);
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.cr-panel__title {
  font-weight: 600;
  font-size: 1rem;
  color: var(--color-text-primary);
}

.cr-panel__title--dim {
  color: var(--color-text-dim);
}

.cr-panel__toolbar {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.5rem;
  background-color: var(--color-background-dark);
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.cr-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.6rem;
  background-color: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  color: var(--color-text-primary);
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;
}

.cr-action-btn:hover:not(:disabled) {
  background-color: var(--color-bg-hover-strong);
}

.cr-action-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.cr-action-btn i {
  font-size: 1rem;
}

.cr-toolbar__divider {
  width: 1px;
  height: 1.2rem;
  background-color: var(--color-border-default);
  margin: 0 0.15rem;
}

.cr-panel__body {
  flex: 1;
  overflow: auto;
}

.cr-panel__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-dim);
}

.cr-panel__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.3rem 0.4rem;
  background-color: var(--color-background-subtle);
  border-top: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.cr-panel__footer-left {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.cr-panel__footer-right {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.cr-footer-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0.35rem;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--color-text-dim);
  cursor: pointer;
  transition: color 0.15s, background-color 0.15s;
}

.cr-footer-btn:hover:not(:disabled) {
  color: var(--color-primary-highlight);
  background-color: var(--color-button-hover-bg);
}

.cr-footer-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.cr-stat {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.1rem 0.3rem;
  border: 1px solid var(--color-border-default);
  border-radius: 2px;
  background-color: var(--color-background-subtle);
}

.cr-stat__label {
  color: var(--color-text-dim);
}

.cr-stat__value {
  font-weight: 600;
  color: var(--color-text-bright);
}

.cr-stat--count {
  background-color: color-mix(in srgb, var(--color-primary-highlight) 8%, transparent);
  border-color: color-mix(in srgb, var(--color-primary-highlight) 8%, transparent);
}
</style>
