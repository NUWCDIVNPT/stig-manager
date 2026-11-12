<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { splitterPt } from '../../lib/serviceJobsPt.js'
import RunOutputTable from './RunOutputTable.vue'
import RunsTable from './RunsTable.vue'

defineProps({
  runs: { type: Array, default: () => [] },
  runsLoading: { type: Boolean, default: false },
  output: { type: Array, default: () => [] },
  outputLoading: { type: Boolean, default: false },
})

const emit = defineEmits(['select-run', 'delete-run'])
</script>

<template>
  <Splitter class="runs-splitter" :pt="splitterPt">
    <SplitterPanel :size="35" :min-size="20" class="runs-splitter-panel">
      <RunsTable
        :runs="runs"
        :loading="runsLoading"
        @select="emit('select-run', $event)"
        @delete-run="emit('delete-run', $event)"
      />
    </SplitterPanel>
    <SplitterPanel :size="65" :min-size="30" class="runs-splitter-panel">
      <RunOutputTable :output="output" :loading="outputLoading" />
    </SplitterPanel>
  </Splitter>
</template>

<style scoped>
.runs-splitter {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.runs-splitter-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  padding: 0 0.4rem;
}

.runs-splitter-panel:first-child {
  padding-left: 0;
}

.runs-splitter-panel:last-child {
  padding-right: 0;
}
</style>
