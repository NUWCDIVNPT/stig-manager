class SmError extends Error {
  constructor(message) {
    super(message)
   // Ensure the name of this error is the same as the class name
    this.name = this.constructor.name
   // This clips the constructor invocation from the stack trace.
   // It's not absolutely essential, but it does make the stack trace a little nicer.
   //  @see Node.js reference (bottom)
    Error.captureStackTrace(this, this.constructor)
    this.toJSON = () => ({ error: this.message })
  }
}


class ClientError extends SmError {
  constructor(detail) {
    super('Incorrect request.')
    this.status = 400
    this.detail = detail
  }
}

class AuthorizeError extends SmError {
  constructor(detail) {
    super('Request not authorized.')
    this.status = 401
    this.detail = detail
  }
}

class PrivilegeError extends SmError {
  constructor(detail) {
    super('User has insufficient privilege to complete this request.')
    this.status = 403
    this.detail = detail
  }
}
class NotFoundError extends SmError {
  constructor(detail) {
    super('Resource not found.')
    this.status = 404
    this.detail = detail
  }
}

class UnprocessableError extends SmError {
  constructor(detail) {
    super('Unprocessable Entity.')
    this.status = 422
    this.detail = detail
  }
}

class InternalError extends SmError {
  constructor(error) {
    super(error.message)
    this.detail = { error }
  }
}

module.exports = {
  SmError,
  AuthorizeError,  
  PrivilegeError,
  NotFoundError,
  ClientError,
  UnprocessableError,
  InternalError 
}
