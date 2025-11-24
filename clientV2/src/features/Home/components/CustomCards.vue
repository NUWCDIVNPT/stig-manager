<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Editor from 'primevue/editor'
import InputText from 'primevue/inputtext'
import { computed, inject, ref } from 'vue'
import CloseButton from '../../../components/common/CloseButton.vue'

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
  // Strip HTML tags to check if editor has actual content
  const textContent = newCardContent.value.replace(/<[^>]*>/g, '').trim()
  return newCardTitle.value.trim().length > 0 && textContent.length > 0
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

defineExpose({
  customCards,
  deleteCard,
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
    :pt="{
      root: {
        style: {
          borderRadius: '0.6rem',
          width: '900px',
        },
      },
      header: {
        style: {
          borderTopLeftRadius: '0.5rem',
          borderTopRightRadius: '0.5rem',
          backgroundColor: '#35393b',
          padding: '10px',
          height: '35px',
        },
      },
      content: {
        style: {
          padding: '1rem',
        },
      },
      pcCloseButton: {
        style: {
          borderRadius: '12px',
          height: '24px',
          boxShadow: 'none',
          border: 'none',
          width: '24px',
          outline: 'none',
          color: '#fff',
        },
      },
    }"
  >
    <template #closebutton="{ closeCallback }">
      <CloseButton :on-click="closeCallback" />
    </template>
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
      <Editor
        id="card-content"
        v-model="newCardContent"
        editor-style="height: 320px"
        :pt="{
          root: {
            style: {
              borderRadius: '0.375rem',
            },
          },
          toolbar: {
            style: {
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderBottom: 'none',
              borderRadius: '0.375rem 0.375rem 0 0',
            },
          },
          content: {
            style: {
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0 0 0.375rem 0.375rem',
              background: 'rgba(0, 0, 0, 0.2)',
            },
          },
        }"
      >
        <template #toolbar>
          <span class="ql-formats">
            <button class="ql-bold" />
            <button class="ql-italic" />
            <button class="ql-underline" />
            <button class="ql-strike" />
          </span>
          <span class="ql-formats">
            <select class="ql-header">
              <option value="1" />
              <option value="2" />
              <option value="3" />
              <option selected />
            </select>
          </span>
          <span class="ql-formats">
            <button class="ql-list" value="ordered" />
            <button class="ql-list" value="bullet" />
          </span>
          <span class="ql-formats">
            <button class="ql-link" />
            <button class="ql-code-block" />
          </span>
          <span class="ql-formats">
            <button class="ql-clean" />
          </span>
        </template>
      </Editor>
    </div>
    <template #footer>
      <Button
        label="Cancel" severity="secondary" :pt="{
          root: {
            style: {
              outline: 'none',
              boxShadow: 'none',
            },
          },
        }" @click="cancelNewCard"
      />
      <Button
        label="Create" :disabled="!isFormValid" :pt="{
          root: {
            style: {
              outline: 'none',
              boxShadow: 'none',
              background: 'var(--color-primary-blue)',
            },
          },
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

/* PrimeVue Editor Styling */
:deep(.ql-editor) {
  color: rgba(255, 255, 255, 0.9);
}

:deep(.ql-editor.ql-blank::before) {
  color: rgba(255, 255, 255, 0.4);
  font-style: italic;
}

.dialog-title {
  font-size: 0.875rem;
  font-weight: 600;
}
</style>
