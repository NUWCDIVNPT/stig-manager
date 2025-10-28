import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { render } from '@testing-library/vue'
import Column from 'primevue/column'
import PrimeVue from 'primevue/config'
import DataTable from 'primevue/datatable'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: 0, refetchOnWindowFocus: false },
    },
  })
}

export function renderWithProviders(
  component,
  {
    workerToken = 'test-token',
    props = {},
    // allow turning PrimeVue on/off per test
    withPrimeVue = true,
  } = {},
) {
  const queryClient = createTestQueryClient()

  const global = {
    plugins: [[VueQueryPlugin, { queryClient }]],
    provide: { worker: { token: workerToken } },
  }

  if (withPrimeVue) {
    // Install PrimeVue so $primevue.config exists
    global.plugins.push([PrimeVue, { ripple: false }])
    // Register components you use in the SFC
    global.components = {
      ...(global.components || {}),
      DataTable,
      Column,
    }
  }

  return render(component, { props, global })
}
