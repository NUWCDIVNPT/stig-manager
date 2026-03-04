<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import { computed, ref } from 'vue'
import EngineBadge from '../../../components/common/EngineBadge.vue'
import ManualBadge from '../../../components/common/ManualBadge.vue'
import OverrideBadge from '../../../components/common/OverrideBadge.vue'
import ResultBadge from '../../../components/common/ResultBadge.vue'
import StatusBadge from '../../../components/common/StatusBadge.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'

const props = defineProps({
  currentReview: {
    type: Object,
    default: null,
  },
  reviewHistory: {
    type: Array,
    default: () => [],
  },
  selectedRuleId: {
    type: String,
    default: null,
  },
})

const activeTab = ref('history')
const expandedRows = ref([])

// Maps for display
const resultDisplayMap = {
  pass: 'NF',
  fail: 'O',
  notapplicable: 'NA',
  notchecked: 'NR',
  informational: 'I',
  unknown: 'NR',
  error: 'NR',
  notselected: 'NR',
  fixed: 'NF',
}

function getResultDisplay(result) {
  if (!result) {
    return null
  }
  return resultDisplayMap[result] || 'NR'
}

function getEngineDisplay(item) {
  if (!item?.resultEngine) {
    return null
  }
  if (item.resultEngine.overrides?.length) {
    return 'override'
  }
  return 'engine'
}

function formatTimestamp(ts) {
  if (!ts) {
    return '--'
  }
  return new Date(ts).toLocaleString()
}

// History stats (computed from props.reviewHistory)
const historyStats = computed(() => {
  const history = props.reviewHistory
  if (!history?.length) {
    return null
  }

  const results = { pass: 0, fail: 0, notapplicable: 0, other: 0 }
  const engine = { manual: 0, engine: 0, override: 0 }
  const statuses = { saved: 0, submitted: 0, accepted: 0, rejected: 0 }

  for (const item of history) {
    if (item.result === 'pass') {
      results.pass++
    }
    else if (item.result === 'fail') {
      results.fail++
    }
    else if (item.result === 'notapplicable') {
      results.notapplicable++
    }
    else {
      results.other++
    }

    if (item.result) {
      if (!item.resultEngine) {
        engine.manual++
      }
      else if (item.resultEngine.overrides?.length) {
        engine.override++
      }
      else {
        engine.engine++
      }
    }

    const statusLabel = item.status?.label || item.status
    if (statusLabel && statuses[statusLabel] !== undefined) {
      statuses[statusLabel]++
    }
  }

  return { results, engine, statuses, total: history.length }
})

// PrimeVue passthrough objects (following CollectionView pattern)
const tabsPt = {
  root: {
    style: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    },
  },
}

const tabPanelsPt = {
  root: {
    style: {
      flex: '1',
      padding: '0',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    },
  },
}

const tabPanelPt = {
  root: {
    style: {
      flex: '1',
      overflow: 'hidden',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    },
  },
}

const tabPt = {
  root: {
    style: {
      padding: '0.3rem 0.6rem',
      fontSize: '0.85rem',
    },
  },
}
</script>

<template>
  <div class="review-resources">
    <Tabs v-model:value="activeTab" :pt="tabsPt">
      <TabList>
        <Tab value="history" :pt="tabPt">
          History
        </Tab>
        <Tab value="statusText" :pt="tabPt">
          Status Text
        </Tab>
        <Tab value="otherAssets" :pt="tabPt" disabled>
          Other Assets
        </Tab>
        <Tab value="attachments" :pt="tabPt" disabled>
          Attachments
        </Tab>
      </TabList>

      <TabPanels :pt="tabPanelsPt">
        <!-- History Tab -->
        <TabPanel value="history" :pt="tabPanelPt">
          <DataTable
            v-model:expanded-rows="expandedRows"
            :value="reviewHistory"
            data-key="touchTs"
            scrollable
            scroll-height="flex"
            class="history-table"
          >
            <Column expander :style="{ width: '28px' }" />

            <Column header="Timestamp" field="touchTs" sortable :style="{ width: '140px' }">
              <template #body="{ data }">
                <span class="cell-text--dim">{{ formatTimestamp(data.touchTs) }}</span>
              </template>
            </Column>

            <Column header="Rule" field="ruleId" :style="{ width: '140px' }">
              <template #body="{ data }">
                <span class="cell-text--mono">{{ data.ruleId }}</span>
              </template>
            </Column>

            <Column header="Result" field="result" :style="{ width: '50px', textAlign: 'center' }">
              <template #body="{ data }">
                <ResultBadge v-if="getResultDisplay(data.result)" :status="getResultDisplay(data.result)" />
              </template>
            </Column>

            <Column field="resultEngine" :style="{ width: '24px', textAlign: 'center' }">
              <template #header>
                <img
                  src="../../../assets/bot2.svg"
                  alt="Engine"
                  class="engine-header-icon"
                  title="Result engine"
                >
              </template>
              <template #body="{ data }">
                <img
                  v-if="getEngineDisplay(data) === 'engine'"
                  src="../../../assets/bot2.svg"
                  alt="Engine"
                  class="engine-icon"
                  title="Result engine"
                >
                <img
                  v-else-if="getEngineDisplay(data) === 'override'"
                  src="../../../assets/override2.svg"
                  alt="Override"
                  class="engine-icon"
                  title="Overridden result"
                >
              </template>
            </Column>

            <Column header="Status" :style="{ width: '50px', textAlign: 'center' }">
              <template #body="{ data }">
                <StatusBadge v-if="data.status?.label" :status="data.status.label" />
              </template>
            </Column>

            <Column header="User" field="username" />

            <!-- Row Expansion -->
            <template #expansion="{ data }">
              <div class="history-expansion">
                <div v-if="data.detail" class="history-expansion__field">
                  <span class="history-expansion__label">Detail:</span>
                  <span class="history-expansion__value">{{ data.detail }}</span>
                </div>
                <div v-if="data.comment" class="history-expansion__field">
                  <span class="history-expansion__label">Comment:</span>
                  <span class="history-expansion__value">{{ data.comment }}</span>
                </div>
                <div v-if="data.status?.user?.username" class="history-expansion__field">
                  <span class="history-expansion__label">Status user:</span>
                  <span class="history-expansion__value">{{ data.status.user.username }}</span>
                </div>
                <div v-if="data.status?.text" class="history-expansion__field">
                  <span class="history-expansion__label">Status text:</span>
                  <span class="history-expansion__value">{{ data.status.text }}</span>
                </div>
              </div>
            </template>

            <template v-if="historyStats" #footer>
              <StatusFooter
                :show-refresh="false"
                :total-count="historyStats.total"
              >
                <template #left-extra>
                  <ResultBadge status="O" :count="historyStats.results.fail" />
                  <ResultBadge status="NF" :count="historyStats.results.pass" />
                  <ResultBadge status="NA" :count="historyStats.results.notapplicable" />
                  <ResultBadge status="NR+" :count="historyStats.results.other" />
                  <span class="footer-divider">|</span>
                  <ManualBadge :count="historyStats.engine.manual" />
                  <EngineBadge :count="historyStats.engine.engine" />
                  <OverrideBadge :count="historyStats.engine.override" />
                  <span class="footer-divider">|</span>
                  <StatusBadge status="saved" :count="historyStats.statuses.saved" />
                  <StatusBadge status="submitted" :count="historyStats.statuses.submitted" />
                  <StatusBadge status="accepted" :count="historyStats.statuses.accepted" />
                  <StatusBadge status="rejected" :count="historyStats.statuses.rejected" />
                </template>
              </StatusFooter>
            </template>
          </DataTable>
        </TabPanel>

        <!-- Status Text Tab -->
        <TabPanel value="statusText" :pt="tabPanelPt">
          <div class="status-text-content">
            <p v-if="currentReview?.status?.text" class="status-text__body">
              {{ currentReview.status.text }}
            </p>
            <p v-else class="status-text__empty">
              No status text available.
            </p>
          </div>
        </TabPanel>

        <!-- Other Assets - placeholder -->
        <TabPanel value="otherAssets" :pt="tabPanelPt">
          <div class="review-resources__placeholder">
            Other Assets tab will be implemented.
          </div>
        </TabPanel>

        <!-- Attachments - placeholder -->
        <TabPanel value="attachments" :pt="tabPanelPt">
          <div class="review-resources__placeholder">
            Attachments tab will be implemented in a future phase.
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>

<style scoped>
.review-resources {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background-subtle);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  overflow: hidden;
}

.history-table {
  flex: 1;
  min-height: 0;
}

:deep(.p-datatable-table-container) {
  height: 100%;
}

:deep(.p-datatable-tbody > tr > td) {
  padding: 0.15rem 0.35rem;
  vertical-align: top;
}

:deep(.p-datatable-thead > tr > th) {
  padding: 0.2rem 0.35rem;
}

:deep(.p-datatable-footer) {
  padding: 0;
  border: none;
}

.cell-text--mono {
  font-family: monospace;
  color: var(--color-text-dim);
}

.cell-text--dim {
  color: var(--color-text-dim);
}

.engine-header-icon {
  width: 12px;
  height: 12px;
  opacity: 0.7;
}

.engine-icon {
  width: 12px;
  height: 12px;
  opacity: 0.7;
}

/* Row expansion */
.history-expansion {
  padding: 0.35rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.history-expansion__field {
  display: flex;
  gap: 0.35rem;
}

.history-expansion__label {
  font-weight: 600;
  color: var(--color-text-dim);
  flex-shrink: 0;
}

.history-expansion__value {
  color: var(--color-text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

/* Status Text tab */
.status-text-content {
  padding: 0.5rem;
  height: 100%;
  overflow-y: auto;
}

.status-text__body {
  color: var(--color-text-primary);
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.4;
  margin: 0;
}

.status-text__empty {
  color: var(--color-text-dim);
  font-style: italic;
  margin: 0;
}

.review-resources__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-dim);
}

.footer-divider {
  color: var(--color-border-light);
}
</style>
