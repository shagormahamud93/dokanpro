import { Server } from 'socket.io'
import { verifyToken } from '../utils/jwt.js'
import { env } from '../config/env.js'
import { User } from '../modules/users/user.model.js'

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigins.includes('*') ? true : env.corsOrigins,
      credentials: true,
    },
    path: '/socket.io',
  })

  // JWT-authenticated handshake — shop room comes from DB membership only
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '')
      if (!token) return next(new Error('Auth token required'))

      const payload = verifyToken(token)
      const user = await User.findById(payload.sub).select('role shop active')
      if (!user || !user.active) return next(new Error('User not found or inactive'))

      socket.data.userId = user._id.toString()
      socket.data.role = user.role
      // Ignore handshake.auth.shopId / query shop — membership only
      socket.data.shopId = user.shop?.toString() ?? null
      next()
    } catch {
      next(new Error('Invalid or expired token'))
    }
  })

  io.on('connection', (socket) => {
    const { role, shopId } = socket.data

    socket.join(`user:${socket.data.userId}`)
    if (shopId) socket.join(`shop:${shopId}`)
    if (role === 'admin') socket.join('admin')

    console.log(`[ws] connected ${socket.id} role=${role} shop=${shopId ? 'yes' : 'no'}`)

    socket.on('join', (_room, cb) => {
      if (typeof cb === 'function') cb({ error: 'forbidden' })
    })

    socket.on('disconnect', (reason) => {
      console.log(`[ws] disconnected ${socket.id} (${reason})`)
    })

    socket.on('ping:check', (cb) => cb?.({ ok: true, ts: Date.now() }))
  })

  return io
}
