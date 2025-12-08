'use client'

import { useState } from 'react'
import { Socket } from 'socket.io-client'

interface TournamentBracketProps {
  events: any[]
  socket: Socket | null
}

export function TournamentBracket({ events, socket }: TournamentBracketProps) {
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [matches, setMatches] = useState<any[]>([])

  const activeEvent = events.find((e) => e.id === selectedEvent)

  const handleCreateMatches = async () => {
    if (!selectedEvent) return

    try {
      const response = await fetch(
        `/api/admin/events/${selectedEvent}/matches/create`,
        {
          method: 'POST',
        }
      )

      if (response.ok) {
        const data = await response.json()
        setMatches(data)
        if (socket) {
          socket.emit('matches-created', { eventId: selectedEvent })
        }
      }
    } catch (error) {
      console.error('Eşleştirme hatası:', error)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Turnuva Eşleştirmeleri</h2>

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
              .filter((e) => e.status === 'ACTIVE' && e.tournamentMode)
              .map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
          </select>
        </div>

        {selectedEvent && (
          <>
            <button
              onClick={handleCreateMatches}
              className="px-6 py-3 bg-blue-600 rounded hover:bg-blue-700"
            >
              🔄 Otomatik Eşleştirme Yap
            </button>

            {matches.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold">Eşleştirmeler</h3>
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className="bg-gray-700 rounded p-4 flex justify-between items-center"
                  >
                    <div>
                      <span className="font-semibold">
                        {match.player1.username}
                      </span>{' '}
                      vs{' '}
                      <span className="font-semibold">
                        {match.player2?.username || 'Bekleniyor...'}
                      </span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded text-sm ${
                        match.status === 'COMPLETED'
                          ? 'bg-green-600'
                          : match.status === 'IN_PROGRESS'
                          ? 'bg-blue-600'
                          : 'bg-gray-600'
                      }`}
                    >
                      {match.status === 'COMPLETED' && 'Tamamlandı'}
                      {match.status === 'IN_PROGRESS' && 'Devam Ediyor'}
                      {match.status === 'PENDING' && 'Bekliyor'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

