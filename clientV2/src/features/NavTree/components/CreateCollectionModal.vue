<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import { computed, inject, ref, watch } from 'vue'
import CloseButton from '../../../components/common/CloseButton.vue'
import { useGlobalError } from '../../../shared/composables/useGlobalError.js'
import { collectionKeys } from '../../../shared/keys/collectionKeys.js'
import { useEnv } from '../../../shared/stores/useEnv.js'

const emit = defineEmits(['created'])
// this is a two way binded prop that controls the visibility of the modal
const visible = defineModel('visible', { type: Boolean, default: false })
const worker = inject('worker', null)

const name = ref('')
const description = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')
const apiUrl = useEnv().apiUrl

const isFormValid = computed(() => name.value.trim().length > 0)

// watch the visible prop to reset the form when the modal is closed
watch(visible, (isOpen) => {
  if (!isOpen) {
    resetForm()
  }
})

function resetForm() {
  name.value = ''
  description.value = ''
  isSubmitting.value = false
  errorMessage.value = ''
}

async function handleSubmit() {
  if (!isFormValid.value || isSubmitting.value) {
    return
  }
  if (!worker?.token) {
    errorMessage.value = 'Authentication is required to create a collection.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const payload = {
      name: name.value.trim(),
      description: description.value.trim() || null,
      grants: [{
        userId: '87', /** TODO: Get current user id from stored user info  */
        roleId: 4, // Owner role
      }],
      metadata: {},
    }

    const response = await fetch(`${apiUrl}/collections`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json;charset=utf-8',
        'Authorization': `Bearer ${worker.token}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Create collection failed: ${response.status} ${response.statusText}`)
    }

    const createdCollection = await response.json()
    emit('created', createdCollection)
    visible.value = false
  }
  catch (error) {
    const { triggerError } = useGlobalError()
    triggerError(error)
  }
  finally {
    isSubmitting.value = false
  }
}

function handleCancel() {
  visible.value = false
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :style="{ width: '600px' }"
    :pt="{
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
    }"
  >
    <template #closebutton="{ closeCallback }">
      <CloseButton :on-click="closeCallback" />
    </template>
    <template #header>
      <span class="dialog-title">Create Collection</span>
    </template>
    <form class="form" @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="collection-name">Collection Name<span class="required">*</span></label>
        <InputText
          id="collection-name"
          v-model="name"
          placeholder="Enter collection name..."
          maxlength="120"
          :disabled="isSubmitting"
        />
      </div>

      <div class="form-group">
        <label for="collection-description">Description</label>
        <Textarea
          id="collection-description"
          v-model="description"
          rows="6"
          placeholder="Describe the collection (optional)..."
          :disabled="isSubmitting"
        />
      </div>

      <p v-if="errorMessage" class="error">
        {{ errorMessage }}
      </p>

      <div class="actions">
        <Button
          type="button"
          label="Cancel"
          severity="secondary"
          :disabled="isSubmitting"
          :pt="{
            root: {
              style: {
                outline: 'none',
                boxShadow: 'none',
              },
            },
          }"
          @click="handleCancel"
        />
        <Button
          type="submit"
          label="Create"
          :disabled="!isFormValid || isSubmitting"
          :loading="isSubmitting"
          :pt="{
            root: {
              style: {
                outline: 'none',
                boxShadow: 'none',
                background: 'var(--color-primary-highlight)',
              },
            },
          }"
        />
      </div>
    </form>
  </Dialog>
</template>

<style scoped>
.dialog-title {
  font-size: 0.875rem;
  font-weight: 600;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

label {
  font-weight: 500;
  font-size: 0.95rem;
}

.required {
  color: #ff7676;
  margin-left: 0.25rem;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.error {
  color: #ff7676;
  font-size: 0.9rem;
}
</style>
