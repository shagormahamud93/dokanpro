import { ApiError } from './apiError.js'

/**
 * Authorized tenant shop id from server-resolved membership only.
 * Never read shop identifiers from the client body, query, params, or headers.
 */
export function authorizedShopId(req) {
  const id = req.shop?._id
  if (!id) {
    throw new ApiError(403, 'Shop context required.', { code: 'no_shop' })
  }
  return id
}

export function shopScope(req) {
  return { shop: authorizedShopId(req) }
}

/** Strip client-supplied tenant fields so they cannot reassign ownership. */
export function omitClientShopFields(body = {}) {
  const {
    shop: _shop,
    shopId: _shopId,
    shop_id: _shop_id,
    ...rest
  } = body
  return rest
}

/**
 * Emit a tenant event only to the shop room. Never fall back to a global broadcast.
 */
export function emitToShop(io, shopId, event, payload) {
  if (!io || !shopId) return
  io.to(`shop:${shopId}`).emit(event, payload)
}
