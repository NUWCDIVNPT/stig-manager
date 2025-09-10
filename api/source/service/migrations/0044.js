const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  `DROP TABLE IF EXISTS job_output`,
  `DROP TABLE IF EXISTS job`,
  `CREATE TABLE job (
    id INT NOT NULL AUTO_INCREMENT,
    jobId BINARY(16) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(45) NOT NULL,
    created TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE INDEX jobId_UNIQUE (jobId ASC))`,

  `CREATE TABLE job_output (
    id INT NOT NULL AUTO_INCREMENT,
    jobId BINARY(16) NOT NULL,
    ts TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    data JSON NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_joboutput_job FOREIGN KEY (jobId) REFERENCES job(jobId) ON DELETE CASCADE
  )`,

  `DROP procedure IF EXISTS job_output`,
  `CREATE PROCEDURE job_output(
    IN jobId BINARY(16),
    IN data JSON
    )
    BEGIN
      insert into job_output (jobId, data) values (jobId, data);
    END`,

  `DROP procedure IF EXISTS job_start`,
  `CREATE PROCEDURE job_start(
      IN jobId BINARY(16),
      IN name VARCHAR(255)
    )
    BEGIN
      insert into job(jobId, name, status) values (jobId, name, 'started');
    END`,

  `DROP procedure IF EXISTS job_failed`,
  `CREATE PROCEDURE job_failed(
    IN jobId BINARY(16)
  )
  BEGIN
    update job set status = 'failed' where job.jobId = jobId;
  END`,

  `DROP procedure IF EXISTS job_finished`,
  `CREATE PROCEDURE job_finished(
    IN jobId BINARY(16)
  )
  BEGIN
    update job set status = 'finished' where job.jobId = jobId;
  END`,

  `DROP PROCEDURE IF EXISTS delete_disabled_objects`,

  `CREATE PROCEDURE delete_disabled_objects(IN jobIdStr VARCHAR(36))
    BEGIN
    DECLARE incrementValue INT DEFAULT 10000;
    DECLARE curMinId BIGINT DEFAULT 1;
    DECLARE curMaxId BIGINT DEFAULT incrementValue + 1;
    DECLARE numCollectionIds INT;
    DECLARE numAssetIds INT;
    DECLARE numReviewIds INT;
    DECLARE numHistoryIds INT;
    DECLARE jobId BINARY(16);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
      DECLARE err_code INT;
      DECLARE err_msg TEXT;
      GET DIAGNOSTICS CONDITION 1
        err_code = MYSQL_ERRNO, err_msg = MESSAGE_TEXT;
      CALL job_output(jobId, JSON_OBJECT('message', 'error', 'error_code', err_code, 'error_message', err_msg));
      CALL job_failed (jobId);
    END;

    IF jobIdStr IS NOT NULL AND jobIdStr REGEXP '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
      SET jobId = UUID_TO_BIN(jobIdStr);
    ELSE
      SET jobId = UUID_TO_BIN(UUID());
    END IF;

    CALL job_start (jobId, 'delete_disabled_objects');

    CALL job_output (jobId, JSON_OBJECT('message', 'Job started'));
    drop temporary table if exists t_collectionIds;
    create temporary table t_collectionIds (seq INT AUTO_INCREMENT PRIMARY KEY)
      select collectionId from collection where isEnabled is null;
    select max(seq) into numCollectionIds from t_collectionIds;
    CALL job_output (jobId, JSON_OBJECT('message', 'created table', 'table', 't_collectionIds', 'count', numCollectionIds));

    drop temporary table if exists t_assetIds;
    create temporary table t_assetIds (seq INT AUTO_INCREMENT PRIMARY KEY)
      select assetId from asset where isEnabled is null or collectionId in (select collectionId from t_collectionIds);
    select max(seq) into numAssetIds from t_assetIds;
    CALL job_output (jobId, JSON_OBJECT('message', 'created table', 'table', 't_assetIds', 'count', numAssetIds));

    drop temporary table if exists t_reviewIds;
    create temporary table t_reviewIds (seq INT AUTO_INCREMENT PRIMARY KEY)
      select reviewId from review where assetId in (select assetId from t_assetIds);
    select max(seq) into numReviewIds from t_reviewIds;
    CALL job_output (jobId, JSON_OBJECT('message', 'created table', 'table', 't_reviewIds', 'count', numReviewIds));

    drop temporary table if exists t_historyIds;
    create temporary table t_historyIds (seq INT AUTO_INCREMENT PRIMARY KEY)
      select historyId from review_history where reviewId in (select reviewId from t_reviewIds);
    select max(seq) into numHistoryIds from t_historyIds;
    CALL job_output (jobId, JSON_OBJECT('message', 'created table', 'table', 't_historyIds', 'count', numHistoryIds));

    IF numHistoryIds > 0 THEN
    REPEAT
      CALL job_output (jobId, JSON_OBJECT('message', 'delete range', 'table', 'review_history', 'range_start', curMinId, 'range_end', curMaxId, 'range_size', numHistoryIds));
      delete from review_history where historyId IN (
          select historyId from t_historyIds where seq >= curMinId and seq < curMaxId 
        );
      SET curMinId = curMinId + incrementValue;
      SET curMaxId = curMaxId + incrementValue;
    UNTIL ROW_COUNT() = 0 END REPEAT;
    END IF;
    drop temporary table if exists t_historyIds;

    SET curMinId = 1;
    SET curMaxId = curMinId + incrementValue;
    IF numReviewIds > 0 THEN
      REPEAT
        CALL job_output (jobId, JSON_OBJECT('message', 'delete range', 'table', 'review', 'range_start', curMinId, 'range_end', curMaxId, 'range_size', numReviewIds));
        delete from review where reviewId IN (
            select reviewId from t_reviewIds where seq >= curMinId and seq < curMaxId 
          );
        SET curMinId = curMinId + incrementValue;
        SET curMaxId = curMaxId + incrementValue;
      UNTIL ROW_COUNT() = 0 END REPEAT;
    END IF;
    drop temporary table if exists t_reviewIds;

    SET curMinId = 1;
    SET curMaxId = curMinId + incrementValue;
    IF numAssetIds > 0 THEN
      REPEAT
        CALL job_output (jobId, JSON_OBJECT('message', 'delete range', 'table', 'asset', 'range_start', curMinId, 'range_end', curMaxId, 'range_size', numAssetIds));
        delete from asset where assetId IN (
            select assetId from t_assetIds where seq >= curMinId and seq < curMaxId 
          );
        SET curMinId = curMinId + incrementValue;
        SET curMaxId = curMaxId + incrementValue;
    UNTIL ROW_COUNT() = 0 END REPEAT;
    END IF;
    drop temporary table if exists t_assetIds;

    SET curMinId = 1;
    SET curMaxId = curMinId + incrementValue;
    IF numCollectionIds > 0 THEN
      REPEAT
        CALL job_output (jobId, JSON_OBJECT('message', 'delete range', 'table', 'collection', 'range_start', curMinId, 'range_end', curMaxId, 'range_size', numCollectionIds));
        delete from collection where collectionId IN (
            select collectionId from t_collectionIds where seq >= curMinId and seq < curMaxId 
          );
        SET curMinId = curMinId + incrementValue;
        SET curMaxId = curMaxId + incrementValue;
      UNTIL ROW_COUNT() = 0 END REPEAT;
    END IF;
    drop temporary table if exists t_collectionIds;

    CALL job_output (jobId, JSON_OBJECT('message', 'Job finished'));
    CALL job_finished (jobId);
    END`
]

const downMigration = [
  `DROP TABLE IF EXISTS job_output`,
  `DROP TABLE IF EXISTS job`,
  `DROP PROCEDURE IF EXISTS job_output`,
  `DROP PROCEDURE IF EXISTS job_start`,
  `DROP PROCEDURE IF EXISTS job_failed`,
  `DROP PROCEDURE IF EXISTS job_finished`,
  `DROP PROCEDURE IF EXISTS delete_disabled_objects`,
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
