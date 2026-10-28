import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { login, me } from './auth.controller.js'
import { protect } from '../../middlewares/auth.js'

const router = Router()

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many login attempts, try again later' } },
})

router.post('/login', loginLimiter, login)
router.get('/me', protect, me)

export default router
