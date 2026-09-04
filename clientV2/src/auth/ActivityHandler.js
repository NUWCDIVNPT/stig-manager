// Ported from client/src/js/SM/ActivityHandler.js
// Throttle-posts `contextActive` to the shared OIDC worker on real user
// activity so the worker keeps the session/token alive while the user is present.
class ActivityHandler {
  #lastMessageTime = 0
  #messageTime = 0
  #messageThrottle = 1000 // 1 second

  // keydown, not keypress: keypress never fires for arrows/Tab/Delete/modifiers,
  // so keyboard-only navigation would read as idle
  #events = ['click', 'keydown', 'scroll']
  #boundHandler = null

  #logPrefix = '[ActivityHandler]'
  // false until init.js computes the real value from the idle-timeout config;
  // the worker's accessToken broadcast can call add() before that happens
  reportActivity = false

  add() {
    if (!this.#boundHandler && this.reportActivity) {
      this.#boundHandler = this.throttledActiveMessage.bind(this)
      this.#events.forEach((event) => {
        window.addEventListener(event, this.#boundHandler, true)
      })
      console.log(`${this.#logPrefix} activity event handlers added`)
    }
  }

  remove() {
    if (this.#boundHandler) {
      this.#events.forEach((event) => {
        window.removeEventListener(event, this.#boundHandler, true)
      })
      this.#boundHandler = null
      console.log(`${this.#logPrefix} activity event handlers removed`)
    }
  }

  throttledActiveMessage() {
    if (!this.reportActivity) return
    this.#messageTime = Date.now()
    if (this.#messageTime - this.#lastMessageTime >= this.#messageThrottle) {
      STIGMAN.oidcWorker.postContextActiveMessage()
      this.#lastMessageTime = this.#messageTime
      console.log(`${this.#logPrefix} contextActive message posted to OIDC worker`)
    }
  }
}

export default new ActivityHandler()
