import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AdminClient } from '@/components/admin/AdminClient'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
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

  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: {
          eventParticipants: true,
          scores: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return <AdminClient events={events} users={users} />
}

