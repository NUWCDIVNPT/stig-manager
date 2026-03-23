import { screen } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { renderWithProviders } from '../../../testUtils/utils.js'

import NavRail from '../components/NavRail.vue'

// Mock the composables used by the component
vi.mock('../composables/useNavItems.js', () => ({
  useNavItems: () => ({
    navItems: ref([
      { key: 'home', label: 'Home', route: '/', matchFn: () => true },
      { key: 'test', label: 'Test Label', route: '/test', matchFn: () => false },
    ]),
    typeIcon: vi.fn(),
  }),
}))

vi.mock('../composables/useRecentViews.js', () => ({
  useRecentViews: () => ({
    recentViews: ref([]),
    clearViews: vi.fn(),
  }),
}))

vi.mock('../composables/useRouteTracking.js', () => ({
  useRouteTracking: vi.fn(),
}))

vi.mock('../../../shared/lib/localStorage.js', () => ({
  readStoredValue: vi.fn(() => 'false'),
  storeValue: vi.fn(),
}))

describe('navRail', () => {
  it('renders the navigation items provided by useNavItems', () => {
    renderWithProviders(NavRail)
    expect(screen.getByTitle('Home')).toBeInTheDocument()
    expect(screen.getByTitle('Test Label')).toBeInTheDocument()
  })

  it('renders the toggle button', () => {
    renderWithProviders(NavRail)
    const toggleBtn = screen.getByRole('button', { name: /expand navigation/i })
    expect(toggleBtn).toBeInTheDocument()
  })
})
