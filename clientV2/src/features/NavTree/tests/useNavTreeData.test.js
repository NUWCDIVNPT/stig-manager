// import { screen, waitFor } from '@testing-library/vue'
// import { http, HttpResponse } from 'msw'
// import { beforeAll, describe, expect, it } from 'vitest'
// import { server } from '@/test/testServer'
// import { renderWithProviders } from '../../../test/utils'
// import { useNavTreeData } from '../composeables/useNavTreeData'
// import { navTreeHandlers } from '../mocks/navTree.handler'

// beforeAll(() => {
//   server.use(...navTreeHandlers)
// })

// function renderHookComponent(options = {}) {
//   const Comp = {
//     template: `
//       <div>
//         <span data-testid="count">{{ collections.length }}</span>
//         <span data-testid="loading">{{ loading }}</span>
//         <span data-testid="error">{{ error ? 'yes' : '' }}</span>
//       </div>
//     `,
//     setup() {
//       return useNavTreeData()
//     },
//   }

//   return renderWithProviders(Comp, { workerToken: 'TEST_TOKEN', withPrimeVue: false, ...options })
// }

// describe('useNavTreeData (MSW only)', () => {
//   it('renders placeholders', () => {
//     const { getByTestId } = renderHookComponent()
//     expect(getByTestId('count')).toBeInTheDocument()
//     expect(getByTestId('loading')).toBeInTheDocument()
//     expect(getByTestId('error')).toBeInTheDocument()
//   })

//   it('loads 3 collections from the API', async () => {
//     renderHookComponent()
//     await waitFor(() => {
//       expect(screen.getByTestId('loading').textContent).toBe('false')
//       expect(screen.getByTestId('count').textContent).toBe('3')
//     })
//   })

//   it('shows error when API fails', async () => {
//     server.use(
//       http.get('/api/collections', () =>
//         HttpResponse.text('Boom', { status: 500, statusText: 'Server Error' })),
//     )

//     renderHookComponent()
//     await waitFor(() => {
//       expect(screen.getByTestId('loading').textContent).toBe('false')
//       expect(screen.getByTestId('error').textContent).toBe('yes')
//     })
//   })

//   it('sends Authorization header', async () => {
//     let sawAuth = false
//     server.use(
//       http.get('/api/collections', ({ request }) => {
//         sawAuth = request.headers.get('authorization') === 'Bearer TEST_TOKEN'
//         return HttpResponse.json([])
//       }),
//     )

//     renderHookComponent()
//     await waitFor(() => {
//       expect(screen.getByTestId('loading').textContent).toBe('false')
//     })
//     expect(sawAuth).toBe(true)
//   })
// })
