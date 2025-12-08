'use client'

import { useEffect, useState, useCallback } from 'react'
import { GameScreen } from './GameScreen'
import { Socket } from 'socket.io-client'

interface MatchScreenProps {
  match: any
  userId: string
  socket: Socket | null
  eventId: string
}

export function MatchScreen({ match, userId, socket, eventId }: MatchScreenProps) {
  const [phase, setPhase] = useState<'preparation' | 'playing' | 'finished'>('preparation')
  const [preparationTime, setPreparationTime] = useState(15)
  const [gameTime, setGameTime] = useState(90)
  const [player1Score, setPlayer1Score] = useState(0)
  const [player2Score, setPlayer2Score] = useState(0)

  const isPlayer1 = match.player1Id === userId
  const isPlayer2 = match.player2Id === userId
  const opponent = isPlayer1 ? match.player2 : match.player1

  const finishMatch = useCallback(async () => {
    try {
      const response = await fetch(`/api/matches/${match.id}/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player1Score,
          player2Score,
        }),
      })

      if (response.ok && socket) {
        socket.emit('match-finished', {
          matchId: match.id,
          eventId,
        })
      }
    } catch (error) {
      console.error('Maç bitirme hatası:', error)
    }
  }, [match.id, eventId, player1Score, player2Score, socket])

  useEffect(() => {
    // Hazırlık süresi
    if (phase === 'preparation' && preparationTime > 0) {
      const timer = setTimeout(() => {
        setPreparationTime((prev) => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (phase === 'preparation' && preparationTime === 0) {
      setPhase('playing')
      // Socket ile oyun başladığını bildir
      if (socket) {
        socket.emit('match-started', { matchId: match.id, eventId })
      }
    }

    // Oyun süresi
    if (phase === 'playing' && gameTime > 0) {
      const timer = setTimeout(() => {
        setGameTime((prev) => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (phase === 'playing' && gameTime === 0) {
      setPhase('finished')
      // Maç bitti, skorları kaydet
      finishMatch()
    }
  }, [phase, preparationTime, gameTime, socket, match, eventId, player1Score, player2Score, finishMatch])

  const handleScoreUpdate = (score: number) => {
    if (isPlayer1) {
      setPlayer1Score(score)
    } else if (isPlayer2) {
      setPlayer2Score(score)
    }
  }

  if (phase === 'preparation') {
    return (
      <div className="bg-white rounded-xl p-8 sm:p-12 text-center border-2 border-purple-600 shadow-lg">
        <div className="mb-6">
          <div className="text-5xl sm:text-6xl font-bold text-black mb-4">{preparationTime}</div>
          <div className="text-xl sm:text-2xl text-black">Hazırlık Süresi</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 sm:p-6 mb-4 border-2 border-purple-600">
          <p className="text-lg sm:text-xl text-black mb-2 font-semibold">Maçınız:</p>
          <p className="text-xl sm:text-2xl font-bold text-black">
            {match.player1.username} vs {match.player2?.username}
          </p>
        </div>
        <p className="text-black text-sm sm:text-base">Oyun başlamak için hazır olun!</p>
      </div>
    )
  }

  if (phase === 'playing') {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl p-4 border-2 border-purple-600 shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 mb-2">
            <div className="text-center flex-1">
              <p className="text-xs sm:text-sm text-black">Sen</p>
              <p className="text-lg sm:text-xl font-bold text-black">{isPlayer1 ? match.player1.username : match.player2?.username}</p>
              <p className="text-2xl sm:text-3xl font-bold text-black">
                {isPlayer1 ? player1Score : player2Score}
              </p>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-white bg-purple-600 rounded-lg px-4 py-2">{gameTime}</div>
              <div className="text-xs text-black mt-1">saniye</div>
            </div>
            <div className="text-center flex-1">
              <p className="text-xs sm:text-sm text-black">Rakip</p>
              <p className="text-lg sm:text-xl font-bold text-black">{opponent?.username}</p>
              <p className="text-2xl sm:text-3xl font-bold text-black">
                {isPlayer1 ? player2Score : player1Score}
              </p>
            </div>
          </div>
        </div>
        <GameScreen
          gameType={match.gameType}
          eventId={eventId}
          userId={userId}
          socket={socket}
          onScoreUpdate={handleScoreUpdate}
        />
      </div>
    )
  }

  if (phase === 'finished') {
    const winner = player1Score > player2Score ? match.player1 : match.player2
    const isWinner = (isPlayer1 && player1Score > player2Score) || (isPlayer2 && player2Score > player1Score)

    return (
      <div className="bg-white rounded-xl p-8 sm:p-12 text-center border-2 border-purple-600 shadow-lg">
        <h2 className="text-3xl sm:text-4xl font-bold text-black mb-6">
          {isWinner ? '🎉 Kazandınız!' : '😔 Kaybettiniz'}
        </h2>
        <div className="bg-purple-50 rounded-xl p-4 sm:p-6 mb-4 border-2 border-purple-600">
          <p className="text-xl sm:text-2xl font-bold text-black mb-4">Final Skoru</p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8">
            <div>
              <p className="text-base sm:text-lg text-black">{match.player1.username}</p>
              <p className="text-3xl sm:text-4xl font-bold text-black">{player1Score}</p>
            </div>
            <p className="text-xl sm:text-2xl text-black">-</p>
            <div>
              <p className="text-base sm:text-lg text-black">{match.player2?.username}</p>
              <p className="text-3xl sm:text-4xl font-bold text-black">{player2Score}</p>
            </div>
          </div>
        </div>
        <p className="text-black text-sm sm:text-base">Maç tamamlandı. Sonuçlar kaydedildi.</p>
      </div>
    )
  }

  return null
}

