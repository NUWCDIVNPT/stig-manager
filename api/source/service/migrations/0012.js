const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  `ALTER TABLE collection DROP COLUMN workflow, ADD COLUMN settings JSON NOT NULL AFTER description`,
  `update collection
  set settings = JSON_OBJECT(
    'fields', JSON_OBJECT(
      'comment', JSON_OBJECT(
        'enabled', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(metadata->>'$.fieldSettings', '$.commentEnabled')), 'findings'),
        'required', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(metadata->>'$.fieldSettings', '$.commentRequired')), 'findings')
      ),
      'detail', JSON_OBJECT(
        'enabled',  COALESCE(JSON_UNQUOTE(JSON_EXTRACT(metadata->>'$.fieldSettings', '$.detailEnabled')), 'always'),
        'required', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(metadata->>'$.fieldSettings', '$.detailRequired')), 'always')
      )
    ),
    'status', JSON_OBJECT(
      'canAccept', CAST(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(metadata->>'$.statusSettings', '$.canAccept')), cast(true as json)) as json),
      'minAcceptGrant', CAST(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(metadata->>'$.statusSettings', '$.minGrant')), 3) as json),
      'resetCriteria', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(metadata->>'$.statusSettings', '$.resetCriteria')), 'result')
    )   
  )`,
  `update collection set metadata = JSON_REMOVE(metadata, '$.fieldSettings', '$.statusSettings')`
]

const downMigration = [
  `update collection set metadata = JSON_INSERT(metadata, 
    '$.fieldSettings', CAST(
      JSON_OBJECT(
        'detailEnabled', JSON_EXTRACT(settings, '$.fields.detail.enabled'),
        'detailRequired', JSON_EXTRACT(settings, '$.fields.detail.required'),
        'commentEnabled', JSON_EXTRACT(settings, '$.fields.comment.enabled'),
        'commentRequired', JSON_EXTRACT(settings, '$.fields.comment.required')
      )
    as char),
    '$.statusSettings', CAST(
      JSON_OBJECT(
        'canAccept', JSON_EXTRACT(settings, '$.status.canAccept'),
        'minGrant', JSON_EXTRACT(settings, '$.status.minAcceptGrant'),
        'resetCriteria', JSON_EXTRACT(settings, '$.status.resetCriteria')
      )
    as char)
  )`,
  'ALTER TABLE `collection` DROP COLUMN settings, ADD COLUMN `workflow` VARCHAR(45) DEFAULT "emass"'
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
