import { render } from '@testing-library/vue'
import { createPinia } from 'pinia'
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
  } = {},
) {
  const global = {
    plugins: [
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
  return { ...utils }
}
