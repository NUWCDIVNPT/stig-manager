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
const grantsOpen = ref(true)

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

const tabsPt = {
  root: { style: 'display: flex; flex-direction: column; height: 100%;' },
}

// The default Tab padding (1rem 1.125rem) is sized for top-level nav; these
// inner tabs sit above already-labeled tables, so a slim bar reads better.
const tabPt = {
  root: { style: 'padding: 0.55rem 1rem; font-size: 1rem;' },
}

const tabPanelsPt = {
  root: { style: 'flex: 1; padding: 0; overflow: hidden; display: flex; flex-direction: column;' },
}

const tabPanelPt = {
  root: { style: 'flex: 1; overflow: hidden; height: 100%; display: flex; flex-direction: column;' },
}
</script>

<template>
  <div class="collections-tab">
    <Splitter :key="grantsOpen" layout="vertical" :pt="splitterPt">
      <SplitterPanel :size="grantsOpen ? 62 : 100" :min-size="25" class="collections-panel">
        <Tabs v-model:value="activeTab" :pt="tabsPt">
          <TabList>
            <Tab v-for="tab in TABS" :key="tab.value" :value="tab.value" :pt="tabPt">
              {{ tab.label }}
            </Tab>
          </TabList>
          <TabPanels :pt="tabPanelsPt">
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

      <SplitterPanel v-if="grantsOpen" :size="38" :min-size="15" class="collections-panel">
        <CollectionGrantsTable
          :rows="grantRows"
          :collection-name="selectedCollection?.name ?? ''"
          @collapse="grantsOpen = false"
        />
      </SplitterPanel>
    </Splitter>

    <button
      v-if="!grantsOpen"
      type="button"
      class="grants-collapsed-bar"
      title="Expand the grants panel"
      @click="grantsOpen = true"
    >
      <i class="pi pi-chevron-up" />
      <span>Grants</span>
      <span v-if="selectedCollection" class="collapsed-name">{{ selectedCollection.name }}</span>
    </button>
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

.grants-collapsed-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.45rem 0.75rem;
  background: var(--color-background-subtle);
  border: none;
  border-top: 1px solid var(--color-border-default);
  color: var(--color-text-bright);
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.1s;
}

.grants-collapsed-bar:hover {
  background: var(--color-background-light);
}

.grants-collapsed-bar i {
  color: var(--color-text-dim);
}

.collapsed-name {
  font-weight: 600;
  color: var(--color-text-primary);
}

:deep(.p-tablist) {
  background: var(--color-background-subtle);
  border-bottom: 1px solid var(--color-border-default);
  padding: 0.35rem 0.5rem 0;
}

:deep(.p-tablist-tab-list) {
  gap: 0.25rem;
  background: transparent;
  border: none;
}

:deep(.p-tab) {
  display: inline-flex;
  align-items: center;
  padding: 0.45rem 0.85rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-dim);
  background: color-mix(in srgb, var(--color-background-dark) 40%, transparent);
  border: 1px solid var(--color-border-default);
  border-bottom: none;
  border-radius: 4px 4px 0 0;
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
</style>
