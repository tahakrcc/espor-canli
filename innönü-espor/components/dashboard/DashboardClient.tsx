'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'
import { GameScreen } from './GameScreen'
import { Leaderboard } from './Leaderboard'
import { EventList } from './EventList'
import { MatchScreen } from './MatchScreen'

interface DashboardClientProps {
  activeEvent: any
  userEvents: any[]
  scores: any[]
  user: any
  activeMatch: any
}

export function DashboardClient({
  activeEvent: initialActiveEvent,
  userEvents: initialUserEvents,
  scores: initialScores,
  user,
  activeMatch: initialActiveMatch,
}: DashboardClientProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [activeEvent, setActiveEvent] = useState(initialActiveEvent)
  const [activeMatch, setActiveMatch] = useState(initialActiveMatch)
  const [currentGame, setCurrentGame] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000')
    setSocket(newSocket)

    newSocket.on('connect', () => {
      setIsConnected(true)
      if (activeEvent) {
        newSocket.emit('join-event', activeEvent.id)
      }
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
    })

    // Admin oyun değiştirdiğinde
    newSocket.on('game-changed', (data: { gameType: string; eventId: string }) => {
      if (data.eventId === activeEvent?.id) {
        setCurrentGame({ gameType: data.gameType, isActive: true })
        // Etkinlik bilgisini güncelle
        setActiveEvent((prev: any) => ({
          ...prev,
          currentGameType: data.gameType,
        }))
      }
    })

    // Admin oyun durdurduğunda
    newSocket.on('game-stopped', (data: { eventId: string }) => {
      if (data.eventId === activeEvent?.id) {
        setCurrentGame(null)
        setActiveEvent((prev: any) => ({
          ...prev,
          currentGameType: null,
        }))
      }
    })

    // Etkinlik güncellemeleri
    newSocket.on('event-updated', (event: any) => {
      setActiveEvent(event)
    })

    // Yeni etkinlik oluşturulduğunda (tüm kullanıcılara)
    newSocket.on('new-event-available', (event: any) => {
      if (event.status === 'ACTIVE' && event.isLive && !activeEvent) {
        // Aktif etkinlik yoksa yeni etkinliği göster
        setActiveEvent({
          ...event,
          participants: [],
          _count: { participants: 0 },
        })
      }
    })

    // Maç oluşturulduğunda
    newSocket.on('match-assigned', (match: any) => {
      if (
        (match.player1Id === user.id || match.player2Id === user.id) &&
        match.eventId === activeEvent?.id
      ) {
        setActiveMatch(match)
      }
    })

    // Maç başladığında
    newSocket.on('match-started', (data: { matchId: string }) => {
      if (activeMatch?.id === data.matchId) {
        setActiveMatch((prev: any) => ({
          ...prev,
          status: 'IN_PROGRESS',
        }))
      }
    })

    // Maç bittiğinde
    newSocket.on('match-finished', (data: { matchId: string }) => {
      if (activeMatch?.id === data.matchId) {
        setActiveMatch(null)
      }
    })

    return () => {
      newSocket.close()
    }
  }, [activeEvent?.id])

  const handleJoinEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/join`, {
        method: 'POST',
      })
      if (response.ok) {
        const event = await response.json()
        // Kullanıcıyı participant olarak ekle
        setActiveEvent((prev: any) => ({
          ...prev,
          participants: [{ userId: user.id }],
        }))
        socket?.emit('join-event', eventId)
      }
    } catch (error) {
      console.error('Etkinliğe katılma hatası:', error)
    }
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <nav className="bg-purple-900 border-b-2 border-purple-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center h-auto sm:h-16 py-3 sm:py-0 gap-3 sm:gap-0">
            <div className="flex items-center">
              <h1 className="text-lg sm:text-xl font-bold text-white">🎮 İnönü E-Spor</h1>
              <span className="ml-2 sm:ml-4 text-xs sm:text-sm text-purple-200">
                {user.username}
              </span>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-400' : 'bg-red-400'
                }`}
                title={isConnected ? 'Bağlı' : 'Bağlantı yok'}
              />
              <button
                onClick={() => signOut()}
                className="px-3 sm:px-4 py-2 bg-white text-purple-900 rounded-lg hover:bg-gray-100 transition-all font-semibold text-sm sm:text-base"
              >
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {activeEvent ? (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-purple-600 shadow-lg">
              <h2 className="text-xl sm:text-2xl font-bold mb-2 text-black">
                {activeEvent.name}
              </h2>
              <p className="text-black mb-4 text-sm sm:text-base">{activeEvent.description}</p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <span className="px-3 py-1 bg-purple-600 text-white rounded-lg text-xs sm:text-sm font-semibold">
                    Aktif Etkinlik
                  </span>
                  <span className="text-xs sm:text-sm text-black">
                    {activeEvent._count?.participants || 0} katılımcı
                  </span>
                </div>
                {activeEvent.participants?.length === 0 && (
                  <button
                    onClick={() => handleJoinEvent(activeEvent.id)}
                    className="w-full sm:w-auto px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition-all transform hover:scale-105 shadow-lg"
                  >
                    🎮 Etkinliğe Katıl
                  </button>
                )}
              </div>
            </div>

            {/* Kullanıcı katılmışsa oyun/bekleme ekranını göster */}
            {activeEvent.participants && activeEvent.participants.length > 0 ? (
              <>
                {/* Eğer aktif maç varsa MatchScreen göster */}
                {activeMatch ? (
                  <MatchScreen
                    match={activeMatch}
                    userId={user.id}
                    socket={socket}
                    eventId={activeEvent.id}
                  />
                ) : activeEvent.currentGameType || currentGame ? (
                  <GameScreen
                    gameType={
                      currentGame?.gameType || activeEvent.currentGameType
                    }
                    eventId={activeEvent.id}
                    userId={user.id}
                    socket={socket}
                  />
                ) : (
                  <div className="bg-white rounded-xl p-8 sm:p-12 text-center border-2 border-purple-600 shadow-lg">
                    <div className="mb-6">
                      <div className="inline-block animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-t-4 border-b-4 border-purple-600"></div>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-black">
                      ⏳ Beklemedesiniz
                    </h3>
                    <p className="text-lg sm:text-xl text-black mb-2">
                      Admin eşleştirme yapana kadar bekleyin...
                    </p>
                    <p className="text-sm sm:text-base text-black">
                      Eşleştirme yapıldığında otomatik olarak maç ekranına yönlendirileceksiniz
                    </p>
                    <div className="mt-6 flex justify-center space-x-2">
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                )}
                <Leaderboard eventId={activeEvent.id} socket={socket} />
              </>
            ) : (
              <div className="bg-white rounded-xl p-6 sm:p-8 text-center border-2 border-dashed border-purple-600 shadow-lg">
                <p className="text-base sm:text-lg text-black mb-4">
                  Etkinliğe katılmak için yukarıdaki "🎮 Etkinliğe Katıl" butonuna tıklayın
                </p>
                <p className="text-sm text-black">
                  Katıldıktan sonra admin eşleştirme yapana kadar bekleyeceksiniz
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-black">Etkinlikler</h2>
            {initialUserEvents.length > 0 ? (
              <EventList
                events={initialUserEvents}
                onJoinEvent={handleJoinEvent}
              />
            ) : (
              <div className="bg-white rounded-xl p-6 sm:p-8 text-center border-2 border-purple-600 shadow-lg">
                <p className="text-black mb-4 text-base sm:text-lg">
                  Henüz aktif etkinlik yok
                </p>
                <p className="text-sm text-black">
                  Admin bir etkinlik oluşturduğunda burada görünecektir.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

