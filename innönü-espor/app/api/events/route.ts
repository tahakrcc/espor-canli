import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        _count: {
          select: {
            participants: true,
          },
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

