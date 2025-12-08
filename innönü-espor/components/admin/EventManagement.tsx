'use client'

import { useState } from 'react'
import { Socket } from 'socket.io-client'

interface EventManagementProps {
  events: any[]
  onRefresh: () => void
  socket: Socket | null
}

export function EventManagement({
  events,
  onRefresh,
  socket,
}: EventManagementProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startTime: '',
    endTime: '',
    tournamentMode: false,
    isLive: false,
  })

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onRefresh()
        setShowCreateModal(false)
        setFormData({
          name: '',
          description: '',
          startTime: '',
          endTime: '',
          tournamentMode: false,
          isLive: false,
        })
      }
    } catch (error) {
      console.error('Etkinlik oluşturma hatası:', error)
    }
  }

  const handleToggleEvent = async (eventId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        const event = await response.json()
        onRefresh()
        if (socket) {
          socket.emit('event-updated', { eventId, status })
          // Eğer etkinlik aktif ve canlı ise tüm kullanıcılara bildir
          if (status === 'ACTIVE' && event.isLive) {
            socket.emit('new-event-created', event)
          }
        }
      }
    } catch (error) {
      console.error('Etkinlik durumu güncelleme hatası:', error)
    }
  }

  const handleStartEvent = async (eventId: string) => {
    try {
      // Önce oyun tipini al (varsayılan PONG)
      const gameType = 'PONG' // Admin panelinden seçilebilir hale getirilebilir
      
      const response = await fetch(`/api/admin/events/${eventId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameType }),
      })

      if (response.ok) {
        const data = await response.json()
        onRefresh()
        if (socket) {
          // Tüm maçları kullanıcılara bildir
          data.matches.forEach((match: any) => {
            socket.emit('match-assigned', match)
          })
          // Oyun başladığını bildir
          socket.emit('game-changed', {
            gameType: data.game.gameType,
            eventId,
          })
        }
      }
    } catch (error) {
      console.error('Etkinlik başlatma hatası:', error)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 sm:gap-0">
        <h2 className="text-xl sm:text-2xl font-bold text-black">Etkinlik Yönetimi</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all transform hover:scale-105 font-semibold shadow-lg"
        >
          + Yeni Etkinlik
        </button>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 sm:p-6 rounded-xl w-full max-w-md border-2 border-purple-600 shadow-2xl">
            <h3 className="text-lg sm:text-xl font-bold mb-4 text-black">Yeni Etkinlik Oluştur</h3>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-black">
                  Etkinlik Adı
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 bg-white bg-opacity-10 border-2 border-purple-600 rounded-lg text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-black">
                  Açıklama
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white bg-opacity-10 border-2 border-purple-600 rounded-lg text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-black">
                  Başlangıç Zamanı
                </label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 bg-white bg-opacity-10 border-2 border-purple-600 rounded-lg text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-black">
                  Bitiş Zamanı
                </label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 bg-white bg-opacity-10 border-2 border-purple-600 rounded-lg text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition"
                />
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center text-black">
                  <input
                    type="checkbox"
                    checked={formData.tournamentMode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tournamentMode: e.target.checked,
                      })
                    }
                    className="mr-2 w-4 h-4 text-purple-600 border-purple-300 rounded focus:ring-purple-500"
                  />
                  Turnuva Modu
                </label>
                <label className="flex items-center text-black">
                  <input
                    type="checkbox"
                    checked={formData.isLive}
                    onChange={(e) =>
                      setFormData({ ...formData, isLive: e.target.checked })
                    }
                    className="mr-2 w-4 h-4 text-purple-600 border-purple-300 rounded focus:ring-purple-500"
                  />
                  Canlı Mod
                </label>
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-white text-purple-900 rounded-lg hover:bg-gray-100 font-semibold transition-all transform hover:scale-105"
                >
                  Oluştur
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-600 font-semibold transition-all"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="bg-white rounded-xl p-4 sm:p-6 hover:bg-purple-50 transition-all border-2 border-purple-600 shadow-lg"
          >
            <h3 className="text-lg sm:text-xl font-bold mb-2 text-black">{event.name}</h3>
            <p className="text-black text-sm mb-4">{event.description}</p>
            <div className="space-y-2 mb-4">
              <div className="text-sm">
                <span className="text-black">Katılımcı:</span>{' '}
                <span className="text-black font-semibold">{event._count.participants}</span>
              </div>
              <div className="text-sm">
                <span className="text-black">Maç:</span>{' '}
                <span className="text-black font-semibold">{event._count.matches}</span>
              </div>
              <div className="text-sm">
                <span
                  className={`px-2 py-1 rounded-lg font-semibold ${
                    event.status === 'ACTIVE'
                      ? 'bg-white text-purple-900'
                      : event.status === 'ENDED'
                      ? 'bg-gray-600 text-white'
                      : 'bg-yellow-500 text-gray-900'
                  }`}
                >
                  {event.status === 'ACTIVE' && 'Aktif'}
                  {event.status === 'ENDED' && 'Bitti'}
                  {event.status === 'DRAFT' && 'Taslak'}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              {event.status === 'DRAFT' && (
                <button
                  onClick={() => handleToggleEvent(event.id, 'ACTIVE')}
                  className="flex-1 px-3 py-2 bg-white text-purple-900 rounded-lg hover:bg-gray-100 text-sm font-semibold transition-all transform hover:scale-105"
                >
                  Başlat
                </button>
              )}
              {event.status === 'ACTIVE' && (
                <>
                  <button
                    onClick={() => handleStartEvent(event.id)}
                    className="flex-1 px-3 py-2 bg-white text-purple-900 rounded-lg hover:bg-gray-100 text-sm font-semibold transition-all transform hover:scale-105"
                  >
                    🎮 Eşleştirme Yap & Başlat
                  </button>
                  <button
                    onClick={() => handleToggleEvent(event.id, 'ENDED')}
                    className="flex-1 px-3 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-600 text-sm font-semibold transition-all"
                  >
                    Bitir
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

