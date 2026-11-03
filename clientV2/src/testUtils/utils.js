import { render } from '@testing-library/vue'
import PrimeVue from 'primevue/config'
import Tooltip from 'primevue/tooltip'

export function renderWithProviders(
  component,
  {
    worker = {
      token: 'test-token',
      tokenParsed: { preferred_username: 'Test User' },
    },
    props = {},
    withPrimeVue = true,
    global: callerGlobal = {},
    ...options
  } = {},
) {
  // Merge the caller's global config instead of letting it replace the
  // constructed one, so per-test plugins/provide/directives/stubs compose
  // with the defaults rather than silently dropping them.
  const global = {
    ...callerGlobal,
    plugins: [...(callerGlobal.plugins ?? [])],
    provide: {
      worker,
      ...callerGlobal.provide,
    },
    directives: { ...callerGlobal.directives },
  }

  if (withPrimeVue) {
    global.plugins.push([PrimeVue])
    global.directives.tooltip ??= Tooltip
  }

  const utils = render(component, { props, ...options, global })
  return { ...utils }
}

// Answers a mocked `api.patch` of /user/web-preferences the way the API does:
// a JSON merge-patch of the user's stored preferences, where a null tour date
// drops that tour. Call it from beforeEach with the vi.fn and the app store.
export function mockWebPreferencesPatch(patchMock, appStore) {
  patchMock.mockImplementation((_path, body) => {
    const prefs = appStore.user.webPreferences
    const tours = Object.fromEntries(
      Object.entries({ ...prefs.tours, ...body.tours }).filter(([, date]) => date !== null),
    )
    return Promise.resolve({ ...prefs, ...body, tours })
  })
}
