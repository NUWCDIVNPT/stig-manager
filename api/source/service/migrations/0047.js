const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  // Insert new ReviewAging task
  `INSERT INTO task (taskId, name, description, command) VALUES
    (5, 'ReviewAging', 'Age reviews based on per-collection rules', 'review_aging()')`,

  // Introduce nullable taskId FK in user_data for task-specific attribution
  `ALTER TABLE user_data
  ADD COLUMN taskId INT NULL DEFAULT NULL,
  ADD CONSTRAINT fk_ud_taskId FOREIGN KEY (taskId) REFERENCES task(taskId) ON DELETE SET NULL`,

  // Seed user_data entry for ReviewAging task
  `INSERT INTO user_data (username, taskId, status)
  VALUES ('_task_ReviewAging', 5, 'unavailable')`,
  
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
        ROLLBACK;
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
    IN in_status VARCHAR(20)
  )
    BEGIN
      DECLARE v_statusId INT;
      DECLARE v_numReviewIds INT;
      DECLARE v_incrementValue INT DEFAULT 10000;
      DECLARE v_curMinId BIGINT DEFAULT 1;
      DECLARE v_curMaxId BIGINT DEFAULT v_incrementValue + 1;

      DECLARE EXIT HANDLER FOR SQLEXCEPTION
      BEGIN
        DECLARE err_code INT;
        DECLARE err_msg TEXT;
        GET STACKED DIAGNOSTICS CONDITION 1 err_code = MYSQL_ERRNO, err_msg = MESSAGE_TEXT;
        ROLLBACK;
        CALL task_output('error', concat('code: ', err_code, ' message: ', err_msg));
        RESIGNAL;
      END;

      -- Map status string to statusId: saved=0, submitted=1, rejected=2, accepted=3
      SELECT statusId INTO v_statusId FROM status WHERE api = in_status LIMIT 1;

      SELECT MAX(seq) INTO v_numReviewIds FROM t_reviewIds;
      CALL task_output('info', concat('updating ', IFNULL(v_numReviewIds, 0), ' reviews: status -> ', in_status));

      IF IFNULL(v_numReviewIds, 0) > 0 THEN
        REPEAT
          UPDATE review
            SET statusId = v_statusId, statusTs = NOW(), statusUserId = @taskUserId
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
    IN in_result VARCHAR(20)
  )
    BEGIN
      DECLARE v_resultId INT;
      DECLARE v_numReviewIds INT;
      DECLARE v_incrementValue INT DEFAULT 10000;
      DECLARE v_curMinId BIGINT DEFAULT 1;
      DECLARE v_curMaxId BIGINT DEFAULT v_incrementValue + 1;

      DECLARE EXIT HANDLER FOR SQLEXCEPTION
      BEGIN
        DECLARE err_code INT;
        DECLARE err_msg TEXT;
        GET STACKED DIAGNOSTICS CONDITION 1 err_code = MYSQL_ERRNO, err_msg = MESSAGE_TEXT;
        ROLLBACK;
        CALL task_output('error', concat('code: ', err_code, ' message: ', err_msg));
        RESIGNAL;
      END;

      -- Map result string to resultId: notReviewed -> notchecked=1, informational=8
      -- The API value "notReviewed" is not in the result table; map it to "notchecked" (resultId=1)
      SET in_result = IF(in_result = 'notReviewed', 'notchecked', in_result);
      SELECT resultId INTO v_resultId FROM result WHERE api = in_result LIMIT 1;

      SELECT MAX(seq) INTO v_numReviewIds FROM t_reviewIds;
      CALL task_output('info', concat('updating ', IFNULL(v_numReviewIds, 0), ' reviews: result -> ', in_result));

      IF IFNULL(v_numReviewIds, 0) > 0 THEN
        REPEAT
          UPDATE review
            SET resultId = v_resultId, ts = NOW(), userId = @taskUserId, 
            statusId = 0, statusTs = NOW(), statusUserId = @taskUserId,
            statusText = 'Review change triggered status update'
          WHERE reviewId IN (
            SELECT reviewId FROM t_reviewIds WHERE seq >= v_curMinId AND seq < v_curMaxId
          );
          SET v_curMinId = v_curMinId + v_incrementValue;
          SET v_curMaxId = v_curMaxId + v_incrementValue;
        UNTIL ROW_COUNT() = 0 END REPEAT;
      END IF;
    END`,

  // Snapshot and prune history for reviews in t_reviewIds before they are updated.
  // Prunes first (to cap-1), then inserts the new snapshot, so the new record counts toward the cap.
  // Caller must create: t_reviewIds (seq INT AUTO_INCREMENT PK, reviewId INT)
  `DROP PROCEDURE IF EXISTS prune_and_insert_history`,
  `CREATE PROCEDURE prune_and_insert_history(IN in_maxReviews INT)
    BEGIN
      DECLARE EXIT HANDLER FOR SQLEXCEPTION
      BEGIN
        DECLARE err_code INT;
        DECLARE err_msg TEXT;
        GET STACKED DIAGNOSTICS CONDITION 1 err_code = MYSQL_ERRNO, err_msg = MESSAGE_TEXT;
        ROLLBACK;
        CALL task_output('error', concat('code: ', err_code, ' message: ', err_msg));
        RESIGNAL;
      END;

      -- Step 1: prune existing history to cap-1, making room for the incoming snapshot
      WITH historyRecs AS (
        SELECT
          rh.historyId,
          ROW_NUMBER() OVER (PARTITION BY r.reviewId ORDER BY rh.historyId DESC) AS rowNum
        FROM review_history rh
        LEFT JOIN review r USING (reviewId)
        WHERE r.reviewId IN (SELECT reviewId FROM t_reviewIds)
      )
      DELETE review_history
      FROM review_history
      LEFT JOIN historyRecs ON review_history.historyId = historyRecs.historyId
      WHERE historyRecs.rowNum > in_maxReviews - 1;

      -- Step 2: insert snapshot of current review state before the update
      INSERT INTO review_history (
        reviewId,
        ruleId,
        resultId,
        detail,
        comment,
        autoResult,
        ts,
        userId,
        statusText,
        statusUserId,
        statusTs,
        statusId,
        touchTs,
        resultEngine
      ) SELECT
          reviewId,
          ruleId,
          resultId,
          LEFT(detail, 32767),
          LEFT(comment, 32767),
          autoResult,
          ts,
          userId,
          statusText,
          statusUserId,
          statusTs,
          statusId,
          touchTs,
          CASE WHEN resultEngine = 0 THEN NULL ELSE resultEngine END
        FROM review
        WHERE reviewId IN (SELECT reviewId FROM t_reviewIds);
    END`,

  // Stored procedure equivalent of the JS updateStatsAssetStig function.
  // Accepts a JSON filter object with optional keys: collectionId, collectionIds,
  // assetId, assetIds, assetBenchmarkIds, benchmarkId, benchmarkIds, rules, saIds.
  // NULL or omitted keys are ignored; NULL p_filter updates all rows.
  `DROP PROCEDURE IF EXISTS update_stats_asset_stig`,
  `CREATE PROCEDURE update_stats_asset_stig(IN p_filter JSON)
    BEGIN
      DECLARE v_where    TEXT DEFAULT 'WHERE sa.assetId IS NOT NULL AND sa.benchmarkId IS NOT NULL';
      DECLARE v_json_arr JSON;
      DECLARE v_sql      TEXT;

      -- rules: array of ruleIds -> filter by benchmarkId
      IF JSON_CONTAINS_PATH(p_filter, 'one', '$.rules') THEN
        SET v_json_arr = JSON_EXTRACT(p_filter, '$.rules');
        SET v_where = CONCAT(v_where,
          ' AND sa.benchmarkId IN (',
            'SELECT DISTINCT benchmarkId FROM rev_group_rule_map ',
            'LEFT JOIN revision USING (revId) ',
            'WHERE ruleId IN (',
              'SELECT value FROM JSON_TABLE(', QUOTE(v_json_arr), ', ''$[*]'' COLUMNS(value VARCHAR(255) PATH ''$'')) jt',
            ')',
          ')');
      END IF;

      -- collectionId: scalar
      IF JSON_CONTAINS_PATH(p_filter, 'one', '$.collectionId') THEN
        SET v_where = CONCAT(v_where,
          ' AND a.collectionId = ', JSON_VALUE(p_filter, '$.collectionId'));
      END IF;

      -- collectionIds: array
      IF JSON_CONTAINS_PATH(p_filter, 'one', '$.collectionIds') THEN
        SET v_json_arr = JSON_EXTRACT(p_filter, '$.collectionIds');
        SET v_where = CONCAT(v_where,
          ' AND a.collectionId IN (',
            'SELECT value FROM JSON_TABLE(', QUOTE(v_json_arr), ', ''$[*]'' COLUMNS(value INT PATH ''$'')) jt',
          ')');
      END IF;

      -- assetId: scalar
      IF JSON_CONTAINS_PATH(p_filter, 'one', '$.assetId') THEN
        SET v_where = CONCAT(v_where,
          ' AND a.assetId = ', JSON_VALUE(p_filter, '$.assetId'));
      END IF;

      -- assetIds: array
      IF JSON_CONTAINS_PATH(p_filter, 'one', '$.assetIds') THEN
        SET v_json_arr = JSON_EXTRACT(p_filter, '$.assetIds');
        SET v_where = CONCAT(v_where,
          ' AND a.assetId IN (',
            'SELECT value FROM JSON_TABLE(', QUOTE(v_json_arr), ', ''$[*]'' COLUMNS(value INT PATH ''$'')) jt',
          ')');
      END IF;

      -- assetBenchmarkIds: array of benchmarkIds -> filter by assetId
      IF JSON_CONTAINS_PATH(p_filter, 'one', '$.assetBenchmarkIds') THEN
        SET v_json_arr = JSON_EXTRACT(p_filter, '$.assetBenchmarkIds');
        SET v_where = CONCAT(v_where,
          ' AND a.assetId IN (',
            'SELECT assetId FROM stig_asset_map WHERE benchmarkId IN (',
              'SELECT value FROM JSON_TABLE(', QUOTE(v_json_arr), ', ''$[*]'' COLUMNS(value VARCHAR(255) PATH ''$'')) jt',
            ')',
          ')');
      END IF;

      -- benchmarkId: scalar
      IF JSON_CONTAINS_PATH(p_filter, 'one', '$.benchmarkId') THEN
        SET v_where = CONCAT(v_where,
          ' AND sa.benchmarkId = ', QUOTE(JSON_UNQUOTE(JSON_EXTRACT(p_filter, '$.benchmarkId'))));
      END IF;

      -- benchmarkIds: array
      IF JSON_CONTAINS_PATH(p_filter, 'one', '$.benchmarkIds') THEN
        SET v_json_arr = JSON_EXTRACT(p_filter, '$.benchmarkIds');
        SET v_where = CONCAT(v_where,
          ' AND sa.benchmarkId IN (',
            'SELECT value FROM JSON_TABLE(', QUOTE(v_json_arr), ', ''$[*]'' COLUMNS(value VARCHAR(255) PATH ''$'')) jt',
          ')');
      END IF;

      -- saIds: array
      IF JSON_CONTAINS_PATH(p_filter, 'one', '$.saIds') THEN
        SET v_json_arr = JSON_EXTRACT(p_filter, '$.saIds');
        SET v_where = CONCAT(v_where,
          ' AND sa.saId IN (',
            'SELECT value FROM JSON_TABLE(', QUOTE(v_json_arr), ', ''$[*]'' COLUMNS(value INT PATH ''$'')) jt',
          ')');
      END IF;

      -- reviewIds: array of reviewIds -> filter by saId
      IF JSON_CONTAINS_PATH(p_filter, 'one', '$.reviewIds') THEN
        SET v_json_arr = JSON_EXTRACT(p_filter, '$.reviewIds');
        SET v_where = CONCAT(v_where,
          ' AND sa.saId IN (',
            'SELECT DISTINCT sa2.saId FROM review r2 ',
            'INNER JOIN rule_version_check_digest rvsd ON (rvsd.version = r2.version AND rvsd.checkDigest = r2.checkDigest) ',
            'INNER JOIN rev_group_rule_map rgr2 ON rgr2.ruleId = rvsd.ruleId ',
            'INNER JOIN revision rev2 ON rev2.revId = rgr2.revId ',
            'INNER JOIN stig_asset_map sa2 ON (sa2.assetId = r2.assetId AND sa2.benchmarkId = rev2.benchmarkId) ',
            'WHERE r2.reviewId IN (',
              'SELECT value FROM JSON_TABLE(', QUOTE(v_json_arr), ', ''$[*]'' COLUMNS(value INT PATH ''$'')) jt',
            ')',
          ')');
      END IF;

      SET v_sql = CONCAT('
      WITH source AS (
        SELECT
          sa.assetId,
          sa.benchmarkId,
          MIN(review.ts)      AS minTs,
          MAX(review.ts)      AS maxTs,
          MAX(review.touchTs) AS maxTouchTs,
          SUM(CASE WHEN review.statusId = 0 THEN 1 ELSE 0 END) AS saved,
          SUM(CASE WHEN review.resultEngine IS NOT NULL AND review.statusId = 0 THEN 1 ELSE 0 END) AS savedResultEngine,
          SUM(CASE WHEN review.statusId = 1 THEN 1 ELSE 0 END) AS submitted,
          SUM(CASE WHEN review.resultEngine IS NOT NULL AND review.statusId = 1 THEN 1 ELSE 0 END) AS submittedResultEngine,
          SUM(CASE WHEN review.statusId = 2 THEN 1 ELSE 0 END) AS rejected,
          SUM(CASE WHEN review.resultEngine IS NOT NULL AND review.statusId = 2 THEN 1 ELSE 0 END) AS rejectedResultEngine,
          SUM(CASE WHEN review.statusId = 3 THEN 1 ELSE 0 END) AS accepted,
          SUM(CASE WHEN review.resultEngine IS NOT NULL AND review.statusId = 3 THEN 1 ELSE 0 END) AS acceptedResultEngine,
          SUM(CASE WHEN review.resultId = 4 AND rgr.severity = ''high''   THEN 1 ELSE 0 END) AS highCount,
          SUM(CASE WHEN review.resultId = 4 AND rgr.severity = ''medium'' THEN 1 ELSE 0 END) AS mediumCount,
          SUM(CASE WHEN review.resultId = 4 AND rgr.severity = ''low''    THEN 1 ELSE 0 END) AS lowCount,
          SUM(CASE WHEN review.resultId IN (2,3,4) AND rgr.severity = ''high''   THEN 1 ELSE 0 END) AS assessedHighCount,
          SUM(CASE WHEN review.resultId IN (2,3,4) AND rgr.severity = ''medium'' THEN 1 ELSE 0 END) AS assessedMediumCount,
          SUM(CASE WHEN review.resultId IN (2,3,4) AND rgr.severity = ''low''    THEN 1 ELSE 0 END) AS assessedLowCount,
          SUM(CASE WHEN review.resultId = 1 THEN 1 ELSE 0 END) AS notchecked,
          SUM(CASE WHEN review.resultEngine IS NOT NULL AND review.resultId = 1 THEN 1 ELSE 0 END) AS notcheckedResultEngine,
          SUM(CASE WHEN review.resultId = 2 THEN 1 ELSE 0 END) AS notapplicable,
          SUM(CASE WHEN review.resultEngine IS NOT NULL AND review.resultId = 2 THEN 1 ELSE 0 END) AS notapplicableResultEngine,
          SUM(CASE WHEN review.resultId = 3 THEN 1 ELSE 0 END) AS pass,
          SUM(CASE WHEN review.resultEngine IS NOT NULL AND review.resultId = 3 THEN 1 ELSE 0 END) AS passResultEngine,
          SUM(CASE WHEN review.resultId = 4 THEN 1 ELSE 0 END) AS fail,
          SUM(CASE WHEN review.resultEngine IS NOT NULL AND review.resultId = 4 THEN 1 ELSE 0 END) AS failResultEngine,
          SUM(CASE WHEN review.resultId = 5 THEN 1 ELSE 0 END) AS unknown,
          SUM(CASE WHEN review.resultEngine IS NOT NULL AND review.resultId = 5 THEN 1 ELSE 0 END) AS unknownResultEngine,
          SUM(CASE WHEN review.resultId = 6 THEN 1 ELSE 0 END) AS error,
          SUM(CASE WHEN review.resultEngine IS NOT NULL AND review.resultId = 6 THEN 1 ELSE 0 END) AS errorResultEngine,
          SUM(CASE WHEN review.resultId = 7 THEN 1 ELSE 0 END) AS notselected,
          SUM(CASE WHEN review.resultEngine IS NOT NULL AND review.resultId = 7 THEN 1 ELSE 0 END) AS notselectedResultEngine,
          SUM(CASE WHEN review.resultId = 8 THEN 1 ELSE 0 END) AS informational,
          SUM(CASE WHEN review.resultEngine IS NOT NULL AND review.resultId = 8 THEN 1 ELSE 0 END) AS informationalResultEngine,
          SUM(CASE WHEN review.resultId = 9 THEN 1 ELSE 0 END) AS fixed,
          SUM(CASE WHEN review.resultEngine IS NOT NULL AND review.resultId = 9 THEN 1 ELSE 0 END) AS fixedResultEngine
        FROM
          enabled_asset a
          INNER JOIN enabled_collection ec ON a.collectionId = ec.collectionId
          LEFT JOIN stig_asset_map sa USING (assetId)
          LEFT JOIN default_rev dr ON (sa.benchmarkId = dr.benchmarkId AND a.collectionId = dr.collectionId)
          LEFT JOIN rev_group_rule_map rgr ON dr.revId = rgr.revId
          LEFT JOIN rule_version_check_digest rvcd ON rgr.ruleId = rvcd.ruleId
          LEFT JOIN review ON (rvcd.version = review.version AND rvcd.checkDigest = review.checkDigest AND review.assetId = sa.assetId)
        ', v_where, '
        GROUP BY sa.assetId, sa.benchmarkId
      )
      UPDATE stig_asset_map sam
        INNER JOIN source ON sam.assetId = source.assetId AND source.benchmarkId = sam.benchmarkId
        SET
          sam.minTs                     = source.minTs,
          sam.maxTs                     = source.maxTs,
          sam.maxTouchTs                = source.maxTouchTs,
          sam.saved                     = source.saved,
          sam.savedResultEngine         = source.savedResultEngine,
          sam.submitted                 = source.submitted,
          sam.submittedResultEngine     = source.submittedResultEngine,
          sam.rejected                  = source.rejected,
          sam.rejectedResultEngine      = source.rejectedResultEngine,
          sam.accepted                  = source.accepted,
          sam.acceptedResultEngine      = source.acceptedResultEngine,
          sam.highCount                 = source.highCount,
          sam.mediumCount               = source.mediumCount,
          sam.lowCount                  = source.lowCount,
          sam.assessedHighCount         = source.assessedHighCount,
          sam.assessedMediumCount       = source.assessedMediumCount,
          sam.assessedLowCount          = source.assessedLowCount,
          sam.notchecked                = source.notchecked,
          sam.notcheckedResultEngine    = source.notcheckedResultEngine,
          sam.notapplicable             = source.notapplicable,
          sam.notapplicableResultEngine = source.notapplicableResultEngine,
          sam.pass                      = source.pass,
          sam.passResultEngine          = source.passResultEngine,
          sam.fail                      = source.fail,
          sam.failResultEngine          = source.failResultEngine,
          sam.unknown                   = source.unknown,
          sam.unknownResultEngine       = source.unknownResultEngine,
          sam.error                     = source.error,
          sam.errorResultEngine         = source.errorResultEngine,
          sam.notselected               = source.notselected,
          sam.notselectedResultEngine   = source.notselectedResultEngine,
          sam.informational             = source.informational,
          sam.informationalResultEngine = source.informationalResultEngine,
          sam.fixed                     = source.fixed,
          sam.fixedResultEngine         = source.fixedResultEngine
      ');

      SET @stmt = v_sql;
      PREPARE stmt FROM @stmt;
      EXECUTE stmt;
      DEALLOCATE PREPARE stmt;
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
      DECLARE v_cutoff DATETIME;
      DECLARE v_numReviews INT;
      DECLARE v_maxReviews INT;
      DECLARE v_done INT DEFAULT FALSE;

      DECLARE cur CURSOR FOR
        SELECT tcc.collectionId, tcc.config FROM task_collection_config tcc
        INNER JOIN enabled_collection ec USING (collectionId)
        WHERE tcc.taskId = @taskId;
      DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;
      DECLARE EXIT HANDLER FOR SQLEXCEPTION
      BEGIN
        DECLARE err_code INT;
        DECLARE err_msg TEXT;
        GET STACKED DIAGNOSTICS CONDITION 1 err_code = MYSQL_ERRNO, err_msg = MESSAGE_TEXT;
        ROLLBACK;
        CALL task_output('error', concat('code: ', err_code, ' message: ', err_msg));
        RESIGNAL;
      END;

      CALL task_output('info', 'task started');
      
      SELECT userId INTO @taskUserId FROM user_data WHERE taskId = @taskId;

      OPEN cur;
      collection_loop: LOOP
        FETCH cur INTO v_collectionId, v_config;
        IF v_done THEN LEAVE collection_loop; END IF;

        CALL task_output_collection('info', concat('processing collectionId ', v_collectionId), v_collectionId);

        BEGIN  -- collection-scoped block: error here rolls back and continues the loop
          DECLARE EXIT HANDLER FOR SQLEXCEPTION
          BEGIN
            DECLARE err_code INT;
            DECLARE err_msg TEXT;
            GET STACKED DIAGNOSTICS CONDITION 1 err_code = MYSQL_ERRNO, err_msg = MESSAGE_TEXT;
            ROLLBACK;
            CALL task_output_collection('error', concat('code: ', err_code, ' message: ', err_msg), v_collectionId);
            CALL task_output('error', concat('error processing collectionId ', v_collectionId, ': code: ', err_code, ' message: ', err_msg));
          END;

          START TRANSACTION;

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
                SELECT CAST(c.settings->>"$.history.maxReviews" AS UNSIGNED)
                  INTO v_maxReviews
                FROM enabled_collection c WHERE c.collectionId = v_collectionId;
                CALL prune_and_insert_history(v_maxReviews);
                IF v_updateField = 'status' THEN
                  CALL update_review_status_batch(v_updateValue);
                ELSEIF v_updateField = 'result' THEN
                  CALL update_review_result_batch(v_updateValue);
                END IF;
                CALL update_stats_asset_stig(JSON_OBJECT('reviewIds', (SELECT JSON_ARRAYAGG(reviewId) FROM t_reviewIds)));
              END IF;
            END IF;

            DROP TEMPORARY TABLE IF EXISTS t_reviewIds;
            SET v_ruleIdx = v_ruleIdx + 1;
          END WHILE rule_loop;

          COMMIT;
        END;  -- collection-scoped block

        CALL task_output_collection('info', CONCAT('finished collectionId ', v_collectionId), v_collectionId);
      END LOOP collection_loop;
      CLOSE cur;

      CALL task_output('info', 'task finished');
    END`,
]

const downMigration = [
  `DROP PROCEDURE IF EXISTS update_stats_asset_stig`,
  `DROP PROCEDURE IF EXISTS prune_and_insert_history`,
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
