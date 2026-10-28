import { ApiError } from '../utils/apiError.js'
import { Shop } from '../modules/shops/shop.model.js'

/**
 * Fail closed for shop-scoped routes.
 *
 * Shop is taken only from the authenticated user's stored membership
 * (req.user.shop), never from the request body, query, URL, or headers.
 *
 * Platform admins still bypass billing in requireActiveSubscription, but they
 * cannot operate POS / catalog / customer APIs without a shop on their user.
 */
export async function requireShop(req, _res, next) {
  try {
    if (!req.user) return next(ApiError.unauthorized())

    const membershipId = req.user.shop
    if (!membershipId) {
      const status = req.user.role === 'admin' ? 403 : 402
      return next(
        new ApiError(status, 'No shop assigned to this account. Contact administrator.', {
          code: 'no_shop',
        }),
      )
    }

    if (req.shop && String(req.shop._id) !== String(membershipId)) {
      return next(ApiError.forbidden('Shop context does not match membership'))
    }

    if (!req.shop) {
      const shop = await Shop.findById(membershipId)
      if (!shop) {
        return next(new ApiError(403, 'Shop not found.', { code: 'no_shop' }))
      }
      req.shop = shop
    }

    next()
  } catch (err) {
    next(err)
  }
}
