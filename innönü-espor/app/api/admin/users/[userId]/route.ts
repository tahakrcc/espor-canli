import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = params
    const body = await request.json()

    const updateData: any = {}
    if (body.isBanned !== undefined) updateData.isBanned = body.isBanned
    if (body.isMuted !== undefined) updateData.isMuted = body.isMuted
    if (body.xp !== undefined) updateData.xp = body.xp
    if (body.profileNote !== undefined) updateData.profileNote = body.profileNote

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    return NextResponse.json(user, { status: 200 })
  } catch (error) {
    console.error('Kullanıcı güncelleme hatası:', error)
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

