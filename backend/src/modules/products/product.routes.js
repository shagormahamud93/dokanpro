import { Router } from 'express'
import { protect } from '../../middlewares/auth.js'
import { requireActiveSubscription } from '../../middlewares/subscription.js'
import { requireShop } from '../../middlewares/shop.js'
import {
  createProduct,
  deleteProduct,
  getByBarcode,
  getProduct,
  listProducts,
  updateProduct,
} from './product.controller.js'

const router = Router()

router.use(protect, requireShop)

router.get('/', listProducts)
router.get('/barcode/:code', getByBarcode)
router.get('/:id', getProduct)

router.post('/', createProduct)
router.put('/:id', updateProduct)
router.delete('/:id', deleteProduct)

export default router
