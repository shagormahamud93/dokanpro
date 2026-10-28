import { ApiError } from '../utils/apiError.js'
import { Shop } from '../modules/shops/shop.model.js'
import { Subscription } from '../modules/subscriptions/subscription.model.js'

/**
 * Loads the user's shop + current subscription onto the request.
 * - SaaS admins (role === 'admin') always pass through.
 * - Performs a lazy expiry check: if the active subscription's endDate has
 *   passed, it is flipped to 'expired' in-place.
 * - Blocks with HTTP 402 + machine-readable code when not active.
 */
export async function requireActiveSubscription(req, _res, next) {
  try {
    if (!req.user) return next(ApiError.unauthorized())

    // SaaS platform admins bypass entirely
    if (req.user.role === 'admin') return next()

    if (!req.user.shop) {
      return next(
        new ApiError(402, 'No shop assigned to this account. Contact administrator.', {
          code: 'no_shop',
        }),
      )
    }

    const shop = await Shop.findById(req.user.shop)
    if (!shop) {
      return next(new ApiError(402, 'Shop not found.', { code: 'no_shop' }))
    }

    let sub = shop.currentSubscription
      ? await Subscription.findById(shop.currentSubscription)
      : null

    // Lazy expiry — single source of truth
    if (sub && sub.status === 'active' && sub.endDate && sub.endDate.getTime() < Date.now()) {
      sub.status = 'expired'
      await sub.save()
      shop.currentSubscription = null
      await shop.save()
      const io = req.app.get('io')
      io?.to(`shop:${shop._id}`).emit('subscription:expired', sub)
    }

    if (!sub || sub.status !== 'active') {
      return next(
        new ApiError(402, 'Subscription expired. Please renew to continue.', {
          code: 'subscription_required',
          status: sub?.status ?? 'none',
          subscriptionId: sub?._id ?? null,
        }),
      )
    }

    req.shop = shop
    req.subscription = sub
    next()
  } catch (err) {
    next(err)
  }
}
