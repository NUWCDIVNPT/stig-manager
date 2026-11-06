import DataTable from 'primevue/datatable'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { renderWithProviders } from '../../../testUtils/utils.js'
import RevisionColumn from '../RevisionColumn.vue'

const rows = [
  { benchmarkId: 'RHEL_9_STIG', revisionStr: 'V1R2', revisionPinned: true },
  { benchmarkId: 'MS_Windows_11_STIG', revisionStr: 'V2R8', revisionPinned: false },
]

// A wrapped Column only registers with the DataTable when its vnode has a key
// (the grids supply one through v-for), and the body renders on the tick after
// that registration.
async function renderTable(props = {}) {
  const result = renderWithProviders({
    components: { DataTable, RevisionColumn },
    data: () => ({ rows, props }),
    template: `
      <DataTable :value="rows" data-key="benchmarkId">
        <RevisionColumn key="revision" v-bind="props" />
      </DataTable>
    `,
  })
  await nextTick()
  return result
}

describe('revisionColumn', () => {
  it('shows the revision string and a pin only on rows pinned to a default revision', async () => {
    const { container } = await renderTable()
    const cells = [...container.querySelectorAll('td')]
    expect(cells.map(c => c.textContent.trim())).toEqual(['V1R2', 'V2R8'])
    expect(cells[0].querySelector('.revision-pin')?.getAttribute('aria-label')).toBe('Pinned Revision')
    expect(cells[1].querySelector('.revision-pin')).toBeNull()
  })

  it('highlights the search term in the revision string', async () => {
    const { container } = await renderTable({ searchTerm: 'v1' })
    expect(container.querySelector('td mark')?.textContent).toBe('V1')
  })
})
