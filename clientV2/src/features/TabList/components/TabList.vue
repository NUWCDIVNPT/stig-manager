<script setup>
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import { watch } from 'vue'

import { useTabList } from '../composeables/useTabList.js'

const props = defineProps({
  selection: { type: Object, default: null },
})

const { tabs, active, handleTabOpen, handleTabClose } = useTabList()

watch(
  () => props.selection,
  (val) => {
    if (val && (val.component && val.key)) {
      handleTabOpen(val)
    }
  },
  { immediate: true },
)
</script>

<template>
  <div id="tabs-wrapper" class="tabs-wrapper">
    <Tabs v-model:value="active" :pt="{ root: { class: 'tabs-root' } }">
      <TabList id="tab-list" :pt="{ root: { class: 'tab-list' } }">
        <template v-for="t in tabs" :key="t.key">
          <Tab :id="`tab-${t.key}`" :value="t.key" :pt="{ root: { class: 'tab-item' } }">
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

      <TabPanels id="tab-panels" :pt="{ root: { class: 'tab-panels' } }">
        <template v-for="t in tabs" :key="t.key">
          <TabPanel :id="`tab-panel-${t.key}`" :value="t.key" :pt="{ root: { class: 'tab-panel' } }">
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

:deep(.tabs-root) {
    height: 100%;
    border-radius: 8px;
    overflow: hidden;
}

:deep(.tab-list) {
    border-bottom: 3px solid #444;
    background: #000000;
    min-height: 30px;
    gap: 1px;
    margin-bottom: 5px;
}

:deep(.p-tablist-active-bar) {
    bottom: 0;
    height: 2px;
    background: color-mix(in srgb, var(--p-primary-400), transparent 50%);
    transition: 250ms cubic-bezier(0.35, 0, 0.25, 1);
    border: none;
}

:deep(.tab-item) {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-left: 1px;
    margin-right: 1px;
    max-width: 50;
    padding: 4px 10px;
    border: none;
    border-top-right-radius: 5px;
    border-top-left-radius: 5px;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    background: #2d2d2d;
    cursor: pointer;
    height: 30px;
    box-sizing: border-box;
    color: #888;
    font-weight: normal;
}

:deep(.tab-item:focus),
:deep(.tab-item:focus-visible) {
    outline: none;
}

:deep(.tab-item[data-p-active='true']) {
    background: #444;
    color: #fff;
    font-weight: 600;
}

:deep(.tab-item:hover) {
    background: #383838;
    color: #fff;
}

:deep(.tab-panels) {
    flex: 1 1 auto;
    min-height: 0;
    padding-top: 8px;
}

:deep(.tab-panel) {
    height: 100%;
    min-height: 0;
    overflow: hidden;
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
    height: 100%;
    min-height: 0;
    overflow: auto;
    box-sizing: border-box;
    padding: 12px;
}
</style>
