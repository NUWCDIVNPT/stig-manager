const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  // Update v_default_rev view to use enabled_asset instead of asset
  // This prevents disabled assets from contributing to default revision calculations
  `DROP VIEW IF EXISTS v_default_rev`,
  `CREATE VIEW v_default_rev AS
  SELECT DISTINCT
        a.collectionId AS collectionId,
        sa.benchmarkId AS benchmarkId,
        CASE WHEN crm.revId IS NOT NULL THEN crm.revId ELSE cr.revId END as revId,
        CASE WHEN crm.revId IS NOT NULL THEN 1 ELSE 0 END as revisionPinned
    FROM
        enabled_asset a
        INNER JOIN stig_asset_map sa ON a.assetId = sa.assetId
        LEFT JOIN current_rev cr ON sa.benchmarkId = cr.benchmarkId
        LEFT JOIN collection_rev_map crm ON (sa.benchmarkId = crm.benchmarkId AND a.collectionId = crm.collectionId)`
]

const downMigration = [
  // Revert to original v_default_rev view using asset table
  `DROP VIEW IF EXISTS v_default_rev`,
  `CREATE VIEW v_default_rev AS
  SELECT DISTINCT
        a.collectionId AS collectionId,
        sa.benchmarkId AS benchmarkId,
        CASE WHEN crm.revId IS NOT NULL THEN crm.revId ELSE cr.revId END as revId,
        CASE WHEN crm.revId IS NOT NULL THEN 1 ELSE 0 END as revisionPinned
    FROM
        asset a
        INNER JOIN stig_asset_map sa ON a.assetId = sa.assetId
        LEFT JOIN current_rev cr ON sa.benchmarkId = cr.benchmarkId
        LEFT JOIN collection_rev_map crm ON (sa.benchmarkId = crm.benchmarkId AND a.collectionId = crm.collectionId)`
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
