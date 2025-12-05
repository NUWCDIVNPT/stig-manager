<script setup>
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import { markRaw, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useTabCoordinatorStore } from '../../../shared/stores/tabCoordinatorStore.js'

const props = defineProps({
  currentComponent: {
    type: Object,
    default: null,
  },
  currentRoute: {
    type: Object,
    required: true,
  },
})

const router = useRouter()
const tabCoordinator = useTabCoordinatorStore()

// Tabs state
// Each tab: { key: string (fullPath), label: string, component: Component, props: object, closable: boolean }
const tabs = ref([])
const active = ref(null) // the key of the active tab

// Helper to generate a label from a route
function getLabel(r) {
  if (r.name === 'home') {
    return 'Home'
  }
  if (r.params.collectionId) {
    return `Collection ${r.params.collectionId}`
  }
  if (r.name) {
    // capitalize and space them name of the route
    return r.name.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
  }
  return 'Tab'
}

// Watch route to add/activate tabs
watch(
  () => props.currentRoute.fullPath, // when route path changes
  async () => {
    const route = props.currentRoute
    // check if tab already exists
    const key = route.fullPath
    const existing = tabs.value.find(t => t.key === key)

    // if it exists, just activate it / route to it
    if (existing) {
      active.value = key
      return
    }

    // Create new tab
    // We use the component passed from RouterView
    if (!props.currentComponent) {
      return
    }

    const newTab = {
      key,
      label: getLabel(route),
      component: markRaw(props.currentComponent),
      props: { ...route.params }, // Pass params as props
      closable: route.name !== 'home',
    }

    tabs.value.push(newTab)
    active.value = key
  },
  { immediate: true },
)

// Handle tab change (click)
watch(active, (newKey) => {
  if (newKey && newKey !== props.currentRoute.fullPath) {
    router.push(newKey)
  }
})

// Handle close
function handleTabClose(key) {
  const idx = tabs.value.findIndex(t => t.key === key)
  if (idx === -1) {
    return
  }

  const tab = tabs.value[idx]
  if (!tab.closable) {
    return
  }

  tabs.value.splice(idx, 1)

  // If we closed the active tab, navigate to another one
  if (active.value === key) {
    const next = tabs.value[idx] || tabs.value[idx - 1] || tabs.value[0]
    if (next) {
      active.value = next.key // This will trigger the watcher to push route
    }
    else {
      router.push('/')
    }
  }
}

// Watch for external close signals
watch(
  () => tabCoordinator.closeSignal,
  (signal) => {
    if (!signal?.key) {
      return
    }
    // The signal key might need to be mapped to our route key
    // For now, assuming signal.key is the route path or similar ID
    // If the signal sends a collection ID, we might need to find the tab with that ID
    const tab = tabs.value.find(t => t.key.includes(signal.key) || t.props.collectionId === signal.key)
    if (tab) {
      handleTabClose(tab.key)
    }
    tabCoordinator.clearCloseSignal()
  },
)
</script>

<template>
  <div id="tabs-wrapper" class="tabs-wrapper">
    <Tabs
      v-model:value="active"
      scrollable
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
          nextButton: {
            class: 'nav-btn',
          },
          prevButton: {
            class: 'nav-btn',
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

:deep(.nav-btn) {
    color: white;
    width: 35px;
    box-shadow: none;
    outline: none;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;
    background-color: rgb(68, 68, 68);
}

:deep(.nav-btn:hover) {
    background-color: color-mix(in srgb, rgb(68, 68, 68), white 10%);
    color: #fff;
}

:deep(.nav-btn:active) {
    background-color: color-mix(in srgb, rgb(68, 68, 68), white 20%);
}
</style>
