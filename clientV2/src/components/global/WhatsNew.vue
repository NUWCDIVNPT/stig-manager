<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { computed, onMounted, ref } from 'vue'
import { api } from '../../shared/api/apiClient.js'
import { useGlobalError } from '../../shared/composables/useGlobalError.js'
import { useGlobalAppStore } from '../../shared/stores/globalAppStore.js'
import WhatsNewContent from './WhatsNewContent.vue'
import { Sources } from './whatsNewSources.js'

const globalAppStore = useGlobalAppStore()
const { triggerError } = useGlobalError()
const visible = ref(false)
const lastShownDate = ref('')

const dialogPt = {
  header: {
    style: 'padding: 0.5rem 1rem;',
  },
}

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
    :style="{ width: '900px', height: '80vh' }"
    :content-style="{ overflow: 'hidden', flex: '1', display: 'flex', flexDirection: 'column', minHeight: '0' }"
    :closable="true"
    :pt="dialogPt"
  >
    <WhatsNewContent :features="newFeatures" />

    <template #footer>
      <div class="footer-actions">
        <Button label="Don't show these features again" @click="handleDontShowAgain" />
        <Button label="Close" outlined @click="visible = false" />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 10px;
}
</style>
