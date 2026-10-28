import mongoose from 'mongoose'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { ApiError } from '../../utils/apiError.js'
import { emitToShop, shopScope } from '../../utils/tenant.js'
import { Order } from './order.model.js'
import { Product } from '../products/product.model.js'
import { Customer } from '../customers/customer.model.js'

const VALID_PAYMENTS = new Set(['cash', 'bkash', 'nagad', 'card'])

async function nextOrderNumber() {
  const last = await Order.findOne().sort({ createdAt: -1 }).select('orderNumber').lean()
  if (!last?.orderNumber) return 'ORD-1000'
  const n = parseInt(last.orderNumber.replace(/\D/g, ''), 10) || 1000
  return `ORD-${n + 1}`
}

/**
 * Atomic per-product stock decrement using findOneAndUpdate with predicate.
 * If any item fails, previously-decremented items are rolled back so the
 * cart never half-commits.
 */
export const createOrder = asyncHandler(async (req, res) => {
  const {
    items,
    paymentMethod,
    discount = 0,
    paymentReference,
    tendered,
    customerId,
    clientId,
    notes,
  } = req.body

  const shopId = shopScope(req).shop

  if (!Array.isArray(items) || items.length === 0) {
    throw ApiError.badRequest('items must be a non-empty array')
  }
  if (!VALID_PAYMENTS.has(paymentMethod)) {
    throw ApiError.badRequest(`paymentMethod must be one of: ${[...VALID_PAYMENTS].join(', ')}`)
  }
  for (const it of items) {
    if (!it.productId || !mongoose.isValidObjectId(it.productId)) {
      throw ApiError.badRequest('Each item requires a valid productId')
    }
    if (!Number.isInteger(it.quantity) || it.quantity <= 0) {
      throw ApiError.badRequest('Each item quantity must be a positive integer')
    }
  }

  if (clientId) {
    const existing = await Order.findOne({ clientId, shop: shopId })
    if (existing) return res.status(200).json({ data: existing, idempotent: true })
  }

  let customer = null
  if (customerId) {
    if (!mongoose.isValidObjectId(customerId)) {
      throw ApiError.badRequest('Invalid customerId')
    }
    customer = await Customer.findOne({ _id: customerId, shop: shopId })
    if (!customer) throw ApiError.badRequest('Customer not found')
  }

  const decremented = []
  const orderItems = []
  let subtotal = 0

  try {
    for (const it of items) {
      const updated = await Product.findOneAndUpdate(
        {
          _id: it.productId,
          shop: shopId,
          active: true,
          stock: { $gte: it.quantity },
        },
        { $inc: { stock: -it.quantity } },
        { new: true },
      )
      if (!updated) {
        const owned = await Product.findOne({ _id: it.productId, shop: shopId }).select(
          'name stock',
        )
        throw ApiError.badRequest(
          owned
            ? `Insufficient stock for "${owned.name}" (have ${owned.stock}, need ${it.quantity})`
            : 'Product not found',
        )
      }
      decremented.push({ productId: it.productId, qty: it.quantity, product: updated })

      const lineTotal = updated.price * it.quantity
      subtotal += lineTotal
      orderItems.push({
        product: updated._id,
        name: updated.name,
        sku: updated.sku,
        price: updated.price,
        quantity: it.quantity,
        lineTotal,
      })
    }

    const safeDiscount = Math.max(0, Math.min(Number(discount) || 0, subtotal))
    const tax = Math.round((subtotal - safeDiscount) * 0.05)
    const total = Math.max(0, subtotal - safeDiscount + tax)
    const tenderedAmt = Number(tendered) || 0
    const change = paymentMethod === 'cash' ? Math.max(0, tenderedAmt - total) : 0

    if (paymentMethod === 'cash' && tenderedAmt > 0 && tenderedAmt < total) {
      throw ApiError.badRequest('Tendered amount is less than total')
    }

    const order = await Order.create({
      shop: shopId,
      orderNumber: await nextOrderNumber(),
      clientId,
      cashier: req.user._id,
      customer: customer?._id || undefined,
      items: orderItems,
      subtotal,
      discount: safeDiscount,
      tax,
      total,
      paymentMethod,
      paymentReference,
      tendered: paymentMethod === 'cash' ? tenderedAmt : undefined,
      change,
      notes,
    })

    if (customer) {
      Customer.updateOne(
        { _id: customer._id, shop: shopId },
        {
          $inc: { totalSpent: total, visitCount: 1 },
          $set: { lastVisitAt: new Date() },
        },
      ).catch((err) => console.error('[customer rollup]', err.message))
    }

    const io = req.app.get('io')
    emitToShop(io, shopId, 'order:created', order)
    for (const d of decremented) {
      emitToShop(io, shopId, 'stock:updated', {
        productId: d.product._id,
        stock: d.product.stock,
        name: d.product.name,
      })
      if (d.product.stock <= (d.product.reorderPoint ?? 10)) {
        emitToShop(io, shopId, 'low-stock:alert', {
          productId: d.product._id,
          name: d.product.name,
          stock: d.product.stock,
        })
      }
    }

    return res.status(201).json({ data: order })
  } catch (err) {
    await Promise.all(
      decremented.map((d) =>
        Product.updateOne(
          { _id: d.productId, shop: shopId },
          { $inc: { stock: d.qty } },
        ).catch(() => {}),
      ),
    )
    throw err
  }
})

export const listOrders = asyncHandler(async (req, res) => {
  const { from, to, paymentMethod, status, page = 1, limit = 50 } = req.query

  const filter = { ...shopScope(req) }
  if (status) filter.status = status
  if (paymentMethod) filter.paymentMethod = paymentMethod
  if (from || to) {
    filter.createdAt = {}
    if (from) filter.createdAt.$gte = new Date(from)
    if (to) filter.createdAt.$lte = new Date(to)
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50))

  const [items, total] = await Promise.all([
    Order.find(filter)
      .populate('cashier', 'name email role')
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Order.countDocuments(filter),
  ])

  res.json({
    data: items,
    meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  })
})

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, ...shopScope(req) })
    .populate('cashier', 'name email role')
    .populate('customer', 'name phone')
  if (!order) throw ApiError.notFound('Order not found')
  res.json({ data: order })
})
