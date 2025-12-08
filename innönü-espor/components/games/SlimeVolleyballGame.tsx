'use client'

import { useEffect, useRef, useState } from 'react'

interface SlimeVolleyballGameProps {
  onScoreUpdate: (score: number) => void
}

export function SlimeVolleyballGame({
  onScoreUpdate,
}: SlimeVolleyballGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 800
    canvas.height = 400

    const state = {
      ball: { x: 400, y: 100, vx: 3, vy: 0, radius: 15 },
      player: { x: 100, y: 350, width: 60, height: 20, vx: 0 },
      ai: { x: 700, y: 50, width: 60, height: 20, vx: 0 },
      keys: {} as Record<string, boolean>,
      playerScore: 0,
      gravity: 0.3,
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      state.keys[e.key] = true
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      state.keys[e.key] = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    const update = () => {
      // Oyuncu hareketi
      if (state.keys['a'] || state.keys['A']) {
        state.player.x = Math.max(0, state.player.x - 5)
      }
      if (state.keys['d'] || state.keys['D']) {
        state.player.x = Math.min(
          canvas.width - state.player.width,
          state.player.x + 5
        )
      }

      // AI hareketi
      const aiCenter = state.ai.x + state.ai.width / 2
      if (state.ball.x < aiCenter - 5) {
        state.ai.x = Math.max(0, state.ai.x - 4)
      } else if (state.ball.x > aiCenter + 5) {
        state.ai.x = Math.min(
          canvas.width - state.ai.width,
          state.ai.x + 4
        )
      }

      // Top fiziği
      state.ball.vy += state.gravity
      state.ball.x += state.ball.vx
      state.ball.y += state.ball.vy

      // Oyuncu çarpışması
      if (
        state.ball.y + state.ball.radius >= state.player.y &&
        state.ball.y - state.ball.radius <= state.player.y + state.player.height &&
        state.ball.x >= state.player.x &&
        state.ball.x <= state.player.x + state.player.width
      ) {
        state.ball.vy = -8
        state.ball.vx = (state.ball.x - (state.player.x + state.player.width / 2)) * 0.1
      }

      // AI çarpışması
      if (
        state.ball.y - state.ball.radius <= state.ai.y + state.ai.height &&
        state.ball.y + state.ball.radius >= state.ai.y &&
        state.ball.x >= state.ai.x &&
        state.ball.x <= state.ai.x + state.ai.width
      ) {
        state.ball.vy = 8
        state.ball.vx = (state.ball.x - (state.ai.x + state.ai.width / 2)) * 0.1
      }

      // Duvarlar
      if (state.ball.x <= state.ball.radius || state.ball.x >= canvas.width - state.ball.radius) {
        state.ball.vx = -state.ball.vx
      }

      // Skor
      if (state.ball.y > canvas.height) {
        state.ball.x = 400
        state.ball.y = 100
        state.ball.vx = 3
        state.ball.vy = 0
      } else if (state.ball.y < 0) {
        state.playerScore++
        setScore(state.playerScore)
        onScoreUpdate(state.playerScore)
        state.ball.x = 400
        state.ball.y = 100
        state.ball.vx = -3
        state.ball.vy = 0
      }
    }

    const draw = () => {
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Net
      ctx.strokeStyle = '#fff'
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(0, canvas.height / 2)
      ctx.lineTo(canvas.width, canvas.height / 2)
      ctx.stroke()
      ctx.setLineDash([])

      // Top
      ctx.fillStyle = '#ff6b6b'
      ctx.beginPath()
      ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2)
      ctx.fill()

      // Oyuncu
      ctx.fillStyle = '#4ecdc4'
      ctx.fillRect(
        state.player.x,
        state.player.y,
        state.player.width,
        state.player.height
      )

      // AI
      ctx.fillStyle = '#ffe66d'
      ctx.fillRect(state.ai.x, state.ai.y, state.ai.width, state.ai.height)

      // Skor
      ctx.fillStyle = '#fff'
      ctx.font = '32px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(state.playerScore.toString(), canvas.width / 2, 30)
    }

    const gameLoop = () => {
      update()
      draw()
      requestAnimationFrame(gameLoop)
    }

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
        <p className="text-gray-400 text-sm">A - Sol</p>
        <p className="text-gray-400 text-sm">D - Sağ</p>
      </div>
    </div>
  )
}

