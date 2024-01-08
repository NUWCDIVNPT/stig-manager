"use strict";

const path = require('path')
const logger = require('../../../utils/logger')

module.exports = class MigrationHandler {
    constructor(upCommands = [], downCommands = []) {
        this._upCommands = upCommands;
        this._downCommands = downCommands;
    }

    async up(pool, filename) {
        let connection
        let migrationName = path.basename(filename, '.js')
        try {
          logger.writeInfo('mysql', 'migration', {status: 'start', direction: 'up', name: migrationName })
          connection = await pool.getConnection()
          for (const statement of this._upCommands) {
            logger.writeInfo('mysql', 'migration', {status: 'running', name: migrationName, statement })
            await connection.query(statement)
          }
        }
        catch (e) {
          logger.writeError('mysql', 'migration', {status: 'error', name: migrationName, message: e.message })
          throw (e)
        }
        finally {
          await connection.release()
          logger.writeInfo('mysql', 'migration', {status: 'finish', name: migrationName })
        }
    }
      
    async down(pool, filename) {
        let connection
        let migrationName = path.basename(filename, '.js')
        try {
          logger.writeInfo('mysql', 'migration', {status: 'start', direction: 'down', name: migrationName })
          connection = await pool.getConnection()
          for (const statement of this._downCommands) {
            logger.writeInfo('mysql', 'migration', {status: 'running', name: migrationName, statement })
            await connection.query(statement)
          }
          await connection.release()
        }
        catch (e) {
          logger.writeError('mysql', 'migration', {status: 'error', name: migrationName, message: e.message })
          throw (e)
        }
        finally {
          await connection.release()
          logger.writeInfo('mysql', 'migration', {status: 'finish', name: migrationName })
        }
    }
}
