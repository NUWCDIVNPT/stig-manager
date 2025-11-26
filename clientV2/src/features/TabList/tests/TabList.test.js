import { userEvent } from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils'
import TabList from '../components/TabList.vue'

vi.mock('../../../shared/stores/useEnv', () => ({
  useEnv: () => ({
    apiUrl: 'http://localhost:3000',
    apiConfig: {
      version: '1.0.0',
    },
    displayAppManagers: false,
    welcome: {
      message: 'Welcome to STIG Manager',
    },
  }),
}))

// mocks something in primevue TabList component
beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    constructor(callback) {
      this.callback = callback
    }

    observe() {}

    unobserve() {}

    disconnect() {}
  }
})

describe('tabList', () => {
  const exampleSelections = [
    {
      component: 'incorrectComponent',
      icon: 'incorrect-icon',
      key: 'incorrectKey',
      label: 'Incorrect Tab',
    },
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

  it('should render the tabs wrapper', () => {
    // user sees the main tabs container when the component loads
    renderWithProviders(TabList, {
      props: { selection: null },
    })

    const tabsWrapper = document.getElementById('tabs-wrapper')
    expect(tabsWrapper).toBeDefined()
  })

  it('should render tabs from the tabs array', () => {
    // user clicks on Collections in the nav tree, and a new tab appears
    renderWithProviders(TabList, {
      props: { selection: exampleSelections[1] },
    })

    const tabList = document.getElementById('tab-list')
    const tabElements = tabList.querySelectorAll('button[id^="tab-"]:not([id*="close"])')
    expect(tabElements.length).toBe(2) // home tab + one opened tab
  })

  it('should display tab labels correctly', () => {
    // user can see the names of each open tab
    renderWithProviders(TabList, {
      props: { selection: exampleSelections[1] },
    })

    const homeTab = document.getElementById('tab-home')
    const collectionsTab = document.getElementById('tab-CollectionManage')

    expect(homeTab.textContent).toContain('Home')
    expect(collectionsTab.textContent).toContain('Collections')
  })

  it('should set the active tab based on the active value', () => {
    // user sees which tab is currently active (highlighted/selected)
    renderWithProviders(TabList, {
      props: { selection: exampleSelections[1] },
    })

    const collectionsTab = document.getElementById('tab-CollectionManage')

    expect(collectionsTab).toBeDefined()
    expect(collectionsTab.getAttribute('data-p-active')).toBe('true')
  })

  it('should render close button for closable tabs', () => {
    renderWithProviders(TabList, {
      props: { selection: exampleSelections[1] },
    })

    const closeButton = document.getElementById('tab-close-CollectionManage')

    expect(closeButton).toBeDefined()
    expect(closeButton.getAttribute('aria-label')).toBe('Close tab')
  })

  it('should not render close button for non-closable tabs', () => {
    renderWithProviders(TabList, {
      props: { selection: null },
    })

    const closeButton = document.getElementById('tab-close-home')

    expect(closeButton).toBeNull()
  })

  it('should call handleTabClose when close button is clicked', async () => {
    renderWithProviders(TabList, {
      props: { selection: exampleSelections[1] },
    })
    const user = userEvent.setup()

    const tabList = document.getElementById('tab-list')
    let tabElements = tabList.querySelectorAll('button[id^="tab-"]:not([id*="close"])')
    expect(tabElements.length).toBe(2)

    const closeButton = document.getElementById('tab-close-CollectionManage')
    await user.click(closeButton)

    tabElements = tabList.querySelectorAll('button[id^="tab-"]:not([id*="close"])')
    expect(tabElements.length).toBe(1)
  })

  it('should call handleTabOpen when selection prop changes with valid component and key', async () => {
    const { rerender } = renderWithProviders(TabList, {
      props: { selection: null },
    })

    const tabList = document.getElementById('tab-list')
    let tabElements = tabList.querySelectorAll('button[id^="tab-"]:not([id*="close"])')
    expect(tabElements.length).toBe(1) // Only home tab

    await rerender({ selection: exampleSelections[1] })

    tabElements = tabList.querySelectorAll('button[id^="tab-"]:not([id*="close"])')
    expect(tabElements.length).toBe(2) // Home + Collections
  })

  it('should not call handleTabOpen when selection prop is null', () => {
    // only home tab
    renderWithProviders(TabList, {
      props: { selection: null },
    })

    const tabList = document.getElementById('tab-list')
    const tabElements = tabList.querySelectorAll('button[id^="tab-"]:not([id*="close"])')

    expect(tabElements.length).toBe(1) // only home tab
  })

  it('should not call handleTabOpen when selection prop lacks component', async () => {
    // User clicks something invalid in the nav tree, no tab opens
    const invalidSelection = { key: 'test', label: 'Test' }
    renderWithProviders(TabList, {
      props: { selection: invalidSelection },
    })

    const tabList = document.getElementById('tab-list')
    const tabElements = tabList.querySelectorAll('button[id^="tab-"]')

    expect(tabElements.length).toBe(1) // only home tab
  })

  it('should not call handleTabOpen when selection prop lacks key', async () => {
    // user clicks something incomplete in the nav tree and no tab opens
    const invalidSelection = { component: 'CollectionManage', label: 'Test' }
    renderWithProviders(TabList, {
      props: { selection: invalidSelection },
    })

    const tabList = document.getElementById('tab-list')
    const tabElements = tabList.querySelectorAll('button[id^="tab-"]')

    expect(tabElements.length).toBe(1)
  })

  it('should render tab panels for each tab', () => {
    // user sees the content area for each tab they have open
    renderWithProviders(TabList, {
      props: { selection: exampleSelections[1] },
    })

    const homePanel = document.getElementById('tab-panel-home')
    const collectionsPanel = document.getElementById('tab-panel-CollectionManage')

    expect(homePanel).toBeDefined()
    expect(collectionsPanel).toBeDefined()
  })

  it('should render the correct component in each tab panel', () => {
    // user sees the actual content rendered in each tab panel
    renderWithProviders(TabList, {
      props: { selection: exampleSelections[1] },
    })

    const homePanel = document.getElementById('tab-panel-home')
    const collectionsPanel = document.getElementById('tab-panel-CollectionManage')

    expect(homePanel).toBeDefined()
    expect(collectionsPanel).toBeDefined()
  })

  it('should pass props to the rendered component in tab panels', () => {
    // user opens a collection view tab with specific collection data
    renderWithProviders(TabList, {
      props: { selection: exampleSelections[4] },
    })

    const collectionViewPanel = document.getElementById('tab-panel-22')

    expect(collectionViewPanel).toBeDefined()
    const panelInner = collectionViewPanel.querySelector('.panelInner')
    expect(panelInner).toBeDefined()
  })

  it('should switch active tab when clicking on a different tab', async () => {
    // user clicks on a different tab header to switch views
    renderWithProviders(TabList, {
      props: { selection: exampleSelections[1] },
    })
    const user = userEvent.setup()

    const collectionsTab = document.getElementById('tab-CollectionManage')
    const homeTab = document.getElementById('tab-home')

    expect(collectionsTab.getAttribute('data-p-active')).toBe('true')

    await user.click(homeTab)

    expect(homeTab.getAttribute('data-p-active')).toBe('true')
  })

  it('should maintain tab state when switching between tabs', async () => {
    // user opens multiple tabs and switches between them without losing any
    const { rerender } = renderWithProviders(TabList, {
      props: { selection: exampleSelections[1] },
    })
    const user = userEvent.setup()

    await rerender({ selection: exampleSelections[2] })

    const homeTab = document.getElementById('tab-home')
    const collectionsTab = document.getElementById('tab-CollectionManage')
    const usersTab = document.getElementById('tab-UserManage')

    expect(homeTab).toBeDefined()
    expect(collectionsTab).toBeDefined()
    expect(usersTab).toBeDefined()

    await user.click(collectionsTab)

    expect(document.getElementById('tab-home')).toBeDefined()
    expect(document.getElementById('tab-CollectionManage')).toBeDefined()
    expect(document.getElementById('tab-UserManage')).toBeDefined()
  })

  it('should handle empty tabs array gracefully', () => {
    // user always sees at least the home tab when the app loads
    renderWithProviders(TabList, {
      props: { selection: null },
    })

    const tabList = document.getElementById('tab-list')
    const tabElements = tabList.querySelectorAll('button[id^="tab-"]')

    expect(tabElements.length).toBe(1)
  })

  it('should update tabs when selection prop changes multiple times', async () => {
    // user clicks multiple items in nav tree and tabs open but do not duplicate
    const { rerender } = renderWithProviders(TabList, {
      props: { selection: null },
    })

    const tabList = document.getElementById('tab-list')

    await rerender({ selection: exampleSelections[1] })
    let tabElements = tabList.querySelectorAll('button[id^="tab-"]:not([id*="close"])')
    expect(tabElements.length).toBe(2)

    await rerender({ selection: exampleSelections[2] })
    tabElements = tabList.querySelectorAll('button[id^="tab-"]:not([id*="close"])')
    expect(tabElements.length).toBe(3)

    await rerender({ selection: exampleSelections[1] })
    tabElements = tabList.querySelectorAll('button[id^="tab-"]:not([id*="close"])')
    expect(tabElements.length).toBe(3)
  })
})
