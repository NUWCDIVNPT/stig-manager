import { render, screen, within } from '@testing-library/vue'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import StigPillStack from '../components/StigPillStack.vue'

// Popover stub: always renders its slot so the full-list content is queryable
// without simulating PrimeVue overlay positioning in jsdom.
vi.mock('primevue/popover', () => ({
  default: {
    name: 'Popover',
    template: '<div data-testid="popover"><slot /></div>',
    methods: { show() {}, hide() {} },
  },
}))

// The component measures its container via offsetWidth (jsdom always reports
// 0). Override the prototype getter so each test can set a real width.
let mockOffsetWidth = 0
let originalDescriptor

beforeAll(() => {
  originalDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get: () => mockOffsetWidth,
  })
})

afterAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalDescriptor)
})

const stigs = (...ids) => ids.map(benchmarkId => ({ benchmarkId }))

async function renderStack(props, width) {
  mockOffsetWidth = width
  const utils = render(StigPillStack, { props })
  await nextTick()
  return utils
}

// Geometry refresher (constants in the component): a short id is one line —
// pill height 1 × 14 + 3 = 17px, +2px gap between pills; height budget is
// itemSize − 4. Short ids stay one line at every width used here.

describe('StigPillStack', () => {
  it('renders all pills when everything fits the height budget', async () => {
    // itemSize 74 → budget 70; three 1-line pills need 17 + 19 + 19 = 55.
    const { container } = await renderStack(
      { stigs: stigs('A_STIG', 'B_STIG', 'C_STIG'), itemSize: 74 },
      200,
    )
    expect(container.querySelectorAll('.stig-stack > .stig-pill')).toHaveLength(3)
    expect(screen.queryByRole('button', { name: /more STIGs/ })).toBeNull()
  })

  it('shows only whole pills plus a +N badge when the stack overflows', async () => {
    // itemSize 36 → budget 32; first pill uses 17, the second needs 19 more —
    // doesn't fit, so one pill is visible and two overflow into the badge.
    const { container } = await renderStack(
      { stigs: stigs('A_STIG', 'B_STIG', 'C_STIG'), itemSize: 36 },
      200,
    )
    expect(container.querySelectorAll('.stig-stack > .stig-pill')).toHaveLength(1)
    expect(screen.getByRole('button', { name: '2 more STIGs' })).toHaveTextContent('+2')
  })

  it('budgets two lines for an id that wraps', async () => {
    // Width 120 → ~20 chars/line; a 30-char id wraps to 2 lines (31px), which
    // alone nearly fills the 32px budget — the short second id overflows.
    const longId = 'A'.repeat(30)
    const { container } = await renderStack(
      { stigs: stigs(longId, 'B_STIG'), itemSize: 36 },
      120,
    )
    expect(container.querySelectorAll('.stig-stack > .stig-pill')).toHaveLength(1)
    expect(screen.getByRole('button', { name: '1 more STIGs' })).toBeInTheDocument()
  })

  it('lists every STIG in the popover, one item per line', async () => {
    await renderStack({ stigs: stigs('A_STIG', 'B_STIG', 'C_STIG'), itemSize: 36 }, 200)
    const items = within(screen.getByTestId('popover')).getAllByRole('listitem')
    expect(items.map(li => li.textContent.trim())).toEqual(['A_STIG', 'B_STIG', 'C_STIG'])
  })

  it('renders all pills before the container has been measured', async () => {
    // Pre-measure (width 0) the fit math is skipped — show everything rather
    // than guessing; the ResizeObserver pass corrects it after mount.
    const { container } = await renderStack(
      { stigs: stigs('A_STIG', 'B_STIG', 'C_STIG'), itemSize: 36 },
      0,
    )
    expect(container.querySelectorAll('.stig-stack > .stig-pill')).toHaveLength(3)
    expect(screen.queryByRole('button', { name: /more STIGs/ })).toBeNull()
  })

  it('renders nothing for an empty stig list', async () => {
    const { container } = await renderStack({ stigs: [], itemSize: 36 }, 200)
    expect(container.querySelectorAll('.stig-pill')).toHaveLength(0)
    expect(screen.queryByRole('button', { name: /more STIGs/ })).toBeNull()
  })
})
