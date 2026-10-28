import http from 'node:http'
import { createApp } from './app.js'
import { connectDB, disconnectDB } from './config/db.js'
import { env } from './config/env.js'
import { initSocket } from './sockets/index.js'
import { startExpirySweep } from './jobs/expirySweep.js'

async function bootstrap() {
  await connectDB()

  const app = createApp()
  const server = http.createServer(app)
  const io = initSocket(server)

  // Make io available to controllers via req.app.get('io')
  app.set('io', io)

  // Hourly auto-expiry sweep + immediate run on boot
  const stopSweep = startExpirySweep(io)

  server.listen(env.port, () => {
    console.log(`[http] DokanPro API running on http://localhost:${env.port}`)
    console.log(`[ws]   Socket.IO listening on  ws://localhost:${env.port}/socket.io`)
    console.log(`[jobs] Subscription expiry sweep started (hourly)`)
  })

  const shutdown = async (signal) => {
    console.log(`\n[shutdown] ${signal} received, closing...`)
    stopSweep()
    server.close(() => console.log('[http] closed'))
    io.close()
    await disconnectDB()
    process.exit(0)
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))

  process.on('unhandledRejection', (err) => {
    console.error('[unhandledRejection]', err)
  })
  process.on('uncaughtException', (err) => {
    console.error('[uncaughtException]', err)
    shutdown('uncaughtException')
  })
}

bootstrap().catch((err) => {
  console.error('[bootstrap] failed:', err)
  process.exit(1)
})
