const state = require('../utils/state')
const logger = require('../utils/logger')

// This function sets up signal handlers for the process
// and listens for SIGINT, SIGTERM, and SIGHUP signals
module.exports.setupSignalHandlers = () => {
  const signals = ['SIGINT', 'SIGTERM', 'SIGHUP'];

  const signalHandler = (signal) => {
    logger.writeInfo('signals','signal', {signal})
    state.setState('stop')
  }

  for (const signal of signals) {
    process.on(signal, signalHandler)
  }
}
