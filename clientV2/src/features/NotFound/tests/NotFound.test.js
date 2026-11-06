import { fireEvent, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRouter } from 'vue-router'
import { renderWithProviders } from '../../../testUtils/utils.js'
import NotFound from '../components/NotFound.vue'

vi.mock('vue-router', () => ({
  useRouter: vi.fn(),
}))

describe('notFound.vue', () => {
  let mockPush

  beforeEach(() => {
    mockPush = vi.fn()
    useRouter.mockReturnValue({ push: mockPush })
  })

  it('covers both a missing page and one the user can\'t access', () => {
    renderWithProviders(NotFound)
    expect(screen.getByText('Page Not Found')).toBeTruthy()
    expect(screen.getByText(/doesn't exist, or you don't have access to it/)).toBeTruthy()
  })

  it('goes home from the button', async () => {
    renderWithProviders(NotFound)
    await fireEvent.click(screen.getByRole('button', { name: /go home/i }))
    expect(mockPush).toHaveBeenCalledWith({ name: 'home' })
  })
})
