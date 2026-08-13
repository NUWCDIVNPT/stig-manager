<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import { computed, ref, watch } from 'vue'
import {
  buildCollectionRows,
  buildGrantRows,
  buildGroupNameLookup,
} from '../../lib/adapters/collectionRows.js'
import { buildUsernameLookup } from '../../lib/adapters/requestRows.js'
import { reportTabListPt, reportTabPanelsPt, reportTabPt, reportTabsPt } from '../../lib/reportTabsPt.js'
import CollectionGrantsTable from '../collections/CollectionGrantsTable.vue'
import CollectionLabelsTable from '../collections/CollectionLabelsTable.vue'
import CollectionRolesTable from '../collections/CollectionRolesTable.vue'
import CollectionsAllFieldsTable from '../collections/CollectionsAllFieldsTable.vue'
import CollectionSettingsTable from '../collections/CollectionSettingsTable.vue'
import CollectionsOverviewTable from '../collections/CollectionsOverviewTable.vue'
import CollectionStigRangesTable from '../collections/CollectionStigRangesTable.vue'

const props = defineProps({
  collections: { type: Object, default: null },
  users: { type: Object, default: null },
  groups: { type: Object, default: null },
})

const selectedCollectionId = ref(null)

// A new report invalidates the selection and the grants panel
watch(() => props.collections, () => {
  selectedCollectionId.value = null
})

const collectionRows = computed(() => buildCollectionRows(props.collections))
const usernameLookup = computed(() => buildUsernameLookup(props.users))
const groupNameLookup = computed(() => buildGroupNameLookup(props.groups))

const selectedCollection = computed(() => props.collections?.[selectedCollectionId.value] ?? null)

const grantRows = computed(() =>
  selectedCollection.value
    ? buildGrantRows(selectedCollection.value, usernameLookup.value, groupNameLookup.value)
    : [],
)

const activeTab = ref('overview')

// Lazy-mount inner tables but keep them alive so filters and column toggles persist
const visitedTabs = ref(new Set([activeTab.value]))
watch(activeTab, tab => visitedTabs.value.add(tab))

const TABS = [
  { value: 'overview', label: 'Overview', component: CollectionsOverviewTable },
  { value: 'all-fields', label: 'All Fields', component: CollectionsAllFieldsTable },
  { value: 'roles', label: 'Roles', component: CollectionRolesTable },
  { value: 'labels', label: 'Labels', component: CollectionLabelsTable },
  { value: 'stig-ranges', label: 'STIG Assignment Ranges', component: CollectionStigRangesTable },
  { value: 'settings', label: 'Settings', component: CollectionSettingsTable },
]

const splitterPt = {
  root: { style: 'border: none; background: transparent; height: 100%;' },
  gutter: { style: 'background: var(--color-border-dark);' },
}

const tabPanelPt = {
  root: { style: 'flex: 1; overflow: hidden; height: 100%; display: flex; flex-direction: column;' },
}
</script>

<template>
  <div class="collections-tab">
    <Splitter layout="vertical" :pt="splitterPt">
      <SplitterPanel :size="62" :min-size="25" class="collections-panel">
        <Tabs v-model:value="activeTab" :pt="reportTabsPt">
          <TabList :pt="reportTabListPt({ compact: true })">
            <Tab v-for="tab in TABS" :key="tab.value" :value="tab.value" :pt="reportTabPt({ compact: true })">
              {{ tab.label }}
            </Tab>
          </TabList>
          <TabPanels :pt="reportTabPanelsPt">
            <TabPanel v-for="tab in TABS" :key="tab.value" :value="tab.value" :pt="tabPanelPt">
              <component
                :is="tab.component"
                v-if="visitedTabs.has(tab.value)"
                v-model:selected-collection-id="selectedCollectionId"
                :rows="collectionRows"
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </SplitterPanel>

      <SplitterPanel :size="38" :min-size="15" class="collections-panel">
        <CollectionGrantsTable
          :rows="grantRows"
          :collection-name="selectedCollection?.name ?? ''"
        />
      </SplitterPanel>
    </Splitter>
  </div>
</template>

<style scoped>
.collections-tab {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.collections-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

</style>
