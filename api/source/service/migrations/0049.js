const MigrationHandler = require('./lib/MigrationHandler')

// Fixes the ReviewAging task for reviews whose rule appears in more than
// one STIG. Such a review was listed once per STIG in the candidate set,
// and the duplicate reviewId broke the stats refresh (ER_DUP_ENTRY on its
// temp table primary key), aborting the rule for the collection. The
// collection-scoped handler also did not roll back the open batch
// transaction, so the batch's review updates were kept without their
// stats being refreshed.
//
// - the batch is built from DISTINCT reviewIds
// - affected stig_asset_map rows are resolved up front for both actions
//   and the stats refresh is called by saIds, as the delete path already did
// - the collection-scoped handler rolls back before logging
// - the collection-scoped handler closes the rule cursor; an open cursor
//   left behind by a failed collection made every later collection in the
//   run fail with 1325 (Cursor is already open)

const upMigration = [
  // Main ReviewAging stored procedure
  `DROP PROCEDURE IF EXISTS review_aging`,
  `CREATE PROCEDURE review_aging()
    BEGIN
      DECLARE v_collectionId INT;
      DECLARE v_ruleId INT;
      DECLARE v_ordinal INT;
      DECLARE v_enabled TINYINT(1);
      DECLARE v_triggerField VARCHAR(20);
      DECLARE v_triggerInterval INT;
      DECLARE v_triggerAction VARCHAR(20);
      DECLARE v_updateField VARCHAR(20);
      DECLARE v_updateValue VARCHAR(20);
      DECLARE v_assetId INT;
      DECLARE v_clId INT;
      DECLARE v_benchmarkId VARCHAR(255);
      DECLARE v_cutoff DATETIME;
      DECLARE v_numReviews INT;
      DECLARE v_maxReviews INT;
      DECLARE v_done INT DEFAULT FALSE;

      DECLARE cur CURSOR FOR
        SELECT DISTINCT rar.collectionId FROM review_aging_rule rar
        INNER JOIN enabled_collection ec USING (collectionId)
        ORDER BY rar.collectionId;
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
        FETCH cur INTO v_collectionId;
        IF v_done THEN LEAVE collection_loop; END IF;

        SET @taskCollectionId = v_collectionId;
        CALL task_output('info', concat('processing collectionId ', v_collectionId));
        CALL task_output_collection('info', concat('processing collectionId ', v_collectionId));

        BEGIN  -- collection-scoped error handling (no transaction at this scope)
          -- The rule cursor is declared here, in the same block as the handler, so the
          -- handler can close it: a cursor left open by an abandoned inner block
          -- makes the next collection fail with 1325 (Cursor is already open).
          DECLARE v_rule_done INT DEFAULT FALSE;
          DECLARE cur_rules CURSOR FOR
            SELECT ruleId, ordinal, enabled, triggerField, triggerInterval,
                   triggerAction, updateField, updateValue, assetId, clId, benchmarkId
            FROM review_aging_rule
            WHERE collectionId = v_collectionId
            ORDER BY ordinal;
          DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_rule_done = TRUE;
          DECLARE EXIT HANDLER FOR SQLEXCEPTION
          BEGIN
            DECLARE err_code INT;
            DECLARE err_msg TEXT;
            GET STACKED DIAGNOSTICS CONDITION 1 err_code = MYSQL_ERRNO, err_msg = MESSAGE_TEXT;
            ROLLBACK;
            BEGIN
              DECLARE CONTINUE HANDLER FOR 1326 BEGIN END;  -- cursor is not open
              CLOSE cur_rules;
            END;
            DROP TEMPORARY TABLE IF EXISTS t_pre_approved;
            DROP TEMPORARY TABLE IF EXISTS t_reviewIds;
            CALL task_output_collection('error', concat('code: ', err_code, ' message: ', err_msg));
            CALL task_output('error', concat('error processing collectionId ', v_collectionId, ': code: ', err_code, ' message: ', err_msg));
          END;

          BEGIN
            OPEN cur_rules;
            rule_loop: LOOP
              FETCH cur_rules INTO
                v_ruleId, v_ordinal, v_enabled, v_triggerField, v_triggerInterval,
                v_triggerAction, v_updateField, v_updateValue, v_assetId, v_clId, v_benchmarkId;
              IF v_rule_done THEN LEAVE rule_loop; END IF;

              IF v_enabled != 1 THEN
                ITERATE rule_loop;
              END IF;

              -- Compute cutoff: always relative to NOW()
              SET v_cutoff = DATE_SUB(NOW(), INTERVAL v_triggerInterval SECOND);

              CALL task_output_collection('info',
                CONCAT('rule ordinal ', v_ordinal, ': ', v_triggerAction,
                       IF(v_triggerAction = 'delete', ' reviews',
                          CONCAT(' ', v_updateField, '=', v_updateValue)),
                       ' when ', v_triggerField, ' older than ', v_triggerInterval, 's'));

              -- Phase 1: Identify eligible reviews into t_pre_approved
              -- Sorted by assetId, benchmarkId to group related stig-asset pairs for stats efficiency
              DROP TEMPORARY TABLE IF EXISTS t_pre_approved;
              CREATE TEMPORARY TABLE t_pre_approved (
                seq INT AUTO_INCREMENT PRIMARY KEY,
                reviewId INT NOT NULL,
                assetId INT NOT NULL,
                benchmarkId VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_as_cs NOT NULL,
                KEY idx_pa_reviewId (reviewId)
              ) ENGINE=InnoDB;

              SET @v_sql = CONCAT(
                'INSERT INTO t_pre_approved (reviewId, assetId, benchmarkId) ',
                'SELECT DISTINCT r.reviewId, r.assetId, rev.benchmarkId ',
                'FROM review r ',
                'JOIN enabled_asset a ON r.assetId = a.assetId ',
                'JOIN rule_version_check_digest rvcd ON (rvcd.version = r.version AND rvcd.checkDigest = r.checkDigest) ',
                'JOIN rev_group_rule_map rgr ON rgr.ruleId = rvcd.ruleId ',
                'JOIN revision rev ON rev.revId = rgr.revId ',
                'WHERE a.collectionId = ', v_collectionId,
                ' AND r.', v_triggerField, ' < ''', DATE_FORMAT(v_cutoff, '%Y-%m-%d %H:%i:%s'), ''''
              );

              -- Exclude reviews already in the desired state
              IF v_triggerAction = 'update' THEN
                IF v_updateField = 'status' THEN
                  SET @v_sql = CONCAT(@v_sql,
                    ' AND r.statusId != (SELECT statusId FROM status WHERE api = ''', v_updateValue, ''' LIMIT 1)');
                ELSEIF v_updateField = 'result' THEN
                  SET @v_sql = CONCAT(@v_sql,
                    ' AND r.resultId != (SELECT resultId FROM result WHERE api = ''', v_updateValue, ''' LIMIT 1)');
                END IF;
              END IF;

              -- Apply target scoping
              IF v_assetId IS NOT NULL AND v_benchmarkId IS NULL THEN
                -- Asset target only: all reviews on this asset
                SET @v_sql = CONCAT(@v_sql, ' AND r.assetId = ', v_assetId);
              ELSEIF v_assetId IS NOT NULL AND v_benchmarkId IS NOT NULL THEN
                -- Asset + benchmark: reviews on this asset for this STIG only
                SET @v_sql = CONCAT(@v_sql,
                  ' AND r.assetId = ', v_assetId,
                  ' AND rev.benchmarkId = ''', v_benchmarkId, '''');
              ELSEIF v_clId IS NOT NULL AND v_benchmarkId IS NULL THEN
                -- Label target only: reviews on assets with this label
                SET @v_sql = CONCAT(@v_sql,
                  ' AND r.assetId IN (',
                  '  SELECT assetId FROM collection_label_asset_map WHERE clId = ', v_clId, ')');
              ELSEIF v_clId IS NOT NULL AND v_benchmarkId IS NOT NULL THEN
                -- Label + benchmark: reviews on labeled assets for this STIG only
                SET @v_sql = CONCAT(@v_sql,
                  ' AND r.assetId IN (',
                  '  SELECT assetId FROM collection_label_asset_map WHERE clId = ', v_clId, ')',
                  ' AND rev.benchmarkId = ''', v_benchmarkId, '''');
              ELSEIF v_benchmarkId IS NOT NULL THEN
                -- Benchmark only: all reviews for this STIG in the collection
                SET @v_sql = CONCAT(@v_sql,
                  ' AND rev.benchmarkId = ''', v_benchmarkId, '''');
              -- ELSE: all three NULL — no target restriction, rule applies to entire collection
              END IF;

              SET @v_sql = CONCAT(@v_sql, ' ORDER BY r.assetId, rev.benchmarkId');

              PREPARE stmt_aging FROM @v_sql;
              EXECUTE stmt_aging;
              DEALLOCATE PREPARE stmt_aging;

              SELECT COUNT(DISTINCT reviewId) INTO v_numReviews FROM t_pre_approved;
              CALL task_output_collection('info',
                CONCAT('rule ordinal ', v_ordinal, ': found ', IFNULL(v_numReviews, 0), ' reviews to ', v_triggerAction));

              -- Phase 2: Process pre-approved reviews in batches
              IF IFNULL(v_numReviews, 0) > 0 THEN
                BEGIN
                  DECLARE v_batchSize INT DEFAULT 5000;
                  DECLARE v_seqMin INT DEFAULT 1;
                  DECLARE v_batchSeqMin INT;
                  DECLARE v_batchSeqMax INT;
                  DECLARE v_numVerified INT;
                  DECLARE v_totalProcessed INT DEFAULT 0;
                  DECLARE v_progressMark INT;
                  DECLARE v_nextProgressLog INT DEFAULT CEIL(v_numReviews * 0.2);

                  CALL task_output_collection('info',
                    CONCAT('rule ordinal ', v_ordinal, ': processing ', v_numReviews, ' reviews'));

                  batch_loop: LOOP
                  -- Find seq range for this batch
                  SELECT MIN(seq), MAX(seq) INTO v_batchSeqMin, v_batchSeqMax
                  FROM (SELECT seq FROM t_pre_approved WHERE seq >= v_seqMin ORDER BY seq LIMIT v_batchSize) t;

                  IF v_batchSeqMin IS NULL THEN LEAVE batch_loop; END IF;

                  SET TRANSACTION ISOLATION LEVEL READ COMMITTED; -- Avoid locking rows when verifying/updating, to reduce contention with other transactions
                  START TRANSACTION;

                  -- Re-verify: candidates still meeting trigger condition
                  DROP TEMPORARY TABLE IF EXISTS t_reviewIds;
                  CREATE TEMPORARY TABLE t_reviewIds (seq INT AUTO_INCREMENT PRIMARY KEY, reviewId INT);

                  SET @v_verify_sql = CONCAT(
                    'INSERT INTO t_reviewIds (reviewId) ',
                    'SELECT DISTINCT pa.reviewId ',
                    'FROM t_pre_approved pa ',
                    'JOIN review r ON r.reviewId = pa.reviewId ',
                    'WHERE pa.seq BETWEEN ', v_batchSeqMin, ' AND ', v_batchSeqMax,
                    ' AND r.', v_triggerField, ' < DATE_SUB(NOW(), INTERVAL ', v_triggerInterval, ' SECOND)'
                  );

                  -- Exclude reviews already in the desired state
                  IF v_triggerAction = 'update' THEN
                    IF v_updateField = 'status' THEN
                      SET @v_verify_sql = CONCAT(@v_verify_sql,
                        ' AND r.statusId != (SELECT statusId FROM status WHERE api = ''', v_updateValue, ''' LIMIT 1)');
                    ELSEIF v_updateField = 'result' THEN
                      SET @v_verify_sql = CONCAT(@v_verify_sql,
                        ' AND r.resultId != (SELECT resultId FROM result WHERE api = ''', v_updateValue, ''' LIMIT 1)');
                    END IF;
                  END IF;

                  PREPARE stmt_verify FROM @v_verify_sql;
                  EXECUTE stmt_verify;
                  DEALLOCATE PREPARE stmt_verify;

                  SELECT MAX(seq) INTO v_numVerified FROM t_reviewIds;

                  IF IFNULL(v_numVerified, 0) > 0 THEN
                    -- Capture affected saIds before changing anything (a review can belong to several STIG-asset pairs)
                    SET @v_saIds = (
                      SELECT JSON_ARRAYAGG(saId) FROM (
                        SELECT DISTINCT sa.saId
                        FROM t_reviewIds tri
                        INNER JOIN review r ON tri.reviewId = r.reviewId
                        INNER JOIN rule_version_check_digest rvcd ON (rvcd.version = r.version AND rvcd.checkDigest = r.checkDigest)
                        INNER JOIN rev_group_rule_map rgr ON rgr.ruleId = rvcd.ruleId
                        INNER JOIN revision rev ON rev.revId = rgr.revId
                        INNER JOIN stig_asset_map sa ON (sa.assetId = r.assetId AND sa.benchmarkId = rev.benchmarkId)
                      ) AS distinct_saIds
                    );
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
                    END IF;
                    IF @v_saIds IS NOT NULL THEN
                      CALL update_stats_asset_stig(JSON_OBJECT('saIds', CAST(@v_saIds AS JSON)));
                    END IF;
                  END IF;

                  DROP TEMPORARY TABLE IF EXISTS t_reviewIds;
                  COMMIT;

                  SET v_totalProcessed = v_totalProcessed + IFNULL(v_numVerified, 0);
                  IF v_totalProcessed >= v_nextProgressLog THEN
                    CALL task_output_collection('info',
                      CONCAT('rule ordinal ', v_ordinal, ': ', v_totalProcessed, '/', v_numReviews, ' reviews processed'));
                    SET v_nextProgressLog = v_nextProgressLog + CEIL(v_numReviews * 0.2);
                  END IF;

                  SET v_seqMin = v_batchSeqMax + 1;
                  END LOOP batch_loop;

                  CALL task_output_collection('info',
                    CONCAT('rule ordinal ', v_ordinal, ': completed ', v_totalProcessed, ' reviews'));
                END;
              END IF;

              DROP TEMPORARY TABLE IF EXISTS t_pre_approved;
            END LOOP rule_loop;
            CLOSE cur_rules;
          END;  -- rule cursor block
        END;  -- collection-scoped error handling

        CALL task_output('info', CONCAT('finished collectionId ', v_collectionId));
        CALL task_output_collection('info', CONCAT('finished collectionId ', v_collectionId));
      END LOOP collection_loop;
      CLOSE cur;

      CALL task_output('info', 'task finished');
    END`,
]

// Restore the 0047 definition
const downMigration = [
  // Main ReviewAging stored procedure
  `DROP PROCEDURE IF EXISTS review_aging`,
  `CREATE PROCEDURE review_aging()
    BEGIN
      DECLARE v_collectionId INT;
      DECLARE v_ruleId INT;
      DECLARE v_ordinal INT;
      DECLARE v_enabled TINYINT(1);
      DECLARE v_triggerField VARCHAR(20);
      DECLARE v_triggerInterval INT;
      DECLARE v_triggerAction VARCHAR(20);
      DECLARE v_updateField VARCHAR(20);
      DECLARE v_updateValue VARCHAR(20);
      DECLARE v_assetId INT;
      DECLARE v_clId INT;
      DECLARE v_benchmarkId VARCHAR(255);
      DECLARE v_cutoff DATETIME;
      DECLARE v_numReviews INT;
      DECLARE v_maxReviews INT;
      DECLARE v_done INT DEFAULT FALSE;

      DECLARE cur CURSOR FOR
        SELECT DISTINCT rar.collectionId FROM review_aging_rule rar
        INNER JOIN enabled_collection ec USING (collectionId)
        ORDER BY rar.collectionId;
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
        FETCH cur INTO v_collectionId;
        IF v_done THEN LEAVE collection_loop; END IF;

        SET @taskCollectionId = v_collectionId;
        CALL task_output('info', concat('processing collectionId ', v_collectionId));
        CALL task_output_collection('info', concat('processing collectionId ', v_collectionId));

        BEGIN  -- collection-scoped error handling (no transaction at this scope)
          DECLARE EXIT HANDLER FOR SQLEXCEPTION
          BEGIN
            DECLARE err_code INT;
            DECLARE err_msg TEXT;
            GET STACKED DIAGNOSTICS CONDITION 1 err_code = MYSQL_ERRNO, err_msg = MESSAGE_TEXT;
            DROP TEMPORARY TABLE IF EXISTS t_pre_approved;
            DROP TEMPORARY TABLE IF EXISTS t_reviewIds;
            CALL task_output_collection('error', concat('code: ', err_code, ' message: ', err_msg));
            CALL task_output('error', concat('error processing collectionId ', v_collectionId, ': code: ', err_code, ' message: ', err_msg));
          END;

          -- Use a cursor for task rules within the collection
          BEGIN
            DECLARE v_rule_done INT DEFAULT FALSE;
            DECLARE cur_rules CURSOR FOR
              SELECT ruleId, ordinal, enabled, triggerField, triggerInterval,
                     triggerAction, updateField, updateValue, assetId, clId, benchmarkId
              FROM review_aging_rule
              WHERE collectionId = v_collectionId
              ORDER BY ordinal;
            DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_rule_done = TRUE;

            OPEN cur_rules;
            rule_loop: LOOP
              FETCH cur_rules INTO
                v_ruleId, v_ordinal, v_enabled, v_triggerField, v_triggerInterval,
                v_triggerAction, v_updateField, v_updateValue, v_assetId, v_clId, v_benchmarkId;
              IF v_rule_done THEN LEAVE rule_loop; END IF;

              IF v_enabled != 1 THEN
                ITERATE rule_loop;
              END IF;

              -- Compute cutoff: always relative to NOW()
              SET v_cutoff = DATE_SUB(NOW(), INTERVAL v_triggerInterval SECOND);

              CALL task_output_collection('info',
                CONCAT('rule ordinal ', v_ordinal, ': ', v_triggerAction,
                       IF(v_triggerAction = 'delete', ' reviews',
                          CONCAT(' ', v_updateField, '=', v_updateValue)),
                       ' when ', v_triggerField, ' older than ', v_triggerInterval, 's'));

              -- Phase 1: Identify eligible reviews into t_pre_approved
              -- Sorted by assetId, benchmarkId to group related stig-asset pairs for stats efficiency
              DROP TEMPORARY TABLE IF EXISTS t_pre_approved;
              CREATE TEMPORARY TABLE t_pre_approved (
                seq INT AUTO_INCREMENT PRIMARY KEY,
                reviewId INT NOT NULL,
                assetId INT NOT NULL,
                benchmarkId VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_as_cs NOT NULL,
                KEY idx_pa_reviewId (reviewId)
              ) ENGINE=InnoDB;

              SET @v_sql = CONCAT(
                'INSERT INTO t_pre_approved (reviewId, assetId, benchmarkId) ',
                'SELECT DISTINCT r.reviewId, r.assetId, rev.benchmarkId ',
                'FROM review r ',
                'JOIN enabled_asset a ON r.assetId = a.assetId ',
                'JOIN rule_version_check_digest rvcd ON (rvcd.version = r.version AND rvcd.checkDigest = r.checkDigest) ',
                'JOIN rev_group_rule_map rgr ON rgr.ruleId = rvcd.ruleId ',
                'JOIN revision rev ON rev.revId = rgr.revId ',
                'WHERE a.collectionId = ', v_collectionId,
                ' AND r.', v_triggerField, ' < ''', DATE_FORMAT(v_cutoff, '%Y-%m-%d %H:%i:%s'), ''''
              );

              -- Exclude reviews already in the desired state
              IF v_triggerAction = 'update' THEN
                IF v_updateField = 'status' THEN
                  SET @v_sql = CONCAT(@v_sql,
                    ' AND r.statusId != (SELECT statusId FROM status WHERE api = ''', v_updateValue, ''' LIMIT 1)');
                ELSEIF v_updateField = 'result' THEN
                  SET @v_sql = CONCAT(@v_sql,
                    ' AND r.resultId != (SELECT resultId FROM result WHERE api = ''', v_updateValue, ''' LIMIT 1)');
                END IF;
              END IF;

              -- Apply target scoping
              IF v_assetId IS NOT NULL AND v_benchmarkId IS NULL THEN
                -- Asset target only: all reviews on this asset
                SET @v_sql = CONCAT(@v_sql, ' AND r.assetId = ', v_assetId);
              ELSEIF v_assetId IS NOT NULL AND v_benchmarkId IS NOT NULL THEN
                -- Asset + benchmark: reviews on this asset for this STIG only
                SET @v_sql = CONCAT(@v_sql,
                  ' AND r.assetId = ', v_assetId,
                  ' AND rev.benchmarkId = ''', v_benchmarkId, '''');
              ELSEIF v_clId IS NOT NULL AND v_benchmarkId IS NULL THEN
                -- Label target only: reviews on assets with this label
                SET @v_sql = CONCAT(@v_sql,
                  ' AND r.assetId IN (',
                  '  SELECT assetId FROM collection_label_asset_map WHERE clId = ', v_clId, ')');
              ELSEIF v_clId IS NOT NULL AND v_benchmarkId IS NOT NULL THEN
                -- Label + benchmark: reviews on labeled assets for this STIG only
                SET @v_sql = CONCAT(@v_sql,
                  ' AND r.assetId IN (',
                  '  SELECT assetId FROM collection_label_asset_map WHERE clId = ', v_clId, ')',
                  ' AND rev.benchmarkId = ''', v_benchmarkId, '''');
              ELSEIF v_benchmarkId IS NOT NULL THEN
                -- Benchmark only: all reviews for this STIG in the collection
                SET @v_sql = CONCAT(@v_sql,
                  ' AND rev.benchmarkId = ''', v_benchmarkId, '''');
              -- ELSE: all three NULL — no target restriction, rule applies to entire collection
              END IF;

              SET @v_sql = CONCAT(@v_sql, ' ORDER BY r.assetId, rev.benchmarkId');

              PREPARE stmt_aging FROM @v_sql;
              EXECUTE stmt_aging;
              DEALLOCATE PREPARE stmt_aging;

              SELECT COUNT(*) INTO v_numReviews FROM t_pre_approved;
              CALL task_output_collection('info',
                CONCAT('rule ordinal ', v_ordinal, ': found ', IFNULL(v_numReviews, 0), ' reviews to ', v_triggerAction));

              -- Phase 2: Process pre-approved reviews in batches
              IF IFNULL(v_numReviews, 0) > 0 THEN
                BEGIN
                  DECLARE v_batchSize INT DEFAULT 5000;
                  DECLARE v_seqMin INT DEFAULT 1;
                  DECLARE v_batchSeqMin INT;
                  DECLARE v_batchSeqMax INT;
                  DECLARE v_numVerified INT;
                  DECLARE v_totalProcessed INT DEFAULT 0;
                  DECLARE v_progressMark INT;
                  DECLARE v_nextProgressLog INT DEFAULT CEIL(v_numReviews * 0.2);

                  CALL task_output_collection('info',
                    CONCAT('rule ordinal ', v_ordinal, ': processing ', v_numReviews, ' reviews'));

                  batch_loop: LOOP
                  -- Find seq range for this batch
                  SELECT MIN(seq), MAX(seq) INTO v_batchSeqMin, v_batchSeqMax
                  FROM (SELECT seq FROM t_pre_approved WHERE seq >= v_seqMin ORDER BY seq LIMIT v_batchSize) t;

                  IF v_batchSeqMin IS NULL THEN LEAVE batch_loop; END IF;

                  SET TRANSACTION ISOLATION LEVEL READ COMMITTED; -- Avoid locking rows when verifying/updating, to reduce contention with other transactions
                  START TRANSACTION;

                  -- Re-verify: candidates still meeting trigger condition
                  DROP TEMPORARY TABLE IF EXISTS t_reviewIds;
                  CREATE TEMPORARY TABLE t_reviewIds (seq INT AUTO_INCREMENT PRIMARY KEY, reviewId INT);

                  SET @v_verify_sql = CONCAT(
                    'INSERT INTO t_reviewIds (reviewId) ',
                    'SELECT pa.reviewId ',
                    'FROM t_pre_approved pa ',
                    'JOIN review r ON r.reviewId = pa.reviewId ',
                    'WHERE pa.seq BETWEEN ', v_batchSeqMin, ' AND ', v_batchSeqMax,
                    ' AND r.', v_triggerField, ' < DATE_SUB(NOW(), INTERVAL ', v_triggerInterval, ' SECOND)'
                  );

                  -- Exclude reviews already in the desired state
                  IF v_triggerAction = 'update' THEN
                    IF v_updateField = 'status' THEN
                      SET @v_verify_sql = CONCAT(@v_verify_sql,
                        ' AND r.statusId != (SELECT statusId FROM status WHERE api = ''', v_updateValue, ''' LIMIT 1)');
                    ELSEIF v_updateField = 'result' THEN
                      SET @v_verify_sql = CONCAT(@v_verify_sql,
                        ' AND r.resultId != (SELECT resultId FROM result WHERE api = ''', v_updateValue, ''' LIMIT 1)');
                    END IF;
                  END IF;

                  PREPARE stmt_verify FROM @v_verify_sql;
                  EXECUTE stmt_verify;
                  DEALLOCATE PREPARE stmt_verify;

                  SELECT MAX(seq) INTO v_numVerified FROM t_reviewIds;

                  IF IFNULL(v_numVerified, 0) > 0 THEN
                    IF v_triggerAction = 'delete' THEN
                      -- Capture affected saIds before deleting
                      SET @v_deleteSaIds = (
                        SELECT JSON_ARRAYAGG(saId) FROM (
                          SELECT DISTINCT sa.saId
                          FROM t_reviewIds tri
                          INNER JOIN review r ON tri.reviewId = r.reviewId
                          INNER JOIN rule_version_check_digest rvcd ON (rvcd.version = r.version AND rvcd.checkDigest = r.checkDigest)
                          INNER JOIN rev_group_rule_map rgr ON rgr.ruleId = rvcd.ruleId
                          INNER JOIN revision rev ON rev.revId = rgr.revId
                          INNER JOIN stig_asset_map sa ON (sa.assetId = r.assetId AND sa.benchmarkId = rev.benchmarkId)
                        ) AS distinct_saIds
                      );
                      CALL delete_review_batch();
                      IF @v_deleteSaIds IS NOT NULL THEN
                        CALL update_stats_asset_stig(JSON_OBJECT('saIds', CAST(@v_deleteSaIds AS JSON)));
                      END IF;
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
                  COMMIT;

                  SET v_totalProcessed = v_totalProcessed + IFNULL(v_numVerified, 0);
                  IF v_totalProcessed >= v_nextProgressLog THEN
                    CALL task_output_collection('info',
                      CONCAT('rule ordinal ', v_ordinal, ': ', v_totalProcessed, '/', v_numReviews, ' reviews processed'));
                    SET v_nextProgressLog = v_nextProgressLog + CEIL(v_numReviews * 0.2);
                  END IF;

                  SET v_seqMin = v_batchSeqMax + 1;
                  END LOOP batch_loop;

                  CALL task_output_collection('info',
                    CONCAT('rule ordinal ', v_ordinal, ': completed ', v_totalProcessed, ' reviews'));
                END;
              END IF;

              DROP TEMPORARY TABLE IF EXISTS t_pre_approved;
            END LOOP rule_loop;
            CLOSE cur_rules;
          END;  -- rule cursor block
        END;  -- collection-scoped error handling

        CALL task_output('info', CONCAT('finished collectionId ', v_collectionId));
        CALL task_output_collection('info', CONCAT('finished collectionId ', v_collectionId));
      END LOOP collection_loop;
      CLOSE cur;

      CALL task_output('info', 'task finished');
    END`,
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
