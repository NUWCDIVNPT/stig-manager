# Collection Manage Grants And Users Tabs Notes

These notes describe the Vue implementation for the Collection Manage `Grants` and `Effective Users` panels. They avoid Ext.js implementation details, but preserve the backend behavior and the reusable plain JavaScript logic from the legacy client.

## Scope

Covered workflows:

- List collection grants.
- Add user and user-group grants.
- Edit grant grantee and role.
- Delete grants.
- Edit restricted access / collection grant ACL rules.
- List effective users for a collection.
- View a user's effective access list.
- Export grants/users/ACL tables to CSV through PrimeVue `DataTable.exportCSV()`.

Out of scope:

- Admin Users and User Groups management screens.
- Collection create/replace grant payloads except where useful for context.
- Ext.js tree/grid/window implementations.

## Source References

- OpenAPI contracts: `api/source/specification/stig-manager.yaml`
- Collection grant controller behavior: `api/source/controllers/Collection.js`
- Collection grant/effective user service behavior: `api/source/service/CollectionService.js`
- Effective grantee and ACL SQL helpers: `api/source/service/utils.js`
- User/group lookup controller behavior: `api/source/controllers/User.js`
- Existing Vue collection manage stubs: `clientV2/src/features/CollectionManage/components/ManageGrants.vue`, `clientV2/src/features/CollectionManage/components/ManageUsers.vue`
- Existing Vue grant pieces: `clientV2/src/components/common/grants`
- Existing Vue API wrappers: `clientV2/src/shared/api/grantsApi.js`, `clientV2/src/shared/api/userApi.js`, `clientV2/src/shared/api/collectionsApi.js`
- Legacy behavior references only: `client/src/js/SM/Manage.js`, `client/src/js/SM/Grant.js`, `client/src/js/SM/Acl.js`, `client/src/js/SM/User.js`

## Existing Vue Pieces To Reuse

### GrantsPanel

File: `clientV2/src/components/common/grants/GrantsPanel.vue`

This is already close to the Collection Manage Grants panel:

- Fetches grants with `fetchGrantsByCollection()`.
- Opens an Add Grants dialog using `GrantsPickList.vue`.
- Opens an Edit Grant dialog using `EditGrantModal.vue`.
- Deletes grants with `DeleteModal.vue`.
- Caches available users/groups and invalidates the cache after mutations.
- Uses `roleOptions.js` for role labels.

Recommended `ManageGrants.vue` shape:

```vue
<script setup>
import GrantsPanel from '../../../components/common/grants/GrantsPanel.vue'

defineProps({
  collectionId: {
    type: [String, Number],
    required: true,
  },
})
</script>

<template>
  <GrantsPanel :collection-id="collectionId" />
</template>
```

Before considering it complete, add the missing ACL action and owner-grant restrictions listed below.

### GrantsPickList

File: `clientV2/src/components/common/grants/GrantsPickList.vue`

Reusable for Add Grants:

- Left list: available users and groups.
- Right list: new grants.
- Moving users/groups right requires selecting a role.
- Emits `save` with `{ source, target }`.

Keep the dual-list behavior. Do not port the legacy Ext tree.

### EditGrantModal

File: `clientV2/src/components/common/grants/EditGrantModal.vue`

Reusable for Edit Grant:

- Shows available users/groups.
- Keeps current grantee unless another grantee is selected.
- Allows role change.
- Emits the modified grant object.

Important fix to consider: exclude all existing grantees except the grant currently being edited. The legacy behavior prevented changing a grant to a user/group that already has a direct grant. The backend also rejects conflicts, but the UI should not offer obvious invalid choices.

### Role Helpers

File: `clientV2/src/components/common/grants/roleOptions.js`

```js
export const roleOptions = [
  { label: 'Restricted', value: 1 },
  { label: 'Full', value: 2 },
  { label: 'Manage', value: 3 },
  { label: 'Owner', value: 4 },
]

export const roleMap = Object.fromEntries(roleOptions.map(r => [r.value, r.label]))
```

Use these labels everywhere in Grants, Effective Users, and ACL modals.

### Grantee Filter

File: `clientV2/src/components/common/grants/useGranteeFilter.js`

Reusable behavior:

- Search by display name.
- User active window filter: all, 30, 60, 90 days.
- Group users separately from user groups.
- Collapse/expand group headings.

Current Vue implementation already has the right idea. Use it rather than carrying over the Ext tree filtering.

## Permission Model

Role IDs:

| Role ID | Label | Meaning in these tabs |
| --- | --- | --- |
| 1 | Restricted | Collection access is controlled by ACL rules. Default access is `none`. |
| 2 | Full | Can access any Asset/STIG in the collection, but cannot manage inventory/grants. Default access is `rw`. |
| 3 | Manage | Can manage Assets, STIGs, and non-owner Grants. Default access is `rw`. |
| 4 | Owner | Manage plus delete collection and create/modify/remove Owner grants. Default access is `rw`. |

Collection Manage Grants and Effective Users require at least Manage access. The backend checks this in `getCollectionInfoAndCheckPermission(req, Security.ROLES.Manage, true)`.

Owner-grant rules:

- A Manage user can create, edit, and delete non-owner grants.
- Only an Owner can create an Owner grant.
- Only an Owner can modify an existing Owner grant.
- Only an Owner can delete an existing Owner grant.
- Admin/elevated calls can bypass the owner-grant restriction with `elevate=true`.

Vue should enforce the owner-grant rule in the UI and still rely on the backend as the source of truth. Compute:

```js
function canModifyOwnerGrants({ roleId, elevate = false }) {
  return elevate || Number(roleId) === 4
}

function canModifyGrant(grant, requesterRoleId, elevate = false) {
  return Number(grant?.roleId) !== 4 || canModifyOwnerGrants({ roleId: requesterRoleId, elevate })
}
```

Use `useCurrentUser().getCollectionRoleId(collectionId)` to find the requester's collection role in normal collection management.

## Endpoint Summary

Use operation IDs through `apiCall()`. Avoid raw URL construction unless the API wrapper does not exist yet.

| Purpose | Method and path | Operation ID | Existing Vue wrapper |
| --- | --- | --- | --- |
| Get collection with effective users | `GET /collections/{collectionId}?projection=users` | `getCollection` | Add `fetchCollectionUsers()` to `collectionsApi.js` |
| List grants | `GET /collections/{collectionId}/grants` | `getGrantsByCollection` | `fetchGrantsByCollection()` |
| Add grants | `POST /collections/{collectionId}/grants` | `postGrantsByCollection` | `createGrants()` |
| Get one grant | `GET /collections/{collectionId}/grants/{grantId}` | `getGrantByCollectionGrant` | Add if needed |
| Replace grant | `PUT /collections/{collectionId}/grants/{grantId}` | `putGrantByCollectionGrant` | `updateGrant()` |
| Delete grant | `DELETE /collections/{collectionId}/grants/{grantId}` | `deleteGrantByCollectionGrant` | `deleteGrant()` |
| Get grant ACL | `GET /collections/{collectionId}/grants/{grantId}/acl` | `getAclRulesByCollectionGrant` | Add `fetchGrantAcl()` |
| Replace grant ACL | `PUT /collections/{collectionId}/grants/{grantId}/acl` | `putAclRulesByCollectionGrant` | Add `replaceGrantAcl()` |
| Get effective ACL for user | `GET /collections/{collectionId}/users/{userId}/effective-acl` | `getEffectiveAclByCollectionUser` | Add `fetchEffectiveAclByCollectionUser()` |
| Get available users | `GET /users?status=available` | `getUsers` | `fetchUsers({ status: 'available' })` |
| Get user groups | `GET /user-groups` | `getUserGroups` | `fetchUserGroups()` |
| Get assets for ACL tree | `GET /assets?collectionId={collectionId}` | `getAssets` | Existing wrappers can be reused or add ACL-specific wrapper |
| Get asset with STIGs | `GET /assets/{assetId}?projection=stigs` | `getAsset` | `fetchAssetWithStigs()` exists in collection manage asset API |
| Get collection STIGs | `GET /collections/{collectionId}/stigs` | `getStigsByCollection` | Add wrapper if needed |
| Get assets by collection STIG | `GET /collections/{collectionId}/stigs/{benchmarkId}/assets` | `getAssetsByStig` | `fetchAssetsByCollectionStig()` exists |
| Get labels for ACL tree | `GET /collections/{collectionId}/labels` | `getCollectionLabels` | `fetchCollectionLabels()` |

All grant mutation endpoints accept optional `elevate=true`. Normal Collection Manage should not pass `elevate`; app/admin collection management can.

## Grant Data Shapes

### Grant Read Response

Operation IDs: `getGrantsByCollection`, `getGrantByCollectionGrant`

Response items are either user grants:

```json
{
  "grantId": "101",
  "roleId": 3,
  "user": {
    "userId": "42",
    "username": "jane.doe",
    "displayName": "Jane Doe"
  }
}
```

Or user-group grants:

```json
{
  "grantId": "102",
  "roleId": 2,
  "userGroup": {
    "userGroupId": "7",
    "name": "Assessors",
    "description": "Assessment team"
  }
}
```

### Create Grants Payload

Operation ID: `postGrantsByCollection`

The body is an array. Each item is one of:

```json
{ "userId": "42", "roleId": 3 }
```

```json
{ "userGroupId": "7", "roleId": 2 }
```

Response: `201` with the newly created grant objects.

Backend errors to expect:

- `422 no such grantee`
- `422 grantee has a conflicting grant`
- user consistency error when assigning unavailable users
- privilege error when non-owner tries to create Owner grants

### Replace Grant Payload

Operation ID: `putGrantByCollectionGrant`

The body is one complete user or user-group grant. It is not a PATCH.

```json
{ "userId": "42", "roleId": 3 }
```

```json
{ "userGroupId": "7", "roleId": 1 }
```

Response: `200` with the updated grant.

Important backend behavior:

- If the role changes, the service deletes ACL rows for this grant where `access = 'none'`.
- This matters when moving a grant away from Restricted behavior.
- The backend rejects duplicate direct grants for the same user/group in the same collection.

### Delete Grant Response

Operation ID: `deleteGrantByCollectionGrant`

Response: `200` with the deleted grant object. Use it for notification text only; reload the grants and effective users afterward.

## Effective Users Data Shape

Effective users are loaded with:

```js
apiCall('getCollection', {
  collectionId,
  projection: 'users',
})
```

`projection` is an OpenAPI repeatable array, but a single string is accepted by current usage. If requesting multiple projections, pass an array.

Response excerpt:

```json
{
  "collectionId": "12",
  "name": "Windows Workstations",
  "users": [
    {
      "user": {
        "userId": "42",
        "username": "jane.doe",
        "displayName": "Jane Doe"
      },
      "roleId": 3,
      "grantees": [
        {
          "userId": "42",
          "username": "jane.doe"
        }
      ]
    },
    {
      "user": {
        "userId": "43",
        "username": "john.smith",
        "displayName": "John Smith"
      },
      "roleId": 2,
      "grantees": [
        {
          "userGroupId": "7",
          "name": "Assessors"
        }
      ]
    }
  ]
}
```

Effective user resolution rules from `sqlGrantees()`:

- Direct user grants are always included.
- Group grants are included only when the user has no direct grant in the same collection.
- If a user inherits multiple group grants, the highest `roleId` wins.
- If multiple groups tie for the winning role, all winning groups appear in `grantees`.

Recommended Effective Users columns:

- User: display name and username.
- Grantee: `Direct` for direct user grants, group names for inherited group grants.
- Role: label from `roleMap`.
- Action: view effective access list.

## ACL Rule Data Shapes

### Get Grant ACL

Operation ID: `getAclRulesByCollectionGrant`

Response:

```json
{
  "defaultAccess": "none",
  "acl": [
    {
      "asset": {
        "assetId": "15",
        "name": "web-01"
      },
      "benchmarkId": "U_RHEL_8_STIG",
      "access": "rw"
    },
    {
      "label": {
        "labelId": "018f6d9a-0000-7000-9000-000000000001",
        "name": "Production",
        "color": "0078d4"
      },
      "benchmarkId": "U_RHEL_8_STIG",
      "access": "r"
    }
  ]
}
```

`defaultAccess` is:

- `none` for Restricted grants.
- `rw` for Full, Manage, and Owner grants.

### Replace Grant ACL

Operation ID: `putAclRulesByCollectionGrant`

Body is an array of ACL rules:

```json
[
  {
    "assetId": "15",
    "benchmarkId": "U_RHEL_8_STIG",
    "access": "rw"
  },
  {
    "labelId": "018f6d9a-0000-7000-9000-000000000001",
    "benchmarkId": "U_RHEL_8_STIG",
    "access": "r"
  },
  {
    "benchmarkId": "U_MS_Windows_10_STIG",
    "access": "r"
  }
]
```

Allowed resource selectors:

- Whole collection: omit `assetId`, `labelId`, and `benchmarkId`.
- STIG across collection: `benchmarkId`.
- Asset across all assigned STIGs: `assetId`.
- Asset/STIG pair: `assetId` plus `benchmarkId`.
- Label across all assigned STIGs for labeled assets: `labelId`.
- Label/STIG pair: `labelId` plus `benchmarkId`.

Allowed access values:

- `rw`
- `r`
- `none`

Legacy UI rule to preserve:

- Restricted grants can add `rw`, `r`, or `none` ACL rules.
- Full/Manage/Owner grants should only offer `rw` and `r` in the UI because their default is already `rw`.

Backend ACL resolution from `cteAclEffective()`:

- More specific ACL rules win over less specific rules.
- Specificity considers asset, STIG, asset+STIG, and label selectors.
- For equal specificity, stricter access wins by sort order: `none`, then `r`, then `rw`.
- Effective ACL rows with `access = 'none'` are not returned as accessible rows.

## Effective ACL Data Shape

Operation ID: `getEffectiveAclByCollectionUser`

Response items:

```json
{
  "asset": {
    "assetId": "15",
    "name": "web-01"
  },
  "benchmarkId": "U_RHEL_8_STIG",
  "access": "r",
  "aclSources": [
    {
      "grantee": {
        "userGroupId": "7",
        "name": "Assessors"
      },
      "aclRule": {
        "asset": {
          "assetId": "15",
          "name": "web-01"
        },
        "benchmarkId": "U_RHEL_8_STIG",
        "access": "r"
      }
    }
  ]
}
```

Backend behavior:

- Requires Manage access to the collection.
- Returns `422 user has no direct or group grant in collection` if the selected user is not granted through either path.

Recommended modal columns:

- Asset
- STIG
- Access
- ACL Source: `Direct` for user source, group name for group source.

## API Wrappers To Add

Add these small wrappers rather than calling `apiCall()` directly from components:

```js
// clientV2/src/shared/api/grantsApi.js
export function fetchGrantAcl(collectionId, grantId) {
  if (!collectionId || !grantId) {
    throw new Error('A collectionId and grantId are required to fetch grant ACL.')
  }
  return apiCall('getAclRulesByCollectionGrant', { collectionId, grantId })
}

export function replaceGrantAcl(collectionId, grantId, acl) {
  if (!collectionId || !grantId) {
    throw new Error('A collectionId and grantId are required to replace grant ACL.')
  }
  return apiCall('putAclRulesByCollectionGrant', { collectionId, grantId }, acl)
}

export function fetchEffectiveAclByCollectionUser(collectionId, userId) {
  if (!collectionId || !userId) {
    throw new Error('A collectionId and userId are required to fetch effective ACL.')
  }
  return apiCall('getEffectiveAclByCollectionUser', { collectionId, userId })
}
```

```js
// clientV2/src/shared/api/collectionsApi.js
export async function fetchCollectionUsers(collectionId, { elevate } = {}) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch collection users.')
  }
  const params = { collectionId, projection: 'users' }
  if (elevate) params.elevate = elevate
  const collection = await apiCall('getCollection', params)
  return collection.users ?? []
}

export function fetchCollectionStigs(collectionId, params = {}) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch collection STIGs.')
  }
  return apiCall('getStigsByCollection', { collectionId, ...params })
}
```

For ACL resource selection, reuse existing wrappers where they already exist:

- `fetchAssetWithStigs(assetId)` from `features/CollectionManage/api/assetManageApi.js`
- `fetchAssetsByCollectionStig(collectionId, benchmarkId)` from `features/CollectionManage/api/stigManageApi.js`
- `fetchCollectionLabels(collectionId)` from `shared/api/collectionsApi.js`
- `apiCall('getAssets', { collectionId })` directly only if no shared wrapper is available.

## Components To Build

Recommended structure:

```text
clientV2/src/features/CollectionManage/components/
  ManageGrants.vue
  ManageUsers.vue
  GrantAclModal.vue
  EffectiveAclModal.vue

clientV2/src/features/CollectionManage/composables/
  useCollectionUsers.js
  useGrantAcl.js

clientV2/src/features/CollectionManage/lib/
  grantsUsers.js
  aclRules.js
```

### ManageGrants.vue

Responsibilities:

- Render `GrantsPanel`.
- Pass `collectionId`.
- Compute requester role and owner-grant modification ability.
- Refresh effective users when grants change if both panels share data later.

Changes needed in `GrantsPanel.vue`:

- Add an ACL action button, probably target icon, for each grant row.
- Hide or disable edit/delete for Owner grants when `canModifyOwners` is false.
- Hide or disable Owner role choices in Add/Edit when `canModifyOwners` is false.
- Emit `updated` after create/update/delete.
- After grant mutation, consider refetching current user if the affected grantee is the current user or if the mutation can change local navigation permissions.

### GrantAclModal.vue

Purpose: edit one grant's ACL rules.

Props:

- `visible`
- `collectionId`
- `grant`

Emits:

- `update:visible`
- `saved`

State:

- `aclResponse`: `{ defaultAccess, acl }`
- `resourceNodes` or lazy-loaded tree state.
- `rules`: editable normalized ACL rule rows.
- `selectedResource`
- `selectedRules`
- `isLoading`
- `isSaving`

UI:

- Dialog title: `Access Control List for {grantee name}`.
- Left resource browser.
- Middle add buttons/menu.
- Right ACL rules DataTable.
- Footer: Cancel, Save.

Resource browser options:

- Collection root.
- STIGs.
- Assets.
- Labels.
- Asset children: assigned STIGs for that asset.
- STIG children: assets assigned to that STIG.
- Label children: STIGs associated with assets carrying that label.

You can implement this as PrimeVue `Tree`, `TreeTable`, or a narrow grouped list with lazy loading. Do not port the Ext tree.

Access menu:

- For Restricted grants (`roleId === 1`): `rw`, `r`, `none`.
- For all other grants: `rw`, `r`.

Save:

1. Convert normalized rule rows to `AclRulePut[]`.
2. `replaceGrantAcl(collectionId, grant.grantId, payload)`.
3. Replace local modal state with API response.
4. Emit `saved`.

### ManageUsers.vue

Purpose: list effective collection users.

Props:

- `collectionId`

State:

- `users`
- `isLoading`
- `selectedUser`
- `effectiveAclVisible`

Fetch:

- `fetchCollectionUsers(collectionId)`.
- Reload when `collectionId` changes.

Columns:

- User: display name, username, user icon.
- Grantee: direct or group source names.
- Role: label from `roleMap`.
- Actions: view effective access.

Footer:

- CSV export.
- Count badge.
- Refresh button.

### EffectiveAclModal.vue

Purpose: read-only modal for one user's effective access.

Props:

- `visible`
- `collectionId`
- `user`
- `roleId`

Fetch:

- `fetchEffectiveAclByCollectionUser(collectionId, user.userId)`.

Title:

- `User: {displayName}`

Subtitle or table caption:

- `Effective Access, default = none` for role 1.
- `Effective Access, default = rw` for roles 2-4.

Columns:

- Asset name.
- STIG benchmark ID.
- Access.
- ACL source names.

Actions:

- Refresh.
- CSV export.
- Close.

## Plain JavaScript Helpers To Reuse

Put these in `clientV2/src/features/CollectionManage/lib/grantsUsers.js` or similar. They are framework-independent and testable.

```js
export function getGrantDisplay(grant) {
  if (grant?.user) {
    return {
      type: 'user',
      icon: 'pi pi-user',
      title: grant.user.displayName || grant.user.username,
      subtitle: grant.user.username,
      id: grant.user.userId,
    }
  }

  if (grant?.userGroup) {
    return {
      type: 'group',
      icon: 'pi pi-users',
      title: grant.userGroup.name,
      subtitle: grant.userGroup.description,
      id: grant.userGroup.userGroupId,
    }
  }

  return {
    type: 'unknown',
    icon: 'pi pi-question-circle',
    title: '',
    subtitle: '',
    id: null,
  }
}

export function normalizeAvailableGrantees(users = [], groups = []) {
  return [
    ...users.map(user => ({
      ...user,
      type: 'user',
      displayName: user.displayName || user.username,
    })),
    ...groups.map(group => ({
      ...group,
      type: 'group',
      displayName: group.name,
    })),
  ]
}

export function filterOutExistingGrantees(grantees, grants, selectedGrant = null) {
  const selectedUserId = selectedGrant?.user?.userId ?? selectedGrant?.userId ?? null
  const selectedGroupId = selectedGrant?.userGroup?.userGroupId ?? selectedGrant?.userGroupId ?? null

  const existingUserIds = new Set(
    grants
      .map(grant => grant.user?.userId ?? grant.userId)
      .filter(userId => userId && String(userId) !== String(selectedUserId))
      .map(String),
  )

  const existingGroupIds = new Set(
    grants
      .map(grant => grant.userGroup?.userGroupId ?? grant.userGroupId)
      .filter(groupId => groupId && String(groupId) !== String(selectedGroupId))
      .map(String),
  )

  return grantees.filter((grantee) => {
    if (grantee.type === 'user') {
      return !existingUserIds.has(String(grantee.userId))
    }
    return !existingGroupIds.has(String(grantee.userGroupId))
  })
}

export function granteeToGrantPayload(grantee) {
  const payload = { roleId: grantee.roleId }
  if (grantee.type === 'user') {
    payload.userId = grantee.userId
  }
  else {
    payload.userGroupId = grantee.userGroupId
  }
  return payload
}

export function getEffectiveUserDisplay(row) {
  const user = row.user ?? {}
  return {
    userId: user.userId,
    displayName: user.displayName || user.username,
    username: user.username,
    roleId: row.roleId,
    granteeLabels: (row.grantees ?? []).map((grantee) => {
      if (grantee.userId) return 'Direct'
      return grantee.name
    }),
  }
}
```

ACL helpers:

```js
export function getDefaultAccessForRole(roleId) {
  return Number(roleId) === 1 ? 'none' : 'rw'
}

export function getAllowedAclAccessOptions(roleId) {
  const options = [
    { label: 'Read/Write', value: 'rw' },
    { label: 'Read Only', value: 'r' },
  ]
  if (Number(roleId) === 1) {
    options.push({ label: 'No Access', value: 'none' })
  }
  return options
}

export function normalizeAclRule(rule) {
  return {
    benchmarkId: rule.benchmarkId,
    assetId: rule.asset?.assetId ?? rule.assetId,
    assetName: rule.asset?.name ?? rule.assetName,
    labelId: rule.label?.labelId ?? rule.labelId,
    labelName: rule.label?.name ?? rule.labelName,
    label: rule.label,
    access: rule.access,
  }
}

export function aclRuleToPayload(rule) {
  return {
    benchmarkId: rule.benchmarkId || undefined,
    assetId: rule.assetId || undefined,
    labelId: rule.labelId || undefined,
    access: rule.access,
  }
}

export function getAclRuleKey(rule) {
  return [
    rule.assetId ?? '',
    rule.labelId ?? '',
    rule.benchmarkId ?? '',
  ].join(':')
}

export function isDuplicateAclRule(rules, candidate) {
  const candidateKey = getAclRuleKey(candidate)
  return rules.some(rule => getAclRuleKey(rule) === candidateKey)
}
```

These helpers are the reusable logic. Avoid copying legacy DOM renderers, Ext stores, Ext windows, or Ext tree-node code.

## Refresh And State Rules

After adding, updating, or deleting grants:

- Reload grants.
- Reload effective users when the Users panel is active.
- Close the modal only after a successful API response.
- Keep API errors in the global error flow through `useGlobalError()` or `useAsyncState()`.
- If the current user's own grant changes, refetch the current user (`fetchCurrentUser()`) and update `globalAppStore`, because navigation permissions and collection role labels may change.

After replacing ACL rules:

- Keep the grant list unchanged.
- Reload the ACL modal data or replace it with the returned ACL response.
- Effective Users rows do not need reload, but an open Effective ACL modal should reload if it is showing the same user.

## Tests To Add

Unit tests:

- `filterOutExistingGrantees()` excludes existing users/groups and permits the selected grant while editing.
- `granteeToGrantPayload()` emits correct user and group payloads.
- `getDefaultAccessForRole()` returns `none` only for role 1.
- `getAllowedAclAccessOptions()` includes `none` only for role 1.
- `aclRuleToPayload()` strips display-only fields.
- `isDuplicateAclRule()` detects duplicates for collection, STIG, asset, asset/STIG, label, and label/STIG selectors.
- Effective user grantee display returns `Direct` for direct grants and group names for inherited grants.

Component tests:

- `ManageGrants.vue` renders `GrantsPanel` with the collection ID.
- Grants panel hides/disables owner edit/delete controls for non-owner users.
- Add grant modal posts the selected role and grantee IDs.
- Edit grant modal sends a full replacement payload.
- Delete modal calls the delete wrapper and reloads grants.
- Grant ACL modal loads, adds a rule, prevents duplicates, saves payload.
- `ManageUsers.vue` fetches `projection=users` and renders role/grantee columns.
- Effective ACL modal calls `getEffectiveAclByCollectionUser` and renders ACL sources.

Integration risk to manually verify:

- Non-owner Manage user cannot create, edit, or delete Owner grants.
- Owner can create, edit, and delete Owner grants.
- Unavailable users cannot be granted.
- Direct user grants override group grants in Effective Users.
- Restricted ACL rules produce expected Effective ACL rows.
