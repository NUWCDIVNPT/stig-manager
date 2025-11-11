<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import { computed, inject, ref } from 'vue'

// Get the OIDC worker to check user roles
const worker = inject('worker', null)

// Parse JWT token to get user roles
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
  const roles = Array.isArray(userRoles.value) ? userRoles.value : [userRoles.value]
  return roles.includes('admin') || roles.includes('Admin')
})

// Custom cards array (will be lost on reload)
const customCards = ref([])

// Dialog state
const showDialog = ref(false)
const newCardTitle = ref('')
const newCardContent = ref('')

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
  })

  // Reset form and close dialog
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
</script>

<template>
  <div v-if="isAdmin" class="custom-cards-container">
    <!-- Existing Custom Cards -->
    <div
      v-for="card in customCards"
      :key="card.id"
      class="home-card"
    >
      <div class="custom-card-header">
        <h2 class="card-title">
          {{ card.title }}
        </h2>
        <button
          class="delete-btn"
          title="Delete card"
          @click="deleteCard(card.id)"
        >
          ×
        </button>
      </div>
      <div class="card-content">
        <div class="custom-section">
          <p class="card-text">
            {{ card.content }}
          </p>
        </div>
      </div>
    </div>

    <!-- Add New Card Button -->
    <div class="home-card add-card-trigger">
      <button class="add-card-btn" @click="openCreateDialog">
        <span class="plus-icon">+</span>
        <span>Add Custom Card</span>
      </button>
    </div>

    <!-- Create Card Dialog -->
    <Dialog
      v-model:visible="showDialog"
      modal
      header="Create Custom Card"
      :style="{ width: '500px' }"
      :dismissable-mask="true"
    >
      <div class="dialog-content">
        <div class="form-group">
          <label for="card-title">Card Title</label>
          <InputText
            id="card-title"
            v-model="newCardTitle"
            placeholder="Enter card title..."
            class="w-full"
            maxlength="100"
          />
        </div>
        <div class="form-group">
          <label for="card-content">Card Content</label>
          <Textarea
            id="card-content"
            v-model="newCardContent"
            placeholder="Enter card content..."
            rows="8"
            class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" @click="cancelNewCard" />
        <Button label="Create Card" @click="addNewCard" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.custom-cards-container {
  display: contents;
}

.custom-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}

.custom-section {
  padding: 0.875rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 0.375rem;
  border-left: 3px solid rgba(96, 165, 250, 0.4);
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
  background: rgba(96, 165, 250, 0.05);
  border: 2px dashed rgba(96, 165, 250, 0.3);
  padding: 0;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-card-trigger:hover {
  background: rgba(96, 165, 250, 0.08);
  border-color: rgba(96, 165, 250, 0.5);
  transform: translateY(-2px);
}

.add-card-btn {
  background: none;
  border: none;
  color: #60a5fa;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem;
  width: 100%;
  height: 100%;
  transition: all 0.15s ease;
}

.add-card-btn:hover {
  color: #93c5fd;
}

.plus-icon {
  font-size: 2.5rem;
  font-weight: 300;
  line-height: 1;
}

/* Dialog Styling */
.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 0.5rem 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 600;
}

.w-full {
  width: 100%;
}
</style>
