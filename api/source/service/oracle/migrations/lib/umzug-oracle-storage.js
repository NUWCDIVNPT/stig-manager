const oracledb = require('oracledb')

module.exports = class MyStorage {
  constructor(options) {
    this.pool = options.pool
    this.hasMigrationTable = false
  }

  async createMigrationTable () {
    let connection
    try {
      connection = await oracledb.getConnection()
      await connection.execute(`CREATE TABLE api_migrations (
        createdAt date default sysdate not null, 
        name VARCHAR2(128) 
      )`)
      this.hasMigrationTable = true
    }
    catch (err) {
      if (err.errorNum == 955) {
        console.log('Table API_MIGRATIONS exists, not creating again')
      }
      else {
        throw (err)
      }
    }
    finally {
      if (typeof connection !== 'undefined') {
        await connection.close()
      }
    }
  }

  async logMigration(migrationName) {
    // This function logs a migration as executed.
    // It will get called once a migration was
    // executed successfully.
    let connection
    try {
      if (!this.hasMigrationTable) {
        await this.createMigrationTable()
      }
      connection = await oracledb.getConnection()
      await connection.execute('INSERT into api_migrations (name) VALUES (:1)', [migrationName], {autoCommit: true})
    }
    catch (err) {
      throw (err)
    }
    finally {
      if (typeof connection !== 'undefined') {
        await connection.close()
      }
    }
  }

  async unlogMigration(migrationName) {
    // This function removes a previously logged migration.
    // It will get called once a migration has been reverted.
    let connection
    try {
      if (!this.hasMigrationTable) {
        await this.createMigrationTable()
      }
      connection = await oracledb.getConnection()
      await connection.execute('DELETE from api_migrations WHERE name = :1', [migrationName], {autoCommit: true})
    }
    catch (err) {
      throw (err)
    }
    finally {
      if (typeof connection !== 'undefined') {
        await connection.close()
      }
    }
  }

  async executed() {
    // This function lists the names of the logged
    // migrations. It will be used to calculate
    // pending migrations. The result has to be an
    // array with the names of the migration files.
    let connection
    try {
      if (!this.hasMigrationTable) {
        await this.createMigrationTable()
      }
      connection = await oracledb.getConnection()
      let result = await connection.execute('SELECT name from api_migrations')
      return result.rows.map(r => r[0])
    }
    catch (err) {
      throw (err)
    }
    finally {
      if (typeof connection !== 'undefined') {
        await connection.close()
      }
    }
  }
}