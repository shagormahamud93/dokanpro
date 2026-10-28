import { test } from 'node:test'
import assert from 'node:assert/strict'
import { emitToShop, omitClientShopFields } from '../src/utils/tenant.js'

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
