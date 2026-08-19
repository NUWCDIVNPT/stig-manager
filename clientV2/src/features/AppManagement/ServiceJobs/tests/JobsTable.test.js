import { fireEvent, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../testUtils/utils.js'
import JobsTable from '../components/JobsTable.vue'

// Stub the column filter (its real value lives behind a PrimeVue Popover that
// does not open under jsdom): a button applies a preset filter term so
// nameFilter can be driven deterministically.
vi.mock('../../../../components/common/ColumnSearchFilter.vue', () => ({
  default: {
    name: 'ColumnSearchFilter',
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue'],
    template: `<button data-testid="apply-name-filter" @click="$emit('update:modelValue', 'nightly')"></button>`,
  },
}))

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

  it('filters rows by name and flips filtersActive (filtered count in footer)', async () => {
    const { container } = renderTable()
    const total = () => container.querySelector('.status-footer__metric-total')
    // Before filtering: no filtered count, footer shows the plain total.
    expect(total().textContent).toMatch(/2\s*jobs/)
    expect(total().textContent).not.toMatch(/of/)

    await fireEvent.click(screen.getByTestId('apply-name-filter'))

    // 'nightly' matches only ADMIN_JOB -> filtersActive flips, footer reads "1 of 2 jobs".
    await waitFor(() => expect(total().textContent).toMatch(/1\s*of\s*2\s*jobs/))
  })
})
