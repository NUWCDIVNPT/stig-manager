export const roleOptions = [
  { label: 'Restricted', value: 1 },
  { label: 'Full', value: 2 },
  { label: 'Manage', value: 3 },
  { label: 'Owner', value: 4 },
]

export const roleMap = Object.fromEntries(roleOptions.map(r => [r.value, r.label]))
