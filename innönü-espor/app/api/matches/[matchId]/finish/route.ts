import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { matchId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { matchId } = params
    const { player1Score, player2Score } = await request.json()

    const match = await prisma.match.findUnique({
      where: { id: matchId },
    })

    if (!match) {
      return NextResponse.json({ error: 'Maç bulunamadı' }, { status: 404 })
    }

    // Kullanıcının bu maçta oynadığını kontrol et
    if (match.player1Id !== session.user.id && match.player2Id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const winnerId = player1Score > player2Score ? match.player1Id : match.player2Id

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'COMPLETED',
        player1Score,
        player2Score,
        winnerId,
        completedAt: new Date(),
      },
    })

    return NextResponse.json(updatedMatch, { status: 200 })
  } catch (error) {
    console.error('Maç bitirme hatası:', error)
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

