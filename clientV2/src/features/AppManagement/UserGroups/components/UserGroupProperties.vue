<script setup>
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import { ref, watch } from 'vue'
import CollectionGrantPickList from '../../../../components/common/grants/CollectionGrantPickList.vue'
import { isDuplicateEntryError } from '../../../../shared/api/apiErrors.js'
import { useAsyncState } from '../../../../shared/composables/useAsyncState.js'
import { inputTextPt, tabListPt, tabPanelPt, tabPanelsPt, tabPt, tabsPt } from '../../../../shared/lib/formPt.js'
import { useLiveApplyDetailPanel } from '../../composables/useLiveApplyDetailPanel.js'
import { fetchAvailableUsers, fetchCollectionsForGrantPicker, fetchUserGroupAdmin, patchUserGroupAdmin } from '../api/userGroupsAdminApi.js'
import { sortByUserLabel } from '../lib/userGroupDisplay.js'
import GroupUsersPickList from './GroupUsersPickList.vue'

const props = defineProps({
  group: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['updated'])

const activeTab = ref('users')

const { state: allUsers, isLoading: usersLoading } = useAsyncState(fetchAvailableUsers, { initialState: [] })
const { state: allCollections, isLoading: collectionsLoading } = useAsyncState(
  fetchCollectionsForGrantPicker,
  { initialState: [] },
)

const nameField = ref('')
const descriptionField = ref('')
const nameApiError = ref(null)

watch(nameField, () => {
  nameApiError.value = null
})

// [available, members] tuple for the Group Users PickList.
const usersModel = ref([[], []])

// Rebuilds the fields and member pane from a freshly fetched group; the
// grant models rebuild in the composable.
function rebuildModels(apiGroup) {
  nameField.value = apiGroup.name ?? ''
  descriptionField.value = apiGroup.description ?? ''
  nameApiError.value = null

  // The member pane comes from the group record itself, not by intersecting
  // allUsers — a member missing from the picker source must not silently
  // drop out of the members list, since patches send full replacements.
  const members = (apiGroup.users ?? []).map(({ userId, username, displayName }) => ({ userId, username, displayName }))
  const memberIds = new Set(members.map(u => String(u.userId)))
  usersModel.value = [
    sortByUserLabel(allUsers.value.filter(u => !memberIds.has(String(u.userId)))),
    sortByUserLabel(members),
  ]
}

const {
  detail: detailGroup,
  detailLoading,
  detailError,
  availableCollections,
  directGrants,
  grantPickerGen,
  onDetailRetry,
  applyPatch,
  onGrantsTargetUpdate,
} = useLiveApplyDetailPanel({
  selectedId: () => props.group?.userGroupId,
  fetchDetail: fetchUserGroupAdmin,
  patchDetail: patchUserGroupAdmin,
  sourcesLoading: [usersLoading, collectionsLoading],
  allCollections,
  extractDirectGrants: apiGroup => apiGroup.collectionGrants ?? [],
  rebuildModels,
  // A rejected rename leaves the server state unchanged, so keep the typed
  // name and flag the field instead of resyncing.
  onPatchError: (err, body, { stillSelected }) => {
    if (body.name !== undefined && isDuplicateEntryError(err)) {
      if (stillSelected) {
        nameApiError.value = 'A user group with this name already exists.'
      }
      return true
    }
    return false
  },
  emit,
})

// A blank name is invalid (legacy restores the previous value); an unchanged
// commit (blur after no edit) must not fire a PATCH.
function onNameCommit() {
  const name = nameField.value.trim()
  if (!name) {
    nameField.value = detailGroup.value?.name ?? ''
    return
  }
  if (name !== detailGroup.value?.name) {
    applyPatch({ name })
  }
}

function onDescriptionCommit() {
  const description = descriptionField.value.trim()
  if (description !== (detailGroup.value?.description ?? '')) {
    applyPatch({ description })
  }
}

function onUsersModelUpdate(tuple) {
  usersModel.value = tuple
  applyPatch({ userIds: tuple[1].map(u => String(u.userId)) })
}
</script>

<template>
  <div class="details-container">
    <div class="details-card">
      <div class="details-header">
        <i class="pi pi-users details-icon" />
        <h2 class="details-title">
          User Group Properties
        </h2>
      </div>

      <div v-if="group" class="details-content">
        <div v-if="detailError" class="panel-error">
          <i class="pi pi-exclamation-triangle" />
          <span>Could not load user group.</span>
          <Button label="Retry" icon="pi pi-refresh" size="small" severity="secondary" @click="onDetailRetry" />
        </div>

        <div v-else-if="detailLoading || !detailGroup" class="panel-loading">
          <i class="pi pi-spin pi-spinner" /> Loading user group...
        </div>

        <template v-else>
          <div class="info-grid">
            <div class="labeled-field">
              <label class="flabel" for="group-prop-name">Group Name</label>
              <InputText
                id="group-prop-name"
                v-model="nameField"
                :invalid="!!nameApiError"
                :pt="inputTextPt"
                maxlength="255"
                @blur="onNameCommit"
                @keyup.enter="onNameCommit"
              />
              <div v-if="nameApiError" class="field-error">
                {{ nameApiError }}
              </div>
            </div>
            <div class="labeled-field">
              <label class="flabel" for="group-prop-description">Description</label>
              <InputText
                id="group-prop-description"
                v-model="descriptionField"
                :pt="inputTextPt"
                maxlength="255"
                @blur="onDescriptionCommit"
                @keyup.enter="onDescriptionCommit"
              />
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
                <GroupUsersPickList
                  :model-value="usersModel"
                  @update:model-value="onUsersModelUpdate"
                />
              </TabPanel>
              <TabPanel value="grants" :pt="tabPanelPt">
                <CollectionGrantPickList
                  :key="grantPickerGen"
                  :source="availableCollections"
                  :target="directGrants"
                  @update:source="availableCollections = $event"
                  @update:target="onGrantsTargetUpdate"
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped src="../../styles/detailPanel.css"></style>

<style scoped>
.field-error {
  font-size: 0.85rem;
  line-height: 1.2;
  color: var(--color-text-error);
}
</style>
