import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'

import { env, isProd } from './config/env.js'
import { errorHandler } from './middlewares/error.js'
import { notFound } from './middlewares/notFound.js'

import authRoutes from './modules/auth/auth.routes.js'
import userRoutes from './modules/users/user.routes.js'
import productRoutes from './modules/products/product.routes.js'
import orderRoutes from './modules/orders/order.routes.js'
import customerRoutes from './modules/customers/customer.routes.js'
import subscriptionRoutes from './modules/subscriptions/subscription.routes.js'
import adminSubscriptionRoutes from './modules/subscriptions/admin.routes.js'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  app.set('trust proxy', 1)

  // Security & infra
  app.use(helmet())
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    }),
  )
  app.use(compression())
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true }))
  if (!isProd && env.nodeEnv !== 'test') app.use(morgan('dev'))

  // Health
  app.get('/healthz', (_req, res) => res.json({ ok: true, env: env.nodeEnv }))

  // API
  app.use('/api/auth', authRoutes)
  app.use('/api/users', userRoutes)
  app.use('/api/products', productRoutes)
  app.use('/api/orders', orderRoutes)
  app.use('/api/customers', customerRoutes)
  app.use('/api/subscriptions', subscriptionRoutes)
  app.use('/api/admin/subscriptions', adminSubscriptionRoutes)

  app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'DokanPro API is running',
  })
})


  // 404 + error handler (always last)
  app.use(notFound)
  app.use(errorHandler)

  return app
}
