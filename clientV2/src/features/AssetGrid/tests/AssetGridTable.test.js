// src/features/AssetGrid/tests/AssetGridTable.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/vue'
import { server } from '@/test/testServer'
import { assetGridHandlers } from '../mocks/assetGrid.handler.js'
import { renderWithProviders } from '../../../test/utils.js'
import AssetGridTable from '../components/AssetGridTable.vue'

describe('AssetGridTable.vue', () => {
  beforeEach(() => {
    server.use(...assetGridHandlers) // add feature mocks just for this suite
  })

  it('renders assets and their labels', async () => {
    renderWithProviders(AssetGridTable, {
      props: { selectedData: { collectionId: '21' } },
      // withPrimeVue is true by default in our helper; keep PrimeVue installed for DataTable
    })

    // after renderWithProviders(...)
    const labelCell = await screen.findByText('Labels') // waits for async render
    expect(labelCell).toBeInTheDocument()

    const assetRows = await screen.findAllByRole('row')
    expect(assetRows.length).toBe(2) // at least one row should

    // // optionally check a specific asset name or number of rows (if your handler returns known data)
    expect(screen.getByText('Assets (2)')).toBeInTheDocument() // if Collection X appears
    // // or, if rows have a role or testid:
    // const rows = await screen.findAllByRole('row')
    // expect(rows.length).toBeGreaterThan(1)
  })
})
