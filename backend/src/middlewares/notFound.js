import { ApiError } from '../utils/apiError.js'

export function notFound(req, _res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`))
}
