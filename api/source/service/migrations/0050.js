const MigrationHandler = require('./lib/MigrationHandler')

// Review Aging rules were accepted with triggerInterval 0, which puts the
// cutoff at the time of the run, so the rule matches every review in its
// target. The API now requires an interval of at least 1 second. Disable any
// stored 0-second rules so they stop running; the interval is kept so the
// Owner can see the rule and correct it.
//
// The down migration is a no-op: there is no record of which rules were
// enabled before, and re-enabling them would resume the behavior this stops.

const upMigration = [
  `UPDATE review_aging_rule SET enabled = 0 WHERE triggerInterval < 1`
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
