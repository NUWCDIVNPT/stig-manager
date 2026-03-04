const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  // New table to hold per-collection task configurations
  `CREATE TABLE task_collection_config (
    tccId INT NOT NULL AUTO_INCREMENT,
    taskId INT NOT NULL,
    collectionId INT NOT NULL,
    config JSON NOT NULL,
    PRIMARY KEY (tccId),
    UNIQUE INDEX idx_task_collection (taskId, collectionId),
    CONSTRAINT fk_tcc_taskId FOREIGN KEY (taskId) REFERENCES task(taskId) ON DELETE CASCADE,
    CONSTRAINT fk_tcc_collectionId FOREIGN KEY (collectionId) REFERENCES collection(collectionId) ON DELETE CASCADE
  )`,

  // Add collectionId column to task_output for collection-scoped logging
  `ALTER TABLE task_output ADD COLUMN collectionId INT DEFAULT NULL`,

  // Insert the ReviewAging task
  `INSERT INTO task (taskId, name, description, command) VALUES
    (5, 'ReviewAging', 'Apply configured review aging rules per collection', 'review_aging()')`,

  // Stored procedure to write collection-scoped task output
  `DROP PROCEDURE IF EXISTS task_output_collection`,
  `CREATE PROCEDURE task_output_collection(
    IN in_type VARCHAR(45),
    IN in_message VARCHAR(255),
    IN in_collectionId INT
  )
    BEGIN
      IF in_message IS NULL THEN SET in_message = ''; END IF;
      INSERT INTO task_output (runId, taskId, type, message, collectionId)
        VALUES (@runId, @taskId, in_type, in_message, in_collectionId);
    END`,

  // Stored procedure to apply review aging rules per collection.
  //
  // Overall flow:
  //   1. Iterate over each enabled collection that has a config for taskId=5
  //   2. For each collection, iterate over the rules in its JSON config array
  //   3. For each enabled rule, find matching reviews and either delete or update them
  //
  // The config JSON is an array of rule objects. Each rule has:
  //   triggerField  - which timestamp column to evaluate: 'ts', 'statusTs', or 'touchTs'
  //   triggerBasis  - reference point: 'now' or an ISO 8601 timestamp string
  //   triggerInterval - age threshold in seconds
  //   triggerAction - what to do with matching reviews: 'delete' or 'update'
  //   updateField   - (for 'update' action) which field to change: 'status' or 'result'
  //   updateValue   - (for 'update' action) target value: a named value, '-' (decrement), or '+' (increment)
  //   updateFilter  - optional scope restriction: { assetIds: [], labelIds: [], benchmarkIds: [] }
  //   updateUserId  - userId to attribute the change to (0 = system/NULL)
  //   enabled       - whether this rule is active
  //
  // A review matches a rule when:
  //   review[triggerField] < (triggerBasis - triggerInterval seconds)
  //
  // Logging:
  //   task_output()            - generic messages visible to App Managers (collectionId IS NULL)
  //   task_output_collection() - per-collection messages visible to Collection Owners/Managers
  `DROP PROCEDURE IF EXISTS review_aging`,
  `CREATE PROCEDURE review_aging()
    main:BEGIN
      -- Cursor control
      DECLARE v_done INT DEFAULT FALSE;
      -- Current collection being processed
      DECLARE v_collectionId INT;
      DECLARE v_config JSON;
      DECLARE v_collectionCount INT DEFAULT 0;
      -- Current rule being processed (rules are elements of the v_config JSON array)
      DECLARE v_ruleCount INT;
      DECLARE v_ruleIdx INT;
      DECLARE v_rule JSON;
      -- Rule properties extracted from the current JSON rule object
      DECLARE v_triggerField VARCHAR(45);
      DECLARE v_triggerBasis VARCHAR(255);
      DECLARE v_triggerInterval INT;
      DECLARE v_triggerAction VARCHAR(45);
      DECLARE v_updateField VARCHAR(45);
      DECLARE v_updateValue VARCHAR(45);
      DECLARE v_updateFilter JSON;
      DECLARE v_updateUserId INT;
      DECLARE v_enabled VARCHAR(10);
      -- Count of reviews matched by the current rule
      DECLARE v_numReviewIds INT;
      -- Batch processing: process reviews in chunks of this size
      DECLARE v_incrementValue INT DEFAULT 10000;
      DECLARE v_curMinId BIGINT;
      DECLARE v_curMaxId BIGINT;
      -- Resolved integer IDs for named status/result values
      DECLARE v_newStatusId INT;
      DECLARE v_newResultId INT;

      -- Cursor: select all enabled collections that have a ReviewAging config (taskId=5)
      DECLARE cur_collections CURSOR FOR
        SELECT tcc.collectionId, tcc.config
        FROM task_collection_config tcc
        INNER JOIN collection c ON tcc.collectionId = c.collectionId
        WHERE tcc.taskId = 5
        AND c.state = 'enabled';
      DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

      -- On any SQL error, log it and re-raise so run_job marks the run as failed
      DECLARE EXIT HANDLER FOR SQLEXCEPTION
      BEGIN
        DECLARE err_code INT;
        DECLARE err_msg TEXT;
        GET STACKED DIAGNOSTICS CONDITION 1 err_code = MYSQL_ERRNO, err_msg = MESSAGE_TEXT;
        CALL task_output('error', CONCAT('code: ', err_code, ' message: ', err_msg));
        RESIGNAL;
      END;

      -- Runtime context is available via session variables @runId and @taskId (set by run_job)
      CALL task_output('info', 'task started');

      -- === OUTER LOOP: iterate over each collection with a config ===
      OPEN cur_collections;
      collection_loop: LOOP
        FETCH cur_collections INTO v_collectionId, v_config;
        IF v_done THEN
          LEAVE collection_loop;
        END IF;

        SET v_collectionCount = v_collectionCount + 1;
        CALL task_output_collection('info', CONCAT('processing collection ', v_collectionId), v_collectionId);

        -- v_config is a JSON array of rule objects; iterate by index
        SET v_ruleCount = JSON_LENGTH(v_config);
        SET v_ruleIdx = 0;

        -- === INNER LOOP: iterate over each rule in this collection's config ===
        rule_loop: WHILE v_ruleIdx < v_ruleCount DO
          -- Extract the current rule object from the JSON array
          SET v_rule = JSON_EXTRACT(v_config, CONCAT('$[', v_ruleIdx, ']'));
          SET v_enabled = JSON_UNQUOTE(JSON_EXTRACT(v_rule, '$.enabled'));

          -- Skip disabled rules
          IF v_enabled = 'true' OR v_enabled = '1' THEN
            -- Extract all rule properties from the JSON object
            SET v_triggerField = JSON_UNQUOTE(JSON_EXTRACT(v_rule, '$.triggerField'));
            SET v_triggerBasis = JSON_UNQUOTE(JSON_EXTRACT(v_rule, '$.triggerBasis'));
            SET v_triggerInterval = JSON_EXTRACT(v_rule, '$.triggerInterval');
            SET v_triggerAction = JSON_UNQUOTE(JSON_EXTRACT(v_rule, '$.triggerAction'));
            SET v_updateField = JSON_UNQUOTE(JSON_EXTRACT(v_rule, '$.updateField'));
            SET v_updateValue = JSON_UNQUOTE(JSON_EXTRACT(v_rule, '$.updateValue'));
            SET v_updateFilter = JSON_EXTRACT(v_rule, '$.updateFilter');
            SET v_updateUserId = JSON_EXTRACT(v_rule, '$.updateUserId');

            -- Validate triggerField to prevent SQL injection (it's used in dynamic SQL below)
            IF v_triggerField NOT IN ('ts', 'statusTs', 'touchTs') THEN
              CALL task_output_collection('error',
                CONCAT('rule ', v_ruleIdx, ': invalid triggerField: ', v_triggerField),
                v_collectionId);
              SET v_ruleIdx = v_ruleIdx + 1;
              ITERATE rule_loop;
            END IF;

            CALL task_output_collection('info',
              CONCAT('rule ', v_ruleIdx, ': ', v_triggerAction, ' reviews where ',
                     v_triggerField, ' older than ', v_triggerInterval, 's from ',
                     IF(v_triggerBasis = 'now', 'now', v_triggerBasis)),
              v_collectionId);

            -- === STEP 1: Build a temp table of reviewIds that match this rule ===
            -- Dynamic SQL is required because the trigger column name (v_triggerField) is variable.
            -- The resulting query finds reviews in this collection's enabled assets where
            -- the trigger timestamp is older than (triggerBasis - triggerInterval seconds).
            DROP TEMPORARY TABLE IF EXISTS t_aging_reviewIds;

            SET @aging_sql = CONCAT(
              'CREATE TEMPORARY TABLE t_aging_reviewIds (seq INT AUTO_INCREMENT PRIMARY KEY, reviewId INT) ',
              'SELECT r.reviewId FROM review r ',
              'INNER JOIN asset a ON r.assetId = a.assetId ',
              'WHERE a.collectionId = ', v_collectionId, ' ',
              'AND a.state = ''enabled'' ',
              'AND r.', v_triggerField, ' < ',
              IF(v_triggerBasis = 'now',
                CONCAT('DATE_SUB(NOW(), INTERVAL ', v_triggerInterval, ' SECOND)'),
                CONCAT('DATE_SUB(''', v_triggerBasis, ''', INTERVAL ', v_triggerInterval, ' SECOND)')
              )
            );

            -- Narrow the matched reviews by optional filters (each non-empty array adds an AND condition)

            -- Filter: only include reviews for specific assetIds
            IF v_updateFilter IS NOT NULL
               AND JSON_EXTRACT(v_updateFilter, '$.assetIds') IS NOT NULL
               AND JSON_LENGTH(JSON_EXTRACT(v_updateFilter, '$.assetIds')) > 0 THEN
              SET @aging_sql = CONCAT(@aging_sql,
                ' AND r.assetId IN (SELECT jt.assetId FROM JSON_TABLE(',
                QUOTE(CAST(JSON_EXTRACT(v_updateFilter, '$.assetIds') AS CHAR)),
                ', ''$[*]'' COLUMNS(assetId INT PATH ''$'')) jt)');
            END IF;

            -- Filter: only include reviews for assets that have specific labels (by UUID)
            IF v_updateFilter IS NOT NULL
               AND JSON_EXTRACT(v_updateFilter, '$.labelIds') IS NOT NULL
               AND JSON_LENGTH(JSON_EXTRACT(v_updateFilter, '$.labelIds')) > 0 THEN
              SET @aging_sql = CONCAT(@aging_sql,
                ' AND r.assetId IN (',
                'SELECT cla.assetId FROM collection_label_asset_map cla ',
                'INNER JOIN collection_label cl ON cla.clId = cl.clId ',
                'WHERE BIN_TO_UUID(cl.uuid, 1) IN (',
                'SELECT jt.labelId FROM JSON_TABLE(',
                QUOTE(CAST(JSON_EXTRACT(v_updateFilter, '$.labelIds') AS CHAR)),
                ', ''$[*]'' COLUMNS(labelId VARCHAR(36) PATH ''$'')) jt))');
            END IF;

            -- Filter: only include reviews for assets mapped to specific STIGs (by benchmarkId)
            IF v_updateFilter IS NOT NULL
               AND JSON_EXTRACT(v_updateFilter, '$.benchmarkIds') IS NOT NULL
               AND JSON_LENGTH(JSON_EXTRACT(v_updateFilter, '$.benchmarkIds')) > 0 THEN
              SET @aging_sql = CONCAT(@aging_sql,
                ' AND r.assetId IN (',
                'SELECT sa.assetId FROM stig_asset_map sa ',
                'WHERE sa.benchmarkId IN (',
                'SELECT jt.benchmarkId FROM JSON_TABLE(',
                QUOTE(CAST(JSON_EXTRACT(v_updateFilter, '$.benchmarkIds') AS CHAR)),
                ', ''$[*]'' COLUMNS(benchmarkId VARCHAR(255) PATH ''$'')) jt))');
            END IF;

            -- Execute the dynamic SQL to populate t_aging_reviewIds
            PREPARE stmt_aging FROM @aging_sql;
            EXECUTE stmt_aging;
            DEALLOCATE PREPARE stmt_aging;

            -- Get the count of matched reviews (seq is auto-increment so MAX = count)
            SELECT MAX(seq) INTO v_numReviewIds FROM t_aging_reviewIds;
            CALL task_output_collection('info',
              CONCAT('rule ', v_ruleIdx, ': found ', IFNULL(v_numReviewIds, 0), ' matching reviews'),
              v_collectionId);

            IF v_numReviewIds > 0 THEN
              -- === STEP 2: Snapshot current review state into review_history (audit trail) ===
              INSERT INTO review_history (
                reviewId, ruleId, resultId, detail, comment, autoResult,
                ts, userId, statusText, statusUserId, statusTs, statusId,
                touchTs, resultEngine
              ) SELECT
                r.reviewId, r.ruleId, r.resultId, LEFT(r.detail, 32767),
                LEFT(r.comment, 32767), r.autoResult, r.ts, r.userId,
                r.statusText, r.statusUserId, r.statusTs, r.statusId,
                r.touchTs,
                CASE WHEN r.resultEngine = 0 THEN NULL ELSE r.resultEngine END
              FROM review r
              WHERE r.reviewId IN (SELECT reviewId FROM t_aging_reviewIds);

              -- === STEP 3: Apply the configured action to matched reviews ===
              IF v_triggerAction = 'delete' THEN
                -- Delete matched reviews in batches to avoid locking too many rows at once
                SET v_curMinId = 1;
                SET v_curMaxId = v_curMinId + v_incrementValue;
                REPEAT
                  DELETE FROM review WHERE reviewId IN (
                    SELECT reviewId FROM t_aging_reviewIds
                    WHERE seq >= v_curMinId AND seq < v_curMaxId
                  );
                  SET v_curMinId = v_curMinId + v_incrementValue;
                  SET v_curMaxId = v_curMaxId + v_incrementValue;
                UNTIL ROW_COUNT() = 0 END REPEAT;

                CALL task_output_collection('info',
                  CONCAT('rule ', v_ruleIdx, ': deleted ', v_numReviewIds, ' reviews'),
                  v_collectionId);

              ELSEIF v_triggerAction = 'update' THEN
                -- === Update the status field ===
                -- Status enum: saved=0, submitted=1, rejected=2, accepted=3
                IF v_updateField = 'status' THEN
                  -- Map named updateValue to the corresponding statusId integer
                  SET v_newStatusId = CASE v_updateValue
                    WHEN 'saved' THEN 0
                    WHEN 'submitted' THEN 1
                    WHEN 'approved' THEN 3
                    ELSE NULL
                  END;

                  -- Batch update reviews
                  SET v_curMinId = 1;
                  SET v_curMaxId = v_curMinId + v_incrementValue;
                  REPEAT
                    IF v_updateValue = '-' THEN
                      -- Relative shift: decrement status by one level (floor at 0/saved)
                      UPDATE review r
                      SET r.statusId = GREATEST(0, r.statusId - 1),
                          r.statusTs = NOW(),
                          r.statusUserId = IF(v_updateUserId = 0, NULL, v_updateUserId)
                      WHERE r.reviewId IN (
                        SELECT reviewId FROM t_aging_reviewIds
                        WHERE seq >= v_curMinId AND seq < v_curMaxId
                      );
                    ELSEIF v_updateValue = '+' THEN
                      -- Relative shift: increment status by one level (ceiling at 3/accepted)
                      UPDATE review r
                      SET r.statusId = LEAST(3, r.statusId + 1),
                          r.statusTs = NOW(),
                          r.statusUserId = IF(v_updateUserId = 0, NULL, v_updateUserId)
                      WHERE r.reviewId IN (
                        SELECT reviewId FROM t_aging_reviewIds
                        WHERE seq >= v_curMinId AND seq < v_curMaxId
                      );
                    ELSEIF v_newStatusId IS NOT NULL THEN
                      -- Absolute value: set status to the specific named value
                      UPDATE review r
                      SET r.statusId = v_newStatusId,
                          r.statusTs = NOW(),
                          r.statusUserId = IF(v_updateUserId = 0, NULL, v_updateUserId)
                      WHERE r.reviewId IN (
                        SELECT reviewId FROM t_aging_reviewIds
                        WHERE seq >= v_curMinId AND seq < v_curMaxId
                      );
                    END IF;
                    SET v_curMinId = v_curMinId + v_incrementValue;
                    SET v_curMaxId = v_curMaxId + v_incrementValue;
                  UNTIL ROW_COUNT() = 0 END REPEAT;

                  CALL task_output_collection('info',
                    CONCAT('rule ', v_ruleIdx, ': updated status to ', v_updateValue, ' for ', v_numReviewIds, ' reviews'),
                    v_collectionId);

                -- === Update the result field ===
                -- Result enum: notchecked=1, notapplicable=2, pass=3, fail=4, ..., informational=8, fixed=9
                ELSEIF v_updateField = 'result' THEN
                  -- Map named updateValue to the corresponding resultId integer
                  SET v_newResultId = CASE v_updateValue
                    WHEN 'notReviewed' THEN 1
                    WHEN 'informational' THEN 8
                    ELSE NULL
                  END;

                  -- Batch update reviews
                  SET v_curMinId = 1;
                  SET v_curMaxId = v_curMinId + v_incrementValue;
                  REPEAT
                    IF v_updateValue = '-' THEN
                      -- Relative shift: decrement result by one level (floor at 1/notchecked)
                      UPDATE review r
                      SET r.resultId = GREATEST(1, r.resultId - 1),
                          r.ts = NOW(),
                          r.userId = IF(v_updateUserId = 0, NULL, v_updateUserId)
                      WHERE r.reviewId IN (
                        SELECT reviewId FROM t_aging_reviewIds
                        WHERE seq >= v_curMinId AND seq < v_curMaxId
                      );
                    ELSEIF v_updateValue = '+' THEN
                      -- Relative shift: increment result by one level (ceiling at 9/fixed)
                      UPDATE review r
                      SET r.resultId = LEAST(9, r.resultId + 1),
                          r.ts = NOW(),
                          r.userId = IF(v_updateUserId = 0, NULL, v_updateUserId)
                      WHERE r.reviewId IN (
                        SELECT reviewId FROM t_aging_reviewIds
                        WHERE seq >= v_curMinId AND seq < v_curMaxId
                      );
                    ELSEIF v_newResultId IS NOT NULL THEN
                      -- Absolute value: set result to the specific named value
                      UPDATE review r
                      SET r.resultId = v_newResultId,
                          r.ts = NOW(),
                          r.userId = IF(v_updateUserId = 0, NULL, v_updateUserId)
                      WHERE r.reviewId IN (
                        SELECT reviewId FROM t_aging_reviewIds
                        WHERE seq >= v_curMinId AND seq < v_curMaxId
                      );
                    END IF;
                    SET v_curMinId = v_curMinId + v_incrementValue;
                    SET v_curMaxId = v_curMaxId + v_incrementValue;
                  UNTIL ROW_COUNT() = 0 END REPEAT;

                  CALL task_output_collection('info',
                    CONCAT('rule ', v_ruleIdx, ': updated result to ', v_updateValue, ' for ', v_numReviewIds, ' reviews'),
                    v_collectionId);
                END IF; -- updateField
              END IF; -- triggerAction
            END IF; -- v_numReviewIds > 0

            DROP TEMPORARY TABLE IF EXISTS t_aging_reviewIds;
          END IF; -- rule enabled

          SET v_ruleIdx = v_ruleIdx + 1;
        END WHILE rule_loop;

        CALL task_output_collection('info',
          CONCAT('finished collection ', v_collectionId),
          v_collectionId);
      END LOOP;
      CLOSE cur_collections;

      CALL task_output('info', CONCAT('processed ', v_collectionCount, ' collections'));
      CALL task_output('info', 'task finished');
    END`,
]

const downMigration = [
  `DROP PROCEDURE IF EXISTS review_aging`,
  `DROP PROCEDURE IF EXISTS task_output_collection`,
  `DELETE FROM task WHERE taskId = 5`,
  `ALTER TABLE task_output DROP COLUMN collectionId`,
  `DROP TABLE IF EXISTS task_collection_config`,
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
