<script setup>
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import { ref } from 'vue'

import lineHeightDown from '../../../assets/line-height-down.svg'
import lineHeightUp from '../../../assets/line-height-up.svg'
import ReviewAttachmentsTab from './ReviewAttachmentsTab.vue'
import ReviewHistoryTab from './ReviewHistoryTab.vue'
import ReviewOtherAssetsTab from './ReviewOtherAssetsTab.vue'
import ReviewStatusTextTab from './ReviewStatusTextTab.vue'
import { useReviewDensity } from '../composables/useReviewDensity.js'

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

const {
  lineClamp,
  increaseRowHeight,
  decreaseRowHeight,
} = useReviewDensity()

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

        <div v-if="activeTab === 'history' || activeTab === 'otherAssets'" class="density-controls-wrapper">
          <div class="density-controls">
            <span class="density-label">Density</span>
            <button
              class="density-icon-btn"
              title="Decrease row height"
              :disabled="lineClamp <= 1"
              @click="decreaseRowHeight"
            >
              <img :src="lineHeightDown" alt="Decrease row height">
            </button>
            <button
              class="density-icon-btn"
              title="Increase row height"
              :disabled="lineClamp >= 10"
              @click="increaseRowHeight"
            >
              <img :src="lineHeightUp" alt="Increase row height">
            </button>
          </div>
        </div>
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

.density-controls-wrapper {
  margin-left: auto;
  display: flex;
  align-items: center;
  padding-right: 0.5rem;
}

.density-controls {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.15rem 0.3rem 0.15rem 0.65rem;
  border: 1px solid color-mix(in srgb, var(--color-border-default) 85%, transparent);
  border-radius: 5px;
  background: color-mix(in srgb, var(--color-background-light) 45%, transparent);
}

.density-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-bright);
  margin-right: 0.2rem;
}

.density-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--color-background-light) 25%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-border-light) 40%, transparent);
  border-radius: 5px;
  margin: 0 0.1rem;
  width: 1.6rem;
  height: 1.6rem;
  padding: 0;
  cursor: pointer;
  opacity: 0.9;
}

.density-icon-btn:hover:not(:disabled) {
  opacity: 1;
  border-color: var(--color-border-default);
  background: color-mix(in srgb, var(--color-background-light) 75%, transparent);
}

.density-icon-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.density-icon-btn img {
  width: 13px;
  height: 13px;
}
</style>
