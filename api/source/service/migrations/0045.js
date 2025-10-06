const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  `DROP TABLE IF EXISTS task`,
  `CREATE TABLE task (
    taskId INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(45) NOT NULL,
    description VARCHAR(255) NULL,
    command VARCHAR(255) NOT NULL,
    PRIMARY KEY (taskId),
    UNIQUE INDEX idx_task_name (name)
  )`,
  `INSERT INTO task (taskId, name, description, command) VALUES
    (1, 'WipeDeletedObjects', 'Wipe deleted collections and assets and their associated reviews', 'delete_disabled()'),
    (2, 'DeleteUnmappedReviews', 'Delete reviews that no longer match any rule in the system', 'delete_unmapped("system")'),
    (3, 'DeleteUnmappedAssetReviews', 'Delete reviews that no longer match an asset''s assigned rules', 'delete_unmapped("asset")'),
    (4, 'AnalyzeReviewTables', 'Analyze database tables for performance', 'analyze_tables(JSON_ARRAY("reviews", "review_history"))')
  `,

  `DROP TABLE IF EXISTS job`,
  `CREATE TABLE job (
    jobId INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(45) NOT NULL,
    description VARCHAR(255) NULL,
    createdBy INT NULL,
    updatedBy INT NULL,
    created TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated TIMESTAMP(3) NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (jobId),
    UNIQUE INDEX idx_job_name (name),
    CONSTRAINT fk_job_updatedBy FOREIGN KEY (updatedBy) REFERENCES user_data(userId) ON DELETE RESTRICT,
    CONSTRAINT fk_job_createdBy FOREIGN KEY (createdBy) REFERENCES user_data(userId) ON DELETE RESTRICT
  )`,
  `INSERT INTO job ( jobId, name, description, createdBy) VALUES
    (1, 'Cleanup Database', 'Wipe deleted collections and assets and their associated reviews', null),
    (2, 'Delete Unmapped Reviews', 'Delete reviews that no longer match any rule in the system', null),
    (3, 'Delete Unmapped Asset Reviews', 'Delete reviews that no longer match an asset''s assigned rules', null)
  `,
  `ALTER TABLE job AUTO_INCREMENT = 100`,

  `DROP TABLE IF EXISTS job_task_map`,
  `CREATE TABLE job_task_map (
    jtId INT NOT NULL AUTO_INCREMENT,
    jobId INT NOT NULL,
    taskId INT NOT NULL,
    created TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (jtId),
    CONSTRAINT fk_job_task_jobId FOREIGN KEY (jobId) REFERENCES job(jobId) ON DELETE CASCADE,
    CONSTRAINT fk_job_task_taskId FOREIGN KEY (taskId) REFERENCES task(taskId) ON DELETE CASCADE
  )`,
  `INSERT INTO job_task_map (jtId, jobId, taskId) VALUES
    (1, 1, 1),
    (2, 1, 4),
    (3, 2, 2),
    (4, 2, 4),
    (5, 3, 3),
    (6, 3, 4)
  `,
  `ALTER TABLE job_task_map AUTO_INCREMENT = 1000`,

  `DROP TABLE IF EXISTS job_run`,
  `CREATE TABLE job_run (
    jrId INT NOT NULL AUTO_INCREMENT,
    jobId INT NOT NULL,
    runId BINARY(16) NOT NULL,
    state VARCHAR(255) NULL,
    created TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (jrId),
    INDEX idx_job_run_runId (runId),
    CONSTRAINT fk_job_run_jobId FOREIGN KEY (jobId) REFERENCES job(jobId) ON DELETE CASCADE
  )`,

  `DROP TABLE IF EXISTS task_output`,
  `CREATE TABLE task_output (
    seq INT NOT NULL AUTO_INCREMENT,
    ts TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    runId BINARY(16) NULL,
    taskId INT NULL,
    type VARCHAR(45) NOT NULL,
    message VARCHAR(255) NOT NULL,
    PRIMARY KEY (seq),
    CONSTRAINT fk_task_output_runId FOREIGN KEY (runId) REFERENCES job_run(runId) ON DELETE CASCADE,
    CONSTRAINT fk_task_output_taskId FOREIGN KEY (taskId) REFERENCES task(taskId) ON DELETE CASCADE
  )`,

  `DROP PROCEDURE IF EXISTS get_runtime`,
  `CREATE PROCEDURE get_runtime(OUT out_runId BINARY(16), OUT out_taskId INT)
    BEGIN
      DECLARE v_table_exists INT DEFAULT 1;
      BEGIN
        DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET v_table_exists = 0;
        SET v_table_exists = 1;
        SELECT 1 FROM t_runtime LIMIT 1;
      END;
      IF v_table_exists = 1 THEN
        SELECT runId, taskId INTO out_runId, out_taskId FROM t_runtime LIMIT 1;
      ELSE
        SET out_runId = NULL;
        SET out_taskId = NULL;
      END IF;
    END`,

  `DROP procedure IF EXISTS run_job`,
  `CREATE PROCEDURE run_job(
    IN in_jobId INT,
    IN in_runIdStr VARCHAR(36)
  )
    main:BEGIN
        DECLARE v_ourId INT DEFAULT NULL;
        DECLARE v_done INT DEFAULT FALSE;
        DECLARE v_runId BINARY(16);
        DECLARE v_jrId INT;
        DECLARE v_numTasks INT;
        DECLARE v_currentTaskId INT;
        DECLARE v_currentTaskName VARCHAR(255);
        DECLARE v_currentCommand VARCHAR(255);
        DECLARE v_currentTaskNum INT DEFAULT 0;
        DECLARE v_param_string TEXT;
        DECLARE cur CURSOR FOR
          SELECT 
            jt.taskId,
            t.name,
            t.command
          FROM
            job_task_map jt
            inner join task t on (jt.taskId = t.taskId)
          WHERE 
            jobId = in_jobId 
          ORDER BY jtId ASC;
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;
        DECLARE EXIT HANDLER FOR SQLEXCEPTION
        BEGIN
          DECLARE err_code INT;
          DECLARE err_msg TEXT;
          GET STACKED DIAGNOSTICS CONDITION 1 err_code = MYSQL_ERRNO, err_msg = MESSAGE_TEXT;
          CALL task_output(v_runId, v_ourId, 'error', concat('code: ', err_code, ' message: ', err_msg));
          UPDATE job_run SET state = 'failed' WHERE runId = v_runId;
        END;

        -- === Pre-task-loop logic ===
        IF in_runIdStr IS NOT NULL AND in_runIdStr REGEXP '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
          SET v_runId = UUID_TO_BIN(in_runIdStr, 1);
        ELSE
          SET v_runId = UUID_TO_BIN(UUID(), 1);
        END IF;

        CREATE TEMPORARY TABLE IF NOT EXISTS t_runtime (runId BINARY(16) NOT NULL, taskId INT NULL) SELECT v_runId AS runId, NULL AS taskId;
        INSERT INTO job_run(jobId, runId, state) VALUES (in_jobId, v_runId, 'running');
        CALL task_output (v_runId, v_ourId, 'info', concat('run started for jobId ', in_jobId));

        -- Get the number of tasks for the job
        SELECT COUNT(*) INTO v_numTasks FROM job_task_map WHERE jobId = in_jobId;

        IF v_numTasks = 0 THEN
          CALL task_output (v_runId, v_ourId, 'error', 'no tasks to run');
          UPDATE job_run SET state = 'failed' WHERE runId = v_runId AND state = 'running';
          LEAVE main; -- No tasks to run, exit the procedure
        END IF;


        OPEN cur;
        read_loop: LOOP
          FETCH cur INTO v_currentTaskId, v_currentTaskName, v_currentCommand;
          IF v_done THEN
            LEAVE read_loop;
          END IF;
          SET v_currentTaskNum = v_currentTaskNum + 1;

          SET @sql = CONCAT('CALL ', v_currentCommand);
          PREPARE stmt_run_job FROM @sql;
          CALL task_output (v_runId, v_ourId, 'info', concat('Starting task ', v_currentTaskName, ' (', v_currentTaskNum, '/', v_numTasks, ')'));
          UPDATE t_runtime SET taskId = v_currentTaskId WHERE runId = runId;
          EXECUTE stmt_run_job;
          DEALLOCATE PREPARE stmt_run_job;
        END LOOP;
        CLOSE cur;

        -- === Post-task-loop logic ===
        UPDATE job_run SET state = 'completed' WHERE runId = v_runId AND state = 'running';
        CALL task_output (v_runId, v_ourId, 'info', concat('run completed for jobId ', in_jobId));

    END`,

  `DROP procedure IF EXISTS task_output`,
  `CREATE PROCEDURE task_output(
    IN in_runId BINARY(16),
    IN in_taskId INT,
    IN in_type VARCHAR(45),
    IN in_message VARCHAR(255)
  )
    BEGIN
      IF in_message IS NULL THEN SET in_message = ''; END IF;
      insert into task_output (runId, taskId, type, message) values (in_runId, in_taskId, in_type, in_message);
    END`,

  `DROP PROCEDURE IF EXISTS delete_disabled`,
  `CREATE PROCEDURE delete_disabled()
    BEGIN
    DECLARE v_incrementValue INT DEFAULT 10000;
    DECLARE v_curMinId BIGINT DEFAULT 1;
    DECLARE v_curMaxId BIGINT DEFAULT v_incrementValue + 1;
    DECLARE v_numCollectionIds INT;
    DECLARE v_numAssetIds INT;
    DECLARE v_numReviewIds INT;
    DECLARE v_numHistoryIds INT;
    DECLARE v_runId BINARY(16);
    DECLARE v_taskId INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
      DECLARE err_code INT;
      DECLARE err_msg TEXT;
      GET STACKED DIAGNOSTICS CONDITION 1 err_code = MYSQL_ERRNO, err_msg = MESSAGE_TEXT;
      CALL task_output(v_runId, v_taskId, 'error', concat('code: ', err_code, ' message: ', err_msg));
      RESIGNAL;
    END;

    -- Set v_runId from t_runtime if table exists, else generate a new UUID
    CALL get_runtime(v_runId, v_taskId);
    CALL task_output (v_runId, v_taskId, 'info','task started');

    drop temporary table if exists t_collectionIds;
    create temporary table t_collectionIds (seq INT AUTO_INCREMENT PRIMARY KEY)
      select collectionId from collection where isEnabled is null;
    select max(seq) into v_numCollectionIds from t_collectionIds;
    CALL task_output (v_runId, v_taskId, 'info', concat('found ', ifnull(v_numCollectionIds, 0), ' collections to delete'));

    drop temporary table if exists t_assetIds;
    create temporary table t_assetIds (seq INT AUTO_INCREMENT PRIMARY KEY)
      select assetId from asset where isEnabled is null or collectionId in (select collectionId from t_collectionIds);
    select max(seq) into v_numAssetIds from t_assetIds;
    CALL task_output (v_runId, v_taskId, 'info', concat('found ', ifnull(v_numAssetIds, 0), ' assets to delete'));

    drop temporary table if exists t_reviewIds;
    create temporary table t_reviewIds (seq INT AUTO_INCREMENT PRIMARY KEY)
      select reviewId from review where assetId in (select assetId from t_assetIds);
    select max(seq) into v_numReviewIds from t_reviewIds;
    CALL task_output (v_runId, v_taskId, 'info', concat('found ', ifnull(v_numReviewIds, 0), ' reviews to delete'));

    drop temporary table if exists t_historyIds;
    create temporary table t_historyIds (seq INT AUTO_INCREMENT PRIMARY KEY)
      select historyId from review_history where reviewId in (select reviewId from t_reviewIds);
    select max(seq) into v_numHistoryIds from t_historyIds;
    CALL task_output (v_runId, v_taskId, 'info', concat('found ', ifnull(v_numHistoryIds, 0), ' history records to delete'));

    IF v_numHistoryIds > 0 THEN
    CALL task_output (v_runId, v_taskId, 'info', concat('deleting ', v_numHistoryIds, ' history records'));
    REPEAT
      delete from review_history where historyId IN (
          select historyId from t_historyIds where seq >= v_curMinId and seq < v_curMaxId
        );
      SET v_curMinId = v_curMinId + v_incrementValue;
      SET v_curMaxId = v_curMaxId + v_incrementValue;
    UNTIL ROW_COUNT() = 0 END REPEAT;
    END IF;
    drop temporary table if exists t_historyIds;

    SET v_curMinId = 1;
    SET v_curMaxId = v_curMinId + v_incrementValue;
    IF v_numReviewIds > 0 THEN
      CALL task_output (v_runId, v_taskId, 'info', concat('deleting ', v_numReviewIds, ' reviews'));
      REPEAT
        delete from review where reviewId IN (
            select reviewId from t_reviewIds where seq >= v_curMinId and seq < v_curMaxId
          );
        SET v_curMinId = v_curMinId + v_incrementValue;
        SET v_curMaxId = v_curMaxId + v_incrementValue;
      UNTIL ROW_COUNT() = 0 END REPEAT;
    END IF;
    drop temporary table if exists t_reviewIds;

    SET v_curMinId = 1;
    SET v_curMaxId = v_curMinId + v_incrementValue;
    IF v_numAssetIds > 0 THEN
      CALL task_output (v_runId, v_taskId, 'info', concat('deleting ', v_numAssetIds, ' assets'));
      REPEAT
        delete from asset where assetId IN (
            select assetId from t_assetIds where seq >= v_curMinId and seq < v_curMaxId
          );
        SET v_curMinId = v_curMinId + v_incrementValue;
        SET v_curMaxId = v_curMaxId + v_incrementValue;
    UNTIL ROW_COUNT() = 0 END REPEAT;
    END IF;
    drop temporary table if exists t_assetIds;

    SET v_curMinId = 1;
    SET v_curMaxId = v_curMinId + v_incrementValue;
    IF v_numCollectionIds > 0 THEN
      CALL task_output (v_runId, v_taskId, 'info', concat('deleting ', v_numCollectionIds, ' collections'));
      REPEAT
        delete from collection where collectionId IN (
            select collectionId from t_collectionIds where seq >= v_curMinId and seq < v_curMaxId
          );
        SET v_curMinId = v_curMinId + v_incrementValue;
        SET v_curMaxId = v_curMaxId + v_incrementValue;
      UNTIL ROW_COUNT() = 0 END REPEAT;
    END IF;
    drop temporary table if exists t_collectionIds;

    CALL task_output (v_runId, v_taskId, 'info', 'task finished');
    END`,

  `DROP PROCEDURE IF EXISTS delete_unmapped`,
  `CREATE PROCEDURE delete_unmapped(IN in_context VARCHAR(255))
    BEGIN
      DECLARE v_runId BINARY(16);
      DECLARE v_taskId INT;
      DECLARE v_numReviewIds INT;
      DECLARE v_numHistoryIds INT;
      DECLARE v_incrementValue INT DEFAULT 10000;
      DECLARE v_curMinId BIGINT DEFAULT 1;
      DECLARE v_curMaxId BIGINT DEFAULT v_incrementValue + 1;

      DECLARE EXIT HANDLER FOR SQLEXCEPTION
      BEGIN
        DECLARE err_code INT;
        DECLARE err_msg TEXT;
        GET STACKED DIAGNOSTICS CONDITION 1
          err_code = MYSQL_ERRNO, err_msg = MESSAGE_TEXT;
        CALL task_output(v_runId, v_taskId, 'error',concat('code: ', err_code, ' message: ', err_msg));
        RESIGNAL;
      END;

      -- Set v_runId from t_runtime if table exists, else generate a new UUID
      CALL get_runtime(v_runId, v_taskId);
      CALL task_output (v_runId, v_taskId, 'info', 'task started');

      drop temporary table if exists t_reviewIds;
      create temporary table t_reviewIds (seq INT AUTO_INCREMENT PRIMARY KEY, reviewId INT);
      -- Context-specific logic
      IF in_context = 'system' THEN
        INSERT into t_reviewIds (reviewId)
        select r.reviewId from review r
        left join rev_group_rule_map rgr on (r.version = rgr.version and r.checkDigest = rgr.checkDigest)
        where rgr.rgrId is null;
      ELSEIF in_context = 'asset' THEN
        INSERT into t_reviewIds (reviewId)
        select
          r.reviewId
        from
          review r
          left join rev_group_rule_map rgr on (r.version = rgr.version and r.checkDigest = rgr.checkDigest)
          left join revision on (rgr.revId = revision.revId)
          left join stig_asset_map sa on (r.assetId = sa.assetId and revision.benchmarkId = sa.benchmarkId)
        group by
          r.reviewId
        having
          count(sa.saId) = 0;
      END IF;

      select max(seq) into v_numReviewIds from t_reviewIds;
      CALL task_output (v_runId, v_taskId, 'info', concat('found ', ifnull(v_numReviewIds, 0), ' reviews to delete'));

      IF v_numReviewIds > 0 THEN
        drop temporary table if exists t_historyIds;
        create temporary table t_historyIds (seq INT AUTO_INCREMENT PRIMARY KEY)
          select historyId from review_history where reviewId in (select reviewId from t_reviewIds);
        select max(seq) into v_numHistoryIds from t_historyIds;
        CALL task_output (v_runId, v_taskId, 'info', concat('found ', ifnull(v_numHistoryIds, 0), ' history records to delete'));
        IF v_numHistoryIds > 0 THEN
          CALL task_output (v_runId, v_taskId, 'info', concat('deleting ', v_numHistoryIds, ' history records'));
          SET v_curMinId = 1;
          SET v_curMaxId = v_curMinId + v_incrementValue;
          REPEAT
            delete from review_history where historyId IN (
                select historyId from t_historyIds where seq >= v_curMinId and seq < v_curMaxId
              );
            SET v_curMinId = v_curMinId + v_incrementValue;
            SET v_curMaxId = v_curMaxId + v_incrementValue;
          UNTIL ROW_COUNT() = 0 END REPEAT;
        END IF;
        CALL task_output (v_runId, v_taskId, 'info', concat('deleting ', v_numReviewIds, ' reviews'));
        SET v_curMinId = 1;
        SET v_curMaxId = v_curMinId + v_incrementValue;
        REPEAT
          delete from review where reviewId IN (
              select reviewId from t_reviewIds where seq >= v_curMinId and seq < v_curMaxId
            );
          SET v_curMinId = v_curMinId + v_incrementValue;
          SET v_curMaxId = v_curMaxId + v_incrementValue;
        UNTIL ROW_COUNT() = 0 END REPEAT;
      END IF;
      CALL task_output (v_runId, v_taskId, 'info', 'task finished');
    END;`,

  `DROP PROCEDURE IF EXISTS analyze_tables`,
  `CREATE PROCEDURE analyze_tables (IN in_tables JSON)
    BEGIN
          DECLARE v_runId BINARY(16) DEFAULT NULL;
          DECLARE v_taskId INT DEFAULT NULL;
          DECLARE v_itemCount INT;
          DECLARE v_currentCount INT;
          DECLARE v_table VARCHAR(255);

          DECLARE EXIT HANDLER FOR SQLEXCEPTION
          BEGIN
            DECLARE err_code INT;
            DECLARE err_msg TEXT;
            GET STACKED DIAGNOSTICS CONDITION 1
              err_code = MYSQL_ERRNO, err_msg = MESSAGE_TEXT;
              IF err_msg = NULL THEN 
          SET err_msg = '';
              END IF;
            CALL task_output(v_runId, v_taskId, 'error',concat('code: ', err_code, ' message: ', err_msg));
            RESIGNAL;
          END;
          
          CALL get_runtime(v_runId, v_taskId);
        CALL task_output (v_runId, v_taskId, 'info', 'task started');

        select JSON_LENGTH(in_tables) INTO v_itemCount;
        SET v_currentCount = 0;
        WHILE v_currentCount < v_itemCount DO
          SET v_table = json_unquote(json_extract(in_tables, concat('$[', v_currentCount, ']')));
          CALL task_output (v_runId, v_taskId, 'info', concat('analyze table: ', v_table));
          SET @sql = CONCAT('ANALYZE TABLE ', v_table);
          PREPARE stmt_analyze_tables FROM @sql;
          EXECUTE stmt_analyze_tables;
          DEALLOCATE PREPARE stmt_analyze_tables;
          SET v_currentCount = v_currentCount + 1;
        END WHILE;
        CALL task_output (v_runId, v_taskId, 'info', 'task finished');

    END`,

  `CREATE EVENT IF NOT EXISTS \`job-1-stigman\`
    ON SCHEDULE EVERY 1 DAY
    STARTS '2025-10-01 05:00:00'
    DISABLE
    DO
      CALL run_job(1, NULL)`,

  // `CREATE EVENT IF NOT EXISTS \`job-1-oneoff\`
  //   ON SCHEDULE AT CURRENT_TIMESTAMP
  //   DO
  //     CALL run_job(1, NULL)`,
]

const downMigration = [
  `DROP TABLE IF EXISTS job_run`,
  `DROP TABLE IF EXISTS job_task_map`,
  `DROP TABLE IF EXISTS job`,
  `DROP TABLE IF EXISTS task_output`,
  `DROP PROCEDURE IF EXISTS task_output`,
  // `DROP PROCEDURE IF EXISTS task_start`, --- IGNORE ---
  // `DROP PROCEDURE IF EXISTS task_failed`, --- IGNORE ---
  // `DROP PROCEDURE IF EXISTS task_finished`, --- IGNORE ---
  `DROP PROCEDURE IF EXISTS task_delete_disabled`
  // `DROP PROCEDURE IF EXISTS delete_disabled_objects` --- IGNORE ---
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
