class ActivityHandler {
  #lastMessageTime = 0;
  #messageTime = 0;
  #messageThrottle = 1000; // 1 second

  #events = ['click', 'keypress', 'scroll'];
  #boundHandler = null;

  #logPrefix = '[ActivityHandler]';
  reportActivity = true;
  
  add() {
    if (!this.#boundHandler && this.reportActivity) {
      this.#boundHandler = this.throttledActiveMessage.bind(this);
      this.#events.forEach(event => {
        window.addEventListener(event, this.#boundHandler, true);
      });
      console.log(`${this.#logPrefix} activity event handlers added`);
    } 
  }

  remove() {
    if (this.#boundHandler) {
      this.#events.forEach(event => {
        window.removeEventListener(event, this.#boundHandler, true);
      });
      this.#boundHandler = null;
      console.log(`${this.#logPrefix} activity event handlers removed`);
    }
  }

  throttledActiveMessage() {
    this.#messageTime = Date.now();
    if (this.#messageTime - this.#lastMessageTime >= this.#messageThrottle) {
      window.oidcWorker.postContextActiveMessage();
      this.#lastMessageTime = this.#messageTime;
      console.log(`${this.#logPrefix} contextActive message posted to OIDC worker`);
    }
  }
}

SM.ActivityHandler = new ActivityHandler();
