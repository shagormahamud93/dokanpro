import { asyncHandler } from '../../utils/asyncHandler.js'
import { ApiError } from '../../utils/apiError.js'
import { Subscription } from './subscription.model.js'
import { Shop } from '../shops/shop.model.js'
import {
  PLANS,
  MERCHANT,
  isValidPlan,
  isValidPaymentMethod,
} from './plans.js'

/**
 * GET /api/subscriptions/plans — list available plans + merchant numbers.
 * Public to authenticated shop users so the submit form can render.
 */
export const listPlans = asyncHandler(async (_req, res) => {
  res.json({
    data: {
      plans: Object.values(PLANS),
      merchant: MERCHANT,
    },
  })
})

/**
 * GET /api/subscriptions/me — current shop's subscription + recent history.
 * Performs lazy expiry on the active record.
 */
export const getMine = asyncHandler(async (req, res) => {
  if (req.user.role === 'admin') {
    return res.json({ data: { current: null, history: [], adminBypass: true } })
  }
  if (!req.user.shop) {
    return res.json({ data: { current: null, history: [], noShop: true } })
  }

  const shop = await Shop.findById(req.user.shop)
  if (!shop) throw ApiError.notFound('Shop not found')

  let current = shop.currentSubscription
    ? await Subscription.findById(shop.currentSubscription)
    : null

  // Lazy expiry
  if (current && current.status === 'active' && current.endDate?.getTime() < Date.now()) {
    current.status = 'expired'
    await current.save()
    shop.currentSubscription = null
    await shop.save()
    current = null
  }

  // Pending submission (if any)
  const pending = await Subscription.findOne({ shop: shop._id, status: 'pending' })

  const history = await Subscription.find({ shop: shop._id })
    .sort({ createdAt: -1 })
    .limit(10)

  res.json({
    data: {
      shop,
      current,
      pending,
      history,
    },
  })
})

/**
 * POST /api/subscriptions — shop submits a payment for verification.
 */
export const submit = asyncHandler(async (req, res) => {
  if (req.user.role === 'admin') {
    throw ApiError.badRequest('Admin accounts do not need a subscription')
  }
  if (!req.user.shop) throw ApiError.badRequest('No shop assigned to this account')

  const { plan, paymentMethod, transactionId, paidAmount, screenshot, notes } = req.body

  if (!isValidPlan(plan)) {
    throw ApiError.badRequest(`Invalid plan. Choose: ${Object.keys(PLANS).join(', ')}`)
  }
  if (!isValidPaymentMethod(paymentMethod)) {
    throw ApiError.badRequest('paymentMethod must be bkash or nagad')
  }
  if (!transactionId || !transactionId.trim()) {
    throw ApiError.badRequest('transactionId is required')
  }
  const paid = Number(paidAmount)
  if (!Number.isFinite(paid) || paid <= 0) {
    throw ApiError.badRequest('paidAmount must be a positive number')
  }

  const planDef = PLANS[plan]

  // Block duplicate pending submissions
  const existingPending = await Subscription.findOne({
    shop: req.user.shop,
    status: 'pending',
  })
  if (existingPending) {
    throw ApiError.conflict('You already have a pending payment awaiting verification')
  }

  // Block duplicate transactionId across the platform
  const dup = await Subscription.findOne({ transactionId: transactionId.trim() })
  if (dup) {
    throw ApiError.conflict('This transaction ID has already been submitted')
  }

  const sub = await Subscription.create({
    shop: req.user.shop,
    plan,
    amount: planDef.amount,
    paidAmount: paid,
    paymentMethod,
    transactionId: transactionId.trim(),
    screenshot: screenshot?.trim() || undefined,
    notes: notes?.trim() || undefined,
    status: 'pending',
  })

  // Notify SaaS admins
  const io = req.app.get('io')
  io?.to('admin').emit('subscription:submitted', sub)
  io?.to(`shop:${req.user.shop}`).emit('subscription:submitted', sub)

  res.status(201).json({ data: sub })
})
