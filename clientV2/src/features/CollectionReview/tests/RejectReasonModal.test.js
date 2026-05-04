import { userEvent } from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/testUtils/utils.js'
import RejectReasonModal from '../components/RejectReasonModal.vue'

describe('rejectReasonModal', () => {
  describe('visibility', () => {
    it('renders when visible', async () => {
      renderWithProviders(RejectReasonModal, { props: { visible: true } })
      await waitFor(() => expect(screen.getByText('Reject Reviews')).toBeInTheDocument())
    })

    it('does not render when not visible', () => {
      renderWithProviders(RejectReasonModal, { props: { visible: false } })
      expect(screen.queryByText('Reject Reviews')).not.toBeInTheDocument()
    })
  })

  describe('confirm button', () => {
    it('is disabled when the textarea is empty', async () => {
      renderWithProviders(RejectReasonModal, { props: { visible: true } })
      const btn = await screen.findByRole('button', { name: /Reject with this feedback/ })
      expect(btn).toBeDisabled()
    })

    it('is enabled once text is entered', async () => {
      const user = userEvent.setup()
      renderWithProviders(RejectReasonModal, { props: { visible: true } })
      await user.type(await screen.findByPlaceholderText(/Provide feedback/), 'bad finding')
      expect(screen.getByRole('button', { name: /Reject with this feedback/ })).not.toBeDisabled()
    })
  })

  describe('confirm action', () => {
    it('emits confirm with the entered text', async () => {
      const user = userEvent.setup()
      const { emitted } = renderWithProviders(RejectReasonModal, { props: { visible: true } })
      await user.type(await screen.findByPlaceholderText(/Provide feedback/), 'needs work')
      await user.click(screen.getByRole('button', { name: /Reject with this feedback/ }))
      expect(emitted().confirm[0]).toEqual(['needs work'])
    })

    it('emits update:visible=false after confirming', async () => {
      const user = userEvent.setup()
      const { emitted } = renderWithProviders(RejectReasonModal, { props: { visible: true } })
      await user.type(await screen.findByPlaceholderText(/Provide feedback/), 'reason')
      await user.click(screen.getByRole('button', { name: /Reject with this feedback/ }))
      expect(emitted()['update:visible']).toContainEqual([false])
    })

    it('does not emit confirm when textarea is empty', async () => {
      const user = userEvent.setup()
      const { emitted } = renderWithProviders(RejectReasonModal, { props: { visible: true } })
      await user.click(await screen.findByRole('button', { name: /Reject with this feedback/ }))
      expect(emitted().confirm).toBeUndefined()
    })
  })

  describe('cancel action', () => {
    it('emits cancel', async () => {
      const user = userEvent.setup()
      const { emitted } = renderWithProviders(RejectReasonModal, { props: { visible: true } })
      await user.click(await screen.findByRole('button', { name: 'Cancel' }))
      expect(emitted().cancel).toBeTruthy()
    })

    it('emits update:visible=false', async () => {
      const user = userEvent.setup()
      const { emitted } = renderWithProviders(RejectReasonModal, { props: { visible: true } })
      await user.click(await screen.findByRole('button', { name: 'Cancel' }))
      expect(emitted()['update:visible']).toContainEqual([false])
    })
  })

  describe('textarea reset', () => {
    it('clears text when the modal reopens', async () => {
      const user = userEvent.setup()
      const { rerender } = renderWithProviders(RejectReasonModal, { props: { visible: true } })
      await user.type(await screen.findByPlaceholderText(/Provide feedback/), 'old text')
      await rerender({ visible: false })
      await rerender({ visible: true })
      expect((await screen.findByPlaceholderText(/Provide feedback/)).value).toBe('')
    })
  })
})
