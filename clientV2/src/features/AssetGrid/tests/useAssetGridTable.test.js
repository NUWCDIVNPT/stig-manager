// import { describe, it, expect } from 'vitest'
// import { ref, defineComponent, h } from 'vue'
// import { waitFor } from '@testing-library/vue'
// import { server } from '@/test/testServer'
// import { renderWithProviders } from '../../../test/utils'
// import { assetGridHandlers } from '../mocks/assetGrid.handler.js'
// import { useAssetGridTable } from '../composeables/useAssetGridTable'

// const Probe = defineComponent({
//   props: { id: { type: String, required: true } },
//   setup(props) {
//     const selected = ref({ collectionId: props.id })
//     const { items, labels, loading, error } = useAssetGridTable({ selectedCollection: selected })
//     return () =>
//       h('div', [
//         h('div', { 'data-testid': 'loading' }, String(loading.value)),
//         h('div', { 'data-testid': 'error' }, error.value || ''),
//         h('pre', { 'data-testid': 'items' }, JSON.stringify(items.value)),
//       ])
//   },
// })

// describe('useAssetGridTable', () => {
//   beforeAll(() => {
//     server.use(...assetGridHandlers) // add feature mocks just for this suite
//   })

//   it('fetches labels and assets for the selected collection', async () => {
//     const { getByTestId } = renderWithProviders(Probe, { props: { id: '21' } })
//     await waitFor(() => {
//       expect(getByTestId('loading').textContent).toBe('false')
//       const itemsArr = JSON.parse(getByTestId('items').textContent || '[]')
//       expect(itemsArr.length).toBeGreaterThan(0)
//       // optional check on first item shape:
//       expect(itemsArr[0]).toMatchObject({ assetId: expect.any(String) })
//     })
//   })
// })
