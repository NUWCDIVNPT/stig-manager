<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { computed } from 'vue'
import { useGlobalError } from '../../shared/composables/useGlobalError.js'

const { error, clearError } = useGlobalError()

const visible = computed({
  get: () => !!error.value,
  set: (val) => {
    if (!val) {
      clearError()
    }
  },
})

function copyError() {
  if (error.value) {
    const errText = JSON.stringify(error.value, null, 2)
    navigator.clipboard.writeText(errText)
  }
}

const dialogPt = {
  root: {
    style: 'background-color: #18181b; border: 1px solid #3f3f46; border-radius: 6px; color: #e4e4e7; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);',
  },
  header: {
    style: 'background-color: #18181b; color: #e4e4e7; border-top-left-radius: 6px; border-top-right-radius: 6px; padding: 1rem; border-bottom: 1px solid #27272a;',
  },
  content: {
    style: 'background-color: #18181b; color: #e4e4e7; border-bottom-left-radius: 6px; border-bottom-right-radius: 6px; padding: 1.5rem;',
  },
  closeButton: {
    style: 'color: #a1a1aa;',
  },
  title: {
    style: 'font-size: 1.5rem; font-weight: 600;',
  },
}

const buttonPt = {
  root: {
    style: 'color: rgba(255, 255, 255, 0.87); border-color: #3f3f46; width: 100%',
    class: 'action-btn',
  },
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="Unhandled Error"
    :style="{ width: '800px', maxWidth: '90vw' }"
    :closable="true"
    :pt="dialogPt"
  >
    <div class="error-modal-content">
      <p class="description">
        An unhandled error has occurred. You can review the error details below and copy the details to your clipboard.
      </p>

      <div class="code-box">
        <div class="box-title">
          Error Details
        </div>
        <div class="code-content custom-scrollbar">
          <pre>{{ JSON.stringify(error, null, 2) }}</pre>
        </div>
      </div>

      <div class="actions">
        <Button
          label="Copy to clipboard"
          icon="pi pi-copy"
          :pt="buttonPt"
          @click="copyError"
        />
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
.error-modal-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  font-size: 0.95rem;
}

.description {
  margin: 0;
  color: #a1a1aa;
}

.code-box {
  border: 1px solid #3f3f46;
  border-radius: 6px;
  padding: 1rem;
  position: relative;
  margin-top: 0.5rem;
  background-color: #09090b;
}

.box-title {
  position: absolute;
  top: -10px;
  left: 1rem;
  background-color: #18181b;
  padding: 0 0.5rem;
  color: #a1a1aa;
  font-size: 0.9rem;
  font-weight: 500;
}

.code-content {
  max-height: 400px;
  overflow: auto;
}

pre {
  margin: 0;
  font-family: monospace;
  font-size: 0.85rem;
  color: #e4e4e7;
  white-space: pre-wrap;
  word-break: break-all;
}

.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.action-btn:hover,
.action-btn:active,
.action-btn:focus-visible {
  background-color: rgba(96, 165, 250, 0.1) !important;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #09090b;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #3f3f46;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #52525b;
}
</style>
