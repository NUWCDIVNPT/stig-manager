import { userEvent } from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../testUtils/utils'
import { fetchReviewAgingConfig, fetchTasks, saveReviewAgingConfig } from '../api/tasksManageApi.js'
import ManageTasks from '../components/Configuration/ManageTasks.vue'

vi.mock('../api/tasksManageApi.js', () => ({
  fetchReviewAgingConfig: vi.fn(),
  fetchTasks: vi.fn(),
  saveReviewAgingConfig: vi.fn(),
}))

const { triggerError } = vi.hoisted(() => ({ triggerError: vi.fn() }))
vi.mock('../../../shared/composables/useGlobalError.js', () => ({
  useGlobalError: () => ({ triggerError }),
}))

vi.mock('../../../shared/composables/useCurrentUser.js', () => ({
  useCurrentUser: () => ({ getCollectionRoleId: () => 4 }),
}))

vi.mock('../components/Configuration/TaskOutput.vue', () => ({
  default: { name: 'TaskOutput', template: '<div />' },
}))
vi.mock('../components/Configuration/ReviewAgingRuleEditModal.vue', () => ({
  default: {
    name: 'ReviewAgingRuleEditModal',
    props: ['visible', 'rule'],
    template: '<div v-if="visible">rule editor open</div>',
  },
}))

function rule(title) {
  return {
    title,
    enabled: true,
    triggerInterval: 3600,
    triggerAction: 'delete',
    triggerBasis: 'ts',
    updateField: 'status',
    updateValue: 'saved',
    targetAssets: 'all',
    targetAssetLabelIds: [],
    targetBenchmarkIds: [],
  }
}

function newRuleButton() {
  return screen.getByRole('button', { name: /new rule/i })
}

function rowActions() {
  return ['Move up', 'Move down', 'Edit rule', 'Delete rule'].map(title => screen.getByTitle(title))
}

function allRowActions() {
  return ['Move up', 'Move down', 'Edit rule', 'Delete rule'].flatMap(title => screen.getAllByTitle(title))
}

function renderTasks(collectionId = 'c1') {
  return renderWithProviders(ManageTasks, { props: { collectionId } })
}

beforeEach(() => {
  vi.clearAllMocks()
  fetchTasks.mockResolvedValue([{ taskId: 1, name: 'Review Aging', description: '', events: [] }])
  fetchReviewAgingConfig.mockResolvedValue([rule('Age out')])
  saveReviewAgingConfig.mockResolvedValue()
})

describe('manageTasks', () => {
  it('enables the rule actions once the rules have loaded', async () => {
    renderTasks()
    await screen.findByText('Age out')

    expect(newRuleButton()).toBeEnabled()
    rowActions().filter(el => !/move/i.test(el.title)).forEach(el => expect(el).toBeEnabled())
  })

  it('opens the rule editor from a row double-click', async () => {
    const user = userEvent.setup()
    renderTasks()

    await user.dblClick(await screen.findByText('Age out'))

    expect(screen.getByText('rule editor open')).toBeInTheDocument()
  })

  it('disables the row actions while a reload is running', async () => {
    const user = userEvent.setup()
    fetchReviewAgingConfig.mockResolvedValueOnce([rule('First'), rule('Second')])
    renderTasks()
    await screen.findByText('First')

    fetchReviewAgingConfig.mockReturnValue(new Promise(() => {}))
    await user.click(screen.getAllByTitle('Delete rule')[0])
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(newRuleButton()).toBeDisabled())
    allRowActions().forEach(el => expect(el).toBeDisabled())
  })

  it('blocks a second change until the first save finishes, so the deleted rule cannot return', async () => {
    const user = userEvent.setup()
    fetchReviewAgingConfig.mockResolvedValueOnce([rule('First'), rule('Second')])
    saveReviewAgingConfig.mockReturnValue(new Promise(() => {}))
    renderTasks()
    await screen.findByText('First')

    await user.click(screen.getAllByTitle('Delete rule')[0])
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(saveReviewAgingConfig).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(newRuleButton()).toBeDisabled())
    allRowActions().forEach(el => expect(el).toBeDisabled())
  })

  it('closes the rule editor when the collection changes underneath it', async () => {
    const user = userEvent.setup()
    const utils = renderTasks('c1')
    await user.dblClick(await screen.findByText('Age out'))

    await utils.rerender({ collectionId: 'c2' })

    await waitFor(() => expect(screen.queryByText('rule editor open')).not.toBeInTheDocument())
  })

  it('disables New Rule while the rules are still loading', async () => {
    fetchReviewAgingConfig.mockReturnValue(new Promise(() => {}))
    renderTasks()

    await waitFor(() => expect(newRuleButton()).toBeDisabled())
  })

  describe('after a failed load', () => {
    const err = new Error('boom')

    it('disables New Rule so the existing rules are not replaced', async () => {
      fetchReviewAgingConfig.mockRejectedValue(err)
      renderTasks()
      await screen.findByText(/could not load rules/i)

      expect(triggerError).toHaveBeenCalledWith(err)
      expect(newRuleButton()).toBeDisabled()
    })

    it('reports the failure and does not invite the user to add a rule', async () => {
      fetchReviewAgingConfig.mockRejectedValue(err)
      renderTasks()

      expect(await screen.findByText(/could not load rules/i)).toBeInTheDocument()
      expect(screen.queryByText(/click "new rule"/i)).not.toBeInTheDocument()
    })

    it('does not show the previous collection\'s rules after a failed load', async () => {
      const utils = renderTasks('c1')
      await screen.findByText('Age out')

      fetchReviewAgingConfig.mockRejectedValue(err)
      await utils.rerender({ collectionId: 'c2' })

      await screen.findByText(/could not load rules/i)
      expect(screen.queryByText('Age out')).not.toBeInTheDocument()
      expect(newRuleButton()).toBeDisabled()
    })

    it('disables every row action when a reload fails after a save', async () => {
      const user = userEvent.setup()
      fetchReviewAgingConfig.mockResolvedValueOnce([rule('First'), rule('Second')])
      renderTasks()
      await screen.findByText('First')

      fetchReviewAgingConfig.mockRejectedValue(err)
      await user.click(screen.getAllByTitle('Delete rule')[0])
      await user.click(screen.getByRole('button', { name: 'Delete' }))

      await screen.findByText(/could not load rules/i)
      expect(saveReviewAgingConfig).toHaveBeenCalledTimes(1)
      allRowActions().forEach(el => expect(el).toBeDisabled())
    })

    it('does not open the rule editor from a row double-click', async () => {
      const user = userEvent.setup()
      fetchReviewAgingConfig.mockResolvedValueOnce([rule('First')])
      renderTasks()
      await screen.findByText('First')

      fetchReviewAgingConfig.mockRejectedValue(err)
      await user.click(screen.getByTitle('Delete rule'))
      await user.click(screen.getByRole('button', { name: 'Delete' }))
      await screen.findByText(/could not load rules/i)

      await user.dblClick(screen.getByText('First'))
      expect(screen.queryByText('rule editor open')).not.toBeInTheDocument()
    })
  })
})
