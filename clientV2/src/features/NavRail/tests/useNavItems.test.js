import { describe, expect, it, vi } from 'vitest'
import { useNavItems } from '../composables/useNavItems.js'

const mockRouteName = 'home'
let mockUser = { privileges: { admin: false } }

vi.mock('vue-router', () => ({
  useRoute: () => ({
    get name() { return mockRouteName },
  }),
}))

vi.mock('../../../shared/stores/globalAppStore.js', () => ({
  useGlobalAppStore: () => ({
    get user() { return mockUser },
  }),
}))

describe('useNavItems composable', () => {
  it('does not include the Admin item for regular users', () => {
    mockUser = { privileges: { admin: false } }
    const { navItems, isAdmin } = useNavItems()

    expect(isAdmin.value).toBe(false)
    const adminItem = navItems.value.find(item => item.key === 'admin')
    expect(adminItem).toBeUndefined()
  })

  it('includes the Admin item when user has admin privileges', () => {
    mockUser = { privileges: { admin: true } }
    const { navItems, isAdmin } = useNavItems()

    expect(isAdmin.value).toBe(true)
    const adminItem = navItems.value.find(item => item.key === 'admin')
    expect(adminItem).toBeDefined()
    expect(adminItem.label).toBe('Admin')
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
