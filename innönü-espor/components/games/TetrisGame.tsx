'use client'

import { useEffect, useRef, useState } from 'react'

interface TetrisGameProps {
  onScoreUpdate: (score: number) => void
}

export function TetrisGame({ onScoreUpdate }: TetrisGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const COLS = 10
    const ROWS = 20
    const BLOCK_SIZE = 30
    canvas.width = COLS * BLOCK_SIZE
    canvas.height = ROWS * BLOCK_SIZE

    const board: number[][] = Array(ROWS)
      .fill(null)
      .map(() => Array(COLS).fill(0))

    const shapes = [
      [[1, 1, 1, 1]],
      [
        [1, 1],
        [1, 1],
      ],
      [
        [0, 1, 0],
        [1, 1, 1],
      ],
      [
        [1, 1, 0],
        [0, 1, 1],
      ],
      [
        [0, 1, 1],
        [1, 1, 0],
      ],
    ]

    let currentPiece = {
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      x: Math.floor(COLS / 2),
      y: 0,
    }

    let gameScore = 0
    let dropCounter = 0
    let dropInterval = 1000
    let lastTime = 0

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        if (isValidMove(currentPiece, currentPiece.x - 1, currentPiece.y)) {
          currentPiece.x--
        }
      } else if (e.key === 'ArrowRight') {
        if (isValidMove(currentPiece, currentPiece.x + 1, currentPiece.y)) {
          currentPiece.x++
        }
      } else if (e.key === 'ArrowDown') {
        if (isValidMove(currentPiece, currentPiece.x, currentPiece.y + 1)) {
          currentPiece.y++
        }
      } else if (e.key === ' ') {
        // Rotate
        const rotated = rotate(currentPiece.shape)
        if (isValidMove({ ...currentPiece, shape: rotated }, currentPiece.x, currentPiece.y)) {
          currentPiece.shape = rotated
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    function rotate(shape: number[][]): number[][] {
      return shape[0].map((_, i) => shape.map((row) => row[i]).reverse())
    }

    function isValidMove(
      piece: { shape: number[][]; x: number; y: number },
      x: number,
      y: number
    ): boolean {
      for (let row = 0; row < piece.shape.length; row++) {
        for (let col = 0; col < piece.shape[row].length; col++) {
          if (piece.shape[row][col]) {
            const newX = x + col
            const newY = y + row

            if (
              newX < 0 ||
              newX >= COLS ||
              newY >= ROWS ||
              (newY >= 0 && board[newY][newX])
            ) {
              return false
            }
          }
        }
      }
      return true
    }

    function placePiece() {
      for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
          if (currentPiece.shape[row][col]) {
            const y = currentPiece.y + row
            const x = currentPiece.x + col
            if (y >= 0) {
              board[y][x] = 1
            }
          }
        }
      }

      // Satır temizleme
      for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row].every((cell) => cell === 1)) {
          board.splice(row, 1)
          board.unshift(Array(COLS).fill(0))
          gameScore += 10
          setScore(gameScore)
          onScoreUpdate(gameScore)
        }
      }

      currentPiece = {
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        x: Math.floor(COLS / 2),
        y: 0,
      }

      if (!isValidMove(currentPiece, currentPiece.x, currentPiece.y)) {
        // Oyun bitti
        board.forEach((row) => row.fill(0))
        gameScore = 0
        setScore(0)
        onScoreUpdate(0)
      }
    }

    function update(time: number) {
      const deltaTime = time - lastTime
      lastTime = time

      dropCounter += deltaTime
      if (dropCounter > dropInterval) {
        if (isValidMove(currentPiece, currentPiece.x, currentPiece.y + 1)) {
          currentPiece.y++
        } else {
          placePiece()
        }
        dropCounter = 0
      }
    }

    function draw() {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Board
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          if (board[row][col]) {
            ctx.fillStyle = '#0f0'
            ctx.fillRect(
              col * BLOCK_SIZE,
              row * BLOCK_SIZE,
              BLOCK_SIZE - 1,
              BLOCK_SIZE - 1
            )
          }
        }
      }

      // Current piece
      ctx.fillStyle = '#f00'
      for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
          if (currentPiece.shape[row][col]) {
            ctx.fillRect(
              (currentPiece.x + col) * BLOCK_SIZE,
              (currentPiece.y + row) * BLOCK_SIZE,
              BLOCK_SIZE - 1,
              BLOCK_SIZE - 1
            )
          }
        }
      }

      ctx.fillStyle = '#fff'
      ctx.font = '20px Arial'
      ctx.fillText(`Skor: ${gameScore}`, 10, 30)
    }

    function gameLoop(time: number) {
      update(time)
      draw()
      requestAnimationFrame(gameLoop)
    }

    requestAnimationFrame(gameLoop)

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
        <p className="text-gray-400 text-sm">← → Hareket</p>
        <p className="text-gray-400 text-sm">↓ Hızlandır</p>
        <p className="text-gray-400 text-sm">Space Döndür</p>
      </div>
    </div>
  )
}

