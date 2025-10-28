import { renderWithProviders } from '../../../test/utils'
import NavTree from '../components/NavTree.vue' // adjust path
import { describe, it, beforeAll, expect } from 'vitest'
import { screen } from '@testing-library/vue'
import { server } from '@/test/testServer'
import { navTreeHandlers } from '../mocks/navTree.handler'

describe('NavTree.vue', () => {
  beforeAll(() => {
    server.use(...navTreeHandlers) // add feature mocks just for this suite
  })

  it('renders assets and their labels', async () => {
    const { findByText } = renderWithProviders(NavTree)

    // waits for row content rendered
    await screen.findByText('Collection X')
  })
})
