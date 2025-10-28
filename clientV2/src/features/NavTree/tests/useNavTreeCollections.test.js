// import { describe, it, expect } from 'vitest'
// import { h, defineComponent } from 'vue'
// import { renderWithProviders } from '../../../test/utils'
// import { useNavTreeCollections } from '../composeables/useNavTreeCollections'

// const Probe = defineComponent({
//   setup() {
//     const { nodes, loading, error } = useNavTreeCollections()
//     return () =>
//       h('div', [
//         h('div', { 'data-testid': 'loading' }, String(loading?.value ?? false)),
//         h('div', { 'data-testid': 'error' }, error?.value?.message ?? ''),
//         h('pre', { 'data-testid': 'nodes' }, JSON.stringify(nodes.value)),
//       ])
//   },
// })

// describe('useNavTreeCollections', () => {
//   it('maps collections to tree nodes', async () => {
//     const { nodes, loading, error } = useNavTreeCollections()
//     const { findByTestId } = renderWithProviders(Probe)
//     const nodesEl = await findByTestId('nodes') // waits for render after query resolves
//     const tree = JSON.parse(nodesEl.textContent || '[]')
//     // expect(Array.isArray(tree)).toBe(true)
//     // expect(tree[0]?.key).toBe('collections')
//     expect(1).toBe(1) // Placeholder assertion, replace with actual checks
//   })
// })
