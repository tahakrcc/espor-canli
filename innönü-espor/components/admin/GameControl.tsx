'use client'

import { useState } from 'react'
import { Socket } from 'socket.io-client'
import { GameType } from '@prisma/client'

interface GameControlProps {
  events: any[]
  socket: Socket | null
}

export function GameControl({ events, socket }: GameControlProps) {
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [selectedGame, setSelectedGame] = useState<GameType | ''>('')

  const activeEvent = events.find((e) => e.status === 'ACTIVE' && e.isLive)

  const handleStartGame = async () => {
    if (!selectedEvent || !selectedGame) return

    try {
      const response = await fetch(`/api/admin/events/${selectedEvent}/game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameType: selectedGame }),
      })

      if (response.ok) {
        // Tüm kullanıcılara oyun değişikliğini bildir
        if (socket) {
          socket.emit('game-changed', {
            eventId: selectedEvent,
            gameType: selectedGame,
          })
        }
        alert('Oyun başlatıldı! Tüm kullanıcılar yönlendirildi.')
      }
    } catch (error) {
      console.error('Oyun başlatma hatası:', error)
    }
  }

  const handleStopGame = async () => {
    if (!selectedEvent) return

    try {
      const response = await fetch(
        `/api/admin/events/${selectedEvent}/game/stop`,
        {
          method: 'POST',
        }
      )

      if (response.ok) {
        if (socket) {
          socket.emit('game-stopped', { eventId: selectedEvent })
        }
        alert('Oyun durduruldu.')
      }
    } catch (error) {
      console.error('Oyun durdurma hatası:', error)
    }
  }

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold mb-6 text-black">Oyun Kontrolü</h2>

      <div className="bg-white rounded-xl p-4 sm:p-6 space-y-6 border-2 border-purple-600 shadow-lg">
        <div>
          <label className="block text-sm font-medium mb-2 text-black">
            Aktif Etkinlik Seç
          </label>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="w-full px-4 py-3 bg-white bg-opacity-10 border-2 border-purple-600 rounded-lg text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition"
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

        {selectedEvent && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2 text-black">
                Oyun Seç
              </label>
              <select
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value as GameType)}
                className="w-full px-4 py-3 bg-white bg-opacity-10 border-2 border-purple-600 rounded-lg text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition"
              >
                <option value="">Oyun seçin...</option>
                <option value="PONG">🏓 Pong</option>
                <option value="SLIME_VOLLEYBALL">🏐 Slime Volleyball</option>
                <option value="SNAKE">🐍 Snake</option>
                <option value="TETRIS">🧩 Tetris</option>
              </select>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleStartGame}
                disabled={!selectedGame}
                className="flex-1 px-6 py-3 bg-white text-purple-900 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all transform hover:scale-105 shadow-lg"
              >
                🎮 Oyunu Başlat
              </button>
              <button
                onClick={handleStopGame}
                className="flex-1 px-6 py-3 bg-purple-700 text-white rounded-lg hover:bg-purple-600 font-semibold transition-all shadow-lg"
              >
                ⏹️ Oyunu Durdur
              </button>
            </div>

            <div className="bg-purple-50 border-2 border-purple-600 rounded-lg p-4">
              <p className="text-sm text-black">
                <strong className="text-black">Bilgi:</strong> Oyunu başlattığınızda, etkinliğe katılan
                tüm kullanıcılar otomatik olarak seçtiğiniz oyuna
                yönlendirilecektir.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

