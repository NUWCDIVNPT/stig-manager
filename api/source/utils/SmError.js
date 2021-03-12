module.exports = class SmError extends Error {
    constructor(httpStatus = 400, ...params) {
      // Pass remaining arguments (including vendor specific ones) to parent constructor
      super(...params)
  
      // Maintains proper stack trace for where our error was thrown (only available on V8)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, SmError)
      }
  
      this.name = 'SmError'
      // Custom debugging information
      this.httpStatus = httpStatus
    }
}

