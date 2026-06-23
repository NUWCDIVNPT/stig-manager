# Grants & Effective Users — 4-Phase Implementation Plan

Reference spec: `collection-manage-grants-users-tabs-notes.md` (same folder). That doc is the
source of truth for backend behavior, data shapes, endpoints, and rules. This file only
sequences the work into four self-contained prompts.

## Design decisions baked into this plan

- **Modern UI, fewer modals.** Grants and Effective Users render as inline DataTable panels
  inside the existing `Users & Grants` tab. The ACL editor and effective-ACL viewer use a
  slide-in **Drawer** (PrimeVue `Drawer`/`Sidebar`), not a large centered modal. Keep the
  existing small confirm/edit dialogs (`DeleteModal`, `EditGrantModal`) since they're already
  consistent with the codebase.
- **Layout of the single tab.** `ManageGrants.vue` becomes a host that shows both a Grants
  panel and an Effective Users panel, switched by an inner `SelectButton` (Grants / Effective
  Users), mirroring the styling already in `CollectionManage.vue`.
- **Component home.** New feature components go in
  `src/features/CollectionManage/components/User/`. Shared grant primitives stay in
  `src/components/common/grants/`. Pure logic in `src/features/CollectionManage/lib/`,
  composables in `src/features/CollectionManage/composables/`.
- **Build bottom-up:** pure logic + API first (testable, zero UI risk), then Grants, then
  Effective Users, then the ACL editor (most complex) last.

---

## Phase 1 — Foundation: pure logic + API wrappers + unit tests

**Prompt to paste:**

> Implement Phase 1 of the Grants/Effective-Users feature described in
> `src/features/CollectionManage/components/User/collection-manage-grants-users-tabs-notes.md`.
> No UI changes this phase — just framework-independent logic, API wrappers, and unit tests.
>
> 1. Create `src/features/CollectionManage/lib/grantsUsers.js` with the helpers from the
>    "Plain JavaScript Helpers To Reuse" section: `getGrantDisplay`, `normalizeAvailableGrantees`,
>    `filterOutExistingGrantees`, `granteeToGrantPayload`, `getEffectiveUserDisplay`, plus the
>    permission helpers `canModifyOwnerGrants` and `canModifyGrant` from the "Permission Model"
>    section.
> 2. Create `src/features/CollectionManage/lib/aclRules.js` with `getDefaultAccessForRole`,
>    `getAllowedAclAccessOptions`, `normalizeAclRule`, `aclRuleToPayload`, `getAclRuleKey`,
>    `isDuplicateAclRule`.
> 3. Add to `src/shared/api/grantsApi.js`: `fetchGrantAcl`, `replaceGrantAcl`,
>    `fetchEffectiveAclByCollectionUser`, and `fetchGrantByCollectionGrant`
>    (`getGrantByCollectionGrant`).
> 4. Add to `src/shared/api/collectionsApi.js`: `fetchCollectionUsers(collectionId, {elevate})`
>    (projection=users, returns `.users ?? []`) and `fetchCollectionStigs(collectionId, params)`.
> 5. Add Vitest unit tests covering every item in the "Tests To Add → Unit tests" list. Follow
>    the existing test style under `src/features/CollectionManage/tests/` and
>    `src/features/ImportWizard/tests/`.
>
> Run the unit tests and confirm they pass. Do not touch any `.vue` files.

**Why first:** everything else imports these. They're testable in isolation and de-risk the
later phases.

---

## Phase 2 — Grants panel: wiring + owner-grant enforcement + ACL hook

**Prompt to paste:**

> Implement Phase 2 of the Grants feature (spec: the notes md in
> `src/features/CollectionManage/components/User/`). Phase 1 (lib helpers + API wrappers) is done.
>
> 1. Replace the stub `src/features/CollectionManage/components/ManageGrants.vue` with a host
>    that has an inner `SelectButton` toggle ("Grants" / "Effective Users"), styled like the
>    outer one in `CollectionManage.vue`. For now wire only the Grants side to `GrantsPanel`;
>    leave an `<!-- Effective Users: Phase 3 -->` placeholder for the other.
> 2. Enhance `src/components/common/grants/GrantsPanel.vue` per the "Changes needed in
>    GrantsPanel.vue" list:
>    - Compute requester role via `useCurrentUser().getCollectionRoleId(collectionId)` and
>      `canModifyOwnerGrants` from `lib/grantsUsers.js`.
>    - Hide/disable edit & delete for Owner (roleId 4) grants when the requester can't modify
>      owners.
>    - Hide the Owner role option in Add (`GrantsPickList`) and Edit (`EditGrantModal`) flows
>      when the requester can't modify owners.
>    - Add a per-row ACL action button (`pi pi-bullseye` / target icon) that emits `open-acl`
>      with the grant. Don't build the editor yet — just emit and have `ManageGrants` log/TODO it.
>    - After create/update/delete, if the affected grantee is the current user, call
>      `fetchCurrentUser()` and refresh `globalAppStore` (see "Refresh And State Rules").
> 3. Fix `EditGrantModal.vue` to exclude existing grantees except the grant being edited, using
>    `filterOutExistingGrantees` from `lib/grantsUsers.js` (see the EditGrantModal note in spec).
> 4. Refactor `GrantsPanel`'s inline payload/grantee logic to use the Phase 1 lib helpers where
>    they apply (`granteeToGrantPayload`, `normalizeAvailableGrantees`).
> 5. Add component tests: owner controls hidden for non-owners, add posts role+grantee IDs, edit
>    sends full replacement, delete reloads.
>
> Verify with the running app that the Grants table loads, add/edit/delete work, and owner
> restrictions behave for a non-owner Manage user.

**Why second:** reuses the most-complete existing component; delivers a working Grants tab and
the `open-acl` hook that Phase 4 plugs into.

---

## Phase 3 — Effective Users panel + Effective ACL viewer (Drawer)

**Prompt to paste:**

> Implement Phase 3 (spec: the notes md). Phases 1–2 done; `ManageGrants.vue` already has the
> Grants/Effective-Users toggle with a placeholder for Effective Users.
>
> 1. Create `src/features/CollectionManage/composables/useCollectionUsers.js` that loads
>    effective users via `fetchCollectionUsers(collectionId)` and exposes `users`, `isLoading`,
>    `reload`, reloading on `collectionId` change (use `useAsyncState`).
> 2. Create `src/features/CollectionManage/components/User/ManageUsers.vue` per the
>    "ManageUsers.vue" and "Effective Users Data Shape" sections: DataTable with User /
>    Grantee (Direct vs group names via `getEffectiveUserDisplay`) / Role (`roleMap`) / Action
>    columns, plus footer CSV export, count badge, and refresh. Match `GrantsPanel.vue` styling.
> 3. Wire `ManageUsers` into the Effective Users side of `ManageGrants.vue`'s toggle.
> 4. Create `src/features/CollectionManage/components/User/EffectiveAclDrawer.vue` (PrimeVue
>    `Drawer`, right side, not a centered modal) per "EffectiveAclModal.vue" /
>    "Effective ACL Data Shape": fetch via `fetchEffectiveAclByCollectionUser`, title
>    `User: {displayName}`, caption showing default access by role, columns Asset / STIG /
>    Access / ACL source (Direct vs group name), with Refresh / CSV / Close. Handle the
>    `422 user has no direct or group grant` case gracefully.
> 5. Row action in `ManageUsers` opens the drawer for that user.
> 6. Component tests: `ManageUsers` fetches projection=users and renders role/grantee columns;
>    effective ACL viewer calls `getEffectiveAclByCollectionUser` and renders ACL sources.
>
> Verify in the running app: effective users list resolves direct-over-group correctly and the
> effective access drawer opens with ACL sources.

**Why third:** independent of the ACL *editor*; depends only on Phase 1 wrappers and the
Phase 2 host layout. Read-only, so lower risk than Phase 4.

---

## Phase 4 — Grant ACL editor (Drawer + resource browser)

**Prompt to paste:**

> Implement Phase 4 (spec: the notes md) — the grant ACL editor, the most complex piece.
> Phases 1–3 done; `GrantsPanel` already emits `open-acl` with a grant.
>
> 1. Create `src/features/CollectionManage/composables/useGrantAcl.js` to load
>    (`fetchGrantAcl`) and save (`replaceGrantAcl`) one grant's ACL, normalizing rows with
>    `normalizeAclRule` and converting to payload with `aclRuleToPayload` (Phase 1 helpers).
> 2. Create `src/features/CollectionManage/components/User/GrantAclDrawer.vue` (PrimeVue
>    `Drawer`, wide, right side) per the "GrantAclModal.vue" section:
>    - Title `Access Control List for {grantee name}`.
>    - Left: resource browser (PrimeVue `Tree` with lazy loading) offering Collection root,
>      STIGs, Assets, Labels, and their children per the "Resource browser options" list. Use
>      `fetchCollectionStigs`, `getAssets`/existing asset wrappers, `fetchAssetWithStigs`,
>      `fetchAssetsByCollectionStig`, `fetchCollectionLabels`. Do NOT port the Ext tree.
>    - Middle: add-rule action with an access menu — `rw`/`r`/`none` for Restricted (roleId 1),
>      `rw`/`r` otherwise (`getAllowedAclAccessOptions`). Block duplicates with
>      `isDuplicateAclRule`.
>    - Right: editable ACL rules DataTable.
>    - Footer: Cancel / Save. Save calls `replaceGrantAcl`, replaces local state with the
>      response, emits `saved`, closes only on success.
> 3. Wire the drawer into `ManageGrants.vue`/`GrantsPanel.vue` so the Phase 2 `open-acl` action
>    opens it for the selected grant.
> 4. Apply the "Refresh And State Rules → After replacing ACL rules" behavior (grant list
>    unchanged; reload an open Effective ACL drawer if it shows the same user).
> 5. Component tests: ACL drawer loads, adds a rule, prevents duplicates, saves correct payload;
>    access options differ by role.
>
> Verify in the running app: open ACL from a grant row, add rules across collection/STIG/asset/
> asset+STIG/label selectors, save, and confirm effective ACL reflects the changes.

**Why last:** highest complexity (tree, lazy loading, specificity rules) and depends on the
`open-acl` hook from Phase 2 and the lib/API from Phase 1. Isolating it keeps the earlier,
higher-value phases shippable on their own.

---

## Cross-phase notes

- All grant mutations support `elevate=true`; normal collection manage does **not** pass it.
- Keep errors flowing through `useGlobalError()` / `useAsyncState()` as the existing panels do.
- Use `roleMap`/`roleOptions` labels everywhere; never hardcode role strings.
- Each phase should leave the app in a working, mergeable state.
