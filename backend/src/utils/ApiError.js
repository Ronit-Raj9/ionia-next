class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ) {
        super (message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false
        this.errors = errors
        this.timestamp = new Date().toISOString()

        if (stack) {
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

// Enhanced error class for authentication-specific errors
class AuthError extends ApiError {
    constructor(statusCode, message, errorCode, details = {}) {
        super(statusCode, message);
        this.errorCode = errorCode;
        this.details = details;
        this.timestamp = new Date().toISOString();
    }
}

// Enhanced error class for validation errors
class ValidationError extends ApiError {
    constructor(message, fieldErrors = []) {
        super(400, message, fieldErrors);
        this.errorCode = 'VALIDATION_ERROR';
        this.fieldErrors = fieldErrors;
    }
}


export {ApiError, AuthError, ValidationError}