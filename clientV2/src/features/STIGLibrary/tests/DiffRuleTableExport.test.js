import { userEvent } from '@testing-library/user-event'
import { screen } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils.js'
import DiffRuleTable from '../components/DiffRuleTable.vue'

vi.mock('file-saver-es', () => ({ saveAs: vi.fn() }))

const { saveAs } = await import('file-saver-es')

function savedCsvText() {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.replace(/^\uFEFF/, ''))
    reader.onerror = reject
    reader.readAsText(saveAs.mock.calls.at(-1)[0])
  })
}

// End-to-end check of the footer CSV export against a real DataTable: column
// fields, export headers and the default display formatter together must
// reproduce the legacy diff report columns.
describe('diffRuleTable CSV export', () => {
  it('exports every visible column as displayed', async () => {
    renderWithProviders(DiffRuleTable, {
      props: {
        rows: [
          { key: 'a', stigId: 'RHEL-08-010000', leftRule: 'SV-1r1_rule', rightRule: 'SV-1r2_rule', cat: 'high', changed: ['ruleId', 'check'] },
          { key: 'b', stigId: 'RHEL-08-010001', leftRule: 'SV-2r1_rule', rightRule: '', cat: 'medium', changed: ['rule removed'] },
        ],
        selectedKey: null,
      },
    })

    await userEvent.setup().click(screen.getByText('CSV'))

    const csv = await savedCsvText()
    expect(csv.split('\n')).toEqual([
      'STIG ID,Left rule,Right rule,CAT,Changed properties',
      'RHEL-08-010000,SV-1r1_rule,SV-1r2_rule,CAT 1,"ruleId, check"',
      'RHEL-08-010001,SV-2r1_rule,,CAT 2,rule removed',
    ])
    expect(saveAs.mock.calls.at(-1)[1]).toMatch(/^Changed Rules_.*\.csv$/)
  })
})
