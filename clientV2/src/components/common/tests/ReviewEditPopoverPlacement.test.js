import { fireEvent, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h, ref } from 'vue'
import { mockRootFontSize, restoreRootFontSize } from '../../../testUtils/rootFontSize.js'
import { renderWithProviders } from '../../../testUtils/utils.js'

import ReviewEditPopover from '../ReviewEditPopover.vue'

// Where the box goes: above or below the row, how tall it may get, and where
// it sits across the grid. jsdom has no layout, so the Popover is a stand-in
// that exposes its container, and every rect and size is supplied below.
vi.mock('primevue/popover', async () => {
  const { ref } = await import('vue')
  return {
    default: {
      name: 'Popover',
      emits: ['hide', 'show'],
      setup(props, { expose, emit }) {
        const container = ref(null)
        const visible = ref(false)
        const show = () => {
          visible.value = true
          emit('show')
        }
        const hide = () => {
          visible.value = false
          emit('hide')
        }
        expose({ container, visible, show, hide, toggle: () => (visible.value ? hide() : show()) })
        return { container }
      },
      template: '<div ref="container" data-testid="popover-box"><slot /></div>',
    },
  }
})

vi.mock('primevue/textarea', () => ({
  default: { name: 'Textarea', template: '<textarea />' },
}))

vi.mock('../ReviewResources/ReviewResources.vue', () => ({
  default: { name: 'ReviewResources', template: '<div data-testid="mock-review-resources" />' },
}))

const ROOT_PX = 12
// Five History rows plus chrome at a 12px root: (8.25 + 5 * 3.05) * 12
const RESOURCES_PX = 282
const BOX_WIDTH = 1080
// Padding and border of the box around its content
const BOX_CHROME = 26
const VIEWPORT_WIDTH = 1600
const HEIGHT_KEY = 'stigman:reviewPopoverMainHeight'

const rect = (top, left, width, height) => ({ top, left, width, height, bottom: top + height, right: left + width })

describe('reviewEditPopover placement', () => {
  const originalInnerHeight = window.innerHeight
  let boxHeight
  let rowRect
  let gridRect
  let observers
  let popoverRef

  beforeEach(() => {
    localStorage.removeItem(HEIGHT_KEY)
    mockRootFontSize(ROOT_PX)
    window.innerHeight = 1000
    boxHeight = 400
    rowRect = rect(100, 0, 1500, 30)
    gridRect = null
    observers = []
    popoverRef = ref(null)

    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(VIEWPORT_WIDTH)
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function () {
      return this.dataset.testid === 'popover-box' ? boxHeight : 0
    })
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function () {
      if (this.dataset.testid === 'popover-box') {
        return BOX_WIDTH
      }
      return this.classList.contains('review-edit-popover') ? BOX_WIDTH - BOX_CHROME : 0
    })
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
      if (this.tagName === 'TR') {
        return rowRect
      }
      if (this.classList.contains('p-datatable')) {
        return gridRect
      }
      // The hidden anchor is positioned with inline styles; lay it out from them
      if (this.style.position === 'fixed') {
        return rect(Number.parseFloat(this.style.top), Number.parseFloat(this.style.left), 0, Number.parseFloat(this.style.height))
      }
      return rect(0, 0, 0, 0)
    })
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback) {
        this.callback = callback
        this.observed = []
        this.disconnected = false
        observers.push(this)
      }

      observe(el) {
        this.observed.push(el)
      }

      disconnect() {
        this.disconnected = true
      }
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    restoreRootFontSize()
    window.innerHeight = originalInnerHeight
    document.body.querySelectorAll('[data-fixture]').forEach(el => el.remove())
  })

  function mount(props = {}) {
    renderWithProviders({
      render: () => h(ReviewEditPopover, {
        ref: popoverRef,
        selectedRuleId: 'V-123',
        collectionId: 'coll-1',
        assetId: 'asset-1',
        accessMode: 'rw',
        currentReview: { result: 'fail', detail: 'Detail', comment: 'Comment', status: { label: 'saved' } },
        ...props,
      }),
    })
  }

  // A grid row to click. `grid` puts it inside a DataTable with that rect.
  function makeRow({ grid = null } = {}) {
    const table = document.createElement('table')
    table.dataset.fixture = ''
    table.innerHTML = '<tbody><tr><td>cell</td></tr></tbody>'
    if (grid) {
      gridRect = grid
      const wrapper = document.createElement('div')
      wrapper.className = 'p-datatable'
      wrapper.dataset.fixture = ''
      wrapper.append(table)
      document.body.append(wrapper)
    }
    else {
      document.body.append(table)
    }
    return table.querySelector('td')
  }

  async function clickRow({ top = 100, clickX = 800, grid = null, isSameRow = false, cell = null } = {}) {
    rowRect = rect(top, 0, 1500, 30)
    popoverRef.value.openForRow({ target: cell ?? makeRow({ grid }), clientX: clickX }, isSameRow)
    await flushPromises()
  }

  const box = () => screen.getByTestId('popover-box')
  const maxHeight = () => box().style.getPropertyValue('--sm-popover-max-height')
  const isFlipped = () => box().classList.contains('p-popover-flipped')
  const mainHeight = () => document.querySelector('.review-edit-popover__main').style.getPropertyValue('--sm-main-height')

  describe('above or below the row', () => {
    it('opens below a row with room for the box and Review Resources', async () => {
      mount()
      await clickRow({ top: 100 })

      expect(isFlipped()).toBe(false)
      expect(box().style.top).toBe('130px')
      expect(box().style.transformOrigin).toBe('top')
    })

    it('opens above when Review Resources would not fit below and there is more room above', async () => {
      mount()
      // Room below is 1000 - 630 - 20 = 350: enough for nothing but the closed box
      await clickRow({ top: 600 })

      expect(isFlipped()).toBe(true)
      expect(box().style.top).toBe('200px') // row top less the box height
      expect(box().style.transformOrigin).toBe('bottom')
    })

    it('stays below when the box would not fit but below is the roomier side', async () => {
      mount()
      // Room below 550, above 380; the box can reach 400 + 282
      await clickRow({ top: 400 })

      expect(isFlipped()).toBe(false)
      expect(box().style.top).toBe('430px')
    })

    it('stays below when it fits there, even with more room above', async () => {
      window.innerHeight = 2000
      mount()
      // Room below 950 holds the 682 the box can reach; room above is 980
      await clickRow({ top: 1000 })

      expect(isFlipped()).toBe(false)
    })

    it('counts the Review Resources panel once when it is already open', async () => {
      window.innerHeight = 1350
      mount()
      await fireEvent.click(screen.getByText('Review Resources'))
      boxHeight = 400 + RESOURCES_PX
      // Room below is 700: the open box fits; counted twice it would not
      await clickRow({ top: 600 })

      expect(isFlipped()).toBe(false)
    })

    it('does not move to the other side when Review Resources is opened', async () => {
      mount()
      await clickRow({ top: 600 })
      expect(isFlipped()).toBe(true)

      await fireEvent.click(screen.getByText('Review Resources'))
      boxHeight = 400 + RESOURCES_PX
      observers.at(-1).callback()

      expect(isFlipped()).toBe(true)
      expect(box().style.top).toBe('0px') // 600 - 682, held on screen
    })

    it('re-decides when another row is clicked while open', async () => {
      mount()
      await clickRow({ top: 600 })
      expect(isFlipped()).toBe(true)

      await clickRow({ top: 100 })

      expect(isFlipped()).toBe(false)
      expect(box().style.top).toBe('130px')
    })
  })

  describe('height limit', () => {
    it('is the room below the row for a box below', async () => {
      mount()
      await clickRow({ top: 100 })
      expect(maxHeight()).toBe('850px') // 1000 - 130 - 20
    })

    it('is the room above the row for a flipped box', async () => {
      mount()
      await clickRow({ top: 600 })
      expect(maxHeight()).toBe('580px') // 600 - 20
    })

    it('does not go under 200px on a cramped side', async () => {
      window.innerHeight = 300
      mount()
      await clickRow({ top: 100 })

      expect(isFlipped()).toBe(false)
      expect(maxHeight()).toBe('200px')
    })

    it('reserves the Review Resources height: five History rows', async () => {
      mount()
      await clickRow()
      expect(box().style.getPropertyValue('--sm-resources-height')).toBe(`${RESOURCES_PX}px`)
    })

    it('reserves less for Review Resources on a short viewport', async () => {
      window.innerHeight = 500
      mount()
      await clickRow()
      expect(box().style.getPropertyValue('--sm-resources-height')).toBe('225px') // 45% of 500
    })

    it('never reserves under 200px for Review Resources', async () => {
      window.innerHeight = 300
      mount()
      await clickRow()
      expect(box().style.getPropertyValue('--sm-resources-height')).toBe('200px')
    })
  })

  describe('across the grid', () => {
    const left = () => box().style.insetInlineStart
    const arrowLeft = () => box().style.getPropertyValue('--sm-popover-arrow-left')

    it('centres on the click, with the arrow on the click', async () => {
      mount()
      await clickRow({ clickX: 800 })

      expect(left()).toBe('260px') // 800 - 1080 / 2
      expect(arrowLeft()).toBe('530px') // 10px arrow half-width left of the click
    })

    it('keeps a gutter from the left edge of the viewport', async () => {
      mount()
      await clickRow({ clickX: 100 })

      expect(left()).toBe('12px')
      expect(arrowLeft()).toBe('78px')
    })

    it('keeps a gutter from the right edge of the viewport', async () => {
      mount()
      await clickRow({ clickX: 1500 })

      expect(left()).toBe('508px') // 1600 - 12 - 1080
      expect(arrowLeft()).toBe('982px')
    })

    it('stays left of the right edge of the grid', async () => {
      mount()
      await clickRow({ clickX: 1200, grid: rect(0, 0, 1300, 900) })

      expect(left()).toBe('220px') // 1300 - 1080
      expect(arrowLeft()).toBe('970px')
    })

    it('uses the viewport edge when the grid runs past it', async () => {
      mount()
      await clickRow({ clickX: 1500, grid: rect(0, 0, 2400, 900) })

      expect(left()).toBe('508px')
    })

    it('sits at the left gutter when the grid is narrower than the box', async () => {
      mount()
      await clickRow({ clickX: 700, grid: rect(0, 300, 600, 900) })

      expect(left()).toBe('12px')
    })
  })

  describe('width limit', () => {
    const maxWidth = () => box().style.getPropertyValue('--sm-popover-max-width')

    it('gives the stylesheet a width that follows the window up to 1920px', () => {
      mount()
      const style = document.querySelector('.review-edit-popover').style
      expect(style.getPropertyValue('--sm-popover-width-max')).toBe('98rem')
      expect(style.getPropertyValue('--sm-popover-width-min')).toBe('84rem')
      // 98rem is 1176px at a 12px root, which is 61.25% of 1920px
      expect(style.getPropertyValue('--sm-popover-width-fluid')).toBe('61.25vw')
    })

    it('is the viewport less its gutters when the row is in no grid', async () => {
      mount()
      await clickRow()
      expect(maxWidth()).toBe('1550px') // 1600 - 2 * 12, less the box's own 26
    })

    it('fits the box to a grid inside the viewport', async () => {
      mount()
      await clickRow({ grid: rect(0, 300, 1000, 900) })
      expect(maxWidth()).toBe('974px') // 1000 - 26
    })

    it('stops at the viewport gutters for a grid that runs past them', async () => {
      mount()
      await clickRow({ grid: rect(0, 0, 2400, 900) })
      expect(maxWidth()).toBe('1550px')
    })

    it('does not go under 60rem for a narrower grid', async () => {
      mount()
      await clickRow({ grid: rect(0, 300, 600, 900) })
      expect(maxWidth()).toBe('720px') // 60rem at a 12px root
    })

    it('is set before the box is measured for the flip', async () => {
      const seen = []
      mount()
      vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function () {
        if (this.dataset.testid === 'popover-box') {
          seen.push(this.style.getPropertyValue('--sm-popover-max-width'))
          return boxHeight
        }
        return 0
      })
      await clickRow({ grid: rect(0, 300, 1000, 900) })
      expect(seen[0]).toBe('974px')
    })
  })

  describe('following the box height', () => {
    it('watches the container in place of PrimeVue', async () => {
      mount()
      await clickRow()

      expect(observers.at(-1).observed).toEqual([box()])
    })

    it('a flipped box grows upward from the row', async () => {
      mount()
      await clickRow({ top: 600 })
      expect(box().style.top).toBe('200px')

      boxHeight = 500
      observers.at(-1).callback()

      expect(box().style.top).toBe('100px')
    })

    it('a box below the row keeps its top edge on the row', async () => {
      mount()
      await clickRow({ top: 100 })

      boxHeight = 600
      observers.at(-1).callback()

      expect(box().style.top).toBe('130px')
    })

    it('stops watching when the popover closes', async () => {
      mount()
      await clickRow()
      const observer = observers.at(-1)

      popoverRef.value.hide()
      await flushPromises()

      expect(observer.disconnected).toBe(true)
    })
  })

  describe('resize handle', () => {
    function dragHandle(fromY, toY) {
      const handle = screen.getByRole('separator')
      for (const [type, clientY] of [['pointerdown', fromY], ['pointermove', toY], ['pointerup', toY]]) {
        handle.dispatchEvent(new MouseEvent(type, { clientY, button: 0, bubbles: true, cancelable: true }))
      }
      return flushPromises()
    }

    it('sits under the fields of a box below its row, and dragging down grows them', async () => {
      mount({ subjectLabel: 'Asset-01' })
      await clickRow({ top: 100 })

      const handle = screen.getByRole('separator')
      expect(handle.closest('.review-edit-popover__subject')).toBeNull()
      expect(handle).not.toHaveClass('review-edit-popover__resize-handle--top')

      await dragHandle(300, 324)
      expect(mainHeight()).toBe('22rem') // 20 + 24px / 12px
      expect(localStorage.getItem(HEIGHT_KEY)).toBe('22')
    })

    it('moves into the subject strip of a flipped box, and dragging up grows the fields', async () => {
      mount({ subjectLabel: 'Asset-01' })
      await clickRow({ top: 600 })

      const handles = screen.getAllByRole('separator')
      expect(handles).toHaveLength(1)
      expect(handles[0].closest('.review-edit-popover__subject')).not.toBeNull()

      await dragHandle(300, 276)
      expect(mainHeight()).toBe('22rem')
    })

    it('goes to the top edge of a flipped box with no subject strip', async () => {
      mount()
      await clickRow({ top: 600 })

      expect(screen.getByRole('separator')).toHaveClass('review-edit-popover__resize-handle--top')

      await dragHandle(300, 276)
      expect(mainHeight()).toBe('22rem')
    })

    it('arrow keys follow the edge that moves: up grows a flipped box', async () => {
      mount()
      await clickRow({ top: 600 })

      await fireEvent.keyDown(screen.getByRole('separator'), { key: 'ArrowUp' })
      expect(mainHeight()).toBe('21rem')
    })

    it('a drag stops at 40% of the viewport height', async () => {
      mount()
      await clickRow({ top: 100 })

      await dragHandle(300, 900)
      expect(mainHeight()).toBe('33.3rem') // 400px at a 12px root
    })
  })
})
