import { describe, expect, it } from 'vitest'
import { useTabList } from '../composeables/useTabList'

describe('useTabList', () => {
  const selections = [
    { key: 'CollectionManage', label: 'Collections', component: 'CollectionManage' },
    { key: 'UserManage', label: 'Users', component: 'UserManage' },
    { key: 'UserGroupManage', label: 'User Groups', component: 'UserGroupManage' },
    { key: '22', label: 'collection name', component: 'CollectionView', data: {
      collectionId: '83',
      name: 'Collection Y',
      description: null,
      settings: {
        fields: {
          detail: {
            enabled: 'always',
            required: 'always',
          },
          comment: {
            enabled: 'findings',
            required: 'findings',
          },
        },
        status: {
          canAccept: true,
          resetCriteria: 'result',
          minAcceptGrant: 3,
        },
        history: {
          maxReviews: 5,
        },
        importOptions: {
          autoStatus: {
            fail: 'submitted',
            pass: 'submitted',
            notapplicable: 'submitted',
          },
          unreviewed: 'commented',
          allowCustom: true,
          emptyDetail: 'replace',
          emptyComment: 'ignore',
          unreviewedCommented: 'informational',
        },
      },
      metadata: {
        reqRar: 'true',
        pocName: 'string',
        pocEmail: 'string',
        pocPhone: 'string',
      },
    } },
  ]

  it('should return tabs, the active tab, and two functions handleTabOpen and Close', async () => {
    const { tabs, active, handleTabOpen, handleTabClose } = useTabList()

    expect(tabs).toBeDefined()
    expect(active).toBeDefined()
    expect(handleTabOpen).toBeDefined()
    expect(handleTabClose).toBeDefined()
  })
  it('should as a start always just return the home tab as the active tab which is not closeable', async () => {
    const { tabs, active } = useTabList()

    expect(tabs.value.length).toBe(1)
    expect(tabs.value[0].key).toBe('home')
    expect(tabs.value[0].closable).toBe(false)
    expect(active.value).toBe('home')
  })
  it('should open a new tab when handleTabOpen is called with a tab that isn\'t already open', async () => {
    const { tabs, active, handleTabOpen } = useTabList()

    // open tab for first selection
    const selection = selections[0]
    handleTabOpen(selection)

    // expect new tab to be opened and active
    expect(tabs.value.length).toBe(2)
    expect(tabs.value[1].key).toBe(selection.key)
    expect(active.value).toBe(selection.key)
  })

  it('should switch to an already open tab when handleTabOpen is called with a tab that is already open', async () => {
    const { tabs, active, handleTabOpen } = useTabList()

    // open 2 tabs
    const selection1 = selections[0]
    const selection2 = selections[1]
    handleTabOpen(selection1)
    handleTabOpen(selection2)

    // expect tab 2 (most recent) to be active
    expect(tabs.value.length).toBe(3)
    expect(active.value).toBe(selection2.key)

    // now switch back to selection1
    handleTabOpen(selection1)

    // we did not open a new tab but switched back to selection1
    expect(tabs.value.length).toBe(3)
    expect(active.value).toBe(selection1.key)
  })

  it('should open a few possible tabs when handleTabOpen is called with each tab\'s data', async () => {
    const { tabs, active, handleTabOpen } = useTabList()

    for (const selection of selections) {
      handleTabOpen(selection)
      expect(active.value).toBe(selection.key)
    }

    expect(tabs.value.length).toBe(selections.length + 1) // +1 for home tab

    for (const tab of tabs.value) {
      const found = selections.find(s => s.key === tab.key) || (tab.key === 'home' ? tab : null)
      expect(found).toBeDefined()
    }
  })

  it('should close a tab when handleTabClose is called with the tab key', async () => {
    const { tabs, active, handleTabOpen, handleTabClose } = useTabList()

    // open 3 tabs
    const selection1 = selections[0]
    const selection2 = selections[1]
    const selection3 = selections[2]
    handleTabOpen(selection1)
    handleTabOpen(selection2)
    handleTabOpen(selection3)

    expect(tabs.value.length).toBe(4) // +1 for home tab

    // now close tab 2
    handleTabClose(selection2.key)

    expect(tabs.value.length).toBe(3)
    const foundTab2 = tabs.value.find(t => t.key === selection2.key)
    expect(foundTab2).toBeUndefined()
    // active tab should still be tab3 because it is most recent
    expect(active.value).toBe(selection3.key)
  })

  it('should switch to the home tab when all other tabs are closed', async () => {
    const { tabs, active, handleTabOpen, handleTabClose } = useTabList()

    // open 2 tabs
    const selection1 = selections[0]
    const selection2 = selections[1]
    handleTabOpen(selection1)
    handleTabOpen(selection2)

    expect(tabs.value.length).toBe(3) // +1 for home tab

    // now close tab 2
    handleTabClose(selection2.key)
    expect(tabs.value.length).toBe(2)

    // now close tab 1
    handleTabClose(selection1.key)
    expect(tabs.value.length).toBe(1)

    // active tab should now be home
    expect(active.value).toBe('home')
  })

  it('if tab 1 2 3 are open and tab 2 is active, when tab 2 is closed, tab 3 should become active', async () => {
    const { tabs, active, handleTabOpen, handleTabClose } = useTabList()

    // open 3 tabs
    const selection1 = selections[0]
    const selection2 = selections[1]
    const selection3 = selections[2]
    handleTabOpen(selection1)
    handleTabOpen(selection2)
    handleTabOpen(selection3)

    expect(tabs.value.length).toBe(4) // +1 for home tab

    // make tab 2 active
    active.value = selection2.key
    expect(active.value).toBe(selection2.key)

    // now close tab 2
    handleTabClose(selection2.key)
    expect(tabs.value.length).toBe(3)

    // active tab should now be tab3
    expect(active.value).toBe(selection3.key)
  })

  it('should not open a tab if the tabs component name can\'t be resolved (create collection node)', async () => {
    const { tabs, active, handleTabOpen } = useTabList()

    const invalidSelection = { key: 'wadwad', label: 'awdwad awdwad', component: 'adawdawd' }
    handleTabOpen(invalidSelection)

    // expect no new tab to be opened
    expect(tabs.value.length).toBe(1) // only home tab
    expect(active.value).toBe('home')
  })
})
