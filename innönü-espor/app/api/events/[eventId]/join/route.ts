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
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = params

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event || event.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Etkinlik bulunamadı veya aktif değil' },
        { status: 404 }
      )
    }

    // Zaten katılmış mı kontrol et
    const existing = await prisma.eventParticipant.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(event, { status: 200 })
    }

    // Etkinliğe katıl
    await prisma.eventParticipant.create({
      data: {
        userId: session.user.id,
        eventId,
      },
    })

    // Etkinlik bilgilerini tekrar getir (participant bilgisiyle)
    const updatedEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        games: {
          where: { isActive: true },
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
        participants: {
          where: { userId: session.user.id },
        },
        _count: {
          select: {
            participants: true,
          },
        },
      },
    })

    return NextResponse.json(updatedEvent, { status: 200 })
  } catch (error) {
    console.error('Etkinliğe katılma hatası:', error)
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

