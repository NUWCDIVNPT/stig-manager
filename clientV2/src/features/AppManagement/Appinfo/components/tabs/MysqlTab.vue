<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { computed } from 'vue'
import {
  buildKeyValueRows,
  buildMysqlSummary,
  buildMysqlTableRows,
} from '../../lib/adapters/mysqlRows.js'
import MysqlStatusTable from '../mysql/MysqlStatusTable.vue'
import MysqlTablesTable from '../mysql/MysqlTablesTable.vue'
import MysqlVariablesTable from '../mysql/MysqlVariablesTable.vue'

const props = defineProps({
  mysql: { type: Object, default: null },
})

const tableRows = computed(() => buildMysqlTableRows(props.mysql))
const summary = computed(() => (props.mysql ? buildMysqlSummary(props.mysql) : null))
const variableRows = computed(() => buildKeyValueRows(props.mysql?.variables))
const statusRows = computed(() => buildKeyValueRows(props.mysql?.status))

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
    <SplitterPanel :size="55" :min-size="20" class="mysql-panel">
      <MysqlTablesTable :rows="tableRows" :summary="summary" />
    </SplitterPanel>

    <SplitterPanel :size="45" :min-size="15" class="mysql-panel bottom-row-panel">
      <Splitter :pt="bottomSplitterPt">
        <SplitterPanel :size="50" :min-size="20" class="mysql-panel subpanel-table">
          <MysqlVariablesTable :rows="variableRows" />
        </SplitterPanel>
        <SplitterPanel :size="50" :min-size="20" class="mysql-panel subpanel-table">
          <MysqlStatusTable :rows="statusRows" />
        </SplitterPanel>
      </Splitter>
    </SplitterPanel>
  </Splitter>
</template>

<style scoped>
.mysql-panel {
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
  min-width: 18rem;
  max-width: none;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  overflow: hidden;
}
</style>
