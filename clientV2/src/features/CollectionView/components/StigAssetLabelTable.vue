<script setup>
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import AssetsView from './AssetsView.vue'
import LabelsView from './LabelsView.vue'
import StigsView from './StigsView.vue'

const props = defineProps({
  collectionId: {
    type: [String, Number],
    required: true,
  },
  stigs: {
    type: Array,
    default: () => [],
  },
  assets: {
    type: Array,
    default: () => [],
  },
  labels: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['select-stig'])
</script>

<template>
  <div class="stig-asset-table">
    <Tabs value="0">
      <TabList>
        <Tab value="0">
          STIGs
        </Tab>
        <Tab value="1">
          Assets
        </Tab>
        <Tab value="2">
          Labels
        </Tab>
      </TabList>
      <TabPanels>
        <TabPanel value="0">
          <StigsView
            :collection-id="collectionId"
            :stigs="stigs"
            @select-stig="(id) => emit('select-stig', id)"
          />
        </TabPanel>
        <TabPanel value="1">
          <AssetsView :collection-id="collectionId" :assets="assets" />
        </TabPanel>
        <TabPanel value="2">
          <LabelsView :collection-id="collectionId" :labels="labels" />
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>

<style scoped>
.stig-asset-table {
  background-color: #1f1f1f;
  border: 1px solid #3a3d40;
  border-radius: 4px;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.p-tabs) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

:deep(.p-tabpanels) {
  flex: 1;
  padding: 0;
  overflow: hidden;
  background: transparent;
}

:deep(.p-tabpanel) {
  height: 100%;
  padding: 0;
}
</style>
