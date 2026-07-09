import { computed, ref } from 'vue'

const filterOptions = [
  { label: 'All', value: 0 },
  { label: '30 Days', value: 30 },
  { label: '60 Days', value: 60 },
  { label: '90 Days', value: 90 },
]

const itemLabel = 'displayName'

export function useGranteeFilter(usersRef, groupsRef) {
  const searchText = ref('')
  const selectedFilter = ref(filterOptions[0])
  const collapsedGroups = ref({})

  // Search + last-active filtering, before the collapse presentation is
  // applied — collapsing a section hides items but doesn't filter them out.
  const filtered = computed(() => {
    let users = usersRef.value
    let groups = groupsRef.value

    if (searchText.value) {
      const lower = searchText.value.toLowerCase()
      users = users.filter(u => u[itemLabel].toLowerCase().includes(lower))
      groups = groups.filter(g => g[itemLabel].toLowerCase().includes(lower))
    }

    if (selectedFilter.value.value > 0) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - selectedFilter.value.value)
      users = users.filter((u) => {
        if (!u.lastAccess) {
          return false
        }
        // lastAccess is stored as Unix seconds (see api auth.js), so scale to ms
        return new Date(u.lastAccess * 1000) >= cutoffDate
      })
    }

    return { users, groups }
  })

  // The set "Add All" should act on: everything matching the active filters.
  const filteredSource = computed(() => [...filtered.value.groups, ...filtered.value.users])

  const displaySource = computed(() => [
    {
      label: 'User Groups',
      value: 'group',
      items: collapsedGroups.value.group ? [{ collapsed: true, [itemLabel]: '' }] : filtered.value.groups,
    },
    {
      label: 'Users',
      value: 'user',
      items: collapsedGroups.value.user ? [{ collapsed: true, [itemLabel]: '' }] : filtered.value.users,
    },
  ])

  const toggleGroup = (groupValue) => {
    collapsedGroups.value[groupValue] = !collapsedGroups.value[groupValue]
  }

  return {
    searchText,
    selectedFilter,
    collapsedGroups,
    filterOptions,
    itemLabel,
    displaySource,
    filteredSource,
    toggleGroup,
  }
}
