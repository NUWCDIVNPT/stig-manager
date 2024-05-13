const logger = require('../../utils/logger')
const path = require('node:path')

const migrationName = path.basename(__filename, '.js')

const upFn = async (pool, migrationName) => {
  const [cols] = await pool.query('SHOW COLUMNS FROM stig_asset_map')
  const colNames = cols.map(row => row.Field)
  const colStatements = []
  if (!colNames.includes('resultEngines')) {
    colStatements.push(`ALTER TABLE stig_asset_map ADD COLUMN resultEngines JSON NULL`)
  }
  if (!colNames.includes('users')) {
    colStatements.push(`ALTER TABLE stig_asset_map ADD COLUMN users JSON NULL`)
  }
  if (!colNames.includes('statusUsers')) {
    colStatements.push(`ALTER TABLE stig_asset_map ADD COLUMN statusUsers JSON NULL`)
  }
  for (const statement of colStatements) {
    logger.writeInfo('mysql', 'migration', {status: 'running', name: migrationName, statement })
    await pool.query(statement)
  }
  const sqlUpdateStigAssetMap = `with reviewProps as (
    select
      review.assetId,
      dr.benchmarkId,
      review.userId,
      udUser.username,
      review.statusUserId,
      udStatusUser.username as statusUsername,
      review.reProduct,
      json_unquote(json_extract(review.resultEngine,'$.version')) as reVersion
    from
      asset a
      left join stig_asset_map sa using (assetId)
      left join default_rev dr on (sa.benchmarkId = dr.benchmarkId and a.collectionId = dr.collectionId)
      left join rev_group_rule_map rgr on dr.revId = rgr.revId
      left join rule_version_check_digest rvcd on rgr.ruleId = rvcd.ruleId
      inner join review on (rvcd.version=review.version and rvcd.checkDigest=review.checkDigest and review.assetId=sa.assetId)
      left join user_data udUser on review.userId = udUser.userId
      left join user_data udStatusUser on review.statusUserId = udStatusUser.userId
    ),
  reCount as (
    select
      assetId,
      benchmarkId,
      reProduct,
      reVersion,
      count(*) as reviewCount
    from
      reviewProps
    where
	    reProduct is not null
    group by
      assetId,
      benchmarkId,
      reProduct,
      reVersion
  ),
  reJson as (
    select
      assetId,
      benchmarkId,
      json_arrayagg(json_object('product', reProduct, 'version', reVersion, 'reviewCount', reviewCount)) as resultEngines
    from
      reCount
    group by
      assetId,
      benchmarkId
  ),
  userCount as (
    select
      assetId,
      benchmarkId,
      userId,
      username,
      count(*) as reviewCount
    from
      reviewProps
    group by
      assetId,
      benchmarkId,
      userId,
      username
  ),
  userJson as (
    select
      assetId,
      benchmarkId,
      json_arrayagg(json_object('userId', cast(userId as char), 'username', username, 'reviewCount', reviewCount)) as users
    from
      userCount
    group by
      assetId,
      benchmarkId
  ),
  statusUserCount as (
    select
      assetId,
      benchmarkId,
      statusUserId,
      statusUsername,
      count(*) as reviewCount
    from
      reviewProps
    group by
      assetId,
      benchmarkId,
      statusUserId,
      statusUsername
  ),
  statusUserJson as (
    select
      assetId,
      benchmarkId,
      json_arrayagg(json_object('userId', cast(statusUserId as char), 'username', statusUsername, 'reviewCount', reviewCount)) as statusUsers
    from
      statusUserCount
    group by
      assetId,
      benchmarkId
  ),
  source as (
    select
      sa.assetId,
      sa.benchmarkId,
      any_value(reJson.resultEngines) as resultEngines,
      any_value(userJson.users) as users,
      any_value(statusUserJson.statusUsers) as statusUsers
    from
      asset a
      inner join stig_asset_map sa using (assetId)
      left join default_rev dr on (sa.benchmarkId = dr.benchmarkId and a.collectionId = dr.collectionId)
      left join rev_group_rule_map rgr on dr.revId = rgr.revId
      left join rule_version_check_digest rvcd on rgr.ruleId = rvcd.ruleId
      left join review on (rvcd.version=review.version and rvcd.checkDigest=review.checkDigest and review.assetId=sa.assetId)
      left join reJson on (sa.assetId = reJson.assetId and sa.benchmarkId = reJson.benchmarkId)
      left join userJson on (sa.assetId = userJson.assetId and sa.benchmarkId = userJson.benchmarkId)
      left join statusUserJson on (sa.assetId = statusUserJson.assetId and sa.benchmarkId = statusUserJson.benchmarkId)
    group by
      sa.assetId,
      sa.benchmarkId
  )
  update
    stig_asset_map sam
    inner join source on sam.assetId = source.assetId and source.benchmarkId = sam.benchmarkId
  set
    sam.resultEngines = source.resultEngines,
    sam.users = source.users,
    sam.statusUsers = source.statusUsers
  `
  logger.writeInfo('mysql', 'migration', {status: 'running', name: migrationName, statement: sqlUpdateStigAssetMap})
  await pool.query(sqlUpdateStigAssetMap)
}

const downFn = async (pool, migrationName) => {
  const [cols] = await pool.query('SHOW COLUMNS FROM stig_asset_map')
  const colNames = cols.map(row => row.Field)
  const colStatements = []
  if (colNames.includes('resultEngines')) {
    colStatements.push(`ALTER TABLE stig_asset_map DROP COLUMN resultEngines`)
  }
  if (colNames.includes('users')) {
    colStatements.push(`ALTER TABLE stig_asset_map DROP COLUMN users`)
  }
  if (colNames.includes('statusUsers')) {
    colStatements.push(`ALTER TABLE stig_asset_map DROP COLUMN statusUsers`)
  }
  for (const statement of colStatements) {
    logger.writeInfo('mysql', 'migration', {status: 'running', name: migrationName, statement })
    await pool.query(statement)
  }
}

module.exports = {
  up: async pool => {
    try {
      logger.writeInfo('mysql', 'migration', {status: 'start', direction: 'up', migrationName })
      await upFn(pool, migrationName)
      logger.writeInfo('mysql', 'migration', {status: 'finish', migrationName })
    }
    catch (e) {
      logger.writeError('mysql', 'migration', {status: 'error', migrationName, message: e.message })
      throw (e)
    }
  },
  down: async (pool) => {
    try {
      logger.writeInfo('mysql', 'migration', {status: 'start', direction: 'down', migrationName })
      await downFn(pool, migrationName)
      logger.writeInfo('mysql', 'migration', {status: 'finish', migrationName })
    }
    catch (e) {
      logger.writeError('mysql', 'migration', {status: 'error', migrationName, message: e.message })
      throw (e)
    }
  }
}

