const EventEmitter = require('events')
const logger = require('./logger')

/**
 * Represents the state of the API.
 * @typedef {'starting' | 'fail' | 'available' | 'unavailable' | 'stop'} StateString
 */

/**
 * Represents the mode of the API.
 * @typedef {'normal' | 'maintenance'} ModeString
 */

/**
 * @typedef {Object} ModeScheduled
 * @property {ModeString} nextMode - The requested new mode of the API.
 * @property {string} nextMessage - The message to be associated with the new mode.
 * @property {string} requestedBy - The user ID of the user who made the request.
 * @property {Number} scheduledFor - The time in seconds to delay the mode change.
 * @property {string} message - An optional message associated with the new mode.
*/

/**
 * @typedef {Object} Mode
 * @property {ModeString} currentMode - The current mode of the API.
 * @property {Date} since - The time when the API entered the current mode.
 * @property {string} requestedBy - The user ID of the user who initiated the mode change.
 * @property {boolean} isLocked - Whether the mode is locked.
 * @property {string} message - An optional message associated with the mode.
 * @property {ModeScheduled} scheduled
*/

/**
 * @typedef {Object} DependencyStatus
 * @property {boolean} db - The status of the database dependency.
 * @property {boolean} oidc - The status of the OIDC dependency.
 */

/**
 * Class representing the state and mode of the API.
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

  /** @type {Mode} */
  #mode

  /** @type {Object} */
  #endpoints

  /** @type {Number} */
  #changeTimeoutId


  /**
   * Creates an instance of State.
   * @param {Object} options - Options for initializing the state.
   * @param {StateString} [options.initialState='starting'] - The initial state of the API.
   * @param {Mode} [options.initialMode='normal'] - The initial mode of the API.
   */
  constructor({ 
    initialState = 'starting', 
    initialMode = {currentMode: 'normal', since: new Date(), requestedBy: '', message: '', isLocked: false, scheduled: undefined}, 
    endpoints = { 
      ui: { 
        normal: '/', 
        maintenance: '/maintenance' 
      } 
    } 
  } = {}) {
    super()
    this.#currentState = initialState
    this.#stateDate = new Date()
    this.#mode = initialMode
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

  /**
   * Emits 'mode-changed', passing the current mode.
   * @private
   */
  #emitModeChangedEvent() {
    this.emit('mode-changed', this.#mode)
  }

  #emitModeScheduledEvent() {
    this.emit('mode-scheduled', this.#mode)
  }

  #emitModeUnscheduledEvent() {
    this.emit('mode-unscheduled', this.#mode)
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

  scheduleMode({ nextMode, nextMessage = '', requestedBy = '', scheduleIn, scheduledMessage = '', force = false }) {
    // clear any existing timer
    clearTimeout(this.#changeTimeoutId)
    if (scheduleIn > 0) {
      this.#mode.scheduled = { 
        nextMode, 
        nextMessage, 
        requestedBy, 
        scheduledFor: new Date(Date.now() + scheduleIn * 1000), 
        scheduledMessage, 
        force 
      }
      this.#changeTimeoutId = setTimeout(() => {
        this.setMode({ currentMode: nextMode, requestedBy, message: nextMessage, scheduled: undefined })
      }, scheduleIn * 1000)
      this.#emitModeScheduledEvent()
    }
  }

  cancelScheduledMode() {
    clearTimeout(this.#changeTimeoutId)
    this.#mode.scheduled = undefined
    this.#emitModeUnscheduledEvent()
  }

  /**
   * Sets the mode to the provided mode and emits mode-changed event.
   * @param {Mode} mode - The new mode.
   * @param {boolean} force - Whether to force the mode change.
   * @private
   */
  setMode(mode, force = false) {
    if (this.#mode.isLocked && !force) {
      return {success: false, error: 'Failed to change API mode. The mode is locked and force != true'}
    }
    this.#mode = {...mode, since: new Date()}
    this.#emitModeChangedEvent()
    return {success: true}
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

  lockMode() {
    const wasLocked = this.#mode.isLocked
    this.#mode.isLocked = true
    if (!wasLocked) this.#emitModeChangedEvent()
  }

  unlockMode() {
    const wasLocked = this.#mode.isLocked
    this.#mode.isLocked = false
    if (wasLocked) this.#emitModeChangedEvent()
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
   * Gets the current mode.
   * @type {Mode}
   * @readonly
   */
  get currentMode() {
    return this.#mode.currentMode
  }

  get mode() {
    return this.#mode
  }

  /**
   * Sets the mode.
   * @param {Mode} mode - The new mode.
   */
  set mode(mode) {
    this.#mode = mode
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
    const publicMode = {...this.#mode}
    delete publicMode.requestedBy
    if (publicMode.scheduled) delete publicMode.scheduled.requestedBy  
    return {
      currentState: this.#currentState,
      since: this.#stateDate,
      mode: publicMode,
      dependencies: this.#dependencyStatus,
      endpoints: {
        ui: this.#endpoints.ui[this.#mode.currentMode]
      },
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