const logger = require('../utils/logger')
const auth = require('../utils/auth')
const db = require('../service/utils')
const { serializeError } = require('../utils/serializeError')
const state = require('../utils/state')

async function initializeDependencies() {
  try {
      await Promise.all([
          auth.initializeAuth(),
          db.initializeDatabase()
      ])
  } 
  catch (e) {
    logger.writeError('dependencies', 'fail', {message:'Unable to setup dependencies'})
    state.setState('fail')
  }
}

module.exports = {
  initializeDependencies
}
