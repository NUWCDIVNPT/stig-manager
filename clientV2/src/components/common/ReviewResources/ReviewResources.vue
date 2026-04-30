<script setup>
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import { ref, watch } from 'vue'

import ReviewAttachmentsTab from './ReviewAttachmentsTab.vue'
import ReviewHistoryTab from './ReviewHistoryTab.vue'
import ReviewOtherAssetsTab from './ReviewOtherAssetsTab.vue'
import ReviewStatusTextTab from './ReviewStatusTextTab.vue'

const props = defineProps({
  ruleId: {
    type: String,
    default: null,
  },
  collectionId: {
    type: String,
    default: null,
  },
  assetId: {
    type: [String, Number],
    default: null,
  },
  accessMode: {
    type: String,
    default: 'r',
  },
  currentReview: {
    type: Object,
    default: null,
  },
  enabledTabs: {
    type: Array,
    default: () => ['history', 'statusText', 'otherAssets', 'attachments'],
  },
})

const emit = defineEmits(['apply-review'])

const activeTab = ref(props.enabledTabs[0] ?? 'history')

watch(() => props.enabledTabs, (tabs) => {
  if (!tabs.includes(activeTab.value)) {
    activeTab.value = tabs[0] ?? 'history'
  }
})

const tabsPt = {
  root: {
    style: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    },
  },
}

const tabListPt = {
  root: {
    style: {
      background: 'linear-gradient(180deg, var(--color-background-light), var(--color-background-dark))',
      borderBottom: '1px solid var(--color-border-default)',
      padding: '0 0.5rem',
      gap: '0.25rem',
    },
  },
  activeBar: {
    style: {
      height: '3px',
      backgroundColor: 'var(--color-primary-highlight)',
      bottom: '-1px',
    },
  },
  content: {
    style: {
      border: 'none',
    },
  },
}

const tabPanelsPt = {
  root: {
    style: {
      flex: '1',
      padding: '0',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--color-background-darkest)',
    },
  },
}

const tabPanelPt = {
  root: {
    style: {
      flex: '1',
      overflow: 'hidden',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    },
  },
}

const tabPt = {
  root: ({ context }) => ({
    style: {
      padding: '0.75rem 1.15rem',
      fontSize: '0.95rem',
      fontWeight: context.active ? '700' : '600',
      color: context.active ? 'var(--color-text-bright)' : 'var(--color-text-dim)',
      background: 'transparent',
      border: 'none',
      transition: 'all 0.2s ease',
      opacity: context.disabled ? '0.5' : '1',
    },
  }),
}
</script>

<template>
  <div class="review-resources">
    <Tabs v-model:value="activeTab" :pt="tabsPt">
      <TabList :pt="tabListPt">
        <Tab v-if="enabledTabs.includes('history')" value="history" :pt="tabPt">
          History
        </Tab>
        <Tab v-if="enabledTabs.includes('statusText')" value="statusText" :pt="tabPt">
          Status Text
        </Tab>
        <Tab v-if="enabledTabs.includes('otherAssets')" value="otherAssets" :pt="tabPt">
          Other Assets
        </Tab>
        <Tab v-if="enabledTabs.includes('attachments')" value="attachments" :pt="tabPt" disabled>
          Attachments
        </Tab>
      </TabList>

      <TabPanels :pt="tabPanelsPt">
        <TabPanel v-if="enabledTabs.includes('history')" value="history" :pt="tabPanelPt">
          <ReviewHistoryTab
            :active="activeTab === 'history'"
            :rule-id="ruleId"
            :collection-id="collectionId"
            :asset-id="assetId"
            :access-mode="accessMode"
            :current-review="currentReview"
            @apply-review="emit('apply-review', $event)"
          />
        </TabPanel>

        <TabPanel v-if="enabledTabs.includes('statusText')" value="statusText" :pt="tabPanelPt">
          <ReviewStatusTextTab :current-review="currentReview" />
        </TabPanel>

        <TabPanel v-if="enabledTabs.includes('otherAssets')" value="otherAssets" :pt="tabPanelPt">
          <ReviewOtherAssetsTab
            v-if="activeTab === 'otherAssets'"
            :rule-id="ruleId"
            :collection-id="collectionId"
            :asset-id="assetId"
            :access-mode="accessMode"
            :current-review="currentReview"
            @apply-review="emit('apply-review', $event)"
          />
        </TabPanel>

        <TabPanel v-if="enabledTabs.includes('attachments')" value="attachments" :pt="tabPanelPt">
          <ReviewAttachmentsTab />
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>

<style scoped>
.review-resources {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background-darkest);
  overflow: hidden;
  border-left: 1px solid var(--color-border-default);
}
</style>
