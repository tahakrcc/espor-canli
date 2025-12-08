import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
      where: { eventId, status: 'PENDING' },
    })

    // Rastgele eşleştirme
    const shuffled = [...participants].sort(() => Math.random() - 0.5)
    const matches = []

    for (let i = 0; i < shuffled.length; i += 2) {
      if (i + 1 < shuffled.length) {
        const match = await prisma.match.create({
          data: {
            eventId,
            gameType: 'PONG', // Varsayılan, admin değiştirebilir
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

    return NextResponse.json(matches, { status: 200 })
  } catch (error) {
    console.error('Eşleştirme hatası:', error)
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

