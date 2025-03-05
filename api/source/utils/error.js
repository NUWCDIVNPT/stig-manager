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
    this.status = 500
    this.detail = { error }
  }
}

class OIDCProviderError extends SmError {
  constructor(detail) {
    super('OIDC Provider is unreachable, unable to validate token.')
    this.status = 503
    this.detail = detail
  }
}

class SigningKeyNotFoundError extends SmError {
  constructor(detail) {
    super('Unknown signing key, unable to validate token.')
    this.status = 403
    this.detail = detail
  }
}

class InsecureTokenError extends SmError {
  constructor(detail) {
    super('Insecure token presented and STIGMAN_DEV_ALLOW_INSECURE_TOKENS is false.')
    this.status = 403
    this.detail = detail
  }
}

class NoTokenError extends SmError {
  constructor(detail) {
    super('Request requires an access token.')
    this.status = 401
    this.detail = detail
  }
}

class OutOfScopeError extends SmError {
  constructor(detail) {
    super('Required scopes were not found in token.')
    this.status = 403
    this.detail = detail
  }
}

class ElevationError extends SmError {
  constructor(detail) {
    super('Request requires parameter elevate=true.')
    this.status = 403
    this.detail = detail
  }
}

class InvalidElevationError extends SmError {
  constructor(detail) {
    super('Invalid use of parameter elevate=true.')
    this.status = 403
    this.detail = detail
  }
}

module.exports = {
  SmError,
  AuthorizeError,  
  PrivilegeError,
  NotFoundError,
  ClientError,
  UnprocessableError,
  OIDCProviderError,
  SigningKeyNotFoundError,
  NoTokenError,
  OutOfScopeError,
  ElevationError,
  InvalidElevationError,
  InternalError,
  InsecureTokenError
}