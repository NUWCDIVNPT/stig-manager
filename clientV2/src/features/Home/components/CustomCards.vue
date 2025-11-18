<script setup>
import DOMPurify from 'dompurify'
import { marked } from 'marked'
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

// Configure marked for better rendering
marked.setOptions({
  breaks: true, // Convert \n to <br>
  gfm: true, // GitHub Flavored Markdown
})

// Computed preview of markdown content
const markdownPreview = computed(() => {
  if (!newCardContent.value) {
    return ''
  }
  return formatContent(newCardContent.value)
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

  // Convert markdown to HTML
  const html = marked(text)

  // Sanitize to prevent XSS attacks
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'strike', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code', 'pre', 'blockquote', 'hr'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  })
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
    :style="{ width: '900px' }"
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
      <div class="markdown-editor">
        <Textarea
          id="card-content"
          v-model="newCardContent"
          placeholder="Enter card content using Markdown..."
          rows="12"
        />
        <div class="preview-pane">
          <div
            v-if="!markdownPreview"
            class="markdown-preview preview-empty"
          >
            Markdown preview will appear here...
          </div>
          <div
            v-else
            class="markdown-preview"
            v-html="markdownPreview"
          />
        </div>
      </div>
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

.markdown-editor {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  min-height: 300px;
}

.editor-pane,
.preview-pane {
  display: flex;
  flex-direction: column;
}

.preview-label {
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: rgba(255, 255, 255, 0.7);
}

.markdown-preview {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  background: rgba(0, 0, 0, 0.2);
  overflow-y: auto;
  min-height: 240px;
}

.preview-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.4);
  font-style: italic;
  font-size: 0.875rem;
}

.formatting-hint {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.5rem;
}

.formatting-hint strong {
  color: rgba(255, 255, 255, 0.7);
}

/* Markdown Preview Styles */
.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3),
.markdown-preview :deep(h4),
.markdown-preview :deep(h5),
.markdown-preview :deep(h6) {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-preview :deep(h1) { font-size: 1.5em; }
.markdown-preview :deep(h2) { font-size: 1.25em; }
.markdown-preview :deep(h3) { font-size: 1.1em; }

.markdown-preview :deep(p) {
  margin: 0.5em 0;
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.markdown-preview :deep(li) {
  margin: 0.25em 0;
}

.markdown-preview :deep(a) {
  color: var(--color-primary-blue);
  text-decoration: none;
}

.markdown-preview :deep(a:hover) {
  text-decoration: underline;
}

.markdown-preview :deep(code) {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.2em 0.4em;
  border-radius: 0.25rem;
  font-size: 0.9em;
  font-family: 'Courier New', monospace;
}

.markdown-preview :deep(pre) {
  background: rgba(255, 255, 255, 0.05);
  padding: 0.75em;
  border-radius: 0.375rem;
  overflow-x: auto;
  margin: 0.5em 0;
}

.markdown-preview :deep(pre code) {
  background: none;
  padding: 0;
}

.markdown-preview :deep(blockquote) {
  border-left: 3px solid rgba(255, 255, 255, 0.3);
  padding-left: 1em;
  margin: 0.5em 0;
  color: rgba(255, 255, 255, 0.7);
}

.markdown-preview :deep(hr) {
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  margin: 1em 0;
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
