/**
 * Idempotent shop-ownership migration for Product, Order, and Customer.
 *
 * Default: dry-run (read-only). Does not write, drop indexes, or delete data.
 *
 *   node scripts/migrate-shop-ownership.js
 *   node scripts/migrate-shop-ownership.js --dry-run
 *
 * Apply (only after reviewing dry-run and explicit operator approval):
 *
 *   node scripts/migrate-shop-ownership.js --apply
 *
 * Never overwrites a document that already has shop set.
 * If more than one shop exists, unassigned documents are AMBIGUOUS and are not updated.
 */

import mongoose from 'mongoose'
import { connectDB, disconnectDB } from '../src/config/db.js'
import { Shop } from '../src/modules/shops/shop.model.js'
import { Product } from '../src/modules/products/product.model.js'
import { Order } from '../src/modules/orders/order.model.js'
import { Customer } from '../src/modules/customers/customer.model.js'

const apply = process.argv.includes('--apply')
const dryRun = !apply

const missingShop = {
  $or: [{ shop: { $exists: false } }, { shop: null }],
}

function dupKey(field) {
  return {
    $match: { shop: { $type: 'objectId' }, [field]: { $type: 'string', $gt: '' } },
  }
}

async function duplicateReport(Model, field) {
  const rows = await Model.aggregate([
    dupKey(field),
    { $group: { _id: { shop: '$shop', value: `$${field}` }, n: { $sum: 1 } } },
    { $match: { n: { $gt: 1 } } },
    { $limit: 20 },
  ])
  return rows.map((r) => ({ shop: String(r._id.shop), n: r.n }))
}

async function planCollection(name, Model, uniqueFields) {
  const total = await Model.countDocuments()
  const withShop = await Model.countDocuments({ shop: { $type: 'objectId' } })
  const withoutShop = await Model.countDocuments(missingShop)
  const dups = {}
  for (const field of uniqueFields) {
    dups[field] = await duplicateReport(Model, field)
  }
  return { name, total, withShop, withoutShop, dups }
}

function decide(shopCount, shops, plan) {
  if (plan.withoutShop === 0) {
    return { action: 'none', reason: 'all documents already have shop' }
  }
  if (shopCount === 0) {
    return { action: 'blocked', reason: 'no Shop documents exist; cannot invent ownership' }
  }
  if (shopCount > 1) {
    return {
      action: 'blocked',
      reason: `ambiguous: ${shopCount} shops exist and ${plan.withoutShop} ${plan.name} documents have no shop`,
    }
  }
  return {
    action: 'assign',
    shopId: shops[0]._id,
    reason: 'exactly one shop; unassigned documents can be mapped unambiguously',
  }
}

const OLD_UNIQUE_INDEXES = {
  products: ['sku_1', 'barcode_1'],
  orders: ['clientId_1'],
  customers: ['phone_1'],
}

async function listIndexNames(Model) {
  try {
    const idx = await Model.collection.indexes()
    return idx.map((i) => i.name)
  } catch {
    return []
  }
}

async function main() {
  console.log(`[migrate] mode=${dryRun ? 'DRY-RUN (read-only)' : 'APPLY'}`)
  await connectDB()

  const shops = await Shop.find().select('_id name').lean()
  console.log(`[migrate] shops=${shops.length}`)

  const productPlan = await planCollection('products', Product, ['sku', 'barcode'])
  const orderPlan = await planCollection('orders', Order, ['clientId'])
  const customerPlan = await planCollection('customers', Customer, ['phone'])

  const decisions = {
    products: decide(shops.length, shops, productPlan),
    orders: decide(shops.length, shops, orderPlan),
    customers: decide(shops.length, shops, customerPlan),
  }

  const report = {
    mode: dryRun ? 'dry-run' : 'apply',
    shops: shops.length,
    products: productPlan,
    orders: orderPlan,
    customers: customerPlan,
    decisions,
    indexes: {
      products: await listIndexNames(Product),
      orders: await listIndexNames(Order),
      customers: await listIndexNames(Customer),
    },
  }

  // Do not print shop names or customer PII
  console.log(JSON.stringify(report, null, 2))

  const blocked = Object.values(decisions).filter((d) => d.action === 'blocked')
  if (blocked.length) {
    console.log('[migrate] BLOCKED collections cannot be assigned without operator-confirmed ownership.')
  }

  if (dryRun) {
    console.log('[migrate] dry-run complete; no documents or indexes were modified.')
    await disconnectDB()
    process.exit(blocked.length ? 2 : 0)
  }

  const results = {}
  for (const [key, Model] of [
    ['products', Product],
    ['orders', Order],
    ['customers', Customer],
  ]) {
    const decision = decisions[key]
    if (decision.action !== 'assign') {
      results[key] = { updated: 0, skipped: decision.reason }
      continue
    }
    const res = await Model.updateMany(
      missingShop,
      { $set: { shop: decision.shopId } },
    )
    results[key] = { updated: res.modifiedCount, matched: res.matchedCount }
  }
  console.log('[migrate] assignment', JSON.stringify(results))

  const remainingMissing =
    (await Product.countDocuments(missingShop)) +
    (await Order.countDocuments(missingShop)) +
    (await Customer.countDocuments(missingShop))

  if (remainingMissing > 0) {
    console.log(
      `[migrate] ${remainingMissing} documents still lack shop; keeping legacy unique indexes.`,
    )
  } else {
    for (const [coll, names] of Object.entries(OLD_UNIQUE_INDEXES)) {
      const Model = { products: Product, orders: Order, customers: Customer }[coll]
      const existing = await listIndexNames(Model)
      for (const name of names) {
        if (!existing.includes(name)) continue
        try {
          await Model.collection.dropIndex(name)
          console.log(`[migrate] dropped legacy index ${coll}.${name}`)
        } catch (err) {
          console.log(`[migrate] could not drop ${coll}.${name}: ${err.message}`)
        }
      }
    }
  }

  await disconnectDB()
  process.exit(0)
}

main().catch(async (err) => {
  console.error('[migrate] failed:', err.message)
  await mongoose.connection.close().catch(() => {})
  process.exit(1)
})
