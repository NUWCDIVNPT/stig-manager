<script setup>
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import { computed, ref } from 'vue'
import CollectionGrantPickList from '../../../../components/common/grants/CollectionGrantPickList.vue'
import { fetchUserGroups } from '../../../../shared/api/userApi.js'
import { useAsyncState } from '../../../../shared/composables/useAsyncState.js'
import { inputTextPt, tabListPt, tabPanelPt, tabPanelsPt, tabPt, tabsPt } from '../../../../shared/lib/formPt.js'
import { useLiveApplyDetailPanel } from '../../composables/useLiveApplyDetailPanel.js'
import { fetchCollectionsForGrantPicker, fetchUserAdmin, patchUserAdmin } from '../api/usersAdminApi.js'
import { sortByName } from '../lib/userDisplay.js'
import EffectiveGrants from './EffectiveGrants.vue'
import LastClaims from './LastClaims.vue'
import UserGroupsPickList from './UserGroupsPickList.vue'

const props = defineProps({
  user: {
    type: Object,
    default: null,
  },
})

// Fired after a successful live-apply PATCH with the updated UserProjected.
const emit = defineEmits(['updated'])

const activeTab = ref('groups')

const { state: allGroups, isLoading: groupsLoading } = useAsyncState(fetchUserGroups, { initialState: [] })
const { state: allCollections, isLoading: collectionsLoading } = useAsyncState(
  fetchCollectionsForGrantPicker,
  { initialState: [] },
)

// [available, member] tuple for the User Groups PickList.
const groupsModel = ref([[], []])

// Rebuilds the member pane from a freshly fetched user; the grant models
// rebuild in the composable.
function rebuildModels(apiUser) {
  // The member pane comes from the user record itself, not by intersecting
  // allGroups — a group missing from the picker source must not silently
  // drop out of the assigned list, since patches send full replacements.
  const memberGroups = (apiUser.userGroups ?? []).map(({ userGroupId, name }) => ({ userGroupId, name }))
  const memberIds = new Set(memberGroups.map(g => String(g.userGroupId)))
  groupsModel.value = [
    sortByName(allGroups.value.filter(g => !memberIds.has(String(g.userGroupId)))),
    sortByName(memberGroups),
  ]
}

const {
  detail: detailUser,
  detailLoading,
  detailError,
  availableCollections,
  directGrants,
  grantPickerGen,
  onDetailRetry,
  applyPatch,
  onGrantsTargetUpdate,
} = useLiveApplyDetailPanel({
  selectedId: () => props.user?.userId,
  fetchDetail: fetchUserAdmin,
  patchDetail: patchUserAdmin,
  sourcesLoading: [groupsLoading, collectionsLoading],
  allCollections,
  // Grants derived from group membership carry the group as grantee; direct
  // grants have the user itself.
  extractDirectGrants: apiUser =>
    (apiUser.collectionGrants ?? []).filter(grant => grant.grantees?.some(grantee => grantee.userId)),
  rebuildModels,
  emit,
})

const isUnavailable = computed(() => detailUser.value?.status === 'unavailable')

const privilegesText = computed(() => {
  const privileges = detailUser.value?.privileges ?? {}
  const names = Object.keys(privileges).filter(name => privileges[name])
  return names.join(', ')
})

function onGroupsModelUpdate(tuple) {
  groupsModel.value = tuple
  applyPatch({ userGroups: tuple[1].map(g => String(g.userGroupId)) })
}
</script>

<template>
  <div class="details-container">
    <div class="details-card">
      <div class="details-header">
        <i class="pi pi-user details-icon" />
        <h2 class="details-title">
          User Properties
        </h2>
      </div>

      <div v-if="user" class="details-content">
        <div v-if="detailError" class="panel-error">
          <i class="pi pi-exclamation-triangle" />
          <span>Could not load user.</span>
          <Button label="Retry" icon="pi pi-refresh" size="small" severity="secondary" @click="onDetailRetry" />
        </div>

        <div v-else-if="detailLoading || !detailUser" class="panel-loading">
          <i class="pi pi-spin pi-spinner" /> Loading user...
        </div>

        <template v-else>
          <!-- Username, name, email, and privileges all come from the
               authentication provider's claims (username is set at
               pre-registration); STIG Manager never edits them, so the
               fields render readonly. -->
          <div class="info-grid">
            <div class="labeled-field">
              <label class="flabel" for="user-prop-username">Username</label>
              <InputText
                id="user-prop-username"
                :model-value="detailUser.username"
                :pt="inputTextPt"
                readonly
              />
            </div>
            <div class="labeled-field">
              <label class="flabel" for="user-prop-name">Name</label>
              <InputText
                id="user-prop-name"
                :model-value="detailUser.displayName || ''"
                :pt="inputTextPt"
                readonly
              />
            </div>
            <div class="labeled-field">
              <label class="flabel" for="user-prop-email">Email</label>
              <InputText
                id="user-prop-email"
                :model-value="detailUser.email || ''"
                :pt="inputTextPt"
                readonly
              />
            </div>
            <div class="labeled-field">
              <label class="flabel" for="user-prop-privileges">Privileges</label>
              <InputText
                id="user-prop-privileges"
                :model-value="privilegesText"
                :pt="inputTextPt"
                readonly
              />
            </div>
          </div>

          <div v-if="isUnavailable" class="unavailable-note">
            <i class="pi pi-ban" />
            This user is unavailable and cannot receive Collection Grants or User Group assignments.
          </div>

          <Tabs v-else v-model:value="activeTab" :pt="tabsPt">
            <TabList :pt="tabListPt">
              <Tab value="groups" :pt="tabPt">
                <i class="pi pi-users tab-icon" /> User Groups
              </Tab>
              <Tab value="grants" :pt="tabPt">
                <i class="pi pi-folder tab-icon" /> Direct Grants
              </Tab>
              <Tab value="effective" :pt="tabPt">
                <i class="pi pi-key tab-icon" /> Effective Grants
              </Tab>
              <Tab value="claims" :pt="tabPt">
                <i class="pi pi-id-card tab-icon" /> Last Claims
              </Tab>
            </TabList>
            <TabPanels :pt="tabPanelsPt">
              <TabPanel value="groups" :pt="tabPanelPt">
                <UserGroupsPickList
                  :model-value="groupsModel"
                  @update:model-value="onGroupsModelUpdate"
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
              <TabPanel value="effective" :pt="tabPanelPt">
                <EffectiveGrants :grants="detailUser.collectionGrants ?? []" />
              </TabPanel>
              <TabPanel value="claims" :pt="tabPanelPt">
                <LastClaims :last-claims="detailUser.statistics?.lastClaims" />
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
.unavailable-note {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 0.8rem;
  background: color-mix(in srgb, var(--color-action-red) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-action-red) 25%, transparent);
  border-radius: 6px;
  font-size: 0.95rem;
  color: var(--color-text-primary);
}

.unavailable-note .pi {
  color: var(--color-action-red);
}
</style>
