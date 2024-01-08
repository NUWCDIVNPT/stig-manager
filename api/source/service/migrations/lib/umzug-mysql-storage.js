module.exports = class MyStorage {
  constructor(options) {
    this.pool = options.pool
    this.hasMigrationTable = false
  }

  async createMigrationTable () {
    await  this.pool.query(`CREATE TABLE IF NOT EXISTS _migrations (
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, 
      updatedAt DATETIME ON UPDATE CURRENT_TIMESTAMP, 
      name VARCHAR(128) 
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`)
    this.hasMigrationTable = true
  }

  async logMigration(migrationName) {
    // This function logs a migration as executed.
    // It will get called once a migration was
    // executed successfully.
    if (!this.hasMigrationTable) {
      await this.createMigrationTable()
    }
    await this.pool.query('INSERT into _migrations (name) VALUES (?)', [migrationName])
  }

  async unlogMigration(migrationName) {
    // This function removes a previously logged migration.
    // It will get called once a migration has been reverted.
    if (!this.hasMigrationTable) {
      await this.createMigrationTable()
    }
    await this.pool.query('DELETE from _migrations WHERE name = ?', [migrationName])
  }

  async executed() {
    // This function lists the names of the logged
    // migrations. It will be used to calculate
    // pending migrations. The result has to be an
    // array with the names of the migration files.
    if (!this.hasMigrationTable) {
      await this.createMigrationTable()
    }
    let [rows] = await this.pool.query('SELECT name from _migrations')
    return rows.map(r => r.name)
  }
}