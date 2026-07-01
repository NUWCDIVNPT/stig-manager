<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import { computed, ref, watch } from 'vue'
import GrantsPickList from '../../../../components/common/grants/GrantsPickList.vue'
import { fetchUserGroups, fetchUsers } from '../../../../shared/api/userApi.js'
import { useAsyncState } from '../../../../shared/composables/useAsyncState.js'
import { useGlobalError } from '../../../../shared/composables/useGlobalError.js'
import { granteeToGrantPayload, normalizeAvailableGrantees } from '../../../CollectionManage/lib/grantsUsers.js'
import { primaryBtnPt, secondaryBtnPt } from '../../../ImportWizard/lib/importDialogPt.js'
import { createCollection } from '../api/collectionsAdminApi.js'

const props = defineProps({
  visible: { type: Boolean, required: true },
})

const emit = defineEmits(['update:visible', 'created'])

const { triggerError } = useGlobalError()

const localVisible = computed({
  get: () => props.visible,
  set: v => emit('update:visible', v),
})

const form = ref({ name: '', description: '' })
const saving = ref(false)
const touched = ref(false)

// Grantees the user has staged for the new collection (grantee objects carrying
// a roleId). Serialized to the `grants` array of the create payload on save.
const pendingGrantees = ref([])

async function fetchSystemGrantees() {
  const [users, groups] = await Promise.all([
    fetchUsers({ status: 'available' }),
    fetchUserGroups(),
  ])
  return normalizeAvailableGrantees(users, groups)
}

// Selectable users/groups for the grants PickList. useAsyncState standardizes
// loading/error handling (errors surface via the global error modal). The
// PickList mutates `availableGrantees` as items move between panes.
const { state: availableGrantees, isLoading: granteesLoading, execute: loadGrantees } = useAsyncState(
  fetchSystemGrantees,
  { initialState: [], immediate: false },
)

watch(() => props.visible, (open) => {
  if (open) {
    form.value = { name: '', description: '' }
    pendingGrantees.value = []
    touched.value = false
    loadGrantees()
  }
})

const nameError = computed(() => {
  if (!touched.value) {
    return null
  }
  return form.value.name.trim() ? null : 'Name is required'
})

const isValid = computed(() => !!form.value.name.trim())

function close() {
  emit('update:visible', false)
}

async function onSave() {
  touched.value = true
  if (!isValid.value || saving.value) {
    return
  }
  saving.value = true
  try {
    // `grants` is required by the CollectionCreateOrReplace schema. Elevated
    // requests may not set settings, labels, or metadata, so we omit them.
    const body = {
      name: form.value.name.trim(),
      description: form.value.description?.trim() || undefined,
      grants: pendingGrantees.value.map(granteeToGrantPayload),
    }
    const created = await createCollection(body)
    emit('created', created)
    close()
  }
  catch (err) {
    triggerError(err)
  }
  finally {
    saving.value = false
  }
}

const dialogPt = {
  root: { style: 'background: var(--color-background-dark); border: 1px solid var(--color-border-default); border-radius: 8px; color: var(--color-text-primary); display: flex; flex-direction: column; overflow: hidden;' },
  header: { style: 'background: var(--color-background-dark); padding: 0; border-bottom: 1px solid var(--color-border-default); flex-shrink: 0;' },
  content: { style: 'background: var(--color-background-dark); padding: 0; flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column;' },
  footer: { style: 'flex-shrink: 0; padding: 0; border: none;' },
  closeButton: { style: 'color: var(--color-text-dim);' },
}

const inputTextPt = {
  root: { style: 'background: var(--color-background-light); color: var(--color-text-primary); border-color: var(--color-border-default); font-size: 1rem; padding: 0.6rem 0.8rem; width: 100%;' },
}

const textareaPt = {
  root: { style: 'background: var(--color-background-light); color: var(--color-text-primary); border-color: var(--color-border-default); font-size: 1rem; padding: 0.6rem 0.8rem; width: 100%; resize: none;' },
}
</script>

<template>
  <Dialog
    v-model:visible="localVisible"
    modal
    :draggable="false"
    :style="{ width: '950px', maxWidth: '95vw', height: '850px', maxHeight: '95vh' }"
    :pt="dialogPt"
  >
    <template #header>
      <div class="modal-header">
        <div class="modal-header-icon">
          <i class="pi pi-folder" />
        </div>
        <div class="modal-header-title">
          Create Collection
        </div>
      </div>
    </template>

    <div class="form-body">
      <div class="labeled-field">
        <div class="field-header-row">
          <label class="flabel" for="col-name">Name <span class="req-star">*</span></label>
        </div>
        <InputText
          id="col-name"
          v-model="form.name"
          :invalid="!!nameError"
          :pt="inputTextPt"
          maxlength="255"
          placeholder="Collection name"
          autocomplete="off"
          @blur="touched = true"
          @keyup.enter="onSave"
        />
        <div class="field-error" :class="{ 'field-error--hidden': !nameError }">
          {{ nameError }}
        </div>
      </div>

      <div class="labeled-field">
        <div class="field-header-row">
          <label class="flabel" for="col-description">Description</label>
        </div>
        <Textarea
          id="col-description"
          v-model="form.description"
          :pt="textareaPt"
          rows="3"
          maxlength="255"
          auto-resize
          placeholder="Optional description"
        />
      </div>

      <div class="labeled-field" style="flex: 1; min-height: 0;">
        <div class="field-header-row">
          <span class="flabel">Grants</span>
        </div>
        <div v-if="!granteesLoading" style="height: 100%; display: flex; flex-direction: column;">
          <GrantsPickList
            :source="availableGrantees"
            :target="pendingGrantees"
            :can-modify-owners="true"
            :show-footer="false"
            @update:target="pendingGrantees = $event"
            @update:source="availableGrantees = $event"
          />
        </div>
        <div v-else class="grants-loading">
          <i class="pi pi-spin pi-spinner" /> Loading grantees...
        </div>
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

.modal-header-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-action-blue-dark) 20%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-action-blue-dark) 40%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-action-blue-dark);
  flex-shrink: 0;
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
  flex: 1;
  min-height: 0;
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
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.field-error--hidden {
  visibility: hidden;
}

.grants-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex: 1;
  font-size: 1.1rem;
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
