import { fireEvent, screen, waitFor } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils.js'
import BulkStatusConfirmModal from '../components/BulkStatusConfirmModal.vue'

function render(props = {}) {
  return renderWithProviders(BulkStatusConfirmModal, {
    props: { visible: true, action: 'submit', eligibleCount: 3, skipLines: [], isBusy: false, ...props },
  })
}

describe('bulkStatusConfirmModal', () => {
  it('shows the eligible count and submit confirm label', async () => {
    render({ eligibleCount: 3 })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit 3 reviews/i })).toBeInTheDocument()
    })
  })

  it('lists skip reasons', async () => {
    render({ skipLines: [{ label: 'unreviewed', count: 2 }, { label: 'incomplete', count: 1 }] })
    await waitFor(() => {
      expect(screen.getByText(/unreviewed/)).toBeInTheDocument()
      expect(screen.getByText(/incomplete/)).toBeInTheDocument()
    })
  })

  it('disables confirm when nothing is eligible', async () => {
    render({ eligibleCount: 0 })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit 0 reviews/i })).toBeDisabled()
    })
  })

  it('disables confirm while busy', async () => {
    render({ eligibleCount: 2, isBusy: true })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit 2 reviews/i })).toBeDisabled()
    })
  })

  it('emits confirm when the confirm button is clicked', async () => {
    const { emitted } = render({ eligibleCount: 2 })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit 2 reviews/i })).toBeInTheDocument()
    })
    await fireEvent.click(screen.getByRole('button', { name: /Submit 2 reviews/i }))
    expect(emitted().confirm).toBeTruthy()
  })

  it('uses accept wording for the accept action', async () => {
    render({ action: 'accept', eligibleCount: 5 })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Accept 5 reviews/i })).toBeInTheDocument()
    })
  })
})
