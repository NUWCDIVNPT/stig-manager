<script setup>
import { saveAs } from 'file-saver-es'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import { onMounted, ref, watch } from 'vue'
import collectionSvg from '../../../../assets/collection.svg'
import jsIconGreenSvg from '../../../../assets/jsIconGreen.svg'
import { filenameComponentFromDate, filenameEscaped } from '../../../../shared/lib.js'
import { fetchAppInfo } from '../api/appInfoApi.js'
import { generateSharable } from '../lib/appInfoSharing.js'
import { transformPreviousSchemas } from '../lib/appInfoTransforms.js'
import { reportTabListPt, reportTabPanelsPt, reportTabPt, reportTabsPt } from '../lib/reportTabsPt.js'
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
  downloadJson(report.value, `stig-manager-appinfo_${filenameComponentFromDate(reportDate())}.json`)
}

function saveShareableReport(options) {
  if (!report.value) {
    return
  }
  const sharable = generateSharable(report.value, options)
  downloadJson(sharable, `stig-manager-appinfo-shareable_${filenameComponentFromDate(reportDate())}.json`)
}

onMounted(() => fetchReport(false))

const activeTab = ref('requests')

// Lazy-mount tab panels: only render a tab's content after it has been visited
const visitedTabs = ref(new Set([activeTab.value]))
watch(activeTab, tab => visitedTabs.value.add(tab))

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
          <Tabs v-model:value="activeTab" :pt="reportTabsPt">
            <TabList :pt="reportTabListPt()">
              <Tab value="requests" :pt="reportTabPt()">
                <i class="pi pi-arrow-right-arrow-left tab-icon" /> Requests
              </Tab>
              <Tab value="collections" :pt="reportTabPt()">
                <img :src="collectionSvg" class="tab-svg-icon" alt=""> Collections
              </Tab>
              <Tab value="users" :pt="reportTabPt()">
                <i class="pi pi-user tab-icon" /> Users
              </Tab>
              <Tab value="groups" :pt="reportTabPt()">
                <i class="pi pi-users tab-icon" /> Groups
              </Tab>
              <Tab value="mysql" :pt="reportTabPt()">
                <i class="pi pi-database tab-icon" /> MySQL
              </Tab>
              <Tab value="nodejs" :pt="reportTabPt()">
                <img :src="jsIconGreenSvg" class="tab-svg-icon" alt=""> Node.js
              </Tab>
              <Tab value="json" :pt="reportTabPt()">
                <i class="pi pi-code tab-icon" /> JSON Tree
              </Tab>
            </TabList>

            <TabPanels :pt="reportTabPanelsPt">
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
  border-radius: 6px;
  overflow: hidden;
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
