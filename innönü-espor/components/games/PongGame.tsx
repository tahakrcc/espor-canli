'use client'

import { useEffect, useRef, useState } from 'react'

interface PongGameProps {
  onScoreUpdate: (score: number) => void
}

export function PongGame({ onScoreUpdate }: PongGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const gameRef = useRef<any>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 800
    canvas.height = 400

    // Oyun durumu
    const state = {
      ball: { x: 400, y: 200, vx: 5, vy: 5, radius: 10 },
      paddle1: { x: 20, y: 150, width: 10, height: 100, vy: 0 },
      paddle2: { x: 770, y: 150, width: 10, height: 100, vy: 0 },
      keys: {} as Record<string, boolean>,
      playerScore: 0,
    }

    // Klavye kontrolü
    const handleKeyDown = (e: KeyboardEvent) => {
      state.keys[e.key] = true
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      state.keys[e.key] = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    // AI paddle (basit)
    const updateAI = () => {
      const paddle = state.paddle2
      const ball = state.ball
      const center = paddle.y + paddle.height / 2
      if (ball.y < center - 5) {
        paddle.y = Math.max(0, paddle.y - 4)
      } else if (ball.y > center + 5) {
        paddle.y = Math.min(canvas.height - paddle.height, paddle.y + 4)
      }
    }

    // Oyun güncelleme
    const update = () => {
      // Paddle hareketi
      if (state.keys['w'] || state.keys['W']) {
        state.paddle1.y = Math.max(0, state.paddle1.y - 5)
      }
      if (state.keys['s'] || state.keys['S']) {
        state.paddle1.y = Math.min(
          canvas.height - state.paddle1.height,
          state.paddle1.y + 5
        )
      }

      updateAI()

      // Top hareketi
      state.ball.x += state.ball.vx
      state.ball.y += state.ball.vy

      // Duvarlardan sekme
      if (
        state.ball.y <= state.ball.radius ||
        state.ball.y >= canvas.height - state.ball.radius
      ) {
        state.ball.vy = -state.ball.vy
      }

      // Paddle çarpışmaları
      const paddle1 = state.paddle1
      if (
        state.ball.x - state.ball.radius <= paddle1.x + paddle1.width &&
        state.ball.x - state.ball.radius >= paddle1.x &&
        state.ball.y >= paddle1.y &&
        state.ball.y <= paddle1.y + paddle1.height
      ) {
        state.ball.vx = Math.abs(state.ball.vx)
        state.ball.vy += (state.ball.y - (paddle1.y + paddle1.height / 2)) * 0.1
      }

      const paddle2 = state.paddle2
      if (
        state.ball.x + state.ball.radius >= paddle2.x &&
        state.ball.x + state.ball.radius <= paddle2.x + paddle2.width &&
        state.ball.y >= paddle2.y &&
        state.ball.y <= paddle2.y + paddle2.height
      ) {
        state.ball.vx = -Math.abs(state.ball.vx)
        state.ball.vy += (state.ball.y - (paddle2.y + paddle2.height / 2)) * 0.1
      }

      // Skor
      if (state.ball.x < 0) {
        state.ball.x = 400
        state.ball.y = 200
        state.ball.vx = 5
        state.ball.vy = 5
      } else if (state.ball.x > canvas.width) {
        state.playerScore++
        setScore(state.playerScore)
        onScoreUpdate(state.playerScore)
        state.ball.x = 400
        state.ball.y = 200
        state.ball.vx = -5
        state.ball.vy = 5
      }
    }

    // Çizim
    const draw = () => {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Orta çizgi
      ctx.strokeStyle = '#fff'
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(canvas.width / 2, 0)
      ctx.lineTo(canvas.width / 2, canvas.height)
      ctx.stroke()
      ctx.setLineDash([])

      // Top
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2)
      ctx.fill()

      // Paddle'lar
      ctx.fillRect(
        state.paddle1.x,
        state.paddle1.y,
        state.paddle1.width,
        state.paddle1.height
      )
      ctx.fillRect(
        state.paddle2.x,
        state.paddle2.y,
        state.paddle2.width,
        state.paddle2.height
      )

      // Skor
      ctx.font = '48px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(state.playerScore.toString(), canvas.width / 2, 50)
    }

    // Oyun döngüsü
    const gameLoop = () => {
      update()
      draw()
      requestAnimationFrame(gameLoop)
    }

    gameRef.current = { state, gameLoop }
    gameLoop()

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [onScoreUpdate])

  return (
    <div className="flex justify-center p-4">
      <canvas
        ref={canvasRef}
        className="border-2 border-gray-600"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      <div className="ml-4">
        <p className="text-white mb-2">Kontroller:</p>
        <p className="text-gray-400 text-sm">W - Yukarı</p>
        <p className="text-gray-400 text-sm">S - Aşağı</p>
      </div>
    </div>
  )
}

