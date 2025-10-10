const SmError = require('../utils/error');
const JobService = require(`../service/JobService`)

const userJobIdBase = 100

exports.getJobs = async (req, res, next) => {
  try {
    const projections = req.query.projection
    const jobs = await JobService.getJobs({projections})
    res.json(jobs)
  } catch (error) {
    next(error) 
  }
}

exports.postJob = async (req, res, next) => {
  try {
    const jobId = await JobService.createJob({
      jobData: req.body, 
      userId: req.userObject.userId, 
      svcStatus: res.svcStatus
    })
    const newJob = await JobService.getJob(jobId)
    res.status(201).json(newJob)
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      error = new SmError.UnprocessableError('Job name already exists')
    } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      error = new SmError.UnprocessableError('Unknown taskId in list')
    }
    next(error)
  }
}

exports.getJob = async (req, res, next) => {
  try {
    const projections = req.query.projection
    const jobId = req.params.jobId
    const job = await JobService.getJob(jobId, {projections})
    if (!job) {
      throw new SmError.NotFoundError(`Job with ID [${jobId}] not found.`)
    }
    res.json(job)
  } catch (error) {
    next(error) 
  }
}

exports.deleteJob = async (req, res, next) => {
  try {
    const jobId = req.params.jobId
    if (parseInt(jobId) < userJobIdBase) {
      throw new SmError.UnprocessableError(`Job is a system job and cannot be deleted.`)
    }
    // has desired side-effect of removing events named with the jobId, even if job does not exist
    const wasDeleted = await JobService.deleteJob(jobId)
    if (!wasDeleted) {
      throw new SmError.NotFoundError(`Job with ID [${jobId}] not found.`)
    }
    res.status(204).end()
  } catch (error) {
    next(error) 
  }
}

exports.patchJob = async (req, res, next) => {
  try {
    const jobId = req.params.jobId
    if (parseInt(jobId) < userJobIdBase) {
      const bodyKeys = Object.keys(req.body)
      if (!bodyKeys.every(key => key === 'event')) {
        throw new SmError.UnprocessableError(`System jobs can only be modified with event properties.`)
      }
    }
    const existingJob = await JobService.getJob(jobId)
    if (!existingJob) {
      throw new SmError.NotFoundError(`Job with ID [${jobId}] not found.`)
    }
    await JobService.patchJob({
      jobId,
      jobData: req.body, 
      userId: req.userObject.userId, 
      svcStatus: res.svcStatus
    })
    const patchedJob = await JobService.getJob(jobId)
    res.status(200).json(patchedJob)
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      error = new SmError.UnprocessableError('Job name already exists')
    } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      error = new SmError.UnprocessableError('Unknown taskId in list')
    }
    next(error)
  }
}

exports.getRunsByJob = async (req, res, next) => {
  try {
    const jobId = req.params.jobId
    const job = await JobService.getJob(jobId)
    if (!job) {
      throw new SmError.NotFoundError(`Job with ID [${jobId}] not found.`)
    }
    const runs = await JobService.getRunsByJob(jobId)
    res.json(runs)
  } catch (error) {
    next(error)
  }
}

exports.runImmediateJob = async (req, res, next) => {
  try {
    const jobId = req.params.jobId
    const job = await JobService.getJob(jobId)
    if (!job) {
      throw new SmError.NotFoundError(`Job with ID [${jobId}] not found.`)
    }
    const runId = await JobService.runImmediateJob(jobId)
    res.json({runId})
  } catch (error) {
    next(error)
  }
}

exports.getRunById = async (req, res, next) => {
  try {
    const runId = req.params.runId
    const run = await JobService.getRunById(runId)
    if (!run) {
      throw new SmError.NotFoundError(`Run with ID [${runId}] not found.`)
    }
    res.json(run)
  } catch (error) {
    next(error) 
  }
}

exports.deleteRunById = async (req, res, next) => {
  try {
    const runId = req.params.runId
    const wasDeleted = await JobService.deleteRunById(runId)
    if (!wasDeleted) {
      throw new SmError.NotFoundError(`Run with ID [${runId}] not found.`)
    }
    res.status(204).end()
  } catch (error) {
    next(error)
  }
}

exports.getOutputByRun = async (req, res, next) => {
  try {
    const runId = req.params.runId
    const afterSeq = req.query['after-seq']
    const output = await JobService.getOutputByRun(runId, { filters: { afterSeq } })
    res.json(output)
  } catch (error) {
    next(error)
  } 
}

exports.getAllTasks = async (req, res, next) => {
  try {
    const tasks = await JobService.getAllTasks()
    res.json(tasks)
  } catch (error) {
    next(error)
  }
}


