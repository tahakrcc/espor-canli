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

    // Önceki aktif oyunları durdur
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

    // Yeni oyunu başlat
    const game = await prisma.game.create({
      data: {
        eventId,
        gameType: gameType as GameType,
        isActive: true,
        startedAt: new Date(),
      },
    })

    // Etkinliğin currentGameType'ını güncelle
    await prisma.event.update({
      where: { id: eventId },
      data: { currentGameType: gameType as GameType },
    })

    return NextResponse.json(game, { status: 200 })
  } catch (error) {
    console.error('Oyun başlatma hatası:', error)
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

