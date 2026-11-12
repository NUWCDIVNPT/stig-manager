import { afterEach, describe, expect, it, vi } from 'vitest'
import { useGlobalAppStore } from '../../../shared/stores/globalAppStore.js'
import { useNavItems } from '../composables/useNavItems.js'

const mockRouteName = 'home'

vi.mock('vue-router', () => ({
  useRoute: () => ({
    get name() { return mockRouteName },
  }),
}))

// Real store, so tests see the same reactivity as the app
const store = useGlobalAppStore()

function hasAdminItem(navItems) {
  return navItems.value.some(item => item.key === 'admin')
}

describe('useNavItems composable', () => {
  afterEach(() => {
    store.setUser(null)
  })

  it('does not include the Admin item for regular users', () => {
    store.setUser({ privileges: { admin: false } })
    const { navItems, isAdmin } = useNavItems()

    expect(isAdmin.value).toBe(false)
    expect(hasAdminItem(navItems)).toBe(false)
  })

  it('includes the Admin item when user has admin privileges', () => {
    store.setUser({ privileges: { admin: true } })
    const { navItems, isAdmin } = useNavItems()

    expect(isAdmin.value).toBe(true)
    const adminItem = navItems.value.find(item => item.key === 'admin')
    expect(adminItem.label).toBe('Admin')
  })

  it('removes the Admin item when a refreshed user is no longer admin', () => {
    store.setUser({ privileges: { admin: true } })
    const { navItems } = useNavItems()
    expect(hasAdminItem(navItems)).toBe(true)

    // refreshUser() replaces the whole user object
    store.setUser({ privileges: { admin: false } })
    expect(hasAdminItem(navItems)).toBe(false)
  })

  it('adds the Admin item when a refreshed user becomes admin', () => {
    store.setUser({ privileges: { admin: false } })
    const { navItems } = useNavItems()
    expect(hasAdminItem(navItems)).toBe(false)

    store.setUser({ privileges: { admin: true } })
    expect(hasAdminItem(navItems)).toBe(true)
  })

  it('hides the Admin item before the user is loaded', () => {
    const { navItems, isAdmin } = useNavItems()
    expect(isAdmin.value).toBe(false)
    expect(hasAdminItem(navItems)).toBe(false)
  })

  it('returns the correct icon for typeIcon()', () => {
    const { typeIcon } = useNavItems()
    expect(typeIcon('collection')).toBe('nav-icon-collection')
    expect(typeIcon('library')).toBe('nav-icon-library')
    expect(typeIcon('admin')).toBe('nav-icon-admin')
    expect(typeIcon('asset-review')).toBe('pi pi-file-edit')
    expect(typeIcon('unknown-type')).toBe('pi pi-link')
  })
})
