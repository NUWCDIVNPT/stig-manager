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
