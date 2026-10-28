import mongoose from 'mongoose'
import { ApiError } from '../utils/apiError.js'
import { isProd } from '../config/env.js'

export function errorHandler(err, req, res, _next) {
  let statusCode = err.statusCode || 500
  let message = err.message || 'Internal server error'
  let details = err.details

  // Mongoose validation
  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400
    message = 'Validation failed'
    details = Object.fromEntries(
      Object.entries(err.errors).map(([k, v]) => [k, v.message]),
    )
  }

  // Mongoose cast (bad ObjectId, etc.)
  if (err instanceof mongoose.Error.CastError) {
    statusCode = 400
    message = `Invalid ${err.path}: ${err.value}`
  }

  // Duplicate key
  if (err?.code === 11000) {
    statusCode = 409
    const field = Object.keys(err.keyValue || {})[0] || 'field'
    message = `Duplicate ${field}: ${err.keyValue?.[field]}`
  }

  // JWT
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid token'
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expired'
  }

  if (statusCode >= 500) {
    console.error('[error]', req.method, req.originalUrl, err)
  }

  res.status(statusCode).json({
    error: {
      message,
      ...(details && { details }),
      ...(!isProd && { stack: err.stack }),
    },
  })
}
