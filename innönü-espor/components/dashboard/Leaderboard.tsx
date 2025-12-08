'use client'

import { useEffect, useState } from 'react'
import { Socket } from 'socket.io-client'

interface LeaderboardProps {
  eventId: string
  socket: Socket | null
}

export function Leaderboard({ eventId, socket }: LeaderboardProps) {
  const [scores, setScores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/leaderboard`)
      if (response.ok) {
        const data = await response.json()
        setScores(data)
      }
    } catch (error) {
      console.error('Liderlik tablosu yüklenemedi:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
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
  }, [eventId, socket])

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border-2 border-purple-600 shadow-lg">
        <p className="text-black">Yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-purple-600 shadow-lg">
      <h3 className="text-lg sm:text-xl font-bold mb-4 text-black">🏆 Liderlik Tablosu</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-purple-600">
              <th className="text-left py-2 px-2 text-black text-sm sm:text-base font-semibold">Sıra</th>
              <th className="text-left py-2 px-2 text-black text-sm sm:text-base font-semibold">Kullanıcı</th>
              <th className="text-right py-2 px-2 text-black text-sm sm:text-base font-semibold">Skor</th>
              <th className="text-right py-2 px-2 text-black text-sm sm:text-base font-semibold">Galibiyet</th>
              <th className="text-right py-2 px-2 text-black text-sm sm:text-base font-semibold">Mağlubiyet</th>
            </tr>
          </thead>
          <tbody>
            {scores.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4 text-black">
                  Henüz skor yok
                </td>
              </tr>
            ) : (
              scores.map((score, index) => (
                <tr
                  key={score.id}
                  className="border-b border-purple-200 hover:bg-purple-50 transition"
                >
                  <td className="py-2 px-2 text-black font-semibold">#{index + 1}</td>
                  <td className="py-2 px-2 text-black">{score.user.username}</td>
                  <td className="py-2 px-2 text-right font-bold text-black">
                    {score.score}
                  </td>
                  <td className="py-2 px-2 text-right text-green-600 font-semibold">
                    {score.wins}
                  </td>
                  <td className="py-2 px-2 text-right text-red-600 font-semibold">
                    {score.losses}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

