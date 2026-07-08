<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import { computed, ref, watch } from 'vue'
import CollectionGrantPickList from '../../../../components/common/grants/CollectionGrantPickList.vue'
import { isDuplicateEntryError } from '../../../../shared/api/apiErrors.js'
import { useAsyncState } from '../../../../shared/composables/useAsyncState.js'
import { useGlobalError } from '../../../../shared/composables/useGlobalError.js'
import { primaryBtnPt, secondaryBtnPt } from '../../../../shared/lib/dialogPt.js'
import { inputTextPt, tabListPt, tabPanelPt, tabPanelsPt, tabPt, tabsPt } from '../../../../shared/lib/formPt.js'
import { createUserGroup, fetchAvailableUsers, fetchCollectionsForGrantPicker } from '../api/userGroupsAdminApi.js'
import { sortByName, sortByUserLabel } from '../lib/userGroupDisplay.js'
import GroupUsersPickList from './GroupUsersPickList.vue'

const props = defineProps({
  visible: { type: Boolean, required: true },
})

const emit = defineEmits(['update:visible', 'created'])

const { triggerError } = useGlobalError()

const localVisible = computed({
  get: () => props.visible,
  set: v => emit('update:visible', v),
})

const name = ref('')
const description = ref('')
const saving = ref(false)
const touched = ref(false)
const activeTab = ref('users')
const nameApiError = ref(null)

watch(name, () => {
  nameApiError.value = null
})

// [available, members] tuple for the Group Users PickList.
const usersModel = ref([[], []])
// Collections not yet granted / staged direct grants for the grant picklist.
const availableCollections = ref([])
const pendingGrants = ref([])

// Picker load errors render in the affected tab with a Retry button instead
// of the global error modal (onError: null).
const { isLoading: usersLoading, error: usersError, execute: loadUsers } = useAsyncState(
  async () => {
    const users = await fetchAvailableUsers()
    usersModel.value = [sortByUserLabel(users), []]
    return users
  },
  { initialState: [], immediate: false, onError: null },
)

const { isLoading: collectionsLoading, error: collectionsError, execute: loadCollections } = useAsyncState(
  async () => {
    const collections = await fetchCollectionsForGrantPicker()
    availableCollections.value = sortByName(
      collections.map(({ collectionId, name: collectionName }) => ({ collectionId, name: collectionName })),
    )
    return collections
  },
  { initialState: [], immediate: false, onError: null },
)

watch(() => props.visible, (open) => {
  if (open) {
    name.value = ''
    description.value = ''
    nameApiError.value = null
    touched.value = false
    activeTab.value = 'users'
    usersModel.value = [[], []]
    availableCollections.value = []
    pendingGrants.value = []
    loadUsers()
    loadCollections()
  }
})

const nameError = computed(() => {
  if (nameApiError.value) {
    return nameApiError.value
  }
  if (!touched.value) {
    return null
  }
  return name.value.trim() ? null : 'Group Name is required'
})

const isValid = computed(() => !!name.value.trim())

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
    const created = await createUserGroup({
      name: name.value.trim(),
      description: description.value.trim(),
      userIds: usersModel.value[1].map(u => String(u.userId)),
      collectionGrants: pendingGrants.value.map(g => ({
        collectionId: String(g.collectionId),
        roleId: Number(g.roleId),
      })),
    })
    emit('created', created)
    close()
  }
  catch (err) {
    if (isDuplicateEntryError(err)) {
      // Keep the modal (and staged selections) open; flag the name field.
      nameApiError.value = 'A user group with this name already exists.'
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
  content: { style: 'background: var(--color-background-dark); padding: 0; flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column;' },
  footer: { style: 'flex-shrink: 0; padding: 0; border: none;' },
  closeButton: { style: 'color: var(--color-text-dim);' },
}
</script>

<template>
  <Dialog
    v-model:visible="localVisible"
    modal
    :draggable="false"
    :style="{ width: '900px', maxWidth: '95vw', height: '700px', maxHeight: '95vh' }"
    :pt="dialogPt"
  >
    <template #header>
      <div class="modal-header">
        <div class="modal-header-icon">
          <i class="pi pi-users" />
        </div>
        <div class="modal-header-title">
          New User Group
        </div>
      </div>
    </template>

    <div class="form-body">
      <div class="fields-row">
        <div class="labeled-field">
          <label class="flabel" for="create-group-name">Group Name <span class="req-star">*</span></label>
          <InputText
            id="create-group-name"
            v-model="name"
            :invalid="!!nameError"
            :pt="inputTextPt"
            maxlength="255"
            placeholder="Group Name"
            autocomplete="off"
            @blur="touched = true"
            @keyup.enter="onSave"
          />
          <div class="field-error" :class="{ 'field-error--hidden': !nameError }">
            {{ nameError }}
          </div>
        </div>
        <div class="labeled-field">
          <label class="flabel" for="create-group-description">Description</label>
          <InputText
            id="create-group-description"
            v-model="description"
            :pt="inputTextPt"
            maxlength="255"
            placeholder="Description"
            autocomplete="off"
            @keyup.enter="onSave"
          />
          <div class="field-error field-error--hidden" />
        </div>
      </div>

      <Tabs v-model:value="activeTab" :pt="tabsPt">
        <TabList :pt="tabListPt">
          <Tab value="users" :pt="tabPt">
            <i class="pi pi-user tab-icon" /> Users
          </Tab>
          <Tab value="grants" :pt="tabPt">
            <i class="pi pi-folder tab-icon" /> Direct Grants
          </Tab>
        </TabList>
        <TabPanels :pt="tabPanelsPt">
          <TabPanel value="users" :pt="tabPanelPt">
            <div v-if="usersLoading" class="tab-loading">
              <i class="pi pi-spin pi-spinner" /> Loading users...
            </div>
            <div v-else-if="usersError" class="tab-error">
              <i class="pi pi-exclamation-triangle" />
              <span>Could not load users.</span>
              <Button label="Retry" icon="pi pi-refresh" size="small" severity="secondary" @click="loadUsers" />
            </div>
            <GroupUsersPickList
              v-else
              v-model="usersModel"
            />
          </TabPanel>
          <TabPanel value="grants" :pt="tabPanelPt">
            <div v-if="collectionsLoading" class="tab-loading">
              <i class="pi pi-spin pi-spinner" /> Loading collections...
            </div>
            <div v-else-if="collectionsError" class="tab-error">
              <i class="pi pi-exclamation-triangle" />
              <span>Could not load collections.</span>
              <Button label="Retry" icon="pi pi-refresh" size="small" severity="secondary" @click="loadCollections" />
            </div>
            <CollectionGrantPickList
              v-else
              :source="availableCollections"
              :target="pendingGrants"
              @update:source="availableCollections = $event"
              @update:target="pendingGrants = $event"
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>

    <template #footer>
      <div class="modal-footer">
        <Button label="Cancel" :pt="secondaryBtnPt" :disabled="saving" @click="close" />
        <Button
          label="Save"
          :pt="primaryBtnPt"
          :loading="saving"
          :disabled="!isValid || usersLoading || collectionsLoading"
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
  gap: 0.25rem;
  padding: 1.25rem 1.25rem 0.75rem;
  flex: 1;
  min-height: 0;
}

.fields-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem 1rem;
}

.labeled-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 0;
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

.tab-icon {
  margin-right: 0.4rem;
}

.tab-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex: 1;
  font-size: 1.1rem;
  color: var(--color-text-dim);
}

.tab-error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  flex: 1;
  font-size: 1.05rem;
  color: var(--color-text-primary);
}

.tab-error .pi-exclamation-triangle {
  color: var(--color-text-error);
  font-size: 1.3rem;
}

.modal-footer {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.9rem 1.1rem;
  justify-content: flex-end;
}
</style>
