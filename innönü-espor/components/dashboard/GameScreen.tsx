'use client'

import { useEffect, useState } from 'react'
import { PongGame } from '../games/PongGame'
import { SlimeVolleyballGame } from '../games/SlimeVolleyballGame'
import { SnakeGame } from '../games/SnakeGame'
import { TetrisGame } from '../games/TetrisGame'
import { GameType } from '@prisma/client'
import { Socket } from 'socket.io-client'

interface GameScreenProps {
  gameType: GameType | string
  eventId: string
  userId: string
  socket: Socket | null
  onScoreUpdate?: (score: number) => void
}

export function GameScreen({
  gameType,
  eventId,
  userId,
  socket,
  onScoreUpdate,
}: GameScreenProps) {
  const [score, setScore] = useState(0)

  const handleScoreUpdate = async (newScore: number) => {
    setScore(newScore)
    
    // Eğer match içindeyse, match score callback'ini çağır
    if (onScoreUpdate) {
      onScoreUpdate(newScore)
    }
    
    // Skoru sunucuya gönder
    if (socket) {
      socket.emit('score-update', {
        eventId,
        userId,
        gameType,
        score: newScore,
      })
      
      // Skoru veritabanına kaydet
      try {
        await fetch('/api/score/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            gameType,
            score: newScore,
          }),
        })
      } catch (error) {
        console.error('Skor kaydetme hatası:', error)
      }
    }
  }

  const renderGame = () => {
    switch (gameType) {
      case 'PONG':
        return <PongGame onScoreUpdate={handleScoreUpdate} />
      case 'SLIME_VOLLEYBALL':
        return <SlimeVolleyballGame onScoreUpdate={handleScoreUpdate} />
      case 'SNAKE':
        return <SnakeGame onScoreUpdate={handleScoreUpdate} />
      case 'TETRIS':
        return <TetrisGame onScoreUpdate={handleScoreUpdate} />
      default:
        return <div>Oyun yükleniyor...</div>
    }
  }

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-purple-600 shadow-lg">
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <h3 className="text-lg sm:text-xl font-bold text-black">
          {gameType === 'PONG' && '🏓 Pong'}
          {gameType === 'SLIME_VOLLEYBALL' && '🏐 Slime Volleyball'}
          {gameType === 'SNAKE' && '🐍 Snake'}
          {gameType === 'TETRIS' && '🧩 Tetris'}
        </h3>
        <div className="text-base sm:text-lg font-semibold text-white bg-purple-600 px-4 py-2 rounded-lg">Skor: {score}</div>
      </div>
      <div className="bg-black rounded-lg overflow-hidden border-2 border-purple-600">
        {renderGame()}
      </div>
    </div>
  )
}

