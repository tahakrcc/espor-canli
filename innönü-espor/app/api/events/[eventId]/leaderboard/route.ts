import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params

    const scores = await prisma.score.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: [
        { score: 'desc' },
        { wins: 'desc' },
      ],
    })

    return NextResponse.json(scores, { status: 200 })
  } catch (error) {
    console.error('Liderlik tablosu hatası:', error)
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

