import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { render } from '@testing-library/vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'

function createFreshQueryClient() {
  // Fresh client per test
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 0,
        refetchOnWindowFocus: false,
      },
    },
  })
}

export function renderWithProviders(
  component,
  {
    worker = {
      token: 'test-token',
      tokenParsed: { preferred_username: 'Test User' },
    },
    props = {},
    withPrimeVue = true,
  } = {},
) {
  const queryClient = createFreshQueryClient()

  const global = {
    plugins: [
      [VueQueryPlugin, { queryClient }],
      createPinia(),
    ],
    provide: {
      worker,
    },
  }

  if (withPrimeVue) {
    global.plugins.push([PrimeVue])
  }

  const utils = render(component, { props, global })
  return { ...utils, queryClient }
}
