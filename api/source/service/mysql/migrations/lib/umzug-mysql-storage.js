module.exports = class MyStorage {
  constructor(options) {
    this.pool = options.pool
    this.hasMigrationTable = false
  }

  async createMigrationTable () {
    try {
      await  this.pool.query(`CREATE TABLE IF NOT EXISTS _migrations (
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, 
        updatedAt DATETIME ON UPDATE CURRENT_TIMESTAMP, 
        name VARCHAR(128) 
      )`)
      this.hasMigrationTable = true
    }
    catch (err) {
      throw (err)
    }
  }

  async logMigration(migrationName) {
    // This function logs a migration as executed.
    // It will get called once a migration was
    // executed successfully.
    try {
      if (!this.hasMigrationTable) {
        this.createMigrationTable()
      }
      await this.pool.query('INSERT into _migrations (name) VALUES (?)', [migrationName])
    }
    catch (err) {
      throw (err)
    }
  }

  async unlogMigration(migrationName) {
    // This function removes a previously logged migration.
    // It will get called once a migration has been reverted.
    try {
      if (!this.hasMigrationTable) {
        this.createMigrationTable()
      }
      await this.pool.query('DELETE from _migrations WHERE name = ?', [migrationName])
    }
    catch (err) {
      throw (err)
    }
  }

  async executed() {
    // This function lists the names of the logged
    // migrations. It will be used to calculate
    // pending migrations. The result has to be an
    // array with the names of the migration files.
    try {
      if (!this.hasMigrationTable) {
        this.createMigrationTable()
      }
      let [rows] = await this.pool.query('SELECT name from _migrations')
      return rows.map(r => r.name)
    }
    catch (err) {
      throw (err)
    }
  }
}