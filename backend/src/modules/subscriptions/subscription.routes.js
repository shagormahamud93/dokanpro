import { Router } from 'express'
import { protect } from '../../middlewares/auth.js'
import { getMine, listPlans, submit } from './subscription.controller.js'

const router = Router()

router.use(protect)

router.get('/plans', listPlans)
router.get('/me', getMine)
router.post('/', submit)

export default router
