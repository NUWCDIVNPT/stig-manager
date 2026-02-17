<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { computed, onMounted, ref } from 'vue'
import { api } from '../../shared/api/apiClient.js'
import { useGlobalError } from '../../shared/composables/useGlobalError.js'
import { useGlobalAppStore } from '../../shared/stores/globalAppStore.js'

const globalAppStore = useGlobalAppStore()
const { triggerError } = useGlobalError()
const visible = ref(false)
const lastShownDate = ref('')

const Sources = [
  {
    date: '2026-02-28',
    header: 'Test',
    body: `
    <p>Test</p>
    <p>Test</p>
    
    <p><img src="src/assets/whatsnew/image.png" width=500/></p>`,
  },
]

// Filter sources based on user's last seen date
const newFeatures = computed(() => {
  if (!lastShownDate.value) {
    return Sources
  }
  return Sources.filter(item => item.date > lastShownDate.value)
})

function normalizeDate(dateStr) {
  if (!dateStr) {
    return '1970-01-01'
  }
  const dateParts = dateStr.split('-')
  if (dateParts.length === 3) {
    return `${dateParts[0]}-${dateParts[1].padStart(2, '0')}-${dateParts[2].padStart(2, '0')}`
  }
  return dateStr
}

function checkAndShow() {
  const user = globalAppStore.user
  let lastWhatsNew = user?.webPreferences?.lastWhatsNew || '1970-01-01'
  lastWhatsNew = normalizeDate(lastWhatsNew)

  // Store needed for filtering
  lastShownDate.value = lastWhatsNew

  // Check if we have any features newer than lastWhatsNew
  if (Sources.length > 0 && Sources[0].date > lastWhatsNew) {
    visible.value = true
  }
}

async function handleDontShowAgain() {
  const latestDate = Sources[0].date
  try {
    await api.patch('/user/web-preferences', { lastWhatsNew: latestDate })
    // update shallowly even though it might not be needed...
    if (globalAppStore.user && globalAppStore.user.webPreferences) {
      globalAppStore.user.webPreferences.lastWhatsNew = latestDate
    }
    visible.value = false
  }
  catch (error) {
    triggerError(error)
    visible.value = false
  }
}

onMounted(() => {
  if (globalAppStore.user) {
    checkAndShow()
  }
})
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="What's New"
    :style="{ width: '900px', maxHeight: '80vh' }"
    :content-style="{ overflowY: 'auto' }"
    :closable="true"
  >
    <div class="feedback-panel-container">
      <div class="feedback-box-title">
        Have a Feature Request?
      </div>
      <div style="font-size: 1.1rem;">
        New features in STIG Manager are primarily driven by user requests.
        Have an idea or feature request? We'd love to hear from you!
        Please submit your suggestions by opening an issue on our
        <a href="https://github.com/NUWCDIVNPT/stig-manager/issues" target="_blank">GitHub Issues page</a>.
      </div>
    </div>

    <div class="whats-new-title">
      New Features in the STIG Manager App
    </div>
    <hr class="whats-new-divider">

    <template v-for="(feature, index) in newFeatures" :key="index">
      <div class="home-widget-text feature-container">
        <div class="home-widget-subtitle">
          {{ feature.header }}
          <span class="feature-date">({{ feature.date }})</span>
        </div>
        <div class="feature-body" v-html="feature.body" />
      </div>
      <hr v-if="index < newFeatures.length - 1" class="whats-new-divider">
    </template>

    <template #footer>
      <div style="display: flex; justify-content: flex-end; gap: 10px; padding-top: 10px;">
        <Button label="Don't show these features again" @click="handleDontShowAgain" />
        <Button label="Close" outlined @click="visible = false" />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.home-widget-text {
  padding: 10px 10px;
  font-size: 1.1rem;
  word-wrap: break-word;
}

.whats-new-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--color-primary-highlight);
}

.home-widget-subtitle {
  padding-top: 3px;
  padding-bottom: 3px;
  font-size: 1rem;
  font-weight: bold;
  color: var(--color-primary-highlight);
}

.feature-body :deep(img) {
  max-width: 100%;
  height: auto;
  border: 1px solid var(--surface-border, #3f3f46);
  border-radius: 4px;
  margin-top: 0.5rem;
}

.feature-body :deep(a) {
  color: var(--color-primary-highlight);
  text-decoration: none;
}
.feature-body :deep(a:hover) {
  text-decoration: underline;
}

.feedback-panel-container {
  background-color: #2d3e4e;
  border: 1px solid #3a4d5c;
  border-radius: 4px;
  padding: 8px 16px;
  margin-bottom: 10px;
  position: sticky;
  top: 0;
  z-index: 1;
}

.feedback-box-title {
  font-weight: bold;
  margin-bottom: 5px;
}

.whats-new-divider {
  margin: 10px 16px;
  border: 0;
  border-top: 1px solid #ccc;
}

.feature-container {
  margin-bottom: 10px;
}

.feature-date {
  font-size: 70%;
  font-style: italic;
  font-weight: normal;
}
</style>
