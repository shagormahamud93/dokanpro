import { Router } from 'express'
import { protect } from '../../middlewares/auth.js'
import { requireActiveSubscription } from '../../middlewares/subscription.js'
import { requireShop } from '../../middlewares/shop.js'
import {
  createCustomer,
  deleteCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
} from './customer.controller.js'

const router = Router()

router.use(protect, requireActiveSubscription, requireShop)

router.route('/').get(listCustomers).post(createCustomer)
router.route('/:id').get(getCustomer).put(updateCustomer).delete(deleteCustomer)

export default router
