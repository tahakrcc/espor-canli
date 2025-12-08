'use client'

import { useEffect, useRef, useState } from 'react'

interface SnakeGameProps {
  onScoreUpdate: (score: number) => void
}

export function SnakeGame({ onScoreUpdate }: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const gridSize = 20
    const tileCount = canvas.width / gridSize
    canvas.width = 600
    canvas.height = 600

    const state = {
      snake: [{ x: 10, y: 10 }],
      food: { x: 15, y: 15 },
      dx: 0,
      dy: 0,
      score: 0,
      keys: {} as Record<string, boolean>,
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && state.dy === 0) {
        state.dx = 0
        state.dy = -1
      } else if (e.key === 'ArrowDown' && state.dy === 0) {
        state.dx = 0
        state.dy = 1
      } else if (e.key === 'ArrowLeft' && state.dx === 0) {
        state.dx = -1
        state.dy = 0
      } else if (e.key === 'ArrowRight' && state.dx === 0) {
        state.dx = 1
        state.dy = 0
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    const update = () => {
      const head = { x: state.snake[0].x + state.dx, y: state.snake[0].y + state.dy }

      // Duvarlar
      if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        // Oyun bitti, sıfırla
        state.snake = [{ x: 10, y: 10 }]
        state.dx = 0
        state.dy = 0
        state.food = { x: 15, y: 15 }
        state.score = 0
        setScore(0)
        onScoreUpdate(0)
        return
      }

      // Kendine çarpma
      if (state.snake.some((segment) => segment.x === head.x && segment.y === head.y)) {
        state.snake = [{ x: 10, y: 10 }]
        state.dx = 0
        state.dy = 0
        state.food = { x: 15, y: 15 }
        state.score = 0
        setScore(0)
        onScoreUpdate(0)
        return
      }

      state.snake.unshift(head)

      // Yemek yeme
      if (head.x === state.food.x && head.y === state.food.y) {
        state.score++
        setScore(state.score)
        onScoreUpdate(state.score)
        state.food = {
          x: Math.floor(Math.random() * tileCount),
          y: Math.floor(Math.random() * tileCount),
        }
      } else {
        state.snake.pop()
      }
    }

    const draw = () => {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Yılan
      ctx.fillStyle = '#0f0'
      state.snake.forEach((segment) => {
        ctx.fillRect(
          segment.x * gridSize,
          segment.y * gridSize,
          gridSize - 2,
          gridSize - 2
        )
      })

      // Yemek
      ctx.fillStyle = '#f00'
      ctx.fillRect(
        state.food.x * gridSize,
        state.food.y * gridSize,
        gridSize - 2,
        gridSize - 2
      )

      // Skor
      ctx.fillStyle = '#fff'
      ctx.font = '20px Arial'
      ctx.fillText(`Skor: ${state.score}`, 10, 30)
    }

    const gameLoop = () => {
      update()
      draw()
      setTimeout(() => {
        requestAnimationFrame(gameLoop)
      }, 100)
    }

    gameLoop()

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
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
        <p className="text-gray-400 text-sm">Ok Tuşları</p>
      </div>
    </div>
  )
}

