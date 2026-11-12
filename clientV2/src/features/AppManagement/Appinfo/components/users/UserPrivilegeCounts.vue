<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { computed } from 'vue'
import { buildPrivilegeRows } from '../../lib/adapters/userRows.js'
import KeyValueTable from '../common/KeyValueTable.vue'

const props = defineProps({
  userPrivilegeCounts: { type: Object, default: null },
})

const PANELS = [
  { key: 'overall', title: 'Privileges - Overall', exportFilename: 'appinfo-privileges-overall' },
  { key: 'activeInLast30Days', title: 'Privileges - Active last 30d', exportFilename: 'appinfo-privileges-active-30d' },
  { key: 'activeInLast90Days', title: 'Privileges - Active last 90d', exportFilename: 'appinfo-privileges-active-90d' },
]

const panelRows = computed(() =>
  PANELS.map(panel => ({
    ...panel,
    rows: buildPrivilegeRows(props.userPrivilegeCounts?.[panel.key]),
  })),
)

const splitterPt = {
  root: { style: 'border: none; background: transparent; height: 100%; min-width: max-content;' },
  gutter: { style: 'width: 8px; background: var(--color-background-darkest); border-left: 1px solid var(--color-border-default); border-right: 1px solid var(--color-border-default);' },
}
</script>

<template>
  <Splitter :pt="splitterPt">
    <SplitterPanel
      v-for="panel in panelRows"
      :key="panel.key"
      :size="34"
      :min-size="15"
      class="privilege-panel"
    >
      <KeyValueTable
        :title="panel.title"
        :rows="panel.rows"
        key-header="Privilege"
        value-header="User count"
        noun="privilege"
        :export-filename="panel.exportFilename"
      />
    </SplitterPanel>
  </Splitter>
</template>

<style scoped>
.privilege-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 18rem;
  max-width: none;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  overflow: hidden;
}
</style>
