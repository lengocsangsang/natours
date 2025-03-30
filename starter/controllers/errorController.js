const AppError = require('../utils/appError');

// ✅DEV ENVIRONMENT ERROR HANDLER FUNCTION
const sendErrorDev = (err, req, res) => {
  console.error('🧨[errorController.js]sendErrorDev FUNCTION:', err);
  // API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status || 'error',
      error: err,
      message: err.message || 'An error occurred',
      stack: err.stack || 'No stack trace available',
    });
  }
  // RENDERED WEBSITE
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  let value = 'unknown';
  if (err.errmsg && typeof err.errmsg === 'string') {
    const match = err.errmsg.match(/(["'])(\\?.)*?\1/);
    value = match ? match[0] : 'unknown';
  } else if (err.keyValue) {
    // Fallback for Mongoose-style errors
    value = Object.values(err.keyValue)[0];
  }
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data.  ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid Token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('your token has expired. Please log in again', 401);

// ✅DEV ENVIRONMENT ERROR HANDLER FUNCTION
const sendErrorProd = (err, req, res) => {
  console.error('🧨[errorController.js]sendErrorProd FUNCTION - err:', err);
  // API
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        msg: err.message,
      });
    }
    return res.status(500).json({
      status: 'error',
      msg: 'Something went very wrong!',
    });
  }
  // RENDERED WEBSITE
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      status: err.status,
      msg: err.message,
    });
  }
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.',
  });
};

// ✅THIS IS GLOBAL ERROR HANDLER FUNCTION
module.exports = (err, req, res, next) => {
  console.log(
    '🧨[errorController.js]globalErrorHandler FUNCTION - req.originalUrl:',
    req.originalUrl,
  );
  // console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // Fix shallow copy to preserve key properties
    let error = Object.assign({}, err, {
      name: err.name,
      message: err.message,
    });
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    else if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    else if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    else if (error.name === 'JsonWebTokenError') error = handleJWTError();
    else if (error.name === 'TokenExpiredError')
      error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};

// Role in Context
// This function is an error-handling middleware in an Express.js (or similar Node.js framework) application.
// In Express, middleware functions are used to process requests and responses, and error-handling middleware
// is a special type that catches and processes errors thrown during the request-response cycle.

// Here’s how it fits into the bigger picture:

// Express middleware typically has the signature (req, res, next), but error-handling middleware has the
// signature (err, req, res, next). The presence of err as the first parameter tells Express to invoke this
// function only when an error occurs.

// Purpose
// The primary role of this function is to:
// Catch errors: Handle any errors that occur in the application (e.g., thrown by route handlers, middleware,
// or other code).
// Standardize error responses: Ensure errors are processed consistently and sent back to the client in an
// appropriate format.
// Environment-specific behavior: Adjust how errors are handled and reported based on whether the application
// is running in a development or production environment.
