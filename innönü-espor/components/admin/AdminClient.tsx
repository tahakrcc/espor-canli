'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'
import { EventManagement } from './EventManagement'
import { GameControl } from './GameControl'
import { UserManagement } from './UserManagement'
import { TournamentBracket } from './TournamentBracket'
import { BroadcastMode } from './BroadcastMode'

interface AdminClientProps {
  events: any[]
  users: any[]
}

export function AdminClient({ events: initialEvents, users: initialUsers }: AdminClientProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [events, setEvents] = useState(initialEvents)
  const [users, setUsers] = useState(initialUsers)
  const [activeTab, setActiveTab] = useState('events')
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000')
    setSocket(newSocket)

    newSocket.on('connect', () => {
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
    })

    return () => {
      newSocket.close()
    }
  }, [])

  const refreshEvents = async () => {
    const response = await fetch('/api/admin/events')
    if (response.ok) {
      const data = await response.json()
      setEvents(data)
    }
  }

  const refreshUsers = async () => {
    const response = await fetch('/api/admin/users')
    if (response.ok) {
      const data = await response.json()
      setUsers(data)
    }
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <nav className="bg-purple-900 border-b-2 border-purple-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center h-auto sm:h-16 py-3 sm:py-0 gap-3 sm:gap-0">
            <div className="flex items-center">
              <h1 className="text-lg sm:text-xl font-bold text-white">🛠️ Admin Panel</h1>
              <div
                className={`ml-2 sm:ml-4 w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-400' : 'bg-red-400'
                }`}
                title={isConnected ? 'Bağlı' : 'Bağlantı yok'}
              />
            </div>
            <button
              onClick={() => signOut()}
              className="px-3 sm:px-4 py-2 bg-white text-purple-900 rounded-lg hover:bg-gray-100 transition-all font-semibold text-sm sm:text-base"
            >
              Çıkış
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-wrap gap-1 sm:gap-1 mb-6 border-b-2 border-purple-700 overflow-x-auto">
          {[
            { id: 'events', label: '📅 Etkinlikler' },
            { id: 'games', label: '🎮 Oyun Kontrolü' },
            { id: 'tournament', label: '🏆 Turnuva' },
            { id: 'users', label: '👥 Kullanıcılar' },
            { id: 'broadcast', label: '📺 Yayın Ekranı' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 sm:px-6 py-2 sm:py-3 font-medium transition text-sm sm:text-base whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-b-2 border-purple-400 text-purple-300 bg-purple-900 bg-opacity-50'
                  : 'text-purple-200 hover:text-white hover:bg-purple-900 hover:bg-opacity-30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'events' && (
          <EventManagement
            events={events}
            onRefresh={refreshEvents}
            socket={socket}
          />
        )}

        {activeTab === 'games' && (
          <GameControl events={events} socket={socket} />
        )}

        {activeTab === 'tournament' && (
          <TournamentBracket events={events} socket={socket} />
        )}

        {activeTab === 'users' && (
          <UserManagement users={users} onRefresh={refreshUsers} />
        )}

        {activeTab === 'broadcast' && (
          <BroadcastMode events={events} socket={socket} />
        )}
      </div>
    </div>
  )
}

