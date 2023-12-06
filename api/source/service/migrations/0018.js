const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  `ALTER TABLE stig_asset_map ADD COLUMN maxTouchTs datetime`,
  `with source as (
    select
      sa.assetId,
      sa.benchmarkId,
      max(review.touchTs) as maxTouchTs
    from
      asset a
      left join stig_asset_map sa using (assetId)
      left join current_group_rule cgr using (benchmarkId)
      left join review on (cgr.ruleId=review.ruleId and review.assetId=sa.assetId)
    group by
      sa.assetId,
      sa.benchmarkId)
  update stig_asset_map sam
    inner join source on sam.assetId = source.assetId and source.benchmarkId = sam.benchmarkId
    set sam.maxTouchTs = source.maxTouchTs     
    `
  ]



const downMigration = [
  `ALTER TABLE stig_asset_map DROP COLUMN maxTouchTs`
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
