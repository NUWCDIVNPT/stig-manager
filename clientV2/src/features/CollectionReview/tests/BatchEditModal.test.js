import { userEvent } from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { defaultFieldSettings } from '@/shared/lib/reviewFormUtils.js'
import { renderWithProviders } from '@/testUtils/utils.js'
import BatchEditModal from '../components/BatchEditModal.vue'

function renderModal(props = {}) {
  return renderWithProviders(BatchEditModal, {
    props: { visible: true, rows: [], fieldSettings: defaultFieldSettings, ...props },
  })
}

describe('batchEditModal', () => {
  describe('dialog header', () => {
    it('shows singular item count', async () => {
      renderModal({ rows: [{ result: 'pass' }] })
      await waitFor(() => expect(screen.getByText('Batch Edit (1 item)')).toBeInTheDocument())
    })

    it('shows plural item count', async () => {
      renderModal({ rows: [{ result: 'pass' }, { result: 'fail' }] })
      await waitFor(() => expect(screen.getByText('Batch Edit (2 items)')).toBeInTheDocument())
    })
  })

  describe('result dropdown', () => {
    it('opens with all result options', async () => {
      const user = userEvent.setup()
      renderModal()
      await user.click(await screen.findByRole('combobox'))
      expect(await screen.findByRole('option', { name: 'Not a Finding' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Open' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Not Applicable' })).toBeInTheDocument()
    })

    it('enables Apply Changes when a result is selected', async () => {
      const user = userEvent.setup()
      renderModal()
      await user.click(await screen.findByRole('combobox'))
      await user.click(await screen.findByRole('option', { name: 'Not a Finding' }))
      expect(screen.getByRole('button', { name: /Apply Changes/ })).not.toBeDisabled()
    })

    it('stays disabled when the same pre-populated result is re-selected', async () => {
      const user = userEvent.setup()
      renderModal({ rows: [{ result: 'pass' }] })
      await user.click(await screen.findByRole('combobox'))
      await user.click(await screen.findByRole('option', { name: 'Not a Finding' }))
      expect(screen.getByRole('button', { name: /Apply Changes/ })).toBeDisabled()
    })

    it('includes the selected result in the confirm payload', async () => {
      const user = userEvent.setup()
      const { emitted } = renderModal()
      await user.click(await screen.findByRole('combobox'))
      await user.click(await screen.findByRole('option', { name: 'Open' }))
      await user.click(screen.getByRole('button', { name: /Apply Changes/ }))
      expect(emitted().confirm[0][0]).toMatchObject({ result: 'fail' })
    })
  })

  describe('apply Changes button', () => {
    it('is disabled when no changes have been made', async () => {
      renderModal()
      expect(await screen.findByRole('button', { name: /Apply Changes/ })).toBeDisabled()
    })

    it('is enabled when detail is typed', async () => {
      const user = userEvent.setup()
      renderModal()
      await user.type(await screen.findByPlaceholderText(/keep existing details/), 'new detail')
      expect(screen.getByRole('button', { name: /Apply Changes/ })).not.toBeDisabled()
    })

    it('is enabled when comment is typed', async () => {
      const user = userEvent.setup()
      renderModal()
      await user.type(await screen.findByPlaceholderText(/keep existing comments/), 'new comment')
      expect(screen.getByRole('button', { name: /Apply Changes/ })).not.toBeDisabled()
    })
  })

  describe('confirm payload', () => {
    it('includes detail when typed', async () => {
      const user = userEvent.setup()
      const { emitted } = renderModal({ rows: [{ result: 'pass' }] })
      await user.type(await screen.findByPlaceholderText(/keep existing details/), 'my detail')
      await user.click(screen.getByRole('button', { name: /Apply Changes/ }))
      expect(emitted().confirm[0][0]).toMatchObject({ detail: 'my detail' })
    })

    it('omits comment from payload when left empty', async () => {
      const user = userEvent.setup()
      const { emitted } = renderModal({ rows: [{ result: 'pass' }] })
      await user.type(await screen.findByPlaceholderText(/keep existing details/), 'detail only')
      await user.click(screen.getByRole('button', { name: /Apply Changes/ }))
      expect(emitted().confirm[0][0]).not.toHaveProperty('comment')
    })

    it('emits update:visible=false after confirming', async () => {
      const user = userEvent.setup()
      const { emitted } = renderModal()
      await user.type(await screen.findByPlaceholderText(/keep existing details/), 'some detail')
      await user.click(screen.getByRole('button', { name: /Apply Changes/ }))
      expect(emitted()['update:visible']).toContainEqual([false])
    })
  })

  describe('result pre-population', () => {
    it('shows the result label when all rows share the same result', async () => {
      renderModal({ rows: [{ result: 'pass' }, { result: 'pass' }] })
      await waitFor(() => expect(screen.getByText('Not a Finding')).toBeInTheDocument())
    })

    it('shows the placeholder when rows have mixed results', async () => {
      renderModal({ rows: [{ result: 'pass' }, { result: 'fail' }] })
      await waitFor(() => expect(screen.getByText('Leave Unchanged')).toBeInTheDocument())
    })
  })

  describe('cancel action', () => {
    it('emits cancel', async () => {
      const user = userEvent.setup()
      const { emitted } = renderModal()
      await user.click(await screen.findByRole('button', { name: 'Cancel' }))
      expect(emitted().cancel).toBeTruthy()
    })

    it('emits update:visible=false', async () => {
      const user = userEvent.setup()
      const { emitted } = renderModal()
      await user.click(await screen.findByRole('button', { name: 'Cancel' }))
      expect(emitted()['update:visible']).toContainEqual([false])
    })
  })

  describe('field settings & conditional logic', () => {
    it('keeps Detail enabled even if result is pass (advisory behavior)', async () => {
      const user = userEvent.setup()
      const fieldSettings = {
        detail: { enabled: 'findings' },
      }
      renderModal({ fieldSettings })

      // Select Not a Finding
      await user.click(await screen.findByRole('combobox'))
      await user.click(await screen.findByRole('option', { name: 'Not a Finding' }))

      const detailArea = screen.getByPlaceholderText(/keep existing details/)
      expect(detailArea).not.toBeDisabled()
    })



    it('disables fields if setting is never', async () => {
      const fieldSettings = {
        detail: { enabled: 'never' },
        comment: { enabled: 'never' },
      }
      renderModal({ fieldSettings })

      expect(await screen.findByPlaceholderText(/keep existing details/)).toBeDisabled()
      expect(await screen.findByPlaceholderText(/keep existing comments/)).toBeDisabled()
    })

    it('shows disabled message in label when field is NEVER enabled', async () => {
      const fieldSettings = {
        detail: { enabled: 'never' },
      }
      renderModal({ fieldSettings })

      expect(await screen.findByText('(disabled for selected result)')).toBeInTheDocument()
    })
  })
})
