import { asyncHandler } from '../../utils/asyncHandler.js'
import { ApiError } from '../../utils/apiError.js'
import { User } from './user.model.js'

export const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 })
  res.json({ data: users })
})

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
  if (!user) throw ApiError.notFound('User not found')
  res.json({ data: user })
})

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body
  if (!name || !email || !password) {
    throw ApiError.badRequest('name, email, password are required')
  }
  if (password.length < 6) throw ApiError.badRequest('Password must be at least 6 characters')

  const exists = await User.findOne({ email: email.toLowerCase() })
  if (exists) throw ApiError.conflict('Email already in use')

  const user = new User({ name, email, role, phone })
  await user.setPassword(password)
  await user.save()

  res.status(201).json({ data: user })
})

export const updateUser = asyncHandler(async (req, res) => {
  const { name, email, role, phone, active, password } = req.body
  const user = await User.findById(req.params.id).select('+passwordHash')
  if (!user) throw ApiError.notFound('User not found')

  if (name !== undefined) user.name = name
  if (email !== undefined) user.email = email
  if (role !== undefined) user.role = role
  if (phone !== undefined) user.phone = phone
  if (active !== undefined) user.active = active
  if (password) {
    if (password.length < 6) throw ApiError.badRequest('Password must be at least 6 characters')
    await user.setPassword(password)
  }

  await user.save()
  res.json({ data: user })
})

export const deleteUser = asyncHandler(async (req, res) => {
  if (req.user._id.equals(req.params.id)) {
    throw ApiError.badRequest('Cannot delete yourself')
  }
  const user = await User.findByIdAndDelete(req.params.id)
  if (!user) throw ApiError.notFound('User not found')
  res.json({ data: { id: user._id } })
})
