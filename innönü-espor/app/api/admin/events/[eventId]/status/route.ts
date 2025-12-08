import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = params
    const { status } = await request.json()

    const event = await prisma.event.update({
      where: { id: eventId },
      data: { status },
      include: {
        _count: {
          select: {
            participants: true,
          },
        },
      },
    })

    // Socket.io ile tüm kullanıcılara bildir (eğer aktif ve canlı ise)
    // Bu kısım server.js'de handle edilecek

    return NextResponse.json(event, { status: 200 })
  } catch (error) {
    console.error('Etkinlik durumu güncelleme hatası:', error)
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

