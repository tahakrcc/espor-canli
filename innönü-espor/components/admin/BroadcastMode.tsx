'use client'

import { useState, useEffect } from 'react'
import { Socket } from 'socket.io-client'

interface BroadcastModeProps {
  events: any[]
  socket: Socket | null
}

export function BroadcastMode({ events, socket }: BroadcastModeProps) {
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [leaderboard, setLeaderboard] = useState<any[]>([])

  useEffect(() => {
    if (!selectedEvent) return

    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(`/api/events/${selectedEvent}/leaderboard`)
        if (response.ok) {
          const data = await response.json()
          setLeaderboard(data)
        }
      } catch (error) {
        console.error('Liderlik tablosu yüklenemedi:', error)
      }
    }

    fetchLeaderboard()

    if (socket) {
      socket.on('leaderboard-updated', () => {
        fetchLeaderboard()
      })
    }

    return () => {
      if (socket) {
        socket.off('leaderboard-updated')
      }
    }
  }, [selectedEvent, socket])

  const activeEvent = events.find((e) => e.id === selectedEvent)

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">📺 Canlı Yayın Ekranı</h2>

      <div className="bg-gray-800 rounded-lg p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Etkinlik Seç
          </label>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 rounded text-white"
          >
            <option value="">Etkinlik seçin...</option>
            {events
              .filter((e) => e.status === 'ACTIVE')
              .map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
          </select>
        </div>

        {selectedEvent && activeEvent && (
          <div className="bg-black rounded-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">
                {activeEvent.name}
              </h1>
              <p className="text-gray-400">{activeEvent.description}</p>
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4 text-center">
                🏆 Liderlik Tablosu
              </h2>
              <div className="space-y-2">
                {leaderboard.slice(0, 10).map((score, index) => (
                  <div
                    key={score.id}
                    className="flex justify-between items-center bg-gray-800 p-4 rounded"
                  >
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl font-bold text-yellow-400 w-8">
                        #{index + 1}
                      </span>
                      <span className="text-xl text-white">
                        {score.user.username}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-400">
                        {score.score}
                      </div>
                      <div className="text-sm text-gray-400">
                        {score.wins}W - {score.losses}L
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 text-center text-gray-500 text-sm">
              Bu ekran kafe, sınıf veya Discord ekranı için tasarlanmıştır.
              <br />
              Tıklanamaz - Sadece gösterim modu
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

