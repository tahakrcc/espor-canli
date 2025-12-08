import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DashboardClient } from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  if (session.user.role === 'ADMIN') {
    redirect('/admin')
  }

  // Aktif etkinlikleri getir (kullanıcı katılmamış olsa bile)
  const activeEvent = await prisma.event.findFirst({
    where: {
      status: 'ACTIVE',
      isLive: true,
    },
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

  // Kullanıcının katıldığı etkinlikler
  const userEvents = await prisma.eventParticipant.findMany({
    where: { userId: session.user.id },
    include: {
      event: {
        include: {
          games: {
            where: { isActive: true },
            take: 1,
          },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  })

  // Kullanıcının skorları
  const scores = await prisma.score.findMany({
    where: { userId: session.user.id },
    include: {
      user: true,
    },
    orderBy: { updatedAt: 'desc' },
  })

  // Kullanıcının aktif maçı
  const activeMatch = await prisma.match.findFirst({
    where: {
      eventId: activeEvent?.id,
      OR: [
        { player1Id: session.user.id },
        { player2Id: session.user.id },
      ],
      status: { in: ['PENDING', 'IN_PROGRESS'] },
    },
    include: {
      player1: true,
      player2: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <DashboardClient
      activeEvent={activeEvent}
      userEvents={userEvents.map((ue) => ue.event)}
      scores={scores}
      user={session.user}
      activeMatch={activeMatch}
    />
  )
}

