<script setup>
import Menu from 'primevue/menu'
import { ref } from 'vue'
import ActionButton from '../../../../components/common/ActionButton.vue'
import ActionToolbar from '../../../../components/common/ActionToolbar.vue'
import ShareReportMenu from './common/ShareReportMenu.vue'

const props = defineProps({
  hasReport: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['load-file', 'save-full', 'save-shareable', 'fetch-quick', 'fetch-full'])

const fileInputRef = ref(null)
const fetchMenuRef = ref(null)
const shareMenuRef = ref(null)

const fetchMenuItems = [
  {
    label: 'Quick fetch (estimated row counts)',
    icon: 'pi pi-bolt',
    command: () => emit('fetch-quick'),
  },
  {
    label: 'Full fetch (exact row counts)',
    icon: 'pi pi-database',
    command: () => emit('fetch-full'),
  },
]

const menuPt = {
  root: { style: 'background: var(--color-background-dark); border: 1px solid var(--color-border-default); border-radius: 4px; box-shadow: 0 6px 24px rgba(0,0,0,0.6); padding: 0.25rem 0; min-width: 16rem;' },
  menu: { style: 'background: transparent; outline: none;' },
  menuitem: { style: 'margin: 0;' },
  content: { style: 'padding: 0.4rem 0.8rem; color: var(--color-text-primary); border-radius: 0; transition: background-color 0.1s; display: flex; align-items: center;' },
  icon: { style: 'color: var(--color-text-dim); margin-right: 0.5rem; font-size: 0.92rem;' },
  label: { style: 'font-size: 0.92rem;' },
}

function onFileChange(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (file) {
    emit('load-file', file)
  }
}

function toggleFetchMenu(event) {
  if (!props.loading) {
    fetchMenuRef.value?.toggle(event)
  }
}
</script>

<template>
  <ActionToolbar class="no-wrap-toolbar">
    <ActionButton
      icon="pi pi-upload icon-blue"
      :disabled="loading"
      title="Load a saved Application Info report"
      @click="fileInputRef?.click()"
    >
      Load from file…
    </ActionButton>
    <div class="toolbar-divider" />
    <ActionButton
      icon="pi pi-save icon-grey"
      :disabled="!hasReport || loading"
      title="Save the complete report to a file"
      @click="emit('save-full')"
    >
      Save to file
    </ActionButton>
    <div class="toolbar-divider" />
    <ActionButton
      icon="pi pi-share-alt icon-grey"
      :disabled="!hasReport || loading"
      title="Save an anonymized report for sharing"
      @click="shareMenuRef?.toggle($event)"
    >
      Save for sharing <i class="pi pi-chevron-down trigger-caret" />
    </ActionButton>
    <div class="toolbar-divider" />
    <ActionButton
      icon="pi pi-refresh icon-green"
      :disabled="loading"
      title="Fetch a current report from the API"
      @click="toggleFetchMenu"
    >
      Fetch from API <i class="pi pi-chevron-down trigger-caret" />
    </ActionButton>
  </ActionToolbar>

  <input
    ref="fileInputRef"
    type="file"
    accept=".json"
    style="display: none"
    @change="onFileChange"
  >

  <Menu
    ref="fetchMenuRef"
    :model="fetchMenuItems"
    :popup="true"
    :pt="menuPt"
  />

  <ShareReportMenu ref="shareMenuRef" @save="emit('save-shareable', $event)" />
</template>

<style scoped>
.no-wrap-toolbar {
  flex-wrap: nowrap !important;
  overflow: hidden !important;
}

:deep(.action-btn) {
  white-space: nowrap !important;
  flex-shrink: 0 !important;
}

:deep(.toolbar-divider) {
  flex-shrink: 0 !important;
}

.trigger-caret {
  font-size: 0.75rem;
  color: var(--color-text-dim);
  margin-left: 0.15rem;
}
</style>
