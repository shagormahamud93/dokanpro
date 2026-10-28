import { Router } from 'express'
import { protect } from '../../middlewares/auth.js'
import { requireActiveSubscription } from '../../middlewares/subscription.js'
import { requireShop } from '../../middlewares/shop.js'
import { createOrder, getOrder, listOrders } from './order.controller.js'

const router = Router()

router.use(protect, requireActiveSubscription, requireShop)

router.route('/').get(listOrders).post(createOrder)
router.get('/:id', getOrder)

export default router
