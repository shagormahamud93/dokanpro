import { asyncHandler } from '../../utils/asyncHandler.js'
import { ApiError } from '../../utils/apiError.js'
import { emitToShop, omitClientShopFields, shopScope } from '../../utils/tenant.js'
import { Product } from './product.model.js'

export const listProducts = asyncHandler(async (req, res) => {
  const { q, category, stock, page = 1, limit = 50 } = req.query

  const filter = { ...shopScope(req), active: true }
  if (category && category !== 'All') filter.category = category
  if (stock === 'in') filter.stock = { $gt: 0 }
  if (stock === 'out') filter.stock = { $eq: 0 }
  if (stock === 'low') filter.$expr = { $and: [{ $gt: ['$stock', 0] }, { $lt: ['$stock', 10] }] }
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { nameBn: { $regex: q, $options: 'i' } },
      { sku: { $regex: q, $options: 'i' } },
      { barcode: q },
    ]
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50))

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Product.countDocuments(filter),
  ])

  res.json({
    data: items,
    meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  })
})

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, ...shopScope(req) })
  if (!product) throw ApiError.notFound('Product not found')
  res.json({ data: product })
})

export const getByBarcode = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    barcode: req.params.code,
    active: true,
    ...shopScope(req),
  })
  if (!product) throw ApiError.notFound('Product not found')
  res.json({ data: product })
})

export const createProduct = asyncHandler(async (req, res) => {
  const body = omitClientShopFields(req.body)
  const { name, sku, price, stock = 0 } = body
  if (!name || !sku || price === undefined) {
    throw ApiError.badRequest('name, sku, price are required')
  }
  if (price < 0 || stock < 0) throw ApiError.badRequest('price and stock must be ≥ 0')

  const shop = shopScope(req).shop
  const product = await Product.create({
    ...body,
    sku: String(sku).toUpperCase(),
    shop,
  })
  res.status(201).json({ data: product })
})

export const updateProduct = asyncHandler(async (req, res) => {
  const updates = omitClientShopFields(req.body)
  if (updates.sku) updates.sku = updates.sku.toUpperCase()
  delete updates._id
  delete updates.id

  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, ...shopScope(req) },
    updates,
    { new: true, runValidators: true },
  )
  if (!product) throw ApiError.notFound('Product not found')

  emitToShop(req.app.get('io'), req.shop._id, 'product:updated', product)

  res.json({ data: product })
})

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, ...shopScope(req) },
    { active: false },
    { new: true },
  )
  if (!product) throw ApiError.notFound('Product not found')
  res.json({ data: { id: product._id } })
})
