import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { render } from '@testing-library/vue'
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
  { workerToken = 'test-token', props = {}, withPrimeVue = true } = {},
) {
  const queryClient = createFreshQueryClient()

  const global = {
    plugins: [[VueQueryPlugin, { queryClient }]],
    provide: { worker: { token: workerToken } },
  }

  if (withPrimeVue) {
    global.plugins.push([PrimeVue])
  }

  const utils = render(component, { props, global })
  return { ...utils, queryClient } // optional, in case you ever need it
}
