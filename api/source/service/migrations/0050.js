const MigrationHandler = require('./lib/MigrationHandler')

// Review Aging rules were accepted with any triggerInterval, including 0,
// which puts the cutoff at the time of the run so the rule matches every
// review in its target. The API now requires an interval of at least 3600
// seconds, the smallest value the client can express (one hour).
//
// Stored rules below the minimum are raised to 3600 seconds and disabled, so
// every row satisfies the new schema and the Owner can re-enable the rule
// from the client after reviewing it.
//
// The down migration is a no-op: there is no record of the previous interval
// or enabled state, and restoring them would resume the behavior this stops.

const upMigration = [
  `UPDATE review_aging_rule SET triggerInterval = 3600, enabled = 0 WHERE triggerInterval < 3600`
]

const downMigration = [
]

const migrationHandler = new MigrationHandler(upMigration, downMigration)
module.exports = {
  up: async (pool) => {
    await migrationHandler.up(pool, __filename)
  },
  down: async (pool) => {
    await migrationHandler.down(pool, __filename)
  }
}
