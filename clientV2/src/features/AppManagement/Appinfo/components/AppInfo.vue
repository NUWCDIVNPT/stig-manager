<script setup>
import { saveAs } from 'file-saver-es'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import { onMounted, ref, watch } from 'vue'
import { filenameEscaped } from '../../../../shared/lib.js'
import { fetchAppInfo } from '../api/appInfoApi.js'
import { generateSharable } from '../lib/appInfoSharing.js'
import { transformPreviousSchemas } from '../lib/appInfoTransforms.js'
import collectionSvg from '../../../../assets/collection.svg'
import jsIconGreenSvg from '../../../../assets/jsIconGreen.svg'
import AppInfoSourceSummary from './AppInfoSourceSummary.vue'
import CollectionsTab from './tabs/CollectionsTab.vue'
import GroupsTab from './tabs/GroupsTab.vue'
import JsonTreeTab from './tabs/JsonTreeTab.vue'
import MysqlTab from './tabs/MysqlTab.vue'
import NodeRuntimeTab from './tabs/NodeRuntimeTab.vue'
import RequestsTab from './tabs/RequestsTab.vue'
import UsersTab from './tabs/UsersTab.vue'

const report = ref(null)
const reportSource = ref('')
const loading = ref(false)
const loadingMessage = ref('')
const error = ref(null)

async function fetchReport(includeRowCounts) {
  loading.value = true
  loadingMessage.value = includeRowCounts
    ? 'Fetching from API with exact row counts…'
    : 'Fetching from API with estimated row counts…'
  error.value = null
  try {
    report.value = await fetchAppInfo({ includeRowCounts })
    reportSource.value = 'API'
  }
  catch (e) {
    error.value = e.message
  }
  finally {
    loading.value = false
    loadingMessage.value = ''
  }
}

async function loadReportFile(file) {
  loading.value = true
  loadingMessage.value = `Loading ${file.name}…`
  error.value = null
  try {
    const text = await file.text()
    const parsed = JSON.parse(text)
    const normalized = transformPreviousSchemas(parsed)
    if (!normalized) {
      throw new Error('The file is not a recognized Application Info report.')
    }
    report.value = normalized
    reportSource.value = file.name
  }
  catch (e) {
    error.value = e instanceof SyntaxError ? 'The file does not contain valid JSON.' : e.message
  }
  finally {
    loading.value = false
    loadingMessage.value = ''
  }
}

function reportDate() {
  return report.value?.dateGenerated ?? report.value?.date ?? new Date().toISOString()
}

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json;charset=utf-8' })
  saveAs(blob, filenameEscaped(filename))
}

function saveFullReport() {
  if (!report.value) {
    return
  }
  downloadJson(report.value, `stig-manager-appinfo_${reportDate()}.json`)
}

function saveShareableReport(options) {
  if (!report.value) {
    return
  }
  const sharable = generateSharable(report.value, options)
  downloadJson(sharable, `stig-manager-appinfo-shareable_${reportDate()}.json`)
}

onMounted(() => fetchReport(true))

const activeTab = ref('requests')

// Lazy-mount tab panels: only render a tab's content after it has been visited
const visitedTabs = ref(new Set([activeTab.value]))
watch(activeTab, tab => visitedTabs.value.add(tab))

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
      overflowY: 'auto',
      height: '100%',
    },
  },
}
</script>

<template>
  <div class="appinfo-page">
    <div class="appinfo-workspace">
      <div class="appinfo-content">
        <AppInfoSourceSummary
          :report="report"
          :source="reportSource"
          :loading="loading"
          @load-file="loadReportFile"
          @save-full="saveFullReport"
          @save-shareable="saveShareableReport"
          @fetch-quick="fetchReport(false)"
          @fetch-full="fetchReport(true)"
        />

        <div v-if="loading" class="status-strip status-strip--busy">
          <i class="pi pi-spin pi-spinner" /> {{ loadingMessage }}
        </div>
        <div v-else-if="error" class="status-strip status-strip--error">
          <i class="pi pi-exclamation-triangle" /> {{ error }}
        </div>

        <div class="report-tabs">
          <Tabs v-model:value="activeTab" :pt="tabsPt">
            <TabList>
              <Tab value="requests">
                <i class="pi pi-arrow-right-arrow-left tab-icon" /> Requests
              </Tab>
              <Tab value="collections">
                <img :src="collectionSvg" class="tab-svg-icon" alt="" /> Collections
              </Tab>
              <Tab value="users">
                <i class="pi pi-user tab-icon" /> Users
              </Tab>
              <Tab value="groups">
                <i class="pi pi-users tab-icon" /> Groups
              </Tab>
              <Tab value="mysql">
                <i class="pi pi-database tab-icon" /> MySQL
              </Tab>
              <Tab value="nodejs">
                <img :src="jsIconGreenSvg" class="tab-svg-icon" alt="" /> Node.js
              </Tab>
              <Tab value="json">
                <i class="pi pi-code tab-icon" /> JSON Tree
              </Tab>
            </TabList>

            <TabPanels :pt="tabPanelsPt">
              <TabPanel value="requests" :pt="tabPanelPt">
                <RequestsTab v-if="visitedTabs.has('requests')" :requests="report?.requests ?? null" :users="report?.users ?? null" />
              </TabPanel>
              <TabPanel value="collections" :pt="tabPanelPt">
                <CollectionsTab
                  v-if="visitedTabs.has('collections')"
                  :collections="report?.collections ?? null"
                  :users="report?.users ?? null"
                  :groups="report?.groups ?? null"
                />
              </TabPanel>
              <TabPanel value="users" :pt="tabPanelPt">
                <UsersTab v-if="visitedTabs.has('users')" :users="report?.users ?? null" />
              </TabPanel>
              <TabPanel value="groups" :pt="tabPanelPt">
                <GroupsTab v-if="visitedTabs.has('groups')" :groups="report?.groups ?? null" />
              </TabPanel>
              <TabPanel value="mysql" :pt="tabPanelPt">
                <MysqlTab v-if="visitedTabs.has('mysql')" :mysql="report?.mysql ?? null" />
              </TabPanel>
              <TabPanel value="nodejs" :pt="tabPanelPt">
                <NodeRuntimeTab v-if="visitedTabs.has('nodejs')" :nodejs="report?.nodejs ?? null" />
              </TabPanel>
              <TabPanel value="json" :pt="tabPanelPt">
                <JsonTreeTab v-if="visitedTabs.has('json')" :report="report" />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.appinfo-page {
  height: 100%;
  width: 100%;
  overflow: auto;
  padding: 0.8rem;
  background-color: var(--color-background-darkest);
  color: var(--color-text-primary);
}

.appinfo-workspace {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-background-dark);
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
}

.appinfo-content {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 0.8rem;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.report-tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  overflow: hidden;
}

:deep(.p-tablist) {
  background: var(--color-background-subtle);
  border-bottom: 1px solid var(--color-border-default);
  padding: 0.4rem 0.6rem 0;
}

:deep(.p-tablist-tab-list) {
  gap: 0.35rem;
  background: transparent;
  border: none;
}

:deep(.p-tab) {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1.1rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-dim);
  background: color-mix(in srgb, var(--color-background-dark) 40%, transparent);
  border: 1px solid var(--color-border-default);
  border-bottom: none;
  border-radius: 6px 6px 0 0;
  transition: all 0.15s ease;
  cursor: pointer;
  margin-bottom: -1px;
}

:deep(.p-tab:hover:not(.p-tab-active)) {
  color: var(--color-text-primary);
  background: color-mix(in srgb, var(--color-background-light) 60%, transparent);
}

:deep(.p-tab-active) {
  color: var(--color-primary-highlight, #3b82f6);
  background: var(--color-background-light);
  border-color: var(--color-border-default);
  border-bottom-color: var(--color-background-light);
  font-weight: 700;
  box-shadow: 0 -2px 0 0 var(--color-primary-highlight, #3b82f6) inset;
}

:deep(.p-tab-active .tab-icon) {
  color: var(--color-primary-highlight, #3b82f6);
}

.tab-icon {
  font-size: 0.92rem;
  color: var(--color-text-dim);
}

.tab-svg-icon {
  width: 0.95rem;
  height: 0.95rem;
  display: inline-block;
  vertical-align: middle;
  object-fit: contain;
}

.status-strip {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  border-radius: 6px;
  padding: 0.7rem 1rem;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.status-strip--busy {
  color: var(--color-text-dim);
  background: var(--color-background-light);
  border: 1px solid var(--color-border-default);
}

.status-strip--error {
  color: var(--color-text-error);
  background: var(--color-status-error-bg);
  border: 1px solid color-mix(in srgb, var(--color-action-red) 30%, transparent);
}
</style>
