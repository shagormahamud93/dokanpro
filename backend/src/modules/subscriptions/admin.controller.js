import { asyncHandler } from '../../utils/asyncHandler.js'
import { ApiError } from '../../utils/apiError.js'
import { Subscription } from './subscription.model.js'
import { Shop } from '../shops/shop.model.js'
import { PLANS, SUBSCRIPTION_STATUSES } from './plans.js'

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * GET /api/admin/subscriptions?status=&q=&page=&limit=
 */
export const listAll = asyncHandler(async (req, res) => {
  const { status, q, page = 1, limit = 50 } = req.query

  const filter = {}
  if (status && SUBSCRIPTION_STATUSES.includes(status)) filter.status = status
  if (q) filter.transactionId = { $regex: q, $options: 'i' }

  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50))

  const [items, total, counts] = await Promise.all([
    Subscription.find(filter)
      .populate({ path: 'shop', populate: { path: 'owner', select: 'name email phone' } })
      .populate('verifiedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Subscription.countDocuments(filter),
    Subscription.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
  ])

  const summary = SUBSCRIPTION_STATUSES.reduce((acc, s) => ({ ...acc, [s]: 0 }), {})
  for (const c of counts) summary[c._id] = c.n

  res.json({
    data: items,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      summary,
    },
  })
})

export const getOne = asyncHandler(async (req, res) => {
  const sub = await Subscription.findById(req.params.id)
    .populate({ path: 'shop', populate: { path: 'owner', select: 'name email phone' } })
    .populate('verifiedBy', 'name email')
  if (!sub) throw ApiError.notFound('Subscription not found')
  res.json({ data: sub })
})

/**
 * POST /api/admin/subscriptions/:id/approve
 * Optional body: { durationDays?: number, startFromExisting?: boolean }
 */
export const approve = asyncHandler(async (req, res) => {
  const sub = await Subscription.findById(req.params.id)
  if (!sub) throw ApiError.notFound('Subscription not found')
  if (sub.status === 'active') throw ApiError.badRequest('Already active')
  if (sub.status === 'rejected') throw ApiError.badRequest('Cannot approve a rejected submission')

  const planDef = PLANS[sub.plan]
  if (!planDef) throw ApiError.badRequest('Unknown plan on this submission')

  const days = Number(req.body.durationDays) || planDef.durationDays
  if (days <= 0 || days > 3650) throw ApiError.badRequest('durationDays out of range')

  // Look up the shop's current subscription to optionally chain
  const shop = await Shop.findById(sub.shop)
  if (!shop) throw ApiError.notFound('Shop not found')

  let startDate = new Date()
  if (req.body.startFromExisting && shop.currentSubscription) {
    const current = await Subscription.findById(shop.currentSubscription)
    if (current && current.status === 'active' && current.endDate?.getTime() > Date.now()) {
      startDate = current.endDate
    }
  }
  const endDate = new Date(startDate.getTime() + days * DAY_MS)

  sub.status = 'active'
  sub.startDate = startDate
  sub.endDate = endDate
  sub.verifiedBy = req.user._id
  sub.verifiedAt = new Date()
  await sub.save()

  shop.currentSubscription = sub._id
  await shop.save()

  const io = req.app.get('io')
  io?.to(`shop:${shop._id}`).emit('subscription:approved', sub)
  io?.to('admin').emit('subscription:updated', sub)

  res.json({ data: sub })
})

/**
 * POST /api/admin/subscriptions/:id/reject
 * Body: { reason?: string }
 */
export const reject = asyncHandler(async (req, res) => {
  const sub = await Subscription.findById(req.params.id)
  if (!sub) throw ApiError.notFound('Subscription not found')
  if (sub.status === 'rejected') throw ApiError.badRequest('Already rejected')
  if (sub.status === 'active') throw ApiError.badRequest('Cannot reject an active subscription')

  sub.status = 'rejected'
  sub.rejectionReason = (req.body.reason || '').trim() || 'Payment could not be verified'
  sub.verifiedBy = req.user._id
  sub.verifiedAt = new Date()
  await sub.save()

  const io = req.app.get('io')
  io?.to(`shop:${sub.shop}`).emit('subscription:rejected', sub)
  io?.to('admin').emit('subscription:updated', sub)

  res.json({ data: sub })
})

/**
 * POST /api/admin/subscriptions/:id/extend
 * Body: { days: number }
 */
export const extend = asyncHandler(async (req, res) => {
  const sub = await Subscription.findById(req.params.id)
  if (!sub) throw ApiError.notFound('Subscription not found')

  const days = Number(req.body.days)
  if (!Number.isFinite(days) || days <= 0 || days > 3650) {
    throw ApiError.badRequest('days must be a positive number ≤ 3650')
  }

  const base =
    sub.endDate && sub.endDate.getTime() > Date.now() ? sub.endDate : new Date()
  sub.endDate = new Date(base.getTime() + days * DAY_MS)

  // Re-activate if previously expired
  if (sub.status === 'expired') {
    sub.status = 'active'
    sub.startDate = sub.startDate || new Date()
  }

  await sub.save()

  // Re-attach to shop if it was detached at expiry
  await Shop.findByIdAndUpdate(sub.shop, { currentSubscription: sub._id })

  const io = req.app.get('io')
  io?.to(`shop:${sub.shop}`).emit('subscription:extended', sub)
  io?.to('admin').emit('subscription:updated', sub)

  res.json({ data: sub })
})
