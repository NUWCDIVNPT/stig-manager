"use strict";

const path = require('path')

module.exports = class MigrationHandler {
    constructor(upCommands = [], downCommands = []) {
        this._upCommands = upCommands;
        this._downCommands = downCommands;
    }

    async up(pool, filename) {
        let connection
        try {
          let migrationName = path.basename(filename, '.js')
          console.log(`[DB] Running migration ${migrationName} UP`)
          connection = await pool.getConnection()
          for (const statement of this._upCommands) {
            console.log(`[DB] Execute: ${statement}`)
            await connection.query(statement)
          }
        }
        catch (e) {
          console.log(`[DB] Migration failed: ${e.message}`)
          throw (e)
        }
        finally {
          await connection.release()
        }
    }
      
    async down(pool, filename) {
        let connection
        try {
          let migrationName = path.basename(filename, '.js')
          console.log(`[DB] Running migration ${migrationName} DOWN`)
          connection = await pool.getConnection()
          for (const statement of this._downCommands) {
            console.log(`[DB] Execute: ${statement}`)
            await connection.query(statement)
          }
          await connection.release()
        }
        catch (e) {
          console.log(`[DB] Migration failed: ${e.message}`)
          throw (e)
        }
        finally {
          await connection.release()
        }
    }
}
