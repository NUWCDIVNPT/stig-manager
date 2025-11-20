<script setup>
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import { watch } from 'vue'

import { useTabCoordinatorStore } from '../../../shared/stores/tabCoordinatorStore.js'
import { useTabList } from '../composeables/useTabList.js'

// this prop is the selection from the nav tree
const props = defineProps({
  selection: { type: Object, default: null },
})

// tabs: all open tabs
// active: currently active tab
// handleTabOpen: open a new tab
// handleTabClose: close a tab
const { tabs, active, handleTabOpen, handleTabClose } = useTabList()

// tabCoordinator: handles tab lifecycle coordination
// allows other features to request tabs to close
const tabCoordinator = useTabCoordinatorStore()

// watch for selection changes and open a new tab
watch(
  () => props.selection,
  (val) => {
    if (val && (val.component && val.key)) {
      handleTabOpen(val)
    }
  },
  { immediate: true },
)

// watch for tab close requests from the tabCoordinator
watch(
  () => tabCoordinator.closeSignal,
  (signal) => {
    if (!signal?.key) {
      return
    }
    handleTabClose(signal.key)
    tabCoordinator.clearCloseSignal()
  },
)
</script>

<template>
  <div id="tabs-wrapper" class="tabs-wrapper">
    <Tabs
      v-model:value="active"
      :pt="{
        root: {
          style: {
            height: '100%',
            borderRadius: '8px',
            overflow: 'hidden',
          },
        },
      }"
    >
      <TabList
        id="tab-list"
        :pt="{
          root: {
            style: {
              borderBottom: '3px solid #444',
              background: '#000000',
              minHeight: '30px',
              gap: '1px',
              marginBottom: '5px',
            },
          },
          activeBar: {
            style: {
              bottom: '0',
              height: '2px',
              background: 'color-mix(in srgb, var(--p-primary-400), transparent 50%)',
              transition: '250ms cubic-bezier(0.35, 0, 0.25, 1)',
              border: 'none',
            },
          },
        }"
      >
        <template v-for="t in tabs" :key="t.key">
          <Tab
            :id="`tab-${t.key}`"
            :value="t.key"
            :pt="{
              root: ({ context }) => ({
                style: {
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginLeft: '1px',
                  marginRight: '1px',
                  padding: '4px 10px',
                  border: 'none',
                  borderTopRightRadius: '5px',
                  borderTopLeftRadius: '5px',
                  borderBottomLeftRadius: '0',
                  borderBottomRightRadius: '0',
                  cursor: 'pointer',
                  height: '30px',
                  boxSizing: 'border-box',
                  background: context.active ? '#444' : '#2d2d2d',
                  color: context.active ? '#fff' : '#888',
                  fontWeight: context.active ? '600' : 'normal',
                  outline: 'none',
                },
              }),
            }"
          >
            <span class="tabTitle">{{ t.label }}</span>
            <button
              v-if="t.closable !== false"
              :id="`tab-close-${t.key}`"
              type="button"
              class="tabClose"
              aria-label="Close tab"
              title="Close"
              @click.stop="handleTabClose(t.key)"
            >
              ×
            </button>
          </Tab>
        </template>
      </TabList>

      <TabPanels
        id="tab-panels"
        :pt="{
          root: {
            style: {
              flex: '1 1 auto',
              minHeight: '0',
              paddingTop: '8px',
              padding: '0',
            },
          },
        }"
      >
        <template v-for="t in tabs" :key="t.key">
          <TabPanel
            :id="`tab-panel-${t.key}`"
            :value="t.key"
            :pt="{
              root: {
                style: {
                  height: '100%',
                  minHeight: '0',
                  overflow: 'auto',
                  padding: '0.75rem',
                  boxSizing: 'border-box',
                },
              },
            }"
          >
            <component :is="t.component" v-bind="t.props" class="panelInner" />
          </TabPanel>
        </template>
      </TabPanels>
    </Tabs>
  </div>
</template>

<style scoped>
.tabs-wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-height: 0;
}

.tabTitle {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    line-height: 1;
}

.tabClose {
    border: 0;
    background: none;
    font-size: 18px;
    line-height: 1;
    opacity: 0.6;
    cursor: pointer;
    padding: 0;
    margin-left: 4px;
    width: 16px;
    height: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.tabClose:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.1);
}

:deep(.tabClose:focus),
:deep(.tabClose:focus-visible) {
    outline: none;
}

.panelInner {
    min-height: 100%;
    box-sizing: border-box;
    padding: 0;
}
</style>
