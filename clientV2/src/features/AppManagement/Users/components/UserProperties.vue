<script setup>
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
import { fetchCollectionsForGrantPicker, fetchUserAdmin, patchUserAdmin } from '../api/usersAdminApi.js'
import { sortByName } from '../lib/userDisplay.js'
import { inputTextPt, tabListPt, tabPanelPt, tabPanelsPt, tabPt, tabsPt } from '../lib/usersPt.js'
import CollectionGrantPickList from './CollectionGrantPickList.vue'
import EffectiveGrants from './EffectiveGrants.vue'
import LastClaims from './LastClaims.vue'

const props = defineProps({
  user: {
    type: Object,
    default: null,
  },
})

// Fired after a successful live-apply PATCH with the updated UserProjected.
const emit = defineEmits(['updated'])

const { triggerError } = useGlobalError()

const activeTab = ref('groups')

// Picker source data, loaded once for the panel's lifetime.
const { state: allGroups, isLoading: groupsLoading } = useAsyncState(fetchUserGroups, { initialState: [] })
const { state: allCollections, isLoading: collectionsLoading } = useAsyncState(
  fetchCollectionsForGrantPicker,
  { initialState: [] },
)

// [available, member] tuple for the User Groups PickList.
const groupsModel = ref([[], []])
// Collections without a direct grant / the user's direct grants.
const availableCollections = ref([])
const directGrants = ref([])
// Remount key for CollectionGrantPickList: it copies its props once on mount,
// so rebuilding the lists (user change, error resync) must remount it.
const grantPickerGen = ref(0)

// Rebuilds both picklist models from a freshly fetched user. Called only on
// user change and error resync — successful live-applies leave the picklists
// alone since they already reflect the admin's intent.
function rebuildModels(apiUser) {
  const memberIds = new Set((apiUser.userGroups ?? []).map(g => String(g.userGroupId)))
  groupsModel.value = [
    sortByName(allGroups.value.filter(g => !memberIds.has(String(g.userGroupId)))),
    sortByName(allGroups.value.filter(g => memberIds.has(String(g.userGroupId)))),
  ]

  // Direct grants are the user's grants where the grantee is the user itself
  // (grants derived from group membership carry the group as grantee).
  const direct = (apiUser.collectionGrants ?? [])
    .filter(grant => grant.grantees?.some(grantee => grantee.userId))
    .map(grant => ({
      collectionId: grant.collection.collectionId,
      name: grant.collection.name,
      roleId: grant.roleId,
    }))
  directGrants.value = sortByName(direct)
  const grantedIds = new Set(direct.map(g => String(g.collectionId)))
  availableCollections.value = sortByName(
    allCollections.value
      .filter(c => !grantedIds.has(String(c.collectionId)))
      .map(({ collectionId, name }) => ({ collectionId, name })),
  )
  grantPickerGen.value++
}

const { state: detailUser, isLoading: detailLoading, execute: loadDetail } = useAsyncState(
  async () => {
    const apiUser = await fetchUserAdmin(props.user.userId)
    rebuildModels(apiUser)
    return apiUser
  },
  { initialState: null, immediate: false },
)

// Refetch only when the selected userId changes; table reloads re-point the
// selection at a fresh object with the same id and must not reset the panel.
watch(
  () => [props.user?.userId, groupsLoading.value, collectionsLoading.value],
  ([userId, gLoading, cLoading]) => {
    if (userId && !gLoading && !cLoading) {
      loadDetail()
    }
  },
  { immediate: true },
)

const isUnavailable = computed(() => detailUser.value?.status === 'unavailable')

const privilegesText = computed(() => {
  const privileges = detailUser.value?.privileges ?? {}
  const names = Object.keys(privileges).filter(name => privileges[name])
  return names.join(', ')
})

// Live-apply: each picklist change PATCHes the user immediately (legacy
// behavior). On failure the panel refetches to resync the picklists with the
// server state.
async function applyPatch(body) {
  try {
    const updated = await patchUserAdmin(props.user.userId, body)
    detailUser.value = updated
    emit('updated', updated)
  }
  catch (err) {
    triggerError(err)
    await loadDetail()
  }
}

function onGroupsModelUpdate(tuple) {
  groupsModel.value = tuple
  applyPatch({ userGroups: tuple[1].map(g => String(g.userGroupId)) })
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
        <i class="pi pi-user details-icon" />
        <h2 class="details-title">
          User Properties
        </h2>
      </div>

      <div v-if="user" class="details-content">
        <div v-if="detailLoading || !detailUser" class="panel-loading">
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
                <PickList
                  :model-value="groupsModel"
                  data-key="userGroupId"
                  filter-by="name"
                  show-source-filter
                  show-target-filter
                  source-filter-placeholder="Search groups..."
                  target-filter-placeholder="Search groups..."
                  option-style="padding: 0.4rem 0.75rem;"
                  :virtual-scroller-options="{ itemSize: 34 }"
                  @update:model-value="onGroupsModelUpdate"
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

.tab-icon {
  margin-right: 0.4rem;
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
</style>
