import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { requireIsolatedTestUri } from './mongo-uri.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const testUri = requireIsolatedTestUri(process.env)

process.env.NODE_ENV = 'test'
process.env.MONGODB_URI = testUri
process.env.JWT_SECRET = process.env.JWT_SECRET || 'phase1-test-secret-at-least-32-chars'
process.env.CORS_ORIGIN = 'http://127.0.0.1'
process.env.BCRYPT_ROUNDS = '4'

const { createApp } = await import('../src/app.js')
const { User } = await import('../src/modules/users/user.model.js')
const { Shop } = await import('../src/modules/shops/shop.model.js')
const { Product } = await import('../src/modules/products/product.model.js')
const { Customer } = await import('../src/modules/customers/customer.model.js')
const { Subscription } = await import('../src/modules/subscriptions/subscription.model.js')
const { PLANS } = await import('../src/modules/subscriptions/plans.js')

let server
let baseUrl
const recordedIo = []
const ctx = {}

function mockIo() {
  return {
    to(room) {
      return {
        emit(event) {
          recordedIo.push({ room, event })
        },
      }
    },
    emit(event) {
      recordedIo.push({ room: '*', event })
    },
  }
}

async function json(res) {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

async function login(email, password) {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const body = await json(res)
  assert.equal(res.status, 200, body.error?.message || 'login failed')
  return body.data.token
}

function headers(token) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

async function createShopUser(label, email, password) {
  const user = new User({ name: label, email, role: 'staff' })
  await user.setPassword(password)
  await user.save()
  const shop = await Shop.create({ name: `${label} Shop`, owner: user._id })
  user.shop = shop._id
  await user.save()
  const now = new Date()
  const sub = await Subscription.create({
    shop: shop._id,
    plan: 'monthly',
    amount: PLANS.monthly.amount,
    paidAmount: PLANS.monthly.amount,
    paymentMethod: 'bkash',
    transactionId: `T${label}${Date.now()}${Math.random().toString(36).slice(2, 8)}`,
    status: 'active',
    startDate: now,
    endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
  })
  shop.currentSubscription = sub._id
  await shop.save()
  return { user, shop, token: null }
}

before(async () => {
  await mongoose.connect(testUri, { serverSelectionTimeoutMS: 15000 })
  if (!/test/i.test(mongoose.connection.name)) {
    throw new Error(`Refusing to continue: connected to non-test db`)
  }
  await mongoose.connection.dropDatabase()

  const app = createApp()
  app.set('io', mockIo())
  server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  baseUrl = `http://127.0.0.1:${port}`

  ctx.a = await createShopUser('A', 'a@example.com', 'password1')
  ctx.b = await createShopUser('B', 'b@example.com', 'password1')
  ctx.a.token = await login('a@example.com', 'password1')
  ctx.b.token = await login('b@example.com', 'password1')

  const admin = new User({ name: 'Admin', email: 'admin-test@example.com', role: 'admin' })
  await admin.setPassword('password1')
  await admin.save()
  ctx.adminToken = await login('admin-test@example.com', 'password1')

  const expiredUser = new User({ name: 'Expired', email: 'expired@example.com', role: 'staff' })
  await expiredUser.setPassword('password1')
  await expiredUser.save()
  const expiredShop = await Shop.create({ name: 'Expired Shop', owner: expiredUser._id })
  expiredUser.shop = expiredShop._id
  await expiredUser.save()
  const expiredSub = await Subscription.create({
    shop: expiredShop._id,
    plan: 'monthly',
    amount: 999,
    paidAmount: 999,
    paymentMethod: 'bkash',
    transactionId: `EXP${Date.now()}`,
    status: 'expired',
    startDate: new Date(0),
    endDate: new Date(0),
  })
  expiredShop.currentSubscription = expiredSub._id
  await expiredShop.save()
  ctx.expiredToken = await login('expired@example.com', 'password1')
})

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve))
  if (mongoose.connection.readyState === 1 && /test/i.test(mongoose.connection.name)) {
    await mongoose.connection.dropDatabase()
  }
  await mongoose.disconnect()
})

test('shop A manages own products; cannot read or mutate shop B products', async () => {
  const createdA = await fetch(`${baseUrl}/api/products`, {
    method: 'POST',
    headers: headers(ctx.a.token),
    body: JSON.stringify({
      name: 'Rice A',
      sku: 'SKU-SHARED',
      price: 100,
      stock: 10,
      barcode: '111',
      shop: ctx.b.shop._id,
    }),
  })
  const productABody = await json(createdA)
  assert.equal(createdA.status, 201, productABody.error?.message)
  assert.equal(String(productABody.data.shop), String(ctx.a.shop._id))
  ctx.productAId = productABody.data.id

  const createdB = await fetch(`${baseUrl}/api/products`, {
    method: 'POST',
    headers: headers(ctx.b.token),
    body: JSON.stringify({
      name: 'Rice B',
      sku: 'SKU-SHARED',
      price: 200,
      stock: 20,
      barcode: '222',
    }),
  })
  const productBBody = await json(createdB)
  assert.equal(createdB.status, 201, productBBody.error?.message)
  ctx.productBId = productBBody.data.id

  const listA = await fetch(`${baseUrl}/api/products?shop=${ctx.b.shop._id}`, {
    headers: headers(ctx.a.token),
  })
  const listABody = await json(listA)
  assert.equal(listA.status, 200)
  assert.equal(listABody.data.length, 1)
  assert.equal(listABody.data[0].name, 'Rice A')

  const getB = await fetch(`${baseUrl}/api/products/${ctx.productBId}`, {
    headers: headers(ctx.a.token),
  })
  assert.equal(getB.status, 404)

  const barcodeB = await fetch(`${baseUrl}/api/products/barcode/222`, {
    headers: headers(ctx.a.token),
  })
  assert.equal(barcodeB.status, 404)

  const updateB = await fetch(`${baseUrl}/api/products/${ctx.productBId}`, {
    method: 'PUT',
    headers: headers(ctx.a.token),
    body: JSON.stringify({ price: 1, shop: ctx.a.shop._id }),
  })
  assert.equal(updateB.status, 404)

  const deleteB = await fetch(`${baseUrl}/api/products/${ctx.productBId}`, {
    method: 'DELETE',
    headers: headers(ctx.a.token),
  })
  assert.equal(deleteB.status, 404)

  const stillB = await Product.findById(ctx.productBId)
  assert.equal(stillB.price, 200)
  assert.equal(stillB.active, true)
  assert.equal(stillB.stock, 20)
})

test('shop A cannot read or mutate shop B customers or orders', async () => {
  const custB = await fetch(`${baseUrl}/api/customers`, {
    method: 'POST',
    headers: headers(ctx.b.token),
    body: JSON.stringify({ name: 'Cust B', phone: '01700000001' }),
  })
  const custBBody = await json(custB)
  assert.equal(custB.status, 201)
  ctx.customerBId = custBBody.data.id

  const listA = await fetch(`${baseUrl}/api/customers`, { headers: headers(ctx.a.token) })
  const listABody = await json(listA)
  assert.equal(listA.status, 200)
  assert.equal(listABody.data.length, 0)

  const getA = await fetch(`${baseUrl}/api/customers/${ctx.customerBId}`, {
    headers: headers(ctx.a.token),
  })
  assert.equal(getA.status, 404)

  const delA = await fetch(`${baseUrl}/api/customers/${ctx.customerBId}`, {
    method: 'DELETE',
    headers: headers(ctx.a.token),
  })
  assert.equal(delA.status, 404)
  assert.equal(await Customer.countDocuments({ _id: ctx.customerBId }), 1)

  const orderB = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: headers(ctx.b.token),
    body: JSON.stringify({
      items: [{ productId: ctx.productBId, quantity: 1 }],
      paymentMethod: 'cash',
      tendered: 1000,
      customerId: ctx.customerBId,
    }),
  })
  const orderBBody = await json(orderB)
  assert.equal(orderB.status, 201, orderBBody.error?.message)
  ctx.orderBId = orderBBody.data.id

  const listOrdersA = await fetch(`${baseUrl}/api/orders`, { headers: headers(ctx.a.token) })
  const listOrdersABody = await json(listOrdersA)
  assert.equal(listOrdersA.status, 200)
  assert.equal(listOrdersABody.data.length, 0)

  const getOrderA = await fetch(`${baseUrl}/api/orders/${ctx.orderBId}`, {
    headers: headers(ctx.a.token),
  })
  assert.equal(getOrderA.status, 404)
})

test('shop A cannot checkout using shop B product or customer IDs; stock stays isolated', async () => {
  const productB = await Product.findById(ctx.productBId)
  const stockBefore = productB.stock

  const res = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: headers(ctx.a.token),
    body: JSON.stringify({
      items: [{ productId: ctx.productBId, quantity: 1 }],
      paymentMethod: 'cash',
      tendered: 1000,
      customerId: ctx.customerBId,
    }),
  })
  const body = await json(res)
  assert.equal(res.status, 400)
  assert.match(body.error.message, /Product not found/)

  const fresh = await Product.findById(ctx.productBId)
  assert.equal(fresh.stock, stockBefore)
})

test('same-shop checkout decrements stock and emits only to that shop room', async () => {
  recordedIo.length = 0
  const productA = await Product.findById(ctx.productAId)
  const stockBefore = productA.stock

  const res = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: headers(ctx.a.token),
    body: JSON.stringify({
      items: [{ productId: ctx.productAId, quantity: 2 }],
      paymentMethod: 'cash',
      tendered: 1000,
    }),
  })
  const body = await json(res)
  assert.equal(res.status, 201, body.error?.message)

  const fresh = await Product.findById(ctx.productAId)
  assert.equal(fresh.stock, stockBefore - 2)

  const rooms = recordedIo.map((e) => e.room)
  assert.ok(rooms.includes(`shop:${ctx.a.shop._id}`))
  assert.equal(
    rooms.some((r) => r === '*'),
    false,
  )
  assert.ok(recordedIo.some((e) => e.event === 'order:created'))
  assert.ok(recordedIo.some((e) => e.event === 'stock:updated'))
})

test('product:updated is shop-scoped, not global', async () => {
  recordedIo.length = 0
  const res = await fetch(`${baseUrl}/api/products/${ctx.productAId}`, {
    method: 'PUT',
    headers: headers(ctx.a.token),
    body: JSON.stringify({ price: 150 }),
  })
  assert.equal(res.status, 200)
  assert.equal(
    recordedIo.some((e) => e.room === '*'),
    false,
  )
  assert.ok(
    recordedIo.some(
      (e) => e.event === 'product:updated' && e.room === `shop:${ctx.a.shop._id}`,
    ),
  )
})

test('admin without shop cannot access POS catalog', async () => {
  const list = await fetch(`${baseUrl}/api/products`, { headers: headers(ctx.adminToken) })
  assert.equal(list.status, 403)
  const orders = await fetch(`${baseUrl}/api/orders`, { headers: headers(ctx.adminToken) })
  assert.equal(orders.status, 403)
})

test('expired subscription remains blocked', async () => {
  const list = await fetch(`${baseUrl}/api/products`, { headers: headers(ctx.expiredToken) })
  assert.equal(list.status, 402)
})

test('login still works for shop staff', async () => {
  const me = await fetch(`${baseUrl}/api/auth/me`, { headers: headers(ctx.a.token) })
  const body = await json(me)
  assert.equal(me.status, 200)
  assert.equal(body.data.email, 'a@example.com')
  assert.equal(body.data.role, 'staff')
})
