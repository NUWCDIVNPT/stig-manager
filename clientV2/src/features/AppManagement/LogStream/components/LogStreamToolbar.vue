<script setup>
import Checkbox from 'primevue/checkbox'
import Popover from 'primevue/popover'
import { ref } from 'vue'
import streamStoppedSvg from '../../../../assets/stream-stopped.svg'
import streamSvg from '../../../../assets/stream.svg'
import ActionButton from '../../../../components/common/ActionButton.vue'
import ActionToolbar from '../../../../components/common/ActionToolbar.vue'
import LogFilterMenu from './LogFilterMenu.vue'

defineProps({
  isStreaming: { type: Boolean, default: false },
  canStream: { type: Boolean, default: false },
  isRecording: { type: Boolean, default: false },
  recordingName: { type: String, default: '' },
  recordingError: { type: String, default: '' },
})

const emit = defineEmits(['toggle-stream', 'apply-filter', 'toggle-record', 'clear'])

const preserveLog = defineModel('preserve', { default: true })
const wrap = defineModel('wrap', { default: false })

const filterPopover = ref(null)

// Recording uses the File System Access API (Chromium only); the button hides
// entirely where it is unavailable, exactly as the old client did.
const canRecord = typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function'

function toggleFilter(event) {
  filterPopover.value.toggle(event)
}

function onApplyFilter(filter) {
  filterPopover.value.hide()
  emit('apply-filter', filter)
}
</script>

<template>
  <ActionToolbar class="log-toolbar">
    <ActionButton
      :disabled="!canStream"
      @click="emit('toggle-stream', !isStreaming)"
    >
      <!-- Old-client SVGs: static grey when stopped, animated when streaming. -->
      <img :src="isStreaming ? streamSvg : streamStoppedSvg" class="stream-icon" alt="">
      {{ isStreaming ? 'Streaming' : 'Stream' }}
    </ActionButton>
    <ActionButton
      icon="pi pi-chevron-down"
      :disabled="!canStream"
      aria-label="Stream filters"
      @click="toggleFilter"
    />
    <Popover ref="filterPopover">
      <LogFilterMenu @apply="onApplyFilter" />
    </Popover>

    <div class="toolbar-divider" />
    <ActionButton
      v-if="canRecord"
      :icon="isRecording ? 'pi pi-stop-circle icon-red' : 'pi pi-circle'"
      @click="emit('toggle-record', !isRecording)"
    >
      {{ isRecording ? `Recording to ${recordingName}` : 'Record...' }}
    </ActionButton>
    <span v-if="recordingError" class="log-toolbar-error" role="alert">
      <i class="pi pi-exclamation-triangle" />
      {{ recordingError }}
    </span>

    <div class="toolbar-spacer" />
    <label class="log-toolbar-check">
      <Checkbox v-model="preserveLog" binary input-id="preserve-log" />
      <span>Preserve Log</span>
    </label>
    <div class="toolbar-divider" />
    <ActionButton
      :icon="wrap ? 'pi pi-align-left icon-green' : 'pi pi-align-left'"
      @click="wrap = !wrap"
    >
      Wrap
    </ActionButton>
    <ActionButton icon="pi pi-trash" @click="emit('clear')">
      Clear
    </ActionButton>
  </ActionToolbar>
</template>

<style scoped>
/* Sit flush inside the log pane rather than the free-floating card default. */
.log-toolbar {
  border: none;
  border-bottom: 1px solid var(--color-border-default);
  border-radius: 0;
  background: var(--color-background-subtle);
}

.stream-icon {
  width: 1.35rem;
  height: 1.35rem;
  display: block;
}

.log-toolbar-check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.05rem;
  color: var(--color-text-primary);
  cursor: pointer;
}

.log-toolbar-error {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 1rem;
  color: var(--color-action-red);
}
</style>
