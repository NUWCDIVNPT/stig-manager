export const OWNER_ROLE_ID = 4

export const roleOptions = [
  { label: 'Restricted', value: 1 },
  { label: 'Full', value: 2 },
  { label: 'Manage', value: 3 },
  { label: 'Owner', value: OWNER_ROLE_ID },
]

export const roleMap = Object.fromEntries(roleOptions.map(r => [r.value, r.label]))

// Owner may only be assigned by an Owner (or an elevated caller); every other
// caller gets all roles except Owner.
export function getAssignableRoleOptions(canModifyOwners) {
  return canModifyOwners ? roleOptions : roleOptions.filter(option => option.value !== OWNER_ROLE_ID)
}
