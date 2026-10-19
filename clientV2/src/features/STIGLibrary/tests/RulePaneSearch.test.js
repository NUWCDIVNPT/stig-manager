import { fireEvent, screen } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils.js'
import RulePane from '../components/RulePane.vue'

// The table echoes the key of each row it is given
vi.mock('primevue/datatable', () => ({
  default: {
    name: 'DataTable',
    props: ['value', 'dataKey'],
    template: `
      <div>
        <ul><li v-for="row in value" :key="row[dataKey]" data-row>{{ row[dataKey] }}</li></ul>
        <slot name="empty" v-if="!value.length" />
      </div>
    `,
  },
}))

vi.mock('primevue/column', () => ({ default: { name: 'Column', template: '<span />' } }))

const rowKeys = container => [...container.querySelectorAll('[data-row]')].map(li => li.textContent)

async function search(text) {
  await fireEvent.update(screen.getByRole('textbox', { name: 'Search rules' }), text)
  await vi.advanceTimersByTimeAsync(250)
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('rule pane search', () => {
  const rules = [
    { ruleId: 'SV-1r1_rule', version: 'RHEL-09-000001', groupId: 'V-1', title: 'Audit logs must be protected', severity: 'high' },
    { ruleId: 'SV-2r1_rule', version: 'RHEL-09-000002', groupId: 'V-2', title: 'SSH must use FIPS ciphers', severity: 'medium' },
  ]

  it('searches the changed rules in diff mode, including changed properties', async () => {
    const diffRows = [
      { key: 'a', stigId: 'RHEL-09-000001', leftRule: 'SV-1r1_rule', rightRule: 'SV-1r2_rule', cat: 'high', changed: ['check'] },
      { key: 'b', stigId: 'RHEL-09-000002', leftRule: 'SV-2r1_rule', rightRule: 'SV-2r2_rule', cat: 'medium', changed: ['fix'] },
    ]
    const { container } = renderWithProviders(RulePane, {
      props: { rules, diffRows, diffStatus: 'ready', viewRev: 'V1R2', compareRev: 'V1R1' },
    })
    await search('fix')
    expect(rowKeys(container)).toEqual(['b'])
  })
})
