import { fireEvent, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { renderWithProviders } from '../../../testUtils/utils.js'
import RowLinkIcon from '../RowLinkIcon.vue'

const Empty = { template: '<div />' }
const to = {
  name: 'collection-asset-review',
  params: { collectionId: 'c1', assetId: 'a1', benchmarkId: 'RHEL_9', revisionStr: 'V2R1' },
  query: { labelName: 'web' },
}

let router
let rowClick

// Stands in for a selectable grid row around the icon
function renderInRow(props) {
  const Row = defineComponent({
    setup: () => () => h('div', { onClick: rowClick }, [h(RowLinkIcon, { icon: 'shield.svg', title: 'Open Asset Review', ...props })]),
  })
  return renderWithProviders(Row, { global: { plugins: [router] } })
}

beforeEach(async () => {
  rowClick = vi.fn()
  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: Empty },
      { path: '/collection/:collectionId/asset/:assetId/stig/:benchmarkId/revision/:revisionStr', name: 'collection-asset-review', component: Empty },
    ],
  })
  await router.push('/')
  await router.isReady()
})

describe('rowLinkIcon', () => {
  it('renders a link to the resolved URL', () => {
    renderInRow({ to })
    const link = screen.getByTitle('Open Asset Review')
    expect(link.tagName).toBe('A')
    expect(link.getAttribute('href')).toBe(router.resolve(to).href)
  })

  it('renders nothing without a target', () => {
    renderInRow({ to: null })
    expect(screen.queryByTitle('Open Asset Review')).toBeNull()
  })

  it('navigates in place on a plain click without reaching the row', async () => {
    renderInRow({ to })
    await fireEvent.click(screen.getByTitle('Open Asset Review'))
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe(router.resolve(to).fullPath)
    expect(rowClick).not.toHaveBeenCalled()
  })

  it.each(['ctrlKey', 'metaKey', 'shiftKey'])('leaves a %s click to the browser', async (key) => {
    renderInRow({ to })
    const link = screen.getByTitle('Open Asset Review')
    // jsdom can't open the new tab; stop it trying after the link has seen the click
    link.addEventListener('click', e => e.preventDefault())
    await fireEvent.click(link, { [key]: true })
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('home')
    expect(rowClick).not.toHaveBeenCalled()
  })
})
