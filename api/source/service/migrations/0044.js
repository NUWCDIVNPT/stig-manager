const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  `DROP TABLE IF EXISTS task_output`,
  `DROP TABLE IF EXISTS task`,
  `CREATE TABLE task (
    id INT NOT NULL AUTO_INCREMENT,
    taskId BINARY(16) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(45) NOT NULL,
    userId INT NULL,
    created TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    CONSTRAINT fk_task_user FOREIGN KEY (userId) REFERENCES user_data(userId) ON DELETE RESTRICT,
    UNIQUE INDEX taskId_UNIQUE (taskId ASC))`,

  `CREATE TABLE task_output (
    id INT NOT NULL AUTO_INCREMENT,
    taskId BINARY(16) NOT NULL,
    ts TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    data JSON NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_taskoutput_task FOREIGN KEY (taskId) REFERENCES task(taskId) ON DELETE CASCADE
  )`,

  `DROP procedure IF EXISTS task_output`,
  `CREATE PROCEDURE task_output(
    IN taskId BINARY(16),
    IN data JSON
    )
    BEGIN
      insert into task_output (taskId, data) values (taskId, data);
    END`,

  `DROP procedure IF EXISTS task_start`,
  `CREATE PROCEDURE task_start(
      IN taskId BINARY(16),
      IN userId INT,
      IN name VARCHAR(255)
    )
    BEGIN
      insert into task(taskId, name, userId, status) values (taskId, name, userId, 'started');
    END`,

  `DROP procedure IF EXISTS task_failed`,
  `CREATE PROCEDURE task_failed(
    IN taskId BINARY(16)
  )
  BEGIN
    update task set status = 'failed' where task.taskId = taskId;
  END`,

  `DROP procedure IF EXISTS task_finished`,
  `CREATE PROCEDURE task_finished(
    IN taskId BINARY(16)
  )
  BEGIN
    update task set status = 'finished' where task.taskId = taskId;
  END`,

  `DROP PROCEDURE IF EXISTS delete_disabled_objects`,

  `CREATE PROCEDURE delete_disabled_objects(
      IN taskIdStr VARCHAR(36),
      IN userId INT
    )
    BEGIN
    DECLARE incrementValue INT DEFAULT 10000;
    DECLARE curMinId BIGINT DEFAULT 1;
    DECLARE curMaxId BIGINT DEFAULT incrementValue + 1;
    DECLARE numCollectionIds INT;
    DECLARE numAssetIds INT;
    DECLARE numReviewIds INT;
    DECLARE numHistoryIds INT;
    DECLARE taskId BINARY(16);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
      DECLARE err_code INT;
      DECLARE err_msg TEXT;
      GET DIAGNOSTICS CONDITION 1
        err_code = MYSQL_ERRNO, err_msg = MESSAGE_TEXT;
      CALL task_output(taskId, JSON_OBJECT('message', 'error', 'error_code', err_code, 'error_message', err_msg));
      CALL task_failed (taskId);
    END;

    IF taskIdStr IS NOT NULL AND taskIdStr REGEXP '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
      SET taskId = UUID_TO_BIN(taskIdStr);
    ELSE
      SET taskId = UUID_TO_BIN(UUID());
    END IF;

    IF userId IS NULL OR userId <= 0 THEN
      SET userId = NULL;
    END IF;

    CALL task_start (taskId, userId, 'delete_disabled_objects');

    CALL task_output (taskId, JSON_OBJECT('message', 'Task started'));
    drop temporary table if exists t_collectionIds;
    create temporary table t_collectionIds (seq INT AUTO_INCREMENT PRIMARY KEY)
      select collectionId from collection where isEnabled is null;
    select max(seq) into numCollectionIds from t_collectionIds;
    CALL task_output (taskId, JSON_OBJECT('message', 'created table', 'table', 't_collectionIds', 'count', numCollectionIds));

    drop temporary table if exists t_assetIds;
    create temporary table t_assetIds (seq INT AUTO_INCREMENT PRIMARY KEY)
      select assetId from asset where isEnabled is null or collectionId in (select collectionId from t_collectionIds);
    select max(seq) into numAssetIds from t_assetIds;
    CALL task_output (taskId, JSON_OBJECT('message', 'created table', 'table', 't_assetIds', 'count', numAssetIds));

    drop temporary table if exists t_reviewIds;
    create temporary table t_reviewIds (seq INT AUTO_INCREMENT PRIMARY KEY)
      select reviewId from review where assetId in (select assetId from t_assetIds);
    select max(seq) into numReviewIds from t_reviewIds;
    CALL task_output (taskId, JSON_OBJECT('message', 'created table', 'table', 't_reviewIds', 'count', numReviewIds));

    drop temporary table if exists t_historyIds;
    create temporary table t_historyIds (seq INT AUTO_INCREMENT PRIMARY KEY)
      select historyId from review_history where reviewId in (select reviewId from t_reviewIds);
    select max(seq) into numHistoryIds from t_historyIds;
    CALL task_output (taskId, JSON_OBJECT('message', 'created table', 'table', 't_historyIds', 'count', numHistoryIds));

    IF numHistoryIds > 0 THEN
    REPEAT
      CALL task_output (taskId, JSON_OBJECT('message', 'delete range', 'table', 'review_history', 'range_start', curMinId, 'range_end', curMaxId, 'range_size', numHistoryIds));
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
        CALL task_output (taskId, JSON_OBJECT('message', 'delete range', 'table', 'review', 'range_start', curMinId, 'range_end', curMaxId, 'range_size', numReviewIds));
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
        CALL task_output (taskId, JSON_OBJECT('message', 'delete range', 'table', 'asset', 'range_start', curMinId, 'range_end', curMaxId, 'range_size', numAssetIds));
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
        CALL task_output (taskId, JSON_OBJECT('message', 'delete range', 'table', 'collection', 'range_start', curMinId, 'range_end', curMaxId, 'range_size', numCollectionIds));
        delete from collection where collectionId IN (
            select collectionId from t_collectionIds where seq >= curMinId and seq < curMaxId 
          );
        SET curMinId = curMinId + incrementValue;
        SET curMaxId = curMaxId + incrementValue;
      UNTIL ROW_COUNT() = 0 END REPEAT;
    END IF;
    drop temporary table if exists t_collectionIds;

    CALL task_output (taskId, JSON_OBJECT('message', 'Task finished'));
    CALL task_finished (taskId);
    END`
]

const downMigration = [
  `DROP TABLE IF EXISTS task_output`,
  `DROP TABLE IF EXISTS task`,
  `DROP PROCEDURE IF EXISTS task_output`,
  `DROP PROCEDURE IF EXISTS task_start`,
  `DROP PROCEDURE IF EXISTS task_failed`,
  `DROP PROCEDURE IF EXISTS task_finished`,
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
