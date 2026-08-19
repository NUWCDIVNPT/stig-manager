import { screen, waitFor } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { renderWithProviders } from '../../../testUtils/utils.js'
import AppManagement from '../components/AppManagement.vue'

// Fixed item list so the test doesn't depend on the AppData feature flag.
vi.mock('../composables/useAppManagementItems.js', async () => {
  const { ref } = await import('vue')
  return {
    useAppManagementItems: () => ({
      appManagementItems: ref([
        { key: 'CollectionManage', label: 'Collections', icon: 'icon-collection', routeName: 'admin-collections' },
        { key: 'UserManage', label: 'Users', icon: 'icon-user', routeName: 'admin-users' },
      ]),
    }),
  }
})

// Sections are flat top-level routes here so the shell (rendered directly) owns
// the depth-0 router-view; the real router nests them, but the shell renders
// identically either way.
function buildRouter() {
  const stub = { template: '<div data-testid="section" />' }
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/app-management', name: 'app-management', redirect: { name: 'admin-collections' } },
      { path: '/app-management/collections', name: 'admin-collections', component: stub },
      { path: '/app-management/users', name: 'admin-users', component: stub },
    ],
  })
}

async function renderShell(startPath = '/app-management') {
  const router = buildRouter()
  router.push(startPath)
  await router.isReady()
  renderWithProviders(AppManagement, { global: { plugins: [router] } })
  return router
}

describe('AppManagement shell', () => {
  it('renders a nav item per section', async () => {
    await renderShell()
    expect(screen.getByRole('link', { name: 'Collections' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Users' })).toBeTruthy()
  })

  it('redirects the index route to the first section', async () => {
    const router = await renderShell('/app-management')
    expect(router.currentRoute.value.name).toBe('admin-collections')
  })

  it('marks the active section and renders its content', async () => {
    await renderShell('/app-management/users')
    await waitFor(() => {
      const usersLink = screen.getByRole('link', { name: 'Users' })
      expect(usersLink.className).toContain('is-active')
    })
    expect(screen.getByRole('link', { name: 'Collections' }).className).not.toContain('is-active')
    expect(screen.getByTestId('section')).toBeTruthy()
  })
})
