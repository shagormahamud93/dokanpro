import { asyncHandler } from '../../utils/asyncHandler.js'
import { ApiError } from '../../utils/apiError.js'
import { signToken } from '../../utils/jwt.js'
import { User } from '../users/user.model.js'

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    throw ApiError.badRequest('Email and password are required')
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash')
  if (!user || !user.active) throw ApiError.unauthorized('Invalid credentials')

  const ok = await user.comparePassword(password)
  if (!ok) throw ApiError.unauthorized('Invalid credentials')

  user.lastLoginAt = new Date()
  await user.save()

  const token = signToken({ sub: user._id.toString(), role: user.role })
  res.json({ data: { token, user } })
})

export const me = asyncHandler(async (req, res) => {
  res.json({ data: req.user })
})
