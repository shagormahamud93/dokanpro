import { ApiError } from '../utils/apiError.js'
import { verifyToken } from '../utils/jwt.js'
import { User } from '../modules/users/user.model.js'

export async function protect(req, _res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) throw ApiError.unauthorized('No token provided')

    let payload
    try {
      payload = verifyToken(token)
    } catch {
      throw ApiError.unauthorized('Invalid or expired token')
    }

    const user = await User.findById(payload.sub)
    if (!user || !user.active) throw ApiError.unauthorized('User not found or inactive')

    req.user = user
    next()
  } catch (err) {
    next(err)
  }
}

export const restrictTo =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized())
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Requires role: ${roles.join(' or ')}`))
    }
    next()
  }
