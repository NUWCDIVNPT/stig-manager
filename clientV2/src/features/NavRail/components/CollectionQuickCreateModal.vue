<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import { computed, ref, watch } from 'vue'
import { OWNER_ROLE_ID } from '../../../components/common/grants/roleOptions.js'
import { isDuplicateEntryError } from '../../../shared/api/apiErrors.js'
import { createCollection } from '../../../shared/api/collectionsApi.js'
import { useCurrentUser } from '../../../shared/composables/useCurrentUser.js'
import { useGlobalError } from '../../../shared/composables/useGlobalError.js'
import { primaryBtnPt, secondaryBtnPt } from '../../../shared/lib/dialogPt.js'
import { inputTextPt, textareaPt } from '../../../shared/lib/formPt.js'
import {
  COLLECTION_DESCRIPTION_MAX_LENGTH,
  COLLECTION_NAME_MAX_LENGTH,
  validateCollectionName,
} from '../../CollectionManage/components/Configuration/collectionValidation.js'

const props = defineProps({
  visible: { type: Boolean, required: true },
})

const emit = defineEmits(['update:visible', 'created'])

const { user } = useCurrentUser()
const { triggerError } = useGlobalError()

const localVisible = computed({
  get: () => props.visible,
  set: v => emit('update:visible', v),
})

const form = ref({ name: '', description: '' })
const saving = ref(false)
const touched = ref(false)
const duplicateName = ref(null)

watch(() => props.visible, (open) => {
  if (open) {
    form.value = { name: '', description: '' }
    touched.value = false
    duplicateName.value = null
  }
})

const nameError = computed(() => {
  const name = form.value.name.trim()
  // Case-insensitive to match the collation of the unique index on name
  if (name.toLowerCase() === duplicateName.value) {
    return 'A Collection with this name already exists'
  }
  // Do not flag the empty field until the user has interacted with it
  if (!touched.value && !name) {
    return null
  }
  return validateCollectionName(name)
})

const isValid = computed(() => !!form.value.name.trim() && !nameError.value)

function close() {
  emit('update:visible', false)
}

async function onSave() {
  touched.value = true
  if (!isValid.value || saving.value) {
    return
  }
  saving.value = true
  const name = form.value.name.trim()
  try {
    // The API does not grant the creator anything implicitly; the creating
    // user is always the first Owner of a Collection created this way.
    const body = {
      name,
      description: form.value.description.trim() || undefined,
      grants: [{ userId: user.value.userId, roleId: OWNER_ROLE_ID }],
    }
    const created = await createCollection(body)
    emit('created', created)
    close()
  }
  catch (err) {
    if (isDuplicateEntryError(err)) {
      duplicateName.value = name.toLowerCase()
    }
    else {
      triggerError(err)
    }
  }
  finally {
    saving.value = false
  }
}

const dialogPt = {
  root: { style: 'background: var(--color-background-dark); border: 1px solid var(--color-border-default); border-radius: 8px; color: var(--color-text-primary); display: flex; flex-direction: column; overflow: hidden;' },
  header: { style: 'background: var(--color-background-dark); padding: 0; border-bottom: 1px solid var(--color-border-default); flex-shrink: 0;' },
  content: { style: 'background: var(--color-background-dark); padding: 0; flex: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column;' },
  footer: { style: 'flex-shrink: 0; padding: 0; border: none;' },
  closeButton: { style: 'color: var(--color-text-dim);' },
}
</script>

<template>
  <Dialog
    v-model:visible="localVisible"
    modal
    :draggable="false"
    :style="{ width: '540px', maxWidth: '95vw', maxHeight: '90vh' }"
    :pt="dialogPt"
  >
    <template #header>
      <div class="modal-header">
        <span class="icon-collection-new icon-collection-new--lg" />
        <div class="modal-header-title">
          New Collection
        </div>
      </div>
    </template>

    <div class="form-body">
      <div class="labeled-field">
        <div class="field-header-row">
          <label class="flabel" for="qc-name">Name <span class="req-star">*</span></label>
        </div>
        <InputText
          id="qc-name"
          v-model="form.name"
          :invalid="!!nameError"
          :pt="inputTextPt"
          :maxlength="COLLECTION_NAME_MAX_LENGTH"
          placeholder="Collection name"
          autocomplete="off"
          autofocus
          @blur="touched = true"
          @keyup.enter="onSave"
        />
        <div class="field-error" :class="{ 'field-error--hidden': !nameError }">
          {{ nameError }}
        </div>
      </div>

      <div class="labeled-field">
        <div class="field-header-row">
          <label class="flabel" for="qc-description">Description</label>
        </div>
        <Textarea
          id="qc-description"
          v-model="form.description"
          :pt="textareaPt"
          rows="3"
          :maxlength="COLLECTION_DESCRIPTION_MAX_LENGTH"
          auto-resize
          placeholder="Optional description"
        />
      </div>

      <div class="form-hint">
        You will be the Owner of the new Collection. Grants, Labels, and settings can be configured on the Management page.
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <Button label="Cancel" :pt="secondaryBtnPt" :disabled="saving" @click="close" />
        <Button
          label="Create"
          :pt="primaryBtnPt"
          :loading="saving"
          :disabled="!isValid"
          @click="onSave"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.modal-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.1rem;
}

.modal-header-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text-bright);
}

.form-body {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  padding: 1.25rem 1.25rem 0.5rem;
}

.labeled-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.flabel {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.req-star {
  color: var(--color-text-error);
}

.field-error {
  font-size: 0.85rem;
  line-height: 1.2;
  min-height: 1.2em;
  color: var(--color-text-error);
}

.field-error--hidden {
  visibility: hidden;
}

.form-hint {
  font-size: 0.9rem;
  line-height: 1.4;
  color: var(--color-text-dim);
}

.modal-footer {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.9rem 1.1rem;
  justify-content: flex-end;
}
</style>
