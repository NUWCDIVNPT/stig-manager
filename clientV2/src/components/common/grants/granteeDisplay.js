// Shared grantee display vocabulary for grants UIs (Collection Manage and
// App Management alike).

// A grantee resolves to "Direct" when it's the user themselves, otherwise to
// the group name that confers the access.
export function granteeLabel(grantee) {
  return grantee?.userId ? 'Direct' : grantee?.name
}

export function granteeLabels(grantees = []) {
  return grantees.map(granteeLabel)
}
