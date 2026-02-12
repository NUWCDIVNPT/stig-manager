import { render } from '@testing-library/vue'
import PrimeVue from 'primevue/config'

export function renderWithProviders(
  component,
  {
    worker = {
      token: 'test-token',
      tokenParsed: { preferred_username: 'Test User' },
    },
    props = {},
    withPrimeVue = true,
    ...options
  } = {},
) {
  const global = {
    plugins: [
    ],
    provide: {
      worker,
    },
  }

  if (withPrimeVue) {
    global.plugins.push([PrimeVue])
  }

  const utils = render(component, { props, global, ...options })
  return { ...utils }
}
