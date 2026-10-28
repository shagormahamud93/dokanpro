import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { io, type Socket } from 'socket.io-client'
import { API_URL } from '@/lib/api'
import { useAuth } from './AuthContext'

interface SocketContextValue {
  socket: Socket | null
  connected: boolean
}

const SocketContext = createContext<SocketContextValue>({ socket: null, connected: false })

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const [connected, setConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!token) {
      socketRef.current?.disconnect()
      socketRef.current = null
      setConnected(false)
      return
    }

    const socket = io(API_URL, {
      auth: { token },
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('connect_error', (err) => {
      console.warn('[socket] connect_error:', err.message)
      setConnected(false)
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
      socketRef.current = null
      setConnected(false)
    }
  }, [token])

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}

/**
 * Subscribe to a named server event for the lifetime of the component.
 * Stable across re-renders thanks to a ref-bound handler.
 */
export function useSocketEvent<T = unknown>(event: string, handler: (payload: T) => void) {
  const { socket } = useSocket()
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (!socket) return
    const fn = (payload: T) => handlerRef.current(payload)
    socket.on(event, fn)
    return () => {
      socket.off(event, fn)
    }
  }, [socket, event])
}
