<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { computed } from 'vue'
import { buildKeyValueRows } from '../../lib/adapters/mysqlRows.js'
import { buildCpuRows, buildNodejsSummary } from '../../lib/adapters/runtimeRows.js'
import { formatUptime } from '../../lib/appInfoFormatters.js'
import KeyValueTable from '../common/KeyValueTable.vue'
import CpuTable from '../runtime/CpuTable.vue'

const props = defineProps({
  nodejs: { type: Object, default: null },
})

const environmentRows = computed(() => buildKeyValueRows(props.nodejs?.environment))
const cpuRows = computed(() => buildCpuRows(props.nodejs?.cpus))
const memoryRows = computed(() => buildKeyValueRows(props.nodejs?.memory))
const osRows = computed(() => buildKeyValueRows(props.nodejs?.os))

const environmentTitle = computed(() => {
  if (!props.nodejs) {
    return 'Environment'
  }
  const { version, uptime } = buildNodejsSummary(props.nodejs)
  return `Environment ｜ Version ${version} ｜ up ${formatUptime(uptime)}`
})

const ENVIRONMENT_CONFIG = {
  keyHeader: 'Variable',
  valueHeader: 'Value',
  valueAlign: 'left',
  noun: 'item',
  exportFilename: 'appinfo-nodejs-environment',
}

const MEMORY_CONFIG = {
  title: 'Memory',
  keyHeader: 'Key',
  valueHeader: 'Value',
  noun: 'key',
  exportFilename: 'appinfo-nodejs-memory',
}

const OS_CONFIG = {
  title: 'OS',
  keyHeader: 'Key',
  valueHeader: 'Value',
  valueAlign: 'left',
  noun: 'key',
  exportFilename: 'appinfo-nodejs-os',
}

const splitterPt = {
  root: { style: 'border: none; background: transparent; height: 100%;' },
  gutter: { style: 'background: var(--color-border-dark);' },
}

const bottomSplitterPt = {
  root: { style: 'border: none; background: transparent; height: 100%; min-width: max-content;' },
  gutter: { style: 'width: 8px; background: var(--color-background-darkest); border-left: 1px solid var(--color-border-default); border-right: 1px solid var(--color-border-default);' },
}
</script>

<template>
  <Splitter layout="vertical" :pt="splitterPt">
    <SplitterPanel :size="55" :min-size="20" class="nodejs-panel">
      <KeyValueTable v-bind="ENVIRONMENT_CONFIG" :rows="environmentRows" :title="environmentTitle" />
    </SplitterPanel>

    <SplitterPanel :size="45" :min-size="15" class="nodejs-panel bottom-row-panel">
      <Splitter :pt="bottomSplitterPt">
        <SplitterPanel :size="40" :min-size="15" class="nodejs-panel subpanel-table subpanel-table--cpu">
          <CpuTable :rows="cpuRows" />
        </SplitterPanel>
        <SplitterPanel :size="30" :min-size="15" class="nodejs-panel subpanel-table">
          <KeyValueTable v-bind="MEMORY_CONFIG" :rows="memoryRows" />
        </SplitterPanel>
        <SplitterPanel :size="30" :min-size="15" class="nodejs-panel subpanel-table">
          <KeyValueTable v-bind="OS_CONFIG" :rows="osRows" />
        </SplitterPanel>
      </Splitter>
    </SplitterPanel>
  </Splitter>
</template>

<style scoped>
.nodejs-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.bottom-row-panel {
  overflow-x: auto;
  overflow-y: hidden;
}

.subpanel-table {
  min-width: 16rem;
  max-width: none;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  overflow: hidden;
}

.subpanel-table--cpu {
  min-width: 20rem;
  max-width: none;
}
</style>
