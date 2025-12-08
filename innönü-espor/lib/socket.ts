'use client'

import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const getSocket = (): Socket | null => {
  if (typeof window === 'undefined') return null

  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      transports: ['websocket'],
    })
  }

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

