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
import { useAsyncState } from '../../../../shared/composables/useAsyncState.js'
import { useGlobalError } from '../../../../shared/composables/useGlobalError.js'
import { inputTextPt, tabListPt, tabPanelPt, tabPanelsPt, tabPt, tabsPt } from '../../../../shared/lib/formPt.js'
import { fetchAvailableUsers, fetchCollectionsForGrantPicker, fetchUserGroupAdmin, patchUserGroupAdmin } from '../api/userGroupsAdminApi.js'
import { sortByName, sortByUserLabel } from '../lib/userGroupDisplay.js'
import GroupUsersPickList from './GroupUsersPickList.vue'

const props = defineProps({
  group: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['updated'])

const { triggerError } = useGlobalError()

const activeTab = ref('users')

const { state: allUsers, isLoading: usersLoading } = useAsyncState(fetchAvailableUsers, { initialState: [] })
const { state: allCollections, isLoading: collectionsLoading } = useAsyncState(
  fetchCollectionsForGrantPicker,
  { initialState: [] },
)

const nameField = ref('')
const descriptionField = ref('')

// [available, members] tuple for the Group Users PickList.
const usersModel = ref([[], []])
const availableCollections = ref([])
const directGrants = ref([])
// Remount key for CollectionGrantPickList: it copies its props once on mount,
// so rebuilding the lists (group change, error resync) must remount it.
const grantPickerGen = ref(0)

// Rebuilds the fields and picklist models from a freshly fetched group. Called
// only on group change and error resync — successful live-applies leave the
// picklists alone since they already reflect the admin's intent.
function rebuildModels(apiGroup) {
  nameField.value = apiGroup.name ?? ''
  descriptionField.value = apiGroup.description ?? ''

  // The member pane comes from the group record itself, not by intersecting
  // allUsers — a member missing from the picker source must not silently
  // drop out of the members list, since patches send full replacements.
  const members = (apiGroup.users ?? []).map(({ userId, username, displayName }) => ({ userId, username, displayName }))
  const memberIds = new Set(members.map(u => String(u.userId)))
  usersModel.value = [
    sortByUserLabel(allUsers.value.filter(u => !memberIds.has(String(u.userId)))),
    sortByUserLabel(members),
  ]

  const grants = (apiGroup.collectionGrants ?? []).map(grant => ({
    collectionId: grant.collection.collectionId,
    name: grant.collection.name,
    roleId: grant.roleId,
  }))
  directGrants.value = sortByName(grants)
  const grantedIds = new Set(grants.map(g => String(g.collectionId)))
  availableCollections.value = sortByName(
    allCollections.value
      .filter(c => !grantedIds.has(String(c.collectionId)))
      .map(({ collectionId, name }) => ({ collectionId, name })),
  )
  grantPickerGen.value++
}

const { state: detailGroup, isLoading: detailLoading, error: detailError, execute: loadDetail } = useAsyncState(
  async () => {
    const requestedId = props.group.userGroupId
    const apiGroup = await fetchUserGroupAdmin(requestedId)
    // The selection may have moved on while the fetch was in flight; the
    // generation guard in useAsyncState discards the stale state, but the
    // model rebuild is a side effect and needs its own check.
    if (String(requestedId) !== String(props.group?.userGroupId)) {
      return null
    }
    rebuildModels(apiGroup)
    return apiGroup
  },
  { initialState: null, immediate: false },
)

// Refetch only when the selected userGroupId changes; table reloads re-point
// the selection at a fresh object with the same id and must not reset the panel.
// The watch getter returns a fresh array each run (compared by reference), so
// the callback fires on every re-point — the id must be checked explicitly.
let requestedDetailId = null
watch(
  () => [props.group?.userGroupId, usersLoading.value, collectionsLoading.value],
  ([groupId, uLoading, cLoading]) => {
    if (!groupId) {
      requestedDetailId = null
      return
    }
    if (!uLoading && !cLoading && String(groupId) !== requestedDetailId) {
      requestedDetailId = String(groupId)
      loadDetail()
    }
  },
  { immediate: true },
)

watch(detailError, (err) => {
  if (err) {
    detailGroup.value = null
    requestedDetailId = null
  }
})

function onDetailRetry() {
  requestedDetailId = String(props.group.userGroupId)
  loadDetail()
}

async function applyPatch(body) {
  const groupId = props.group.userGroupId
  try {
    const updated = await patchUserGroupAdmin(groupId, body)
    if (String(groupId) === String(props.group?.userGroupId)) {
      detailGroup.value = updated
    }
    emit('updated', updated)
  }
  catch (err) {
    triggerError(err)
    if (String(groupId) === String(props.group?.userGroupId)) {
      await loadDetail()
    }
  }
}

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

function onGrantsTargetUpdate(target) {
  directGrants.value = target
  applyPatch({
    collectionGrants: target.map(grant => ({
      collectionId: String(grant.collectionId),
      roleId: Number(grant.roleId),
    })),
  })
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
                :pt="inputTextPt"
                maxlength="255"
                @blur="onNameCommit"
                @keyup.enter="onNameCommit"
              />
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

<style scoped>
.details-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
  min-height: 0;
}

.details-card {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-background-dark);
  border-radius: 6px;
}

.details-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 1rem;
  background: var(--color-background-subtle);
  border-bottom: 1px solid var(--color-border-default);
}

.details-icon {
  color: var(--color-primary-highlight);
  font-size: 1rem;
}

.details-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text-bright);
  margin: 0;
}

.details-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.panel-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex: 1;
  font-size: 1.1rem;
  color: var(--color-text-dim);
}

.panel-error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  flex: 1;
  font-size: 1.05rem;
  color: var(--color-text-primary);
}

.panel-error .pi-exclamation-triangle {
  color: var(--color-text-error);
  font-size: 1.3rem;
}

.info-grid {
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

.tab-icon {
  margin-right: 0.4rem;
}
</style>
