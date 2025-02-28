const EventEmitter = require('events')
const logger = require('./logger')

/**
 * Represents the state of the API.
 * @typedef {'starting' | 'fail' | 'available' | 'unavailable' | 'stop'} StateType
 */

/**
 * Represents the mode of the API.
 * @typedef {'normal' | 'maintenance'} ModeType
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
  /** @type {StateType} */
  #currentState
  
  /** @type {StateType} */
  #previousState
  
  /** @type {DependencyStatus} */
  #dependencyStatus

  /** @type {Object} */
  #dbPool

  /** @type {ModeType} */
  #mode

  /** @type {Date} */
  #stateDate

  /**
   * Creates an instance of State.
   * @param {Object} options - Options for initializing the state.
   * @param {StateType} [options.initialState='starting'] - The initial state of the API.
   * @param {ModeType} [options.initialMode='normal'] - The initial mode of the API.
   */
  constructor({ initialState = 'starting', initialMode = 'normal' } = {}) {
    super()
    this.#currentState = initialState
    this.#stateDate = new Date()
    this.#mode = initialMode
    this.#dependencyStatus = {
      db: false,
      oidc: false
    }
  }

  /**
   * Emits 'statechanged', passing the previous and current state and dependency status.
   * @private
   */
  #emitStateChangedEvent() {
    this.emit('statechanged', this.#currentState, this.#previousState, this.#dependencyStatus)
  }

  /**
   * Emits 'modechanged', passing the current mode.
   * @private
   */
  #emitModeChangedEvent() {
    this.emit('modechanged', this.#mode)
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
   * Sets the state to the provided state and emits statechanged event.
   * @param {StateType} state - The new state.
   */
  setState(state) {
    if (this.#currentState === state) return
    this.#previousState = this.#currentState
    this.#currentState = state
    this.#stateDate = new Date()
    this.#emitStateChangedEvent()
  }

  /**
   * Sets the mode to the provided mode and emits modechanged event.
   * @param {ModeType} mode - The new mode.
   * @private
   */
  #setMode(mode) {
    if (this.#mode === mode) return
    this.#mode = mode
    this.#emitModeChangedEvent()
  }

  /**
   * Sets the status of the database dependency.
   * @param {boolean} status - The new status of the database dependency.
   */
  setDbStatus(status) {
    if (this.#dependencyStatus.db === status) return
    this.#dependencyStatus.db = status
    this.#setStateFromDependencyStatus()
  }

  /**
   * Sets the status of the OIDC dependency.
   * @param {boolean} status - The new status of the OIDC dependency.
   */
  setOidcStatus(status) {
    if (this.#dependencyStatus.oidc === status) return
    this.#dependencyStatus.oidc = status
    this.#setStateFromDependencyStatus()
  }

  /**
   * Gets the current state.
   * @type {StateType}
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
   * Gets the current mode.
   * @type {ModeType}
   * @readonly
   */
  get currentMode() {
    return this.#mode
  }

  /**
   * Sets the current mode.
   * @param {ModeType} mode - The new mode.
   */
  set currentMode(mode) {
    this.#setMode(mode)
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
      state: this.#currentState,
      stateDate: this.#stateDate,
      mode: this.#mode,
      dependencies: this.#dependencyStatus
    }
  }
}

const state = new State()
state.on('statechanged', async (currentState, previousState, dependencyStatus) => {
  logger.writeInfo('state','statechanged', {currentState, previousState, dependencyStatus})
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