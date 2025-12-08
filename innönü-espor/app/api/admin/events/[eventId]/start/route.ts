import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GameType } from '@prisma/client'

export async function POST(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = params
    const { gameType } = await request.json()

    // Etkinlik katılımcılarını al
    const participants = await prisma.eventParticipant.findMany({
      where: { eventId },
      include: { user: true },
    })

    if (participants.length < 2) {
      return NextResponse.json(
        { error: 'En az 2 katılımcı gerekli' },
        { status: 400 }
      )
    }

    // Mevcut maçları temizle
    await prisma.match.deleteMany({
      where: { eventId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
    })

    // Rastgele eşleştirme
    const shuffled = [...participants].sort(() => Math.random() - 0.5)
    const matches = []

    for (let i = 0; i < shuffled.length; i += 2) {
      if (i + 1 < shuffled.length) {
        const match = await prisma.match.create({
          data: {
            eventId,
            gameType: (gameType as GameType) || 'PONG',
            player1Id: shuffled[i].userId,
            player2Id: shuffled[i + 1].userId,
            status: 'PENDING',
            round: 1,
          },
          include: {
            player1: true,
            player2: true,
          },
        })
        matches.push(match)
      }
    }

    // Oyunu başlat
    await prisma.game.updateMany({
      where: {
        eventId,
        isActive: true,
      },
      data: {
        isActive: false,
        endedAt: new Date(),
      },
    })

    const game = await prisma.game.create({
      data: {
        eventId,
        gameType: (gameType as GameType) || 'PONG',
        isActive: true,
        startedAt: new Date(),
      },
    })

    await prisma.event.update({
      where: { id: eventId },
      data: { currentGameType: (gameType as GameType) || 'PONG' },
    })

    return NextResponse.json(
      { matches, game, message: 'Etkinlik başlatıldı, eşleştirmeler yapıldı' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Etkinlik başlatma hatası:', error)
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

