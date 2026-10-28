import { Subscription } from '../modules/subscriptions/subscription.model.js'
import { Shop } from '../modules/shops/shop.model.js'

const SWEEP_INTERVAL_MS = 60 * 60 * 1000 // hourly

async function runSweep(io) {
  const now = new Date()
  try {
    const expiring = await Subscription.find({
      status: 'active',
      endDate: { $lt: now },
    }).select('_id shop endDate')

    if (expiring.length === 0) return

    const ids = expiring.map((s) => s._id)
    await Subscription.updateMany({ _id: { $in: ids } }, { $set: { status: 'expired' } })

    // Detach from shops where this was the current subscription
    await Shop.updateMany(
      { currentSubscription: { $in: ids } },
      { $set: { currentSubscription: null } },
    )

    for (const s of expiring) {
      io?.to(`shop:${s.shop}`).emit('subscription:expired', { id: s._id, endDate: s.endDate })
    }

    console.log(`[expiry] swept ${expiring.length} expired subscription(s)`)
  } catch (err) {
    console.error('[expiry] sweep failed:', err.message)
  }
}

export function startExpirySweep(io) {
  // Run once on boot, then on a fixed interval
  runSweep(io).catch(() => {})
  const handle = setInterval(() => runSweep(io), SWEEP_INTERVAL_MS)
  // Don't keep the event loop alive solely for this timer
  if (typeof handle.unref === 'function') handle.unref()
  return () => clearInterval(handle)
}
