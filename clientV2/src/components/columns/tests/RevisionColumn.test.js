import DataTable from 'primevue/datatable'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { renderWithProviders } from '../../../testUtils/utils.js'
import RevisionColumn from '../RevisionColumn.vue'

describe('revisionColumn', () => {
  it('shows the revision string and a pin only on rows pinned to a default revision', async () => {
    // A wrapped Column only registers with the DataTable when its vnode has a
    // key (the grids supply one through v-for), and the body renders on the
    // tick after that registration.
    const { container } = renderWithProviders({
      components: { DataTable, RevisionColumn },
      data: () => ({
        rows: [
          { benchmarkId: 'RHEL_9_STIG', revisionStr: 'V1R2', revisionPinned: true },
          { benchmarkId: 'MS_Windows_11_STIG', revisionStr: 'V2R8', revisionPinned: false },
        ],
      }),
      template: `
        <DataTable :value="rows" data-key="benchmarkId">
          <RevisionColumn key="revision" field="revisionStr" header="Revision" />
        </DataTable>
      `,
    })
    await nextTick()

    const cells = [...container.querySelectorAll('td')]
    expect(cells.map(c => c.textContent.trim())).toEqual(['V1R2', 'V2R8'])
    expect(cells[0].querySelector('[aria-label="Pinned Revision"]')).not.toBeNull()
    expect(cells[1].querySelector('[aria-label="Pinned Revision"]')).toBeNull()
  })
})
