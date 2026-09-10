import { screen } from '@testing-library/vue'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { renderWithProviders } from '../../../testUtils/utils.js'
import StatusFooter from '../StatusFooter.vue'

vi.mock('file-saver-es', () => ({ saveAs: vi.fn() }))

const { saveAs } = await import('file-saver-es')

// jsdom's Blob has no .text(), so read the saved blob through FileReader.
function savedCsvText() {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsText(saveAs.mock.calls.at(-1)[0])
  })
}

// Integration proof for the shared footer export: a REAL PrimeVue DataTable
// (not a mock) behind StatusFooter's dt prop. Guards against PrimeVue
// internals (columns/processedData/columnProp) becoming unreachable via the
// template ref — if they were, exportDataTableCsv would silently fall back to
// the built-in exporter and this CSV would contain [object Object].
const Harness = {
  components: { DataTable, Column, StatusFooter },
  setup() {
    const dt = ref(null)
    const rows = [
      { name: 'srv1', stats: { count: 3 }, tasks: [{ name: 't1' }, { name: 't2' }], secret: 's1' },
      { name: '=cmd()', stats: { count: 0 }, tasks: [], secret: 's2' },
    ]
    return { dt, rows }
  },
  template: `
    <DataTable ref="dt" :value="rows" export-filename="integration-export">
      <Column field="name" header="Name" />
      <Column field="stats.count" header="Count" />
      <Column field="tasks" header="Tasks" />
      <Column header="Actions" />
      <Column field="secret" header="Secret" :exportable="false" />
      <template #footer>
        <StatusFooter :dt="dt" :total-count="rows.length" :show-refresh="false" />
      </template>
    </DataTable>
  `,
}

describe('statusFooter CSV export against a real DataTable', () => {
  it('downloads correctly serialized CSV when the footer button is clicked', async () => {
    renderWithProviders(Harness)
    // The DataTable template ref reaches StatusFooter's dt prop on the tick after mount.
    await nextTick()

    screen.getByText('CSV').click()

    expect(saveAs).toHaveBeenCalledOnce()
    expect(saveAs.mock.calls.at(-1)[1]).toMatch(/^integration-export_\d{4}-\d{2}-\d{2}T\d{4}Z\.csv$/)

    const lines = (await savedCsvText()).replace(/^\uFEFF/, '').split('\n')
    expect(lines[0]).toBe('Name,Count,Tasks')
    // Dot path resolves; array of objects serializes as JSON items, not [object Object]
    expect(lines[1]).toBe('srv1,3,"{""name"":""t1""}, {""name"":""t2""}"')
    // Formula guard from escapeCsv; field-less and exportable=false columns skipped
    expect(lines[2]).toBe('"\t=cmd()",0,')
    expect(lines).toHaveLength(3)
  })
})
