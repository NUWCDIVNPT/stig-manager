import { userEvent } from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../testUtils/utils.js'
import JobPropertiesModal from '../components/JobPropertiesModal.vue'

// Task catalog the modal loads on open. Hoisted so the vi.mock factory can
// reference it and each test can swap it in beforeEach.
const h = vi.hoisted(() => ({ catalog: [] }))

vi.mock('../api/serviceJobsApi.js', () => ({
  fetchTasks: vi.fn(() => Promise.resolve(h.catalog)),
}))

vi.mock('../../../../shared/composables/useCurrentUser.js', () => ({
  useCurrentUser: () => ({ isAdmin: { value: true } }),
}))

// Stub the PrimeVue Dialog + Tabs so every slot (both tab panels) renders in
// jsdom without overlay/active-tab machinery.
vi.mock('primevue/dialog', () => ({
  default: { name: 'Dialog', template: '<div><slot name="header" /><slot /><slot name="footer" /></div>' },
}))
vi.mock('primevue/tabs', () => ({ default: { name: 'Tabs', template: '<div><slot /></div>' } }))
vi.mock('primevue/tablist', () => ({ default: { name: 'TabList', template: '<div><slot /></div>' } }))
vi.mock('primevue/tab', () => ({ default: { name: 'Tab', template: '<div><slot /></div>' } }))
vi.mock('primevue/tabpanels', () => ({ default: { name: 'TabPanels', template: '<div><slot /></div>' } }))
vi.mock('primevue/tabpanel', () => ({ default: { name: 'TabPanel', template: '<div><slot /></div>' } }))

// Stub the task PickList: one button moves the whole available column into the
// assigned column, so tests can select tasks without the virtual scroller.
vi.mock('../components/schedule/TaskPickList.vue', () => ({
  default: {
    name: 'TaskPickList',
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: `<button data-testid="move-all-tasks" @click="$emit('update:modelValue', [[], modelValue?.[0] ?? []])"></button>`,
  },
}))

// Stub the schedule form: one button pushes an invalid schedule (a 'once'
// frequency with no start date) so scheduleValid gating can be exercised.
vi.mock('../components/schedule/ScheduleForm.vue', () => ({
  default: {
    name: 'ScheduleForm',
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: `<button data-testid="set-invalid-schedule" @click="$emit('update:modelValue', { frequency: 'once', startDate: null, startTime: null })"></button>`,
  },
}))

const CATALOG = [
  { taskId: 1, name: 'Alpha', description: 'a' },
  { taskId: 2, name: 'Beta', description: 'b' },
]

// A system job (jobId < 100) with a fixed task set and a recurring schedule.
const SYSTEM_JOB = {
  jobId: 5,
  name: 'System Sweep',
  description: 'built-in',
  tasks: [{ taskId: 1, name: 'Alpha', description: 'a' }],
  event: { type: 'recurring', interval: { value: '1', field: 'day' }, starts: '2026-05-01T00:00:00.000Z', enabled: true },
}

// The modal loads its catalog on the visible false->true transition, so mount
// closed and then open it.
async function renderOpen(props = {}) {
  const utils = renderWithProviders(JobPropertiesModal, { props: { visible: false, ...props } })
  await utils.rerender({ visible: true, ...props })
  return utils
}

const saveBtn = () => screen.getByRole('button', { name: 'Save' })

describe('jobPropertiesModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    h.catalog = CATALOG
  })

  it('keeps Save disabled until a name and at least one task are set', async () => {
    await renderOpen()
    await waitFor(() => expect(screen.getByTestId('move-all-tasks')).toBeInTheDocument())

    // No name, no tasks.
    expect(saveBtn()).toBeDisabled()

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/Name/), 'Nightly')
    // Name alone is not enough — still no tasks assigned.
    expect(saveBtn()).toBeDisabled()

    await user.click(screen.getByTestId('move-all-tasks'))
    await waitFor(() => expect(saveBtn()).toBeEnabled())
  })

  it('locks name/tasks for a system job and enables Save on schedule alone', async () => {
    await renderOpen({ job: SYSTEM_JOB })
    await waitFor(() => expect(screen.getByText(/This is a system job/)).toBeInTheDocument())

    expect(screen.getByLabelText(/Name/)).toBeDisabled()
    // Read-only task list is shown instead of the editable PickList.
    expect(screen.queryByTestId('move-all-tasks')).not.toBeInTheDocument()
    // A valid inherited schedule is enough to save.
    expect(saveBtn()).toBeEnabled()
  })

  it('emits a full payload for a new job (event null when unscheduled)', async () => {
    const { emitted } = await renderOpen()
    await waitFor(() => expect(screen.getByTestId('move-all-tasks')).toBeInTheDocument())

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/Name/), 'Nightly')
    await user.type(screen.getByLabelText(/Description/), 'runs nightly')
    await user.click(screen.getByTestId('move-all-tasks'))
    await waitFor(() => expect(saveBtn()).toBeEnabled())
    await user.click(saveBtn())

    expect(emitted().save[0][0]).toEqual({
      jobId: null,
      isSystemJob: false,
      name: 'Nightly',
      description: 'runs nightly',
      taskIds: [1, 2],
      event: null,
    })
  })

  it('emits an event-only-shaped payload for a system job', async () => {
    const { emitted } = await renderOpen({ job: SYSTEM_JOB })
    await waitFor(() => expect(saveBtn()).toBeEnabled())

    await userEvent.setup().click(saveBtn())

    const payload = emitted().save[0][0]
    expect(payload.jobId).toBe(5)
    expect(payload.isSystemJob).toBe(true)
    expect(payload.event.type).toBe('recurring')
  })

  it('blocks Save when the chosen schedule is invalid', async () => {
    await renderOpen()
    await waitFor(() => expect(screen.getByTestId('move-all-tasks')).toBeInTheDocument())

    const user = userEvent.setup()
    // Make name + tasks valid first, so only the schedule can fail the gate.
    await user.type(screen.getByLabelText(/Name/), 'Nightly')
    await user.click(screen.getByTestId('move-all-tasks'))
    await waitFor(() => expect(saveBtn()).toBeEnabled())

    // Push an invalid 'once' schedule with no start date.
    await user.click(screen.getByTestId('set-invalid-schedule'))
    await waitFor(() => expect(saveBtn()).toBeDisabled())
  })
})
