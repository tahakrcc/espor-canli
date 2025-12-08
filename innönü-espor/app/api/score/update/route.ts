import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GameType } from '@prisma/client'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId, gameType, score } = await request.json()

    // Skoru güncelle veya oluştur
    const scoreRecord = await prisma.score.upsert({
      where: {
        userId_eventId_gameType: {
          userId: session.user.id,
          eventId,
          gameType: gameType as GameType,
        },
      },
      update: {
        score: Math.max(score, 0), // Negatif skor olmasın
      },
      create: {
        userId: session.user.id,
        eventId,
        gameType: gameType as GameType,
        score: Math.max(score, 0),
      },
    })

    return NextResponse.json(scoreRecord, { status: 200 })
  } catch (error) {
    console.error('Skor güncelleme hatası:', error)
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

