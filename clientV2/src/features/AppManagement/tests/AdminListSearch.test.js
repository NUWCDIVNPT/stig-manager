import { fireEvent, screen } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils.js'
import CollectionList from '../Collections/components/CollectionList.vue'
import StigList from '../STIGManage/components/StigList.vue'
import UserGroupList from '../UserGroups/components/UserGroupList.vue'
import UserList from '../Users/components/UserList.vue'

// The table echoes the first cell of each row it is given, plus its column headers
vi.mock('primevue/datatable', () => ({
  default: {
    name: 'DataTable',
    props: ['value', 'dataKey'],
    template: `
      <div>
        <table><thead><tr><slot /></tr></thead></table>
        <ul><li v-for="row in value" :key="row[dataKey]" data-row>{{ row[dataKey] }}</li></ul>
        <slot name="empty" v-if="!value.length" />
      </div>
    `,
  },
}))

vi.mock('primevue/column', () => ({
  default: { name: 'Column', props: ['field', 'header'], template: '<th :data-field="field">{{ header }}</th>' },
}))

const rowKeys = container => [...container.querySelectorAll('[data-row]')].map(li => li.textContent)
const headerFields = container => [...container.querySelectorAll('th[data-field]')].map(th => th.dataset.field)

async function search(label, text) {
  await fireEvent.update(screen.getByRole('textbox', { name: label }), text)
  await vi.advanceTimersByTimeAsync(250)
}

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
})
afterEach(() => vi.useRealTimers())

describe('admin list search and columns', () => {
  it('collections: searches name, owners and ID', async () => {
    const collections = [
      { collectionId: '1', name: 'Alpha', owners: [{ username: 'jdoe' }], statistics: {} },
      { collectionId: '2', name: 'Bravo', owners: [{ username: 'asmith' }], statistics: {} },
    ]
    const { container } = renderWithProviders(CollectionList, { props: { collections } })
    await search('Search collections', 'asmith')
    expect(rowKeys(container)).toEqual(['2'])
  })

  it('users: searches username, name, status and groups; hidden columns drop out', async () => {
    const users = [
      { userId: '1', username: 'jdoe', displayName: 'Jane Doe', status: 'available', userGroups: [] },
      { userId: '2', username: 'bsmith', displayName: 'Bob Smith', status: 'unavailable', userGroups: [] },
    ]
    localStorage.setItem('adminUsers.columns', JSON.stringify({ displayName: false }))
    const { container } = renderWithProviders(UserList, { props: { users } })
    expect(headerFields(container)).not.toContain('displayName')

    await search('Search users', 'unavailable')
    expect(rowKeys(container)).toEqual(['2'])
    await search('Search users', 'Jane')
    expect(rowKeys(container)).toEqual([])
    expect(screen.getByText('No users match the search.')).toBeTruthy()
  })

  it('user groups: searches name and description', async () => {
    const groups = [
      { userGroupId: '1', name: 'Admins', description: 'Site admins' },
      { userGroupId: '2', name: 'Reviewers', description: 'STIG reviewers' },
    ]
    const { container } = renderWithProviders(UserGroupList, { props: { groups } })
    await search('Search groups', 'stig')
    expect(rowKeys(container)).toEqual(['2'])
  })

  it('stigs: searches benchmark ID and title, and keeps the ID column locked on', async () => {
    const stigs = [
      { benchmarkId: 'RHEL_9_STIG', title: 'Red Hat Enterprise Linux 9' },
      { benchmarkId: 'MS_Windows_11_STIG', title: 'Microsoft Windows 11' },
    ]
    localStorage.setItem('adminStigs.columns', JSON.stringify({ benchmarkId: false, title: false }))
    const { container } = renderWithProviders(StigList, { props: { stigs } })
    expect(headerFields(container)).toContain('benchmarkId')
    expect(headerFields(container)).not.toContain('title')

    await search('Search STIGs', 'windows')
    expect(rowKeys(container)).toEqual(['MS_Windows_11_STIG'])
  })
})
