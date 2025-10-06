const dbUtils = require('./utils')
const _this = this
const uuid = require('uuid')

exports.queryJobs = async function ({ projections = [], filters = {} } = {}) {
  const columns = [
    'CAST(job.jobId AS CHAR) AS jobId',
    'job.name',
    'job.description',
    `json_object(
      'userId', CAST(ud_creator.userId as char),
      'username', ud_creator.username) AS createdBy`,
    'job.created',
    `IF(ud_updater.userId IS NULL, NULL, json_object(
      'userId', CAST(ud_updater.userId as char),
      'username', ud_updater.username)) AS updatedBy`,
    'job.updated',
    `(select
      IF(COUNT(jt.taskId), json_arrayagg(json_object('taskId', CAST(jt.taskId as char), 'name', t.name, 'description', t.description)), json_array())
      from job_task_map jt left join task t ON jt.taskId = t.taskId where jt.jobId = job.jobId) AS tasks`,
    `(select ifnull(COUNT(*), 0) from job_run jr where jr.jobId = job.jobId) AS runCount`,
    `(SELECT ifnull(JSON_OBJECT(
      'runId', BIN_TO_UUID(jr.runId, 1),
      'created', DATE_FORMAT(jr.created,'%Y-%m-%dT%H:%i:%sZ'),
      'updated', IF(jr.updated IS NULL, NULL, DATE_FORMAT(jr.updated,'%Y-%m-%dT%H:%i:%sZ')),
      'state', CASE WHEN jr.state = 'running' AND jr.created < CURRENT_TIMESTAMP - INTERVAL gs.VARIABLE_VALUE SECOND THEN 'shutdown' ELSE jr.state END
    ), null) FROM job_run jr left join performance_schema.global_status gs ON gs.VARIABLE_NAME = "Uptime" WHERE jr.jobId = job.jobId ORDER BY jr.jrId DESC LIMIT 1) AS lastRun`,
  ]
  const joins = new Set([
    'job',
    'LEFT JOIN user_data ud_creator ON ud_creator.userId = job.createdBy',
    'LEFT JOIN user_data ud_updater ON ud_updater.userId = job.updatedBy'
  ])
  const groupBy = ['job.jobId']

  const orderBy = ['job.jobId']

  const eventValues = `
  IF(e.event_type = 'ONE TIME',
    JSON_OBJECT(
      'eventId', e.event_name,
      'type', 'once',
      'starts', DATE_FORMAT(e.execute_at,'%Y-%m-%dT%H:%i:%sZ')
    ),
    JSON_OBJECT(
      'eventId', e.event_name,
      'type', 'recurring',
      'interval', JSON_OBJECT('value', CAST(e.interval_value as char), 'field', LCASE(e.interval_field)),
      'starts', DATE_FORMAT(e.starts,'%Y-%m-%dT%H:%i:%sZ'),
      'ends', DATE_FORMAT(e.ends,'%Y-%m-%dT%H:%i:%sZ'),
      'enabled', e.status = 'ENABLED'
    )
  )`
  columns.push(`(select
    ${eventValues} AS event
  from
    information_schema.events e
  where
    e.event_schema = database() 
    AND e.event_name LIKE CONCAT("job-", job.jobId, "-stigman")
    LIMIT 1
  ) as event`)


  const predicates = {
    statements: [],
    binds: []
  }
  if (filters.jobId) {
    predicates.statements.push('job.jobId = ?')
    predicates.binds.push(filters.jobId)
  }

  const sql = dbUtils.makeQueryString({ columns, joins, predicates, groupBy, orderBy, format: true })
  let [rows] = await dbUtils.pool.query(sql)
  return (rows)
}

exports.getJobs = async ({ projections }) => {
  return _this.queryJobs({ projections })
}

exports.getJob = async (jobId, { projections } = {}) => {
  const jobs = await _this.queryJobs({ projections, filters: { jobId } })
  return jobs[0]
}

exports.deleteJob = async (jobId) => {
  const sql = 'select event_name from information_schema.events where event_schema = database() AND event_name LIKE CONCAT("job-", ?, "-%")'
  const [events] = await dbUtils.pool.query(sql, [jobId])
  if (events.length) {
    const eventNames = events.map(r => r.EVENT_NAME)
    for (const eventName of eventNames) {
      const sqlDropEvent = `DROP EVENT IF EXISTS ??`
      await dbUtils.pool.query(sqlDropEvent, [eventName])
    }
  }
  const [result] = await dbUtils.pool.query('DELETE FROM job WHERE jobId = ?', [jobId])
  return result.affectedRows > 0
}

async function createEventByJob(jobId, eventData) {
  const eventName = getEventNameByJob(jobId)
  if (eventData.type === 'once') {
    const sqlCreateEvent = `
      CREATE EVENT ?? 
      ON SCHEDULE AT ? 
      DO CALL run_job(?, null)
    `
    const params = [eventName, eventData.starts, jobId]
    await dbUtils.pool.query(sqlCreateEvent, params)
  } else if (eventData.type === 'recurring') {
    let endsAt = eventData.ends ? `ENDS '${eventData.ends}'` : ''
    // Interpolate the interval unit as a bare word
    const sqlCreateEvent = `
      CREATE EVENT ?? 
      ON SCHEDULE EVERY ? ${eventData.interval.field} STARTS ? ${endsAt}
      ${eventData.enabled === false ? 'DISABLE' : 'ENABLE'}
      DO CALL run_job(?, null)
    `
    const params = [eventName, eventData.interval.value, eventData.starts, jobId]
    await dbUtils.pool.query(sqlCreateEvent, params)
  }
  return eventName
}

async function dropEventByJob(jobId) {
  const eventName = getEventNameByJob(jobId)
  const sqlDropEvent = `DROP EVENT IF EXISTS ??`
  return dbUtils.pool.query(sqlDropEvent, [eventName])
}

function getEventNameByJob(jobId) {
  return `job-${jobId}-stigman`
}

exports.createJob = async ({ jobData, userId, svcStatus } = {}) => {
  const { tasks, event, ...jobFields } = jobData
  async function transactionFn(connection) {
    const sqlInsertJob = `INSERT into job (name, description, createdBy) VALUES ?`
    const values = [
      [jobFields.name, jobFields.description, userId]
    ]
    const result = await connection.query(sqlInsertJob, [values])
    const jobId = result[0].insertId

    const sqlInsertTasks = `INSERT INTO job_task_map (jobId, taskId) VALUES ?`
    const taskValues = tasks.map(t => [jobId, t])
    if (taskValues.length) {
      await connection.query(sqlInsertTasks, [taskValues])
    }
    return jobId
  }
  const jobId = await dbUtils.retryOnDeadlock2({
    transactionFn,
    statusObj: svcStatus
  })

  // Create events after committing the transaction
  if (event) {
    await createEventByJob(jobId, event)
  }
  return jobId
}

exports.patchJob = async ({jobId, jobData, userId, svcStatus = {}}) => {
  const { tasks, event, ...jobFields } = jobData
  async function transactionFn(connection) {
    const sets = []
    const binds = []
    if (jobFields.name !== undefined) {
      sets.push('name = ?')
      binds.push(jobFields.name)
    }
    if (jobFields.description !== undefined) {
      sets.push('description = ?')
      binds.push(jobFields.description)
    }
    if (sets.length) {
      sets.push('updatedBy = ?')
      binds.push(userId)
      binds.push(jobId)
      const sqlUpdateJob = `UPDATE job SET ${sets.join(', ')}, updated = CURRENT_TIMESTAMP WHERE jobId = ?`
      await connection.query(sqlUpdateJob, binds)
    }
    if (Array.isArray(tasks)) {
      const sqlDeleteTasks = `DELETE FROM job_task_map WHERE jobId = ?`
      await connection.query(sqlDeleteTasks, [jobId])
      const sqlInsertTasks = `INSERT INTO job_task_map (jobId, taskId) VALUES ?`
      const taskValues = tasks.map(t => [jobId, t])
      if (taskValues.length) {
        await connection.query(sqlInsertTasks, [taskValues])
      }
    }
    return jobId
  }
  const updatedJobId = await dbUtils.retryOnDeadlock2({
    transactionFn,
    statusObj: svcStatus
  })

  if (event === null) {
    await dropEventByJob(jobId)
  } else if (event) {
    await dropEventByJob(jobId)
    await createEventByJob(jobId, event)
  }
  return updatedJobId
}

exports.getEventsByJob = async (jobId) => {
  throw new Error('Not implemented')
}

exports.createEventByJob = async (jobId, eventData) => {
  throw new Error('Not implemented')
}

exports.getRunById = async (runId) => {
  const columns = [
    `BIN_TO_UUID(jr.runId, 1) AS runId`,
    `CASE WHEN jr.state = 'running' AND jr.created < CURRENT_TIMESTAMP - INTERVAL gs.VARIABLE_VALUE SECOND THEN 'shutdown' ELSE jr.state END AS state`,
    'jr.created',
    'jr.updated',
    'CAST(jr.jobId AS CHAR) AS jobId'
  ]
  const joins = new Set([
    'job_run jr',
    'left join performance_schema.global_status gs ON gs.VARIABLE_NAME = "Uptime"'
  ])
  const predicates = {
    statements: ['jr.runId = ?'],
    binds: [dbUtils.uuidToSqlString(runId)]
  }
  const sql = dbUtils.makeQueryString({ columns, joins, predicates, format: true })
  let [rows] = await dbUtils.pool.query(sql, [runId])
  return (rows[0])
}

exports.getRunsByJob = async (jobId) => {
  const columns = [
    `BIN_TO_UUID(jr.runId, 1) AS runId`,
    `CASE WHEN jr.state = 'running' AND jr.created < CURRENT_TIMESTAMP - INTERVAL gs.VARIABLE_VALUE SECOND THEN 'shutdown' ELSE jr.state END AS state`,
    `jr.created`,
    `jr.updated`,
    `CAST(jr.jobId AS CHAR) AS jobId`
  ]
  const joins = new Set([
    'job_run jr',
    'left join performance_schema.global_status gs ON gs.VARIABLE_NAME = "Uptime"'
  ])
  const predicates = {
    statements: ['jr.jobId = ?'],
    binds: [jobId]
  }
  const orderBy = ['jr.created DESC']

  const sql = dbUtils.makeQueryString({ columns, joins, predicates, orderBy, format: true })
  let [rows] = await dbUtils.pool.query(sql, [jobId])
  return (rows)
}

exports.runImmediateJob = async (jobId) => {
  const v1 = uuid.v1()
  const sql = `CREATE EVENT IF NOT EXISTS ??
  ON SCHEDULE AT CURRENT_TIMESTAMP
  DO CALL run_job(?,?)`
  await dbUtils.pool.query(sql, [`job-${jobId}-${v1}`, jobId, v1])
  return v1
}

exports.getOutputByRun = async (runId, {filters}) => {
  const ctes = [
    `Output AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY tout.seq ASC) as seq,
      tout.ts,
      tout.taskId,
      t.name as task,
      tout.type,
      tout.message
    FROM
      task_output tout
      left join task t ON tout.taskId = t.taskId
    WHERE
      runId = UUID_TO_BIN(?, 1))`
  ]
  const columns = [
    'Output.seq',
    'Output.ts',
    'Output.taskId',
    'Output.task',
    'Output.type',
    'Output.message'
  ]

  const joins = new Set(['Output'])
  const predicates = {
    statements: [],
    binds: [runId]
  }
  if (filters?.afterSeq) {
    predicates.statements.push('Output.seq > ?')
    predicates.binds.push(filters.afterSeq)
  }
  const orderBy = ['Output.seq DESC']
  const sql = dbUtils.makeQueryString({ ctes, columns, joins, predicates, orderBy, format: true })
  let [rows] = await dbUtils.pool.query(sql, predicates.binds)
  return (rows)
}

exports.getAllTasks = async () => {
  const sql = `SELECT CAST(taskId AS CHAR(36)) AS taskId, name, description, command FROM task ORDER BY name`
  let [rows] = await dbUtils.pool.query(sql)
  return rows
}

exports.deleteRunById = async (runId) => {
  const [result] = await dbUtils.pool.query('DELETE FROM job_run WHERE runId = UUID_TO_BIN(?,1)', [runId])
  return result.affectedRows > 0
}