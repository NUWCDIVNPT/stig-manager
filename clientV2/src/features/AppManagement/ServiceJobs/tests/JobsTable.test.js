import { fireEvent, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../testUtils/utils.js'
import JobsTable from '../components/JobsTable.vue'

// An admin-created job (jobId >= 100): removable, with a real createdBy owner.
const ADMIN_JOB = {
  jobId: 200,
  name: 'Nightly Import',
  createdBy: { username: 'alice' },
  tasks: [{ taskId: 1, name: 'Alpha' }],
  runCount: 3,
}
// A system-seeded job (jobId < 100): not removable, createdBy null -> 'system'.
const SYSTEM_JOB = {
  jobId: 5,
  name: 'System Sweep',
  createdBy: null,
  tasks: [{ taskId: 2, name: 'Beta' }],
  runCount: 1,
}

function renderTable(props = {}) {
  return renderWithProviders(JobsTable, {
    props: { jobs: [ADMIN_JOB, SYSTEM_JOB], loading: false, selection: null, ...props },
  })
}

const removeBtn = () => screen.getByRole('button', { name: 'Remove' })

describe('jobsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('disables Remove for a system job and enables it for an admin job', async () => {
    const { rerender } = renderTable({ selection: null })
    // No selection at all.
    expect(removeBtn()).toBeDisabled()

    await rerender({ jobs: [ADMIN_JOB, SYSTEM_JOB], loading: false, selection: SYSTEM_JOB })
    expect(removeBtn()).toBeDisabled()

    await rerender({ jobs: [ADMIN_JOB, SYSTEM_JOB], loading: false, selection: ADMIN_JOB })
    expect(removeBtn()).toBeEnabled()
  })

  it('renders the owner label per row, falling back to "system"', () => {
    renderTable()
    expect(screen.getByText('alice')).toBeInTheDocument()
    expect(screen.getByText('system')).toBeInTheDocument()
  })

  it('searches jobs and shows the filtered count in the footer', async () => {
    const { container } = renderTable()
    const total = () => container.querySelector('.status-footer__metric-total')
    // Before searching: no filtered count, footer shows the plain total.
    expect(total().textContent).toMatch(/2\s*jobs/)
    expect(total().textContent).not.toMatch(/of/)

    // 'beta' matches only SYSTEM_JOB's task -> footer reads "1 of 2 jobs".
    await fireEvent.update(screen.getByRole('textbox', { name: 'Search jobs' }), 'beta')
    await waitFor(() => expect(total().textContent).toMatch(/1\s*of\s*2\s*jobs/))
  })
})
