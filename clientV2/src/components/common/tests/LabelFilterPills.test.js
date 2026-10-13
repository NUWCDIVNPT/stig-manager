import { fireEvent, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { renderWithProviders } from '../../../testUtils/utils.js'
import LabelFilterPills from '../LabelFilterPills.vue'

vi.mock('vue-router', () => ({
  useRoute: vi.fn(),
  useRouter: vi.fn(),
}))

vi.mock('../MetricsFilter.vue', () => ({
  default: {
    name: 'MetricsFilter',
    props: ['modelValue', 'collectionId'],
    template: `
      <div data-testid="mock-filter" :data-collection="collectionId" :data-labels="JSON.stringify(modelValue)">
        <button data-testid="pick" @click="$emit('update:modelValue', ['prod', null])">Pick</button>
      </div>
    `,
  },
}))

describe('labelFilterPills', () => {
  let route, replace

  beforeEach(() => {
    route = reactive({ params: { collectionId: '7' }, query: {} })
    replace = vi.fn()
    useRoute.mockReturnValue(route)
    useRouter.mockReturnValue({ replace })
  })

  it('passes the route collection and label filter to the picker', () => {
    route.query = { labelName: 'prod', labelMatch: 'null' }
    renderWithProviders(LabelFilterPills)
    const filter = screen.getByTestId('mock-filter')
    expect(filter.dataset.collection).toBe('7')
    expect(JSON.parse(filter.dataset.labels)).toEqual(['prod', null])
  })

  it('writes a picked selection to the route query, keeping other keys', async () => {
    route.query = { foo: 'bar' }
    renderWithProviders(LabelFilterPills)
    await fireEvent.click(screen.getByTestId('pick'))
    expect(replace).toHaveBeenCalledWith({ query: { foo: 'bar', labelName: ['prod'], labelMatch: 'null' } })
  })

  it('shows the clear button only while filtered, and clearing drops the label keys', async () => {
    const { unmount } = renderWithProviders(LabelFilterPills)
    expect(screen.queryByLabelText('Clear label filter')).not.toBeInTheDocument()
    unmount()

    route.query = { foo: 'bar', labelName: 'prod' }
    renderWithProviders(LabelFilterPills)
    await fireEvent.click(screen.getByLabelText('Clear label filter'))
    expect(replace).toHaveBeenCalledWith({ query: { foo: 'bar' } })
  })
})
