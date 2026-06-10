import { userEvent } from '@testing-library/user-event'
import { screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../../testUtils/utils'
import LabelsToolbar from '../components/Label/LabelsToolbar.vue'

function renderToolbar(props = {}) {
  return renderWithProviders(LabelsToolbar, { props })
}

describe('labelsToolbar', () => {
  it('renders the action buttons', () => {
    renderToolbar()
    expect(screen.getByRole('button', { name: /Create/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Edit/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Tag Assets/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Delete/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Clear Selection/ })).toBeInTheDocument()
  })

  it('disables single-selection actions when nothing matches', () => {
    renderToolbar({ hasSelection: false, singleSelection: false })
    expect(screen.getByRole('button', { name: /Edit/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Tag Assets/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Delete/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Clear Selection/ })).toBeDisabled()
  })

  it('enables Edit and Tag Assets only for a single selection', () => {
    renderToolbar({ hasSelection: true, singleSelection: true })
    expect(screen.getByRole('button', { name: /Edit/ })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /Tag Assets/ })).not.toBeDisabled()
  })

  it('enables Delete and Clear Selection for a multi-selection but keeps single-only actions disabled', () => {
    renderToolbar({ hasSelection: true, singleSelection: false })
    expect(screen.getByRole('button', { name: /Delete/ })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /Clear Selection/ })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /Edit/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Tag Assets/ })).toBeDisabled()
  })

  it('keeps Create always enabled', () => {
    renderToolbar({ hasSelection: false, singleSelection: false })
    expect(screen.getByRole('button', { name: /Create/ })).not.toBeDisabled()
  })

  it('emits the matching event when each button is clicked', async () => {
    const user = userEvent.setup()
    const { emitted } = renderToolbar({ hasSelection: true, singleSelection: true })

    await user.click(screen.getByRole('button', { name: /Create/ }))
    await user.click(screen.getByRole('button', { name: /Edit/ }))
    await user.click(screen.getByRole('button', { name: /Tag Assets/ }))
    await user.click(screen.getByRole('button', { name: /Delete/ }))
    await user.click(screen.getByRole('button', { name: /Clear Selection/ }))

    expect(emitted()['create-label']).toHaveLength(1)
    expect(emitted()['edit-label']).toHaveLength(1)
    expect(emitted()['tag-assets']).toHaveLength(1)
    expect(emitted()['delete-labels']).toHaveLength(1)
    expect(emitted()['clear-selection']).toHaveLength(1)
  })
})
