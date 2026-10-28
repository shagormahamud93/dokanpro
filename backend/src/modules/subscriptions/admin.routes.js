import { Router } from 'express'
import { protect, restrictTo } from '../../middlewares/auth.js'
import { approve, extend, getOne, listAll, reject } from './admin.controller.js'

const router = Router()

router.use(protect, restrictTo('admin'))

router.get('/', listAll)
router.get('/:id', getOne)
router.post('/:id/approve', approve)
router.post('/:id/reject', reject)
router.post('/:id/extend', extend)

export default router
