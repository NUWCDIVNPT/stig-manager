import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { mockRootFontSize, restoreRootFontSize } from '../../testUtils/rootFontSize.js'
import { useResizableHeight } from './useResizableHeight.js'

const KEY = 'test:height'
const ROOT_PX = 10

function setup(options = {}) {
  return useResizableHeight({ storageKey: KEY, defaultRem: 20, minRem: 10, maxRem: 40, ...options })
}

function pointer(clientY, extra = {}) {
  return { clientY, button: 0, pointerId: 1, preventDefault() {}, currentTarget: {}, ...extra }
}

function key(name) {
  const event = {
    key: name,
    prevented: false,
    preventDefault() {
      event.prevented = true
    },
  }
  return event
}

function drag(h, fromY, toY) {
  h.handleListeners.pointerdown(pointer(fromY))
  h.handleListeners.pointermove(pointer(toY))
  h.handleListeners.pointerup(pointer(toY))
}

describe('useResizableHeight', () => {
  beforeEach(() => {
    localStorage.clear()
    mockRootFontSize(ROOT_PX)
  })

  afterEach(restoreRootFontSize)

  describe('initial height', () => {
    it('is the default when nothing is stored', () => {
      expect(setup().heightRem.value).toBe(20)
    })

    it('is the stored height', () => {
      localStorage.setItem(KEY, '31.5')
      expect(setup().heightRem.value).toBe(31.5)
    })

    it('is the default when the stored value is not a number', () => {
      localStorage.setItem(KEY, 'tall')
      expect(setup().heightRem.value).toBe(20)
    })

    it('is raised to the minimum', () => {
      localStorage.setItem(KEY, '3')
      expect(setup().heightRem.value).toBe(10)
    })

    it('keeps a stored height above the current maximum', () => {
      localStorage.setItem(KEY, '60')
      expect(setup().heightRem.value).toBe(60)
    })
  })

  describe('arrow keys', () => {
    it('step by 1rem and store the height', () => {
      const h = setup()
      h.handleListeners.keydown(key('ArrowDown'))
      expect(h.heightRem.value).toBe(21)
      expect(localStorage.getItem(KEY)).toBe('21')

      h.handleListeners.keydown(key('ArrowUp'))
      h.handleListeners.keydown(key('ArrowUp'))
      expect(h.heightRem.value).toBe(19)
      expect(localStorage.getItem(KEY)).toBe('19')
    })

    it('are reversed when inverted', () => {
      const h = setup({ inverted: true })
      h.handleListeners.keydown(key('ArrowUp'))
      expect(h.heightRem.value).toBe(21)
      h.handleListeners.keydown(key('ArrowDown'))
      h.handleListeners.keydown(key('ArrowDown'))
      expect(h.heightRem.value).toBe(19)
    })

    it('stop at the minimum and the maximum', () => {
      localStorage.setItem(KEY, '10')
      const low = setup()
      low.handleListeners.keydown(key('ArrowUp'))
      expect(low.heightRem.value).toBe(10)

      localStorage.setItem(KEY, '40')
      const high = setup()
      high.handleListeners.keydown(key('ArrowDown'))
      expect(high.heightRem.value).toBe(40)
    })

    it('shrink on the first press when the stored height is above the maximum', () => {
      localStorage.setItem(KEY, '60')
      const h = setup()
      h.handleListeners.keydown(key('ArrowUp'))
      expect(h.heightRem.value).toBe(39)
      expect(localStorage.getItem(KEY)).toBe('39')
    })

    it('prevent the default action; other keys are left alone', () => {
      const h = setup()
      const arrow = key('ArrowDown')
      const tab = key('Tab')
      h.handleListeners.keydown(arrow)
      h.handleListeners.keydown(tab)
      expect(arrow.prevented).toBe(true)
      expect(tab.prevented).toBe(false)
      expect(h.heightRem.value).toBe(21)
    })
  })

  describe('a maximum that changes', () => {
    it('is read on every change', () => {
      const max = ref(40)
      const h = setup({ maxRem: max })
      max.value = 25
      drag(h, 0, 1000)
      expect(h.heightRem.value).toBe(25)

      max.value = 30
      h.handleListeners.keydown(key('ArrowDown'))
      expect(h.heightRem.value).toBe(26)
    })

    it('accepts a getter', () => {
      const h = setup({ maxRem: () => 22 })
      drag(h, 0, 1000)
      expect(h.heightRem.value).toBe(22)
    })

    it('rounds down to a tenth of a rem', () => {
      const h = setup({ maxRem: () => 33.37 })
      drag(h, 0, 1000)
      expect(h.heightRem.value).toBe(33.3)
    })

    it('gives way to the minimum when it is smaller', () => {
      const h = setup({ maxRem: () => 5 })
      h.handleListeners.keydown(key('ArrowDown'))
      expect(h.heightRem.value).toBe(10)
    })
  })

  describe('dragging', () => {
    it('down grows and up shrinks, in rem', () => {
      const h = setup()
      drag(h, 100, 150)
      expect(h.heightRem.value).toBe(25)
      drag(h, 150, 80)
      expect(h.heightRem.value).toBe(18)
    })

    it('up grows when inverted', () => {
      const h = setup({ inverted: true })
      drag(h, 100, 50)
      expect(h.heightRem.value).toBe(25)
    })

    it('reads inverted at the time of the drag', () => {
      const inverted = ref(false)
      const h = setup({ inverted })
      inverted.value = true
      drag(h, 100, 70)
      expect(h.heightRem.value).toBe(23)
    })

    it('rounds to a tenth of a rem', () => {
      const h = setup()
      drag(h, 0, 13.4)
      expect(h.heightRem.value).toBe(21.3)
    })

    it('stops at the minimum and the maximum', () => {
      const h = setup()
      drag(h, 0, -1000)
      expect(h.heightRem.value).toBe(10)
      drag(h, 0, 1000)
      expect(h.heightRem.value).toBe(40)
    })

    it('starts from the rendered height when the element is bound', () => {
      localStorage.setItem(KEY, '60')
      const h = setup()
      // A stylesheet cap is showing the element at 30rem
      h.targetEl.value = { getBoundingClientRect: () => ({ height: 30 * ROOT_PX }) }
      drag(h, 100, 80)
      expect(h.heightRem.value).toBe(28)
    })

    it('stores the height when the drag ends, not while it moves', () => {
      const h = setup()
      h.handleListeners.pointerdown(pointer(0))
      h.handleListeners.pointermove(pointer(30))
      expect(h.heightRem.value).toBe(23)
      expect(localStorage.getItem(KEY)).toBeNull()

      h.handleListeners.pointerup(pointer(30))
      expect(localStorage.getItem(KEY)).toBe('23')
    })

    it('ends on pointercancel', () => {
      const h = setup()
      h.handleListeners.pointerdown(pointer(0))
      h.handleListeners.pointermove(pointer(30))
      h.handleListeners.pointercancel(pointer(30))
      expect(localStorage.getItem(KEY)).toBe('23')

      h.handleListeners.pointermove(pointer(90))
      expect(h.heightRem.value).toBe(23)
    })

    it('captures the pointer on the handle', () => {
      const h = setup()
      const captured = []
      h.handleListeners.pointerdown(pointer(0, { pointerId: 7, currentTarget: { setPointerCapture: id => captured.push(id) } }))
      expect(captured).toEqual([7])
    })

    it('ignores pointer moves with no drag in progress', () => {
      const h = setup()
      h.handleListeners.pointermove(pointer(500))
      h.handleListeners.pointerup(pointer(500))
      expect(h.heightRem.value).toBe(20)
      expect(localStorage.getItem(KEY)).toBeNull()
    })

    it('ignores buttons other than the primary one', () => {
      const h = setup()
      h.handleListeners.pointerdown(pointer(0, { button: 2 }))
      h.handleListeners.pointermove(pointer(50))
      expect(h.heightRem.value).toBe(20)
    })
  })

  describe('double-click', () => {
    it('restores and stores the default', () => {
      localStorage.setItem(KEY, '35')
      const h = setup()
      h.handleListeners.dblclick()
      expect(h.heightRem.value).toBe(20)
      expect(localStorage.getItem(KEY)).toBe('20')
    })

    it('holds the default to the maximum', () => {
      const h = setup({ maxRem: () => 15 })
      h.handleListeners.dblclick()
      expect(h.heightRem.value).toBe(15)
    })
  })
})
