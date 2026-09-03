import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// The handler posts via the STIGMAN.oidcWorker global assigned in init.js
const postContextActiveMessage = vi.fn()

let activityHandler

beforeEach(async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
  postContextActiveMessage.mockClear()
  globalThis.STIGMAN = { oidcWorker: { postContextActiveMessage } }
  // fresh singleton per test: the module exports `new ActivityHandler()`
  vi.resetModules()
  activityHandler = (await import('./ActivityHandler.js')).default
})

afterEach(() => {
  activityHandler.remove()
  vi.useRealTimers()
})

function act(type = 'click') {
  window.dispatchEvent(type === 'keydown' ? new KeyboardEvent('keydown', { key: 'ArrowDown' }) : new Event(type))
}

describe('ActivityHandler', () => {
  it('posts nothing when add() is called before reportActivity is computed (init broadcast race)', () => {
    // init.js order on a fresh login: the worker's accessToken broadcast fires
    // bc.onmessage -> add() while the app is still awaiting getUserObject(),
    // and only afterwards does init.js compute the real reportActivity value
    activityHandler.add()
    activityHandler.reportActivity = false // idle timeout disabled for this user class
    activityHandler.add()
    act()
    expect(postContextActiveMessage).not.toHaveBeenCalled()
  })

  it('posts nothing by default (reportActivity must be opted into)', () => {
    activityHandler.add()
    act()
    expect(postContextActiveMessage).not.toHaveBeenCalled()
  })

  it('posts contextActive on activity when reportActivity is truthy', () => {
    activityHandler.reportActivity = 15 // init.js assigns the raw idleTimeout value
    activityHandler.add()
    act()
    expect(postContextActiveMessage).toHaveBeenCalledTimes(1)
  })

  it('stops posting if reportActivity is cleared after listeners attached', () => {
    activityHandler.reportActivity = 15
    activityHandler.add()
    act()
    activityHandler.reportActivity = false
    vi.advanceTimersByTime(2000)
    act()
    expect(postContextActiveMessage).toHaveBeenCalledTimes(1)
  })

  it('throttles posts to one per interval', () => {
    activityHandler.reportActivity = true
    activityHandler.add()
    act()
    act('scroll')
    vi.advanceTimersByTime(999)
    act()
    expect(postContextActiveMessage).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1)
    act()
    expect(postContextActiveMessage).toHaveBeenCalledTimes(2)
  })

  it('treats keydown (non-character keys) as activity', () => {
    activityHandler.reportActivity = true
    activityHandler.add()
    act('keydown')
    expect(postContextActiveMessage).toHaveBeenCalledTimes(1)
  })

  it('posts nothing after remove(), and add() re-attaches', () => {
    activityHandler.reportActivity = true
    activityHandler.add()
    activityHandler.remove()
    act()
    expect(postContextActiveMessage).not.toHaveBeenCalled()
    activityHandler.add()
    act()
    expect(postContextActiveMessage).toHaveBeenCalledTimes(1)
  })
})
