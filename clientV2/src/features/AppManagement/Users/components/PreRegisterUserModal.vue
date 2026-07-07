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
import PickList from '../../../../components/common/PickList.vue'
import { fetchUserGroups } from '../../../../shared/api/userApi.js'
import { useAsyncState } from '../../../../shared/composables/useAsyncState.js'
import { useGlobalError } from '../../../../shared/composables/useGlobalError.js'
import { isDuplicateEntryError } from '../../../../shared/api/apiErrors.js'
import { primaryBtnPt, secondaryBtnPt } from '../../../ImportWizard/lib/importDialogPt.js'
import { createPreregisteredUser, fetchCollectionsForGrantPicker } from '../api/usersAdminApi.js'
import { sortByName } from '../lib/userDisplay.js'
import { inputTextPt, tabListPt, tabPanelPt, tabPanelsPt, tabPt, tabsPt } from '../lib/usersPt.js'
import CollectionGrantPickList from './CollectionGrantPickList.vue'

const props = defineProps({
  visible: { type: Boolean, required: true },
})

const emit = defineEmits(['update:visible', 'created'])

const { triggerError } = useGlobalError()

const localVisible = computed({
  get: () => props.visible,
  set: v => emit('update:visible', v),
})

const username = ref('')
const saving = ref(false)
const touched = ref(false)
const activeTab = ref('groups')
// API-reported username problem (e.g. duplicate); cleared as soon as the
// admin edits the field.
const usernameApiError = ref(null)

watch(username, () => {
  usernameApiError.value = null
})

// [available, assigned] tuple for the User Groups PickList.
const groupsModel = ref([[], []])
// Collections not yet granted / staged direct grants for the grant picklist.
const availableCollections = ref([])
const pendingGrants = ref([])

// Picker load errors render in the affected tab with a Retry button instead
// of the global error modal (onError: null).
const { isLoading: groupsLoading, error: groupsError, execute: loadGroups } = useAsyncState(
  async () => {
    const groups = await fetchUserGroups()
    groupsModel.value = [sortByName(groups), []]
    return groups
  },
  { initialState: [], immediate: false, onError: null },
)

const { isLoading: collectionsLoading, error: collectionsError, execute: loadCollections } = useAsyncState(
  async () => {
    const collections = await fetchCollectionsForGrantPicker()
    availableCollections.value = sortByName(
      collections.map(({ collectionId, name }) => ({ collectionId, name })),
    )
    return collections
  },
  { initialState: [], immediate: false, onError: null },
)

watch(() => props.visible, (open) => {
  if (open) {
    username.value = ''
    usernameApiError.value = null
    touched.value = false
    activeTab.value = 'groups'
    groupsModel.value = [[], []]
    availableCollections.value = []
    pendingGrants.value = []
    loadGroups()
    loadCollections()
  }
})

const usernameError = computed(() => {
  if (usernameApiError.value) {
    return usernameApiError.value
  }
  if (!touched.value) {
    return null
  }
  return username.value.trim() ? null : 'Username is required'
})

const isValid = computed(() => !!username.value.trim())

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
    const created = await createPreregisteredUser({
      username: username.value.trim(),
      userGroups: groupsModel.value[1].map(g => String(g.userGroupId)),
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
      // Keep the modal (and staged selections) open; flag the username field.
      usernameApiError.value = 'A user with this username already exists.'
    }
    else {
      // Anything else (403/404/stale-reference 422/network): show the API
      // error and leave the modal open so the admin can adjust and retry.
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
          <i class="pi pi-user-plus" />
        </div>
        <div class="modal-header-title">
          Pre-register User
        </div>
      </div>
    </template>

    <div class="form-body">
      <div class="labeled-field">
        <div class="field-header-row">
          <label class="flabel" for="preregister-username">Username <span class="req-star">*</span></label>
        </div>
        <InputText
          id="preregister-username"
          v-model="username"
          :invalid="!!usernameError"
          :pt="inputTextPt"
          maxlength="255"
          placeholder="Username"
          autocomplete="off"
          @blur="touched = true"
          @keyup.enter="onSave"
        />
        <div class="field-error" :class="{ 'field-error--hidden': !usernameError }">
          {{ usernameError }}
        </div>
      </div>

      <Tabs v-model:value="activeTab" :pt="tabsPt">
        <TabList :pt="tabListPt">
          <Tab value="groups" :pt="tabPt">
            <i class="pi pi-users tab-icon" /> User Groups
          </Tab>
          <Tab value="grants" :pt="tabPt">
            <i class="pi pi-folder tab-icon" /> Direct Grants
          </Tab>
        </TabList>
        <TabPanels :pt="tabPanelsPt">
          <TabPanel value="groups" :pt="tabPanelPt">
            <div v-if="groupsLoading" class="tab-loading">
              <i class="pi pi-spin pi-spinner" /> Loading user groups...
            </div>
            <div v-else-if="groupsError" class="tab-error">
              <i class="pi pi-exclamation-triangle" />
              <span>Could not load user groups.</span>
              <Button label="Retry" icon="pi pi-refresh" size="small" severity="secondary" @click="loadGroups" />
            </div>
            <PickList
              v-else
              v-model="groupsModel"
              data-key="userGroupId"
              filter-by="name"
              show-source-filter
              show-target-filter
              source-filter-placeholder="Search groups..."
              target-filter-placeholder="Search groups..."
              option-style="padding: 0.4rem 0.75rem;"
            >
              <template #sourceheader>
                Available Groups
              </template>
              <template #targetheader>
                Assigned Groups
              </template>
              <template #item="{ item }">
                <div class="group-item">
                  <i class="pi pi-users" />
                  <span>{{ item.name }}</span>
                </div>
              </template>
            </PickList>
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
          :disabled="!isValid || groupsLoading || collectionsLoading"
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

.group-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
}

.group-item i {
  font-size: 1.15rem;
}

.modal-footer {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.9rem 1.1rem;
  justify-content: flex-end;
}
</style>
