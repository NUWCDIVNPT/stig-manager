# Routing & Authorization

How the Vue client gates routes, UI elements, and data access based on user privileges and collection grants.

---

## Privilege Source: `globalAppStore.user`

The canonical source for privilege and grant data is `globalAppStore.user`, populated at boot from `GET /user`. This object contains:

```
{
  userId, username, displayName, email,
  privileges: { admin: boolean, create_collection: boolean },
  collectionGrants: [
    {
      collection: { collectionId, name },
      roleId,        // 1=Restricted, 2=Full, 3=Manage, 4=Owner
      grantees       // direct and group grant sources
    }
  ]
}
```

**Do NOT parse privileges directly from the OIDC token** (`tokenParsed.realm_access.roles`). The API normalizes token claims via the configurable `STIGMAN_JWT_PRIVILEGES_CLAIM` environment variable — hardcoding `realm_access.roles` breaks for non-Keycloak providers that use different claim paths. The API's `GET /user` response already resolves this, so the client should read from `globalAppStore.user.privileges`.

Components do not `inject('worker')` for privilege checks; the worker is an implementation detail of the auth/fetch layer (a few export components still inject it for raw token access to streamed downloads).

---

## `useCurrentUser()` Composable

`src/shared/composables/useCurrentUser.js` reads from `globalAppStore.user`:

- `user` — the raw user object (reactive)
- `isAdmin` — `computed(() => user.privileges.admin)`
- `canCreateCollection` — `computed(() => user.privileges.create_collection)`
- `getCollectionGrant(collectionId)` — returns the grant object (with `roleId`) or `null`
- `hasCollectionAccess(collectionId)` — `true` if a grant exists
- `getCollectionRoleId(collectionId)` — returns the `roleId` (1-4) or `null`
- `refreshUser()` — re-fetches `GET /user` and updates the store. Called after mutations that change grants or collection names (create, clone, rename, delete) so the nav rail, breadcrumb and access checks stay current. Failures are logged, not thrown.

---

## Route Meta & Navigation Guards

### Route `meta` fields

| Route pattern | `meta` |
|---|---|
| `/app-management/*` | `{ requiresAdmin: true }` |
| `/app-management/transfer`, `/app-management/log-stream` | `requiresAdmin` plus `{ isEnabled: () => boolean, disabledRedirect: 'app-management' }` |
| `/collection/:id/*` | `{ requiresCollectionGrant: true }` |
| `/collection/:id/management` | `{ requiresCollectionGrant: true, minRoleId: 3 }` |

### Global `beforeEach` guard (`src/router/navigationGuards.js`)

1. **Admin routes** (`meta.requiresAdmin`):
   - If user does not have `privileges.admin` → redirect to `home`

2. **Feature-gated routes** (`meta.isEnabled`):
   - If the predicate returns false → redirect to `meta.disabledRedirect` (or `home`). This only hides UI; the API enforces its experimental flags independently.

3. **Collection routes** (`meta.requiresCollectionGrant`):
   - Look up the `collectionId` route param in `globalAppStore.user.collectionGrants`
   - If **no grant** → redirect to `collections`
   - If grant exists but `meta.minRoleId` is set and user's `roleId < minRoleId` → redirect to the collection dashboard (they can view but not manage)

4. **Catch-all** (`/:pathMatch(.*)*`):
   - Render the `not-found` view

### Key design choice

**All users — including admins — must have a grant to access `/collection/:id/*` routes.** Admin privilege only gates the `/app-management/*` routes (collections, users, user groups, STIGs, service jobs, app info, transfer, log stream). Admins manage collections they don't have grants to through `/app-management/collections`, which is a separate admin-only view.

---

## Collection Access (Grant-Based)

When a user navigates to `/collection/:collectionId` (via deep link, bookmark, or shared URL):

1. **Route guard** checks `globalAppStore.user.collectionGrants` for a matching `collectionId`
2. **No grant** → redirect to `/collections`
3. **Grant exists** → allow navigation. The `roleId` determines available UI features:

| roleId | Role | UI capabilities |
|---|---|---|
| 4 | Owner | Full management, delete collection, modify Owner grants, accept/reject reviews |
| 3 | Manage | Management (assets, STIGs, labels, non-Owner grants), optionally accept/reject |
| 2 | Full | Read/write access to all assets/STIGs, no management |
| 1 | Restricted | Access solely determined by ACL rules (see next section) |

The nav rail builds its collection list from `user.collectionGrants`, so it only shows collections the user has grants for. The route guard handles the deep-link/bookmark edge case.

---

## Asset Access Within a Collection (ACL-Based)

Asset-level access is **not** checked at the route level — it requires an API call and is handled at the component level.

### Route: `/collection/:collectionId/asset/:assetId/stig/:benchmarkId/revision/:revisionStr`

1. **Route guard** validates collection access (grant exists) — same as above
2. **Component** (`AssetReview`) fetches checklist data using `format=json-access`, which returns an `access` field

### Access levels

| `access` | Behavior |
|---|---|
| `rw` | Full editing: result dropdown, detail/comment fields, save/submit, import |
| `r` | Read-only: form fields disabled, buttons show "Read only", import disabled |
| `none` / 403 | Asset not visible to this user — drop it from recent views and route to `not-found` (URL kept) |

### Restricted users (roleId 1)

For Restricted users, the collection dashboard grids naturally reflect ACL filtering — the API only returns assets/STIGs the user has access to. No client-side filtering is needed. The user sees only what their ACL rules permit.

### How ACL rules work

Each grant can have ACL rules that combine a **resource** with an **access level**:

| Resource type | Examples |
|---|---|
| Asset | A specific asset |
| STIG (benchmarkId) | A specific STIG across all assets |
| Label | All assets with a specific label |
| Asset + STIG | A specific asset-STIG combination |
| Label + STIG | Assets with a label, for a specific STIG |

For **Owner/Manage/Full** roles (roleId 2-4): default access is `rw`. ACL rules can only restrict access downward (to `r` or `none`).

For **Restricted** role (roleId 1): default access is `none`. ACL rules are the sole source of access — they grant `r` or `rw` to specific resources.

---

## Stale Grants

User grants can change mid-session (e.g., removed from a collection while viewing it). There is no global 403 interceptor; each view that depends on a resource for its existence handles the failure itself through the `onError` option of `useAsyncState` (see `handleRouteError` in `AssetReview.vue`, and the equivalents in `CollectionView.vue`, `CollectionReview.vue` and `StigLibrary.vue`): on 403/404 it drops the view from recent views and routes to `not-found`. Other 403s surface through the global error modal.

Grant-derived state is refreshed proactively instead: mutations that change grants or collection names call `refreshUser()` so the nav rail and guards see the new state without a reload.

---

## Privilege-Gated UI Elements

Summary of what each privilege/grant level controls and where the check is enforced:

| Check | UI element | Enforcement |
|---|---|---|
| `privileges.admin` | App Management nav rail item, `/app-management/*` routes | Route guard + nav rail |
| `privileges.create_collection` | "Create Collection" action in the nav rail | Nav rail visibility (`canCreateCollection`) |
| Grant exists for collectionId | `/collection/:id/*` routes | Route guard |
| `roleId >= 3` | Collection management tab, `/collection/:id/management` | Route guard + component |
| `roleId === 4` | Delete collection, modify Owner grants | Component |
| `roleId >= minAcceptGrant` | Accept/Reject review buttons | Component (collection setting) |
| `access === 'rw'` (from API) | Review form editing, import | Component |

---

## Edge Cases

- **Collection deleted while user is viewing it**: the view's `onError` handler routes to `not-found`; the deleting view calls `refreshUser()` so the nav rail drops the collection.
- **Non-default OIDC claim path**: Using `globalAppStore.user.privileges` (API-normalized) instead of direct token parsing ensures correctness regardless of `STIGMAN_JWT_PRIVILEGES_CLAIM` configuration.
- **User navigates to `/collection/:id/management` with roleId 2 (Full)**: Route guard redirects to the collection dashboard — they can view but not manage.
- **`/app-management/collections` vs `/collection/:id/management`**: different components and different access requirements. The admin route requires `privileges.admin`; the collection route requires a grant with `roleId >= 3`.
