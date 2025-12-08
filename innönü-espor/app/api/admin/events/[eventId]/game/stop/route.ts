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

    await prisma.event.update({
      where: { id: eventId },
      data: { currentGameType: null },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Oyun durdurma hatası:', error)
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

