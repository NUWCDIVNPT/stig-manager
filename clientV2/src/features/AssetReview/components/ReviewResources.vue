<script setup>
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import { ref } from 'vue'

import ReviewAttachmentsTab from './ReviewAttachmentsTab.vue'
import ReviewHistoryTab from './ReviewHistoryTab.vue'
import ReviewOtherAssetsTab from './ReviewOtherAssetsTab.vue'
import ReviewStatusTextTab from './ReviewStatusTextTab.vue'

defineProps({
  currentReview: {
    type: Object,
    default: null,
  },
  reviewHistory: {
    type: Array,
    default: () => [],
  },
  ruleId: {
    type: String,
    default: null,
  },
  collectionId: {
    type: String,
    default: null,
  },
  editable: {
    type: Boolean,
    default: false,
  },
  formResult: {
    type: String,
    default: '',
  },
  formDetail: {
    type: String,
    default: '',
  },
  formComment: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['apply-review'])

const activeTab = ref('history')

// PrimeVue passthrough objects
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
        <Tab value="history" :pt="tabPt">
          History
        </Tab>
        <Tab value="statusText" :pt="tabPt">
          Status Text
        </Tab>
        <Tab value="otherAssets" :pt="tabPt">
          Other Assets
        </Tab>
        <Tab value="attachments" :pt="tabPt" disabled>
          Attachments
        </Tab>
      </TabList>

      <TabPanels :pt="tabPanelsPt">
        <TabPanel value="history" :pt="tabPanelPt">
          <ReviewHistoryTab
            :review-history="reviewHistory"
            :editable="editable"
            :form-result="formResult"
            :form-detail="formDetail"
            :form-comment="formComment"
            @apply-review="emit('apply-review', $event)"
          />
        </TabPanel>

        <TabPanel value="statusText" :pt="tabPanelPt">
          <ReviewStatusTextTab :current-review="currentReview" />
        </TabPanel>

        <TabPanel value="otherAssets" :pt="tabPanelPt">
          <ReviewOtherAssetsTab
            :rule-id="ruleId"
            :collection-id="collectionId"
            :asset-id="currentReview?.assetId"
            :editable="editable"
            :form-result="formResult"
            :form-detail="formDetail"
            :form-comment="formComment"
            @apply-review="emit('apply-review', $event)"
          />
        </TabPanel>

        <TabPanel value="attachments" :pt="tabPanelPt">
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
