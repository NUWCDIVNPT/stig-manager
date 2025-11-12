<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import { computed, inject, ref } from 'vue'

const worker = inject('worker', null)

const userRoles = computed(() => {
  if (!worker?.tokenParsed) {
    return []
  }
  try {
    return worker.tokenParsed.realm_access.roles || []
  }
  catch {
    return []
  }
})

const isAdmin = computed(() => {
  return userRoles.value.includes('admin')
})

const customCards = ref([])

const showDialog = ref(false)
const newCardTitle = ref('')
const newCardContent = ref('')
const isFormValid = computed(() => {
  return newCardTitle.value.trim().length > 0 && newCardContent.value.trim().length > 0
})

function openCreateDialog() {
  showDialog.value = true
}

function addNewCard() {
  if (!newCardTitle.value.trim()) {
    return
  }

  customCards.value.push({
    id: Date.now(),
    title: newCardTitle.value.trim(),
    content: newCardContent.value.trim(),
    isCustom: true,
  })

  newCardTitle.value = ''
  newCardContent.value = ''
  showDialog.value = false
}

function deleteCard(id) {
  customCards.value = customCards.value.filter(card => card.id !== id)
}

function cancelNewCard() {
  newCardTitle.value = ''
  newCardContent.value = ''
  showDialog.value = false
}

function formatContent(text) {
  if (!text) {
    return ''
  }

  const lines = text.split('\n')

  return lines.map((line) => {
    let formattedLine = line

    if (/^\s*[-*]\s+/.test(formattedLine)) {
      formattedLine = formattedLine.replace(/^\s*[-*]\s+/, '• ')
    }

    formattedLine = formattedLine.replace(/^\s*(\d+)[.)]\s+/, '$1. ')

    formattedLine = formattedLine.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

    formattedLine = formattedLine.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="link">$1</a>')

    return formattedLine
  }).join('<br>')
}
defineExpose({
  customCards,
  deleteCard,
  formatContent,
  isAdmin,
})
</script>

<template>
  <button
    v-if="isAdmin"
    class="floating-add-btn"
    title="Add custom card"
    @click="openCreateDialog"
  >
    +
  </button>

  <Dialog
    v-if="isAdmin"
    v-model:visible="showDialog"
    modal
    :style="{ width: '600px' }"
    :pt="{
      root: { class: 'custom-dialog-root' },
      header: { class: 'custom-dialog-header' },
      content: { class: 'custom-dialog-content' },
      pcCloseButton: { class: 'custom-dialog-close-button' },
    }"
  >
    <template #header>
      <span class="dialog-title">Create Card</span>
    </template>
    <div class="form-group">
      <label for="card-title">Card Title:<span class="required">*</span></label>
      <InputText
        id="card-title"
        v-model="newCardTitle"
        placeholder="Enter card title..."
        maxlength="70"
      />
    </div>
    <div class="form-group">
      <label for="card-content">Card Content:<span class="required">*</span></label>
      <Textarea
        id="card-content"
        v-model="newCardContent"
        placeholder="Enter card content..."
        rows="8"
      />
      <span class="formatting-hint">
        Formatting: <strong>**bold**</strong> • <em>- bullet point</em> • <em>1. numbered list</em> • <em>[link text](url)</em>
      </span>
    </div>
    <template #footer>
      <Button
        label="Cancel" severity="secondary" :pt="{
          root: { class: 'custom-dialog-footer-cancel-button' },
        }" @click="cancelNewCard"
      />
      <Button
        label="Create" :disabled="!isFormValid" :pt="{
          root: { class: 'custom-dialog-footer-create-button' },
        }" @click="addNewCard"
      />
    </template>
  </Dialog>
</template>

<style scoped>
.floating-add-btn {
  background: var(--color-primary-blue);
  border: none;
  color: #fff;
  font-size: 1.5rem;
  font-weight: 300;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  padding: 0;
  transition: all 0.15s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  margin-left: 0.5rem;
}

.floating-add-btn:hover {
  background: var(--color-primary-blue-light);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.floating-add-btn:active {
  transform: scale(0.95);
}

.delete-btn {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  font-size: 1.5rem;
  width: 28px;
  height: 28px;
  border-radius: 0.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  padding: 0;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
  transform: scale(1.05);
}

/* Add Card Trigger */
.add-card-trigger {
  background: transparent;
  border: none;
  padding: 0;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-card-trigger:hover {
  background: transparent;
  transform: none;
}

.add-card-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 3rem;
  font-weight: 300;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: opacity 0.15s ease;
}

.add-card-btn:hover {
  opacity: 0.7;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
}

.required {
  color: #ef4444;
  margin-left: 0.25rem;
}

.formatting-hint {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
  margin-top: 0.25rem;
}

.formatting-hint strong,
.formatting-hint em {
  color: rgba(255, 255, 255, 0.7);
}

:global(.custom-dialog-root) {
  border-radius: 0.6rem !important;
}
:global(.custom-dialog-header) {
  border-top-left-radius: 0.5rem;
  border-top-right-radius: 0.5rem;
  background-color: #35393b;
  padding: 10px !important;
  height: 35px
}

:global(.custom-dialog-content) {
  padding: 1rem !important;
}

:global(.p-button-icon-only.p-button-rounded),
:global(.p-dialog-header-close) {
  border-radius: 12px !important;
  height: 24px !important;
  box-shadow: none !important;
  border: none !important;
  width: 24px !important;
  outline: none !important;
}

:global(.p-button-icon-only.p-button-rounded:hover),
:global(.p-button-icon-only.p-button-rounded:active),
:global(.p-dialog-header-close:hover),
:global(.p-dialog-header-close:active) {
  background: rgba(255, 255, 255, 0.1);
  color: #fff !important;
}

.dialog-title {
  font-size: 0.875rem;
  font-weight: 600;
}

/* Dialog Footer Buttons */
:global(.custom-dialog-footer-cancel-button),
:global(.custom-dialog-footer-cancel-button:focus),
:global(.custom-dialog-footer-cancel-button:focus-visible),
:global(.custom-dialog-footer-cancel-button:active) {
  outline: none !important;
  box-shadow: none !important;
}

:global(.custom-dialog-footer-create-button),
:global(.custom-dialog-footer-create-button:focus),
:global(.custom-dialog-footer-create-button:focus-visible),
:global(.custom-dialog-footer-create-button:active) {
  outline: none !important;
  box-shadow: none !important;
  background: var(--color-primary-blue) !important;
}

:global(.custom-dialog-footer-create-button:hover) {
  background: var(--color-primary-blue-light) !important;
}
</style>
