import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const eventSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  tournamentMode: z.boolean().default(false),
  isLive: z.boolean().default(false),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const events = await prisma.event.findMany({
      include: {
        _count: {
          select: {
            participants: true,
            matches: true,
          },
        },
        games: {
          where: { isActive: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(events, { status: 200 })
  } catch (error) {
    console.error('Etkinlikler yüklenemedi:', error)
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = eventSchema.parse(body)

    const event = await prisma.event.create({
      data: {
        name: data.name,
        description: data.description,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        tournamentMode: data.tournamentMode,
        isLive: data.isLive,
        status: 'DRAFT',
      },
    })

    // Socket.io ile tüm kullanıcılara bildir (eğer aktif ve canlı ise)
    // Bu kısım server.js'de handle edilecek

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Etkinlik oluşturma hatası:', error)
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

