const MigrationHandler = require('./lib/MigrationHandler')

// The procedures review_aging calls to snapshot and update reviews, as 0047 created them or, withRoutineId,
// recording each review's routineId in its history snapshot and clearing it, because aging is not a routine's write.
function reviewAgingProcedures ({ withRoutineId }) {
  const clearRoutineId = withRoutineId ? ', routineId = NULL' : ''
  const routineIdColumn = withRoutineId ? ', routineId' : ''
  return [
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
        CALL task_output('error', concat('[update_review_status_batch] code: ', err_code, ' message: ', err_msg));
        CALL task_output_collection('error', concat('[update_review_status_batch] code: ', err_code, ' message: ', err_msg));
        RESIGNAL;
      END;

      -- Map status string to statusId: saved=0, submitted=1, rejected=2, accepted=3
      SELECT statusId INTO v_statusId FROM status WHERE api = in_status LIMIT 1;

      SELECT MAX(seq) INTO v_numReviewIds FROM t_reviewIds;

      IF IFNULL(v_numReviewIds, 0) > 0 THEN
        REPEAT
          UPDATE review
            SET statusId = v_statusId, statusTs = NOW(), statusUserId = @taskUserId${clearRoutineId}
          WHERE reviewId IN (
            SELECT reviewId FROM t_reviewIds WHERE seq >= v_curMinId AND seq < v_curMaxId
          );
          SET v_curMinId = v_curMinId + v_incrementValue;
          SET v_curMaxId = v_curMaxId + v_incrementValue;
        UNTIL v_curMinId > v_numReviewIds END REPEAT;
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
        CALL task_output('error', concat('[update_review_result_batch] code: ', err_code, ' message: ', err_msg));
        CALL task_output_collection('error', concat('[update_review_result_batch] code: ', err_code, ' message: ', err_msg));
        RESIGNAL;
      END;

      -- Map result string to resultId: notReviewed -> notchecked=1, informational=8
      -- The API value "notReviewed" is not in the result table; map it to "notchecked" (resultId=1)
      SET in_result = IF(in_result = 'notReviewed', 'notchecked', in_result);
      SELECT resultId INTO v_resultId FROM result WHERE api = in_result LIMIT 1;

      SELECT MAX(seq) INTO v_numReviewIds FROM t_reviewIds;

      IF IFNULL(v_numReviewIds, 0) > 0 THEN
        REPEAT
          UPDATE review
            SET resultId = v_resultId, ts = NOW(), userId = @taskUserId,
            statusId = 0, statusTs = NOW(), statusUserId = @taskUserId,
            statusText = 'Review change triggered status update'${clearRoutineId}
          WHERE reviewId IN (
            SELECT reviewId FROM t_reviewIds WHERE seq >= v_curMinId AND seq < v_curMaxId
          );
          SET v_curMinId = v_curMinId + v_incrementValue;
          SET v_curMaxId = v_curMaxId + v_incrementValue;
        UNTIL v_curMinId > v_numReviewIds END REPEAT;
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
        CALL task_output('error', concat('[prune_and_insert_history] code: ', err_code, ' message: ', err_msg));
        CALL task_output_collection('error', concat('[prune_and_insert_history] code: ', err_code, ' message: ', err_msg));
        RESIGNAL;
      END;

      -- Step 1: prune existing history to cap-1, making room for the incoming snapshot
      WITH historyRecs AS (
        SELECT
          rh.historyId,
          ROW_NUMBER() OVER (PARTITION BY r.reviewId ORDER BY rh.historyId DESC) AS rowNum
        FROM review_history rh
        INNER JOIN review r USING (reviewId)
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
        resultEngine${routineIdColumn}
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
          CASE WHEN resultEngine = 0 THEN NULL ELSE resultEngine END${routineIdColumn}
        FROM review
        WHERE reviewId IN (SELECT reviewId FROM t_reviewIds);
    END`
  ]
}

// checkDigest has no FK to check_content, like every other checkDigest column; the STIG delete paths
// keep the rows a routine references (sqlDeleteOrphanCheckContent in STIGService.js)
const createCollectionRoutine = `CREATE TABLE IF NOT EXISTS collection_routine (
    crId INT NOT NULL AUTO_INCREMENT,
    uuid BINARY(16) NOT NULL,
    collectionId INT NOT NULL,
    name VARCHAR(64) NOT NULL,
    description VARCHAR(255) NULL,
    state ENUM('active','disabled','needsReview') NOT NULL DEFAULT 'active',
    version VARCHAR(45) NOT NULL,
    checkDigest BINARY(32) NOT NULL,
    matchResultId INT NOT NULL,
    matchDetail MEDIUMTEXT NOT NULL,
    matchDetailDigest BINARY(32) GENERATED ALWAYS AS (UNHEX(SHA2(matchDetail, 256))) STORED,
    actionResultId INT NOT NULL,
    actionDetail MEDIUMTEXT NULL,
    actionComment MEDIUMTEXT NULL,
    actionStatusId INT NOT NULL,
    createdUserId INT NULL,
    createdTs DATETIME NOT NULL,
    approvedUserId INT NULL,
    approvedTs DATETIME NOT NULL,
    PRIMARY KEY (crId),
    KEY idx_uuid (uuid),
    UNIQUE KEY uk_name (collectionId, name),
    UNIQUE KEY uk_match (collectionId, version, checkDigest, matchResultId, matchDetailDigest),
    CONSTRAINT ck_collection_routine_actionStatus CHECK (actionStatusId IN (0,1)),
    CONSTRAINT fk_collection_routine_collection FOREIGN KEY (collectionId) REFERENCES collection (collectionId) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_collection_routine_matchResult FOREIGN KEY (matchResultId) REFERENCES result (resultId),
    CONSTRAINT fk_collection_routine_actionResult FOREIGN KEY (actionResultId) REFERENCES result (resultId),
    CONSTRAINT fk_collection_routine_actionStatus FOREIGN KEY (actionStatusId) REFERENCES status (statusId),
    CONSTRAINT fk_collection_routine_createdUser FOREIGN KEY (createdUserId) REFERENCES user_data (userId) ON DELETE SET NULL,
    CONSTRAINT fk_collection_routine_approvedUser FOREIGN KEY (approvedUserId) REFERENCES user_data (userId) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`

// DDL commits per statement, so a run failing partway (e.g. the online idx_routineId build) leaves 0050 unrecorded
// with earlier statements applied; keyed by what each adds so the next start skips those already present.
const routineIdAlters = {
  'review.routineId': `ALTER TABLE review ADD COLUMN routineId INT NULL, ALGORITHM=INSTANT`,
  'review.idx_routineId': `ALTER TABLE review ADD INDEX idx_routineId (routineId), ALGORITHM=INPLACE, LOCK=NONE`,
  'review_history.routineId': `ALTER TABLE review_history ADD COLUMN routineId INT NULL, ALGORITHM=INSTANT`
}

async function pendingRoutineIdAlters (pool) {
  const [present] = await pool.query(`
    SELECT CONCAT(TABLE_NAME, '.', COLUMN_NAME) AS name FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('review', 'review_history') AND COLUMN_NAME = 'routineId'
    UNION
    SELECT CONCAT(TABLE_NAME, '.', INDEX_NAME) FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'review' AND INDEX_NAME = 'idx_routineId'`)
  const presentNames = new Set(present.map(({ name }) => name))
  return Object.entries(routineIdAlters).filter(([name]) => !presentNames.has(name)).map(([, alter]) => alter)
}

// Dropping review.routineId also drops idx_routineId
const downMigration = [
  ...reviewAgingProcedures({ withRoutineId: false }),
  `ALTER TABLE review DROP COLUMN routineId`,
  `ALTER TABLE review_history DROP COLUMN routineId`,
  `DROP TABLE collection_routine`
]

module.exports = {
  up: async (pool) => {
    const upMigration = [
      createCollectionRoutine,
      ...await pendingRoutineIdAlters(pool),
      ...reviewAgingProcedures({ withRoutineId: true })
    ]
    await new MigrationHandler(upMigration).up(pool, __filename)
  },
  down: async (pool) => {
    await new MigrationHandler([], downMigration).down(pool, __filename)
  }
}
