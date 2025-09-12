const EventEmitter = require('events')
const logger = require('./logger')

/**
 * Represents the state of the API.
 * @typedef {'starting' | 'fail' | 'available' | 'unavailable' | 'stop'} StateString
 */

/**
 * @typedef {Object} DependencyStatus
 * @property {boolean} db - The status of the database dependency.
 * @property {boolean} oidc - The status of the OIDC dependency.
 */

/**
 * Class representing the state of the API.
 * @extends EventEmitter
 */
class State extends EventEmitter {
  /** @type {StateString} */
  #currentState
  
  /** @type {StateString} */
  #previousState
  
  /** @type {Date} */
  #stateDate

  /** @type {DependencyStatus} */
  #dependencyStatus

  /** @type {Object} */
  #dbPool

  /** @type {Object} */
  #endpoints

  /** @type {Number} */
  #changeTimeoutId


  /**
   * Creates an instance of State.
   * @param {Object} options - Options for initializing the state.
   * @param {StateString} [options.initialState='starting'] - The initial state of the API.
   */
  constructor({ 
    initialState = 'starting', 
    endpoints = { 
      ui: { 
        current: '/', 
        next: '' 
      } 
    } 
  } = {}) {
    super()
    this.#currentState = initialState
    this.#stateDate = new Date()
    this.#dependencyStatus = {
      db: false,
      oidc: false
    }
    this.#endpoints = endpoints
  }

  /**
   * Emits 'state-changed', passing the previous and current state and dependency status.
   * @private
   */
  #emitStateChangedEvent() {
    this.emit('state-changed', this.#currentState, this.#previousState, this.#dependencyStatus)
  }

  #emitDependencyChangeEvent() {
    this.emit('dependency-changed', this.#dependencyStatus)
  }

  /**
   * Sets the state based on the dependency status.
   * @private
   */
  #setStateFromDependencyStatus() {
    if (this.#dependencyStatus.db && this.#dependencyStatus.oidc) {
      this.setState('available')
    }
    else {
      this.setState(this.#currentState === 'starting' ? 'starting' : 'unavailable')
    }
  }

  /**
   * Sets the state to the provided state and emits state-changed event.
   * @param {StateString} state - The new state.
   */
  setState(state) {
    if (this.#currentState === state) return
    this.#previousState = this.#currentState
    this.#currentState = state
    this.#stateDate = new Date()
    this.#emitStateChangedEvent()
  }

  /**
   * Sets the status of the database dependency.
   * @param {boolean} status - The new status of the database dependency.
   */
  setDbStatus(status) {
    if (this.#dependencyStatus.db === status) return
    this.#dependencyStatus.db = status
    this.#emitDependencyChangeEvent()
    this.#setStateFromDependencyStatus()
  }

  /**
   * Sets the status of the OIDC dependency.
   * @param {boolean} status - The new status of the OIDC dependency.
   */
  setOidcStatus(status) {
    if (this.#dependencyStatus.oidc === status) return
    this.#dependencyStatus.oidc = status
    this.#emitDependencyChangeEvent()
    this.#setStateFromDependencyStatus()
  }

  /**
   * Gets the current state.
   * @type {StateString}
   * @readonly
   */
  get currentState() {
    return this.#currentState
  }

  /**
   * Gets the dependency status.
   * @type {DependencyStatus}
   * @readonly
   */
  get dependencyStatus() {
    return {...this.#dependencyStatus}
  }

  /**
   * Sets the database pool.
   * @param {Object} pool - The new database pool.
   */
  set dbPool(pool) {
    this.#dbPool = pool
  }

  /**
   * Gets the database pool.
   * @type {Object}
   * @readonly
   */
  get dbPool() {
    return this.#dbPool
  }

  /**
   * Gets the API state.
   * @type {Object}
   * @readonly
   */
  get apiState() {
    return {
      currentState: this.#currentState,
      since: this.#stateDate,
      dependencies: this.#dependencyStatus,
      endpoints: this.#endpoints,
    }
  }
}

const state = new State()
state.on('state-changed', async (currentState, previousState, dependencyStatus) => {
  logger.writeInfo('state','state-changed', {currentState, previousState, dependencyStatus})
  let exitCode = 0
  switch (currentState) {
    case 'fail':
      exitCode = 1
      logger.writeError('state','fail', {message:'Application failed', exitCode})
      process.exit(exitCode)
      break
    case 'stop':
      try {
        await state.dbPool?.end()
      }
      catch (err) {
        logger.writeError('state','stop', {message:'Error closing database pool', error: serializeError(err)})
      } 
      logger.writeInfo('state','stop', {message:'Application stopped', exitCode})
      process.exit(exitCode)
      break
  }
})

module.exports = state