<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import RuleInfo from '../../../components/common/RuleInfo.vue'
import { getHttpStatus } from '../../../shared/api/apiClient.js'
import { fetchStigRevisions } from '../../../shared/api/stigsApi.js'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useBenchmarkList } from '../composables/useBenchmarkList.js'
import { useRevisionDiff } from '../composables/useRevisionDiff.js'
import { useRevisionRules } from '../composables/useRevisionRules.js'
import { useRuleSelection } from '../composables/useRuleSelection.js'
import { setLastStigLibraryUrl } from '../lastVisited.js'
import BenchmarkListTable from './BenchmarkListTable.vue'
import BenchmarksTable from './BenchmarksTable.vue'
import DiffDetailPanel from './DiffDetailPanel.vue'
import RulePane from './RulePane.vue'

const route = useRoute()
const router = useRouter()

const benchmarkIdParam = computed(() => route.params.benchmarkId ?? null)
const revisionStrParam = computed(() => route.params.revisionStr ?? null)
const compareRev = computed(() => route.query.compareRev ?? null)
const selectedRuleId = computed(() => route.query.ruleId ?? null)
const selectedDiffRowKey = computed(() => route.query.diffKey ?? null)

const hasSelection = computed(() => !!benchmarkIdParam.value)
const diffMode = computed(() => !!compareRev.value)

function handleRouteError(err) {
  const status = getHttpStatus(err)
  if (status === 403 || status === 404 || status === 400) {
    router.push({ name: 'not-found', params: { pathMatch: route.path.substring(1).split('/') } })
  }
}

const {
  benchmarks,
  filter,
  filtered,
  totalCount,
  isLoading: benchmarksLoading,
  error: benchmarksError,
  reload: reloadBenchmarks,
} = useBenchmarkList({ onRouteError: handleRouteError })

const selectedBenchmark = computed(() => {
  const id = benchmarkIdParam.value
  if (!id) {
    return null
  }
  return (benchmarks.value ?? []).find(b => b.benchmarkId === id) ?? null
})

const effectiveViewRev = computed(() => revisionStrParam.value ?? selectedBenchmark.value?.lastRevisionStr ?? null)

const {
  state: benchmarkRevisions,
  isLoading: revisionsLoading,
  execute: loadRevisions,
} = useAsyncState(
  bm => fetchStigRevisions(bm),
  { immediate: false, initialState: [], onError: null },
)

watch(
  benchmarkIdParam,
  (bm) => {
    if (bm) {
      loadRevisions(bm)
    }
    else {
      benchmarkRevisions.value = []
    }
  },
  { immediate: true },
)

const { getRulesForRev, watchCurrent, invalidate: invalidateRules } = useRevisionRules()
const revState = watchCurrent(benchmarkIdParam, effectiveViewRev)

const bmLineClamp = 2
const bmItemSize = 92

// The three panes are self-contained bordered panels, so the gutter is plain
// page background acting as the gap between them.
const splitterPt = {
  root: { style: 'border: none; background: transparent; height: 100%' },
  gutter: { style: 'background: transparent' },
}

const {
  diffRows,
  diffStatus,
  diffError,
  diffDetailFor,
  retry: retryDiff,
  rowByKey,
} = useRevisionDiff({
  benchmarkId: benchmarkIdParam,
  viewRev: effectiveViewRev,
  compareRev,
  getRulesForRev,
})

const {
  ruleContent,
  isRuleLoading,
  ruleContentError,
  retry: retryRule,
} = useRuleSelection({
  benchmarkId: benchmarkIdParam,
  viewRev: effectiveViewRev,
  selectedRuleId,
})

const selectedDiffRow = computed(() =>
  selectedDiffRowKey.value ? rowByKey(selectedDiffRowKey.value) : null,
)
const selectedDiffDetail = computed(() =>
  selectedDiffRowKey.value ? diffDetailFor(selectedDiffRowKey.value) : null,
)

// If a benchmarkId is in the route but not resolvable once the list loads, redirect.
watch([benchmarks, benchmarkIdParam], ([list, bm]) => {
  if (!bm || !list?.length) {
    return
  }
  if (!list.find(b => b.benchmarkId === bm)) {
    router.push({ name: 'not-found', params: { pathMatch: route.path.substring(1).split('/') } })
  }
})

// Auto-select first rule (view mode). router.replace so it doesn't add history.
watch(
  () => revState.rules,
  (rules) => {
    if (!rules?.length) {
      return
    }
    if (diffMode.value) {
      return
    }
    if (selectedRuleId.value) {
      return
    }
    if (!selectedBenchmark.value) {
      return
    }
    replaceQuery({ ruleId: rules[0].ruleId })
  },
  { immediate: true },
)

// Auto-select first diff row when diffRows lands.
watch(
  () => [diffRows.value, diffMode.value, selectedDiffRowKey.value],
  () => {
    if (!diffMode.value) {
      return
    }
    if (selectedDiffRowKey.value) {
      return
    }
    const first = diffRows.value?.[0]
    if (!first) {
      return
    }
    replaceQuery({ diffKey: first.key })
  },
)

// If the current benchmark has only one revision, strip any stale ?compareRev /
// ?diffKey (a user could land here via an old deep-link from a multi-rev benchmark).
watch(benchmarkRevisions, (revs) => {
  if ((revs?.length ?? 0) <= 1 && (compareRev.value || selectedDiffRowKey.value)) {
    replaceQuery({ compareRev: null, diffKey: null })
  }
})

// Remember the most-recent STIG Library URL so the navrail (and any other
// external entry point) can land back on it instead of the bare list.
watch(
  () => route.fullPath,
  (path) => {
    if (route.name === 'stig-library' || route.name === 'stig-library-benchmark') {
      setLastStigLibraryUrl(path)
    }
  },
  { immediate: true },
)

function goToList() {
  // The page-header title is the user's explicit "back to the list" gesture.
  // Clear the cached deep URL so the navrail's beforeEnter doesn't bounce us
  // straight back to it; the route-watch above will reseed lastVisited as the
  // bare list path on the next tick.
  setLastStigLibraryUrl(null)
  router.replace({ name: 'stig-library' })
}
function goToBenchmark(benchmark) {
  router.replace({
    name: 'stig-library-benchmark',
    params: {
      benchmarkId: benchmark.benchmarkId,
      revisionStr: benchmark.lastRevisionStr,
    },
  })
}
function setViewRev(rev) {
  router.replace({
    name: 'stig-library-benchmark',
    params: { benchmarkId: benchmarkIdParam.value, revisionStr: rev },
    query: compareRev.value ? { compareRev: compareRev.value } : {},
  })
}
function setCompareRev(rev) {
  const query = { ...route.query }
  if (rev) {
    query.compareRev = rev
  }
  else {
    delete query.compareRev
  }
  delete query.ruleId
  delete query.diffKey
  router.replace({ name: route.name, params: route.params, query })
}
function setSelectedRule(ruleId) {
  const query = { ...route.query }
  if (ruleId) {
    query.ruleId = ruleId
  }
  else {
    delete query.ruleId
  }
  router.replace({ name: route.name, params: route.params, query })
}
function setSelectedDiffRow(key) {
  const query = { ...route.query }
  if (key) {
    query.diffKey = key
  }
  else {
    delete query.diffKey
  }
  router.replace({ name: route.name, params: route.params, query })
}
function replaceQuery(patch) {
  const query = { ...route.query, ...patch }
  for (const [k, v] of Object.entries(patch)) {
    if (v == null) {
      delete query[k]
    }
  }
  router.replace({ name: route.name, params: route.params, query })
}

function onRetryRules() {
  revState.retry()
  if (benchmarksError.value) {
    reloadBenchmarks()
  }
}

function onRetryDiff() {
  invalidateRules(benchmarkIdParam.value)
  retryDiff()
}
</script>

<template>
  <div class="stig-library">
    <Splitter
      v-if="hasSelection"
      :pt="splitterPt"
      class="stig-library__tri"
    >
      <SplitterPanel :size="16" :min-size="8">
        <BenchmarksTable
          v-model:filter="filter"
          :benchmarks="filtered"
          :loading="benchmarksLoading"
          :error="benchmarksError"
          :selected-id="benchmarkIdParam"
          :item-size="bmItemSize"
          :line-clamp="bmLineClamp"
          :total-count="totalCount"
          @select="goToBenchmark"
          @back="goToList"
          @retry="reloadBenchmarks"
        />
      </SplitterPanel>
      <SplitterPanel :size="49" :min-size="15">
        <RulePane
          :benchmark="selectedBenchmark"
          :benchmark-id="benchmarkIdParam"
          :view-rev="effectiveViewRev"
          :compare-rev="compareRev"
          :revisions="benchmarkRevisions"
          :revisions-loading="revisionsLoading"
          :rules="revState.rules"
          :rules-loading="revState.isLoading"
          :rules-error="revState.error"
          :diff-rows="diffRows"
          :diff-status="diffStatus"
          :diff-error="diffError"
          :selected-rule-id="selectedRuleId"
          :selected-diff-row-key="selectedDiffRowKey"
          @change-view-rev="setViewRev"
          @change-compare-rev="setCompareRev"
          @select-rule="r => setSelectedRule(r.ruleId)"
          @select-diff-row="r => setSelectedDiffRow(r.key)"
          @close="goToList"
          @retry-rules="onRetryRules"
          @retry-diff="onRetryDiff"
        />
      </SplitterPanel>
      <SplitterPanel :size="35" :min-size="18">
        <div class="stig-library__detail">
          <RuleInfo
            v-if="!diffMode"
            :rule-content="ruleContent"
            :is-loading="isRuleLoading"
            :rule-content-error="ruleContentError"
            compact
            @retry="retryRule"
          />
          <DiffDetailPanel
            v-else
            :diff-row="selectedDiffRow"
            :diff-detail="selectedDiffDetail"
            :view-rev="effectiveViewRev"
            :compare-rev="compareRev"
            :status="diffStatus"
            :error="diffError"
          />
        </div>
      </SplitterPanel>
    </Splitter>

    <BenchmarkListTable
      v-else
      :benchmarks="benchmarks"
      :loading="benchmarksLoading"
      :error="benchmarksError"
      @select="goToBenchmark"
      @refresh="reloadBenchmarks"
    />
  </div>
</template>

<style scoped>
.stig-library {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0.5rem;
  background-color: var(--color-background-darkest);
  color: var(--color-text-primary);
}

.stig-library__tri {
  flex: 1;
  min-height: 0;
}

.stig-library__detail {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
</style>
