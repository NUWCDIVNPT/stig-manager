import { fireEvent, screen } from '@testing-library/vue'
import Column from 'primevue/column'
import PrimeVue from 'primevue/config'
import DataTable from 'primevue/datatable'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { MyPrimeVuePT } from '../../../primevueTheme.js'
import { renderWithProviders } from '../../../testUtils/utils.js'
import GridCopyMenu from '../GridCopyMenu.vue'

// End-to-end proof of the automatic wiring: a REAL DataTable with no
// per-table code, the global pass-through from primevueTheme.js, and the
// single app-level GridCopyMenu. Guards the PrimeVue internals the pt
// handler relies on (BodyRow.rowData and the two-parent path to the table).
const Harness = {
  components: { DataTable, Column, GridCopyMenu },
  setup() {
    const rows = [
      { name: 'srv1', stats: { count: 3 }, secret: 's1', labels: ['web', 'prod'] },
      { name: 'srv2', stats: { count: 0 }, secret: 's2', labels: [] },
    ]
    const exportLabels = ({ data }) => data.join(', ')
    return { rows, exportLabels }
  },
  template: `
    <div>
      <DataTable :value="rows" data-testid="dt">
        <Column field="name" header="Name" />
        <Column field="stats.count" header="Count" />
        <Column field="secret" header="Secret" :exportable="false" />
        <Column field="labels" header="Labels" :export-value="exportLabels">
          <template #body="{ data }"><span v-for="l in data.labels" :key="l" class="chip">{{ l }}</span></template>
        </Column>
        <Column header="Note">
          <template #body>slot only</template>
        </Column>
        <Column header="Edit">
          <template #body><input data-testid="editor" value="x"></template>
        </Column>
      </DataTable>
      <GridCopyMenu />
    </div>
  `,
}

function renderHarness() {
  return renderWithProviders(Harness, {
    withPrimeVue: false,
    global: { plugins: [[PrimeVue, { pt: MyPrimeVuePT }]] },
  })
}

async function rightClick(el) {
  await fireEvent.contextMenu(el)
  await nextTick()
}

describe('gridCopyMenu via the global DataTable pass-through', () => {
  let writeText

  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue()
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    window.getSelection = () => ({ isCollapsed: true, anchorNode: null })
  })

  it('opens from any DataTable row via the global pass-through and copies the cell', async () => {
    renderHarness()
    const cell = screen.getByText('srv2')
    await rightClick(cell)

    const item = await screen.findByText('Copy value "srv2"')
    await fireEvent.click(item)
    expect(writeText).toHaveBeenCalledWith('srv2')
  })

  it('copies the row as CSV using the column export rules', async () => {
    renderHarness()
    await rightClick(screen.getByText('srv1'))

    const item = await screen.findByText('Copy row as CSV')
    await fireEvent.click(item)
    expect(writeText).toHaveBeenCalledWith('Name,Count,Labels\nsrv1,3,"web, prod"')
  })

  it('copies a cell as its export text, not its concatenated DOM text', async () => {
    renderHarness()
    await rightClick(screen.getByText('web'))
    await fireEvent.click(await screen.findByText('Copy value "web, prod"'))
    expect(writeText).toHaveBeenCalledWith('web, prod')
  })

  it('falls back to rendered text for columns without a field or export-value', async () => {
    renderHarness()
    await rightClick(screen.getAllByText('slot only')[0])
    await fireEvent.click(await screen.findByText('Copy value "slot only"'))
    expect(writeText).toHaveBeenCalledWith('slot only')
  })

  it('keeps the browser menu for editable cells', async () => {
    renderHarness()
    await rightClick(screen.getAllByTestId('editor')[0])
    expect(screen.queryByText('Copy row as CSV')).toBeNull()
  })

  it('keeps the browser menu when text is already selected in the table', async () => {
    renderHarness()
    const cell = screen.getByText('srv1')
    window.getSelection = () => ({ isCollapsed: false, anchorNode: cell })
    await rightClick(cell)
    expect(screen.queryByText('Copy row as CSV')).toBeNull()
  })

  it('swallows clipboard failures', async () => {
    writeText.mockRejectedValue(new Error('denied'))
    renderHarness()
    await rightClick(screen.getByText('srv1'))
    await fireEvent.click(await screen.findByText('Copy row as CSV'))
    await nextTick()
    expect(writeText).toHaveBeenCalled()
  })
})
