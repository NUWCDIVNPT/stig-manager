const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  // Insert new ReviewAging task
  `INSERT INTO task (taskId, name, description, command) VALUES
    (5, 'ReviewAging', 'Age reviews based on per-collection rules', 'review_aging()')`,

  // New table to hold per-collection config for tasks
  `CREATE TABLE task_collection_config (
    tcId INT NOT NULL AUTO_INCREMENT,
    taskId INT NOT NULL,
    collectionId INT NOT NULL,
    config JSON NOT NULL,
    PRIMARY KEY (tcId),
    UNIQUE KEY idx_tcc_task_collection (taskId, collectionId),
    CONSTRAINT fk_tcc_taskId FOREIGN KEY (taskId) REFERENCES task(taskId) ON DELETE CASCADE,
    CONSTRAINT fk_tcc_collectionId FOREIGN KEY (collectionId) REFERENCES collection(collectionId) ON DELETE CASCADE
  )`,

  // Add collectionId column to task_output for per-collection output routing
  `ALTER TABLE task_output
    ADD COLUMN collectionId INT NULL DEFAULT NULL,
    ADD CONSTRAINT fk_to_collectionId FOREIGN KEY (collectionId) REFERENCES collection(collectionId) ON DELETE CASCADE`,

  // Procedure to write task output tagged to a specific collection
  `DROP PROCEDURE IF EXISTS task_output_collection`,
  `CREATE PROCEDURE task_output_collection(
    IN in_type VARCHAR(45),
    IN in_message VARCHAR(255),
    IN in_collectionId INT
  )
    BEGIN
      IF in_message IS NULL THEN SET in_message = ''; END IF;
      INSERT INTO task_output (runId, taskId, collectionId, type, message)
      VALUES (@runId, @taskId, in_collectionId, in_type, in_message);
    END`,

  // Reusable utility: delete reviews (and their history) in batches from t_reviewIds temp table.
  // Caller must create: t_reviewIds (seq INT AUTO_INCREMENT PK, reviewId INT)
  // Convention matches existing delete_disabled / delete_unmapped procs so this can be reused there.
  `DROP PROCEDURE IF EXISTS delete_review_batch`,
  `CREATE PROCEDURE delete_review_batch()
    BEGIN
      DECLARE v_numReviewIds INT;
      DECLARE v_numHistoryIds INT;
      DECLARE v_incrementValue INT DEFAULT 10000;
      DECLARE v_curMinId BIGINT DEFAULT 1;
      DECLARE v_curMaxId BIGINT DEFAULT v_incrementValue + 1;

      DECLARE EXIT HANDLER FOR SQLEXCEPTION
      BEGIN
        DECLARE err_code INT;
        DECLARE err_msg TEXT;
        GET STACKED DIAGNOSTICS CONDITION 1 err_code = MYSQL_ERRNO, err_msg = MESSAGE_TEXT;
        CALL task_output('error', concat('code: ', err_code, ' message: ', err_msg));
        RESIGNAL;
      END;

      SELECT MAX(seq) INTO v_numReviewIds FROM t_reviewIds;
      CALL task_output('info', concat('found ', IFNULL(v_numReviewIds, 0), ' reviews to delete'));

      IF IFNULL(v_numReviewIds, 0) > 0 THEN
        DROP TEMPORARY TABLE IF EXISTS t_historyIds;
        CREATE TEMPORARY TABLE t_historyIds (seq INT AUTO_INCREMENT PRIMARY KEY)
          SELECT historyId FROM review_history WHERE reviewId IN (SELECT reviewId FROM t_reviewIds);
        SELECT MAX(seq) INTO v_numHistoryIds FROM t_historyIds;
        CALL task_output('info', concat('found ', IFNULL(v_numHistoryIds, 0), ' history records to delete'));

        IF IFNULL(v_numHistoryIds, 0) > 0 THEN
          CALL task_output('info', concat('deleting ', v_numHistoryIds, ' history records'));
          SET v_curMinId = 1;
          SET v_curMaxId = v_curMinId + v_incrementValue;
          REPEAT
            DELETE FROM review_history WHERE historyId IN (
              SELECT historyId FROM t_historyIds WHERE seq >= v_curMinId AND seq < v_curMaxId
            );
            SET v_curMinId = v_curMinId + v_incrementValue;
            SET v_curMaxId = v_curMaxId + v_incrementValue;
          UNTIL ROW_COUNT() = 0 END REPEAT;
        END IF;
        DROP TEMPORARY TABLE IF EXISTS t_historyIds;

        CALL task_output('info', concat('deleting ', v_numReviewIds, ' reviews'));
        SET v_curMinId = 1;
        SET v_curMaxId = v_curMinId + v_incrementValue;
        REPEAT
          DELETE FROM review WHERE reviewId IN (
            SELECT reviewId FROM t_reviewIds WHERE seq >= v_curMinId AND seq < v_curMaxId
          );
          SET v_curMinId = v_curMinId + v_incrementValue;
          SET v_curMaxId = v_curMaxId + v_incrementValue;
        UNTIL ROW_COUNT() = 0 END REPEAT;
      END IF;
    END`,

  // Update review status in batches from t_reviewIds temp table
  `DROP PROCEDURE IF EXISTS update_review_status_batch`,
  `CREATE PROCEDURE update_review_status_batch(
    IN in_status VARCHAR(20),
    IN in_userId INT
  )
    BEGIN
      DECLARE v_statusId INT;
      DECLARE v_userId INT;
      DECLARE v_numReviewIds INT;
      DECLARE v_incrementValue INT DEFAULT 10000;
      DECLARE v_curMinId BIGINT DEFAULT 1;
      DECLARE v_curMaxId BIGINT DEFAULT v_incrementValue + 1;

      DECLARE EXIT HANDLER FOR SQLEXCEPTION
      BEGIN
        DECLARE err_code INT;
        DECLARE err_msg TEXT;
        GET STACKED DIAGNOSTICS CONDITION 1 err_code = MYSQL_ERRNO, err_msg = MESSAGE_TEXT;
        CALL task_output('error', concat('code: ', err_code, ' message: ', err_msg));
        RESIGNAL;
      END;

      -- Map status string to statusId: saved=0, submitted=1, rejected=2, accepted=3
      SELECT statusId INTO v_statusId FROM status WHERE api = in_status LIMIT 1;

      -- Map userId=0 to NULL (system)
      SET v_userId = IF(in_userId = 0, NULL, in_userId);

      SELECT MAX(seq) INTO v_numReviewIds FROM t_reviewIds;
      CALL task_output('info', concat('updating ', IFNULL(v_numReviewIds, 0), ' reviews: status -> ', in_status));

      IF IFNULL(v_numReviewIds, 0) > 0 THEN
        REPEAT
          UPDATE review
            SET statusId = v_statusId, statusTs = NOW(), statusUserId = v_userId
          WHERE reviewId IN (
            SELECT reviewId FROM t_reviewIds WHERE seq >= v_curMinId AND seq < v_curMaxId
          );
          SET v_curMinId = v_curMinId + v_incrementValue;
          SET v_curMaxId = v_curMaxId + v_incrementValue;
        UNTIL ROW_COUNT() = 0 END REPEAT;
      END IF;
    END`,

  // Update review result in batches from t_reviewIds temp table
  `DROP PROCEDURE IF EXISTS update_review_result_batch`,
  `CREATE PROCEDURE update_review_result_batch(
    IN in_result VARCHAR(20),
    IN in_userId INT
  )
    BEGIN
      DECLARE v_resultId INT;
      DECLARE v_userId INT;
      DECLARE v_numReviewIds INT;
      DECLARE v_incrementValue INT DEFAULT 10000;
      DECLARE v_curMinId BIGINT DEFAULT 1;
      DECLARE v_curMaxId BIGINT DEFAULT v_incrementValue + 1;

      DECLARE EXIT HANDLER FOR SQLEXCEPTION
      BEGIN
        DECLARE err_code INT;
        DECLARE err_msg TEXT;
        GET STACKED DIAGNOSTICS CONDITION 1 err_code = MYSQL_ERRNO, err_msg = MESSAGE_TEXT;
        CALL task_output('error', concat('code: ', err_code, ' message: ', err_msg));
        RESIGNAL;
      END;

      -- Map result string to resultId: notReviewed -> notchecked=1, informational=8
      -- The API value "notReviewed" is not in the result table; map it to "notchecked" (resultId=1)
      SET in_result = IF(in_result = 'notReviewed', 'notchecked', in_result);
      SELECT resultId INTO v_resultId FROM result WHERE api = in_result LIMIT 1;

      -- Map userId=0 to NULL (system)
      SET v_userId = IF(in_userId = 0, NULL, in_userId);

      SELECT MAX(seq) INTO v_numReviewIds FROM t_reviewIds;
      CALL task_output('info', concat('updating ', IFNULL(v_numReviewIds, 0), ' reviews: result -> ', in_result));

      IF IFNULL(v_numReviewIds, 0) > 0 THEN
        REPEAT
          UPDATE review
            SET resultId = v_resultId, ts = NOW(), userId = v_userId
          WHERE reviewId IN (
            SELECT reviewId FROM t_reviewIds WHERE seq >= v_curMinId AND seq < v_curMaxId
          );
          SET v_curMinId = v_curMinId + v_incrementValue;
          SET v_curMaxId = v_curMaxId + v_incrementValue;
        UNTIL ROW_COUNT() = 0 END REPEAT;
      END IF;
    END`,

  // Main ReviewAging stored procedure
  `DROP PROCEDURE IF EXISTS review_aging`,
  `CREATE PROCEDURE review_aging()
    BEGIN
      DECLARE v_collectionId INT;
      DECLARE v_config JSON;
      DECLARE v_numRules INT;
      DECLARE v_ruleIdx INT;
      DECLARE v_rule JSON;
      DECLARE v_triggerField VARCHAR(20);
      DECLARE v_triggerBasis VARCHAR(40);
      DECLARE v_triggerInterval INT;
      DECLARE v_triggerAction VARCHAR(20);
      DECLARE v_updateField VARCHAR(20);
      DECLARE v_updateValue VARCHAR(20);
      DECLARE v_updateFilter JSON;
      DECLARE v_updateUserId INT;
      DECLARE v_cutoff DATETIME;
      DECLARE v_numReviews INT;
      DECLARE v_done INT DEFAULT FALSE;

      DECLARE cur CURSOR FOR
        SELECT collectionId, config FROM task_collection_config WHERE taskId = @taskId;
      DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;
      DECLARE EXIT HANDLER FOR SQLEXCEPTION
      BEGIN
        DECLARE err_code INT;
        DECLARE err_msg TEXT;
        GET STACKED DIAGNOSTICS CONDITION 1 err_code = MYSQL_ERRNO, err_msg = MESSAGE_TEXT;
        CALL task_output('error', concat('code: ', err_code, ' message: ', err_msg));
        RESIGNAL;
      END;

      CALL task_output('info', 'task started');

      OPEN cur;
      collection_loop: LOOP
        FETCH cur INTO v_collectionId, v_config;
        IF v_done THEN LEAVE collection_loop; END IF;

        CALL task_output_collection('info', concat('processing collectionId ', v_collectionId), v_collectionId);

        SET v_numRules = JSON_LENGTH(v_config);
        SET v_ruleIdx = 0;

        rule_loop: WHILE v_ruleIdx < v_numRules DO
          SET v_rule        = JSON_EXTRACT(v_config, CONCAT('$[', v_ruleIdx, ']'));

          IF JSON_VALUE(v_rule, '$.enabled') != 'true' THEN
            SET v_ruleIdx = v_ruleIdx + 1;
            ITERATE rule_loop;
          END IF;

          SET v_triggerField    = JSON_UNQUOTE(JSON_EXTRACT(v_rule, '$.triggerField'));
          SET v_triggerBasis    = JSON_UNQUOTE(JSON_EXTRACT(v_rule, '$.triggerBasis'));
          SET v_triggerInterval = JSON_VALUE(v_rule, '$.triggerInterval');
          SET v_triggerAction   = JSON_UNQUOTE(JSON_EXTRACT(v_rule, '$.triggerAction'));
          SET v_updateField     = JSON_UNQUOTE(JSON_EXTRACT(v_rule, '$.updateField'));
          SET v_updateValue     = JSON_UNQUOTE(JSON_EXTRACT(v_rule, '$.updateValue'));
          SET v_updateFilter    = JSON_EXTRACT(v_rule, '$.updateFilter');
          SET v_updateUserId    = JSON_VALUE(v_rule, '$.updateUserId');

          -- Compute cutoff datetime
          -- CAST() does not accept ISO8601 T/Z separators; strip them with REPLACE before casting
          IF v_triggerBasis = 'now' THEN
            SET v_cutoff = DATE_SUB(NOW(), INTERVAL v_triggerInterval SECOND);
          ELSE
            SET v_cutoff = DATE_SUB(
              CAST(REPLACE(REPLACE(v_triggerBasis, 'T', ' '), 'Z', '') AS DATETIME),
              INTERVAL v_triggerInterval SECOND
            );
          END IF;

          -- Identify affected reviews into t_reviewIds
          DROP TEMPORARY TABLE IF EXISTS t_reviewIds;
          CREATE TEMPORARY TABLE t_reviewIds (seq INT AUTO_INCREMENT PRIMARY KEY, reviewId INT);

          -- Dynamic SQL needed to interpolate triggerField column name
          SET @v_sql = CONCAT(
            'INSERT INTO t_reviewIds (reviewId) ',
            'SELECT r.reviewId FROM review r ',
            'JOIN enabled_asset a ON r.assetId = a.assetId ',
            'WHERE a.collectionId = ', v_collectionId,
            ' AND r.', v_triggerField, ' < ''', DATE_FORMAT(v_cutoff, '%Y-%m-%d %H:%i:%s'), ''''
          );

          -- Optional assetIds filter
          IF JSON_LENGTH(JSON_EXTRACT(v_updateFilter, '$.assetIds')) > 0 THEN
            SET @v_sql = CONCAT(@v_sql,
              ' AND r.assetId IN (SELECT j.value FROM JSON_TABLE(''',
              JSON_UNQUOTE(JSON_EXTRACT(v_updateFilter, '$.assetIds')),
              ''', ''$[*]'' COLUMNS (value INT PATH ''$'')) j)');
          END IF;

          -- Optional labelIds filter (UUID lookup via collection_label_asset_map)
          IF JSON_LENGTH(JSON_EXTRACT(v_updateFilter, '$.labelIds')) > 0 THEN
            SET @v_sql = CONCAT(@v_sql,
              ' AND r.assetId IN (',
              '  SELECT clam.assetId FROM collection_label_asset_map clam',
              '  JOIN collection_label cl ON clam.clId = cl.clId',
              '  WHERE BIN_TO_UUID(cl.uuid,1) IN (',
              '    SELECT j.value FROM JSON_TABLE(''',
              JSON_UNQUOTE(JSON_EXTRACT(v_updateFilter, '$.labelIds')),
              ''', ''$[*]'' COLUMNS (value VARCHAR(36) PATH ''$'')) j',
              '  )',
              ')');
          END IF;

          -- Optional benchmarkIds filter (via stig_asset_map)
          IF JSON_LENGTH(JSON_EXTRACT(v_updateFilter, '$.benchmarkIds')) > 0 THEN
            SET @v_sql = CONCAT(@v_sql,
              ' AND r.assetId IN (',
              '  SELECT sam.assetId FROM stig_asset_map sam',
              '  WHERE sam.benchmarkId IN (',
              '    SELECT j.value FROM JSON_TABLE(''',
              JSON_UNQUOTE(JSON_EXTRACT(v_updateFilter, '$.benchmarkIds')),
              ''', ''$[*]'' COLUMNS (value VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_as_cs PATH ''$'')) j',
              '  )',
              ')');
          END IF;

          PREPARE stmt_aging FROM @v_sql;
          EXECUTE stmt_aging;
          DEALLOCATE PREPARE stmt_aging;

          SELECT MAX(seq) INTO v_numReviews FROM t_reviewIds;
          CALL task_output_collection('info',
            CONCAT('rule ', v_ruleIdx, ': found ', IFNULL(v_numReviews, 0), ' reviews to ', v_triggerAction),
            v_collectionId);

          IF IFNULL(v_numReviews, 0) > 0 THEN
            IF v_triggerAction = 'delete' THEN
              CALL delete_review_batch();
            ELSEIF v_triggerAction = 'update' THEN
              IF v_updateField = 'status' THEN
                CALL update_review_status_batch(v_updateValue, v_updateUserId);
              ELSEIF v_updateField = 'result' THEN
                CALL update_review_result_batch(v_updateValue, v_updateUserId);
              END IF;
            END IF;
          END IF;

          DROP TEMPORARY TABLE IF EXISTS t_reviewIds;
          SET v_ruleIdx = v_ruleIdx + 1;
        END WHILE rule_loop;

        CALL task_output_collection('info', CONCAT('finished collectionId ', v_collectionId), v_collectionId);
      END LOOP collection_loop;
      CLOSE cur;

      CALL task_output('info', 'task finished');
    END`,
]

const downMigration = [
  `DROP PROCEDURE IF EXISTS review_aging`,
  `DROP PROCEDURE IF EXISTS update_review_result_batch`,
  `DROP PROCEDURE IF EXISTS update_review_status_batch`,
  `DROP PROCEDURE IF EXISTS delete_review_batch`,
  `DROP PROCEDURE IF EXISTS task_output_collection`,
  `ALTER TABLE task_output DROP FOREIGN KEY fk_to_collectionId`,
  `ALTER TABLE task_output DROP COLUMN collectionId`,
  `DROP TABLE IF EXISTS task_collection_config`,
  `DELETE FROM task WHERE taskId = 5`,
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
