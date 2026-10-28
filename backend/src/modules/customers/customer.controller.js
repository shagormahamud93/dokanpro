import { asyncHandler } from '../../utils/asyncHandler.js'
import { ApiError } from '../../utils/apiError.js'
import { omitClientShopFields, shopScope } from '../../utils/tenant.js'
import { Customer } from './customer.model.js'

export const listCustomers = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 50 } = req.query

  const filter = { ...shopScope(req) }
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } },
    ]
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50))

  const [items, total] = await Promise.all([
    Customer.find(filter)
      .sort({ lastVisitAt: -1, createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Customer.countDocuments(filter),
  ])

  res.json({
    data: items,
    meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  })
})

export const getCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ _id: req.params.id, ...shopScope(req) })
  if (!customer) throw ApiError.notFound('Customer not found')
  res.json({ data: customer })
})

export const createCustomer = asyncHandler(async (req, res) => {
  const body = omitClientShopFields(req.body)
  const { name, phone } = body
  if (!name || !phone) throw ApiError.badRequest('name and phone are required')

  const shop = shopScope(req).shop
  const exists = await Customer.findOne({ phone, shop })
  if (exists) throw ApiError.conflict('Customer with this phone already exists')

  const customer = await Customer.create({
    ...body,
    shop,
    totalSpent: 0,
    visitCount: 0,
  })
  res.status(201).json({ data: customer })
})

export const updateCustomer = asyncHandler(async (req, res) => {
  const updates = omitClientShopFields(req.body)
  delete updates._id
  delete updates.id
  delete updates.totalSpent
  delete updates.visitCount

  const customer = await Customer.findOneAndUpdate(
    { _id: req.params.id, ...shopScope(req) },
    updates,
    { new: true, runValidators: true },
  )
  if (!customer) throw ApiError.notFound('Customer not found')
  res.json({ data: customer })
})

export const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOneAndDelete({ _id: req.params.id, ...shopScope(req) })
  if (!customer) throw ApiError.notFound('Customer not found')
  res.json({ data: { id: customer._id } })
})
