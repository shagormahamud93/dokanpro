import { test } from 'node:test'
import assert from 'node:assert/strict'
import { emitToShop, omitClientShopFields } from '../src/utils/tenant.js'
import { requireIsolatedTestUri, normalizeMongoUri } from './mongo-uri.js'

test('emitToShop never falls back to a global broadcast', () => {
  const events = []
  const io = {
    to(room) {
      return {
        emit(event) {
          events.push({ room, event })
        },
      }
    },
    emit(event) {
      events.push({ room: '*', event })
    },
  }

  emitToShop(io, null, 'order:created', {})
  emitToShop(undefined, 'abc', 'order:created', {})
  emitToShop(io, 'abc', 'stock:updated', {})

  assert.deepEqual(events, [{ room: 'shop:abc', event: 'stock:updated' }])
})

test('omitClientShopFields strips tenant identifiers from bodies', () => {
  const rest = omitClientShopFields({
    shop: 'evil',
    shopId: 'evil2',
    shop_id: 'evil3',
    name: 'Ok',
  })
  assert.deepEqual(rest, { name: 'Ok' })
})

test('requireIsolatedTestUri does not fall back to MONGODB_URI', () => {
  assert.throws(
    () =>
      requireIsolatedTestUri({
        MONGODB_URI: 'mongodb://127.0.0.1:27017/dokanpro',
      }),
    /TEST_MONGODB_URI/,
  )
})

test('requireIsolatedTestUri rejects production-named databases', () => {
  assert.throws(
    () =>
      requireIsolatedTestUri({
        TEST_MONGODB_URI: 'mongodb://127.0.0.1:27017/dokanpro',
      }),
    /must contain "test"/,
  )
})

test('requireIsolatedTestUri accepts a quoted isolated URI', () => {
  const uri = requireIsolatedTestUri({
    TEST_MONGODB_URI: '"mongodb://127.0.0.1:27017/dokanpro_phase1_test"',
  })
  assert.equal(normalizeMongoUri(uri), 'mongodb://127.0.0.1:27017/dokanpro_phase1_test')
})
