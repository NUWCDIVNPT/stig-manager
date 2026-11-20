import { fireEvent, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../../../../testUtils/utils.js'
import UserList from '../components/UserList.vue'

const users = [
  { userId: '1', username: 'alpha', status: 'available', lastAccess: 1700000000 },
  { userId: '2', username: 'beta', status: 'unavailable', lastAccess: null },
]

describe('userList.vue', () => {
  it('draws Status values in the Filter button as the grid\'s pills', async () => {
    renderWithProviders(UserList, { props: { users } })
    await fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
    await fireEvent.click(await screen.findByRole('menuitem', { name: 'Status' }))
    const option = await screen.findByRole('menuitemcheckbox', { name: 'unavailable' })
    expect(option.querySelector('.status-pill.unavailable')).toHaveTextContent('unavailable')
  })
})
