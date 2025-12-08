import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session) {
    if (session.user.role === 'ADMIN') {
      redirect('/admin')
    } else {
      redirect('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-purple-50 to-white">
      <div className="text-center space-y-6 sm:space-y-8 p-4 sm:p-8 w-full max-w-2xl">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-black mb-4">
          🎮 İnönü E-Spor
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl text-black mb-8">
          Modern Turnuva Yönetim Platformu
        </p>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-4 justify-center items-center">
          <Link
            href="/auth/login"
            className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all transform hover:scale-105 font-semibold shadow-lg"
          >
            Giriş Yap
          </Link>
          <Link
            href="/auth/register"
            className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-white text-purple-900 border-2 border-purple-600 rounded-lg hover:bg-purple-50 transition-all transform hover:scale-105 font-semibold shadow-lg"
          >
            Kayıt Ol
          </Link>
        </div>
      </div>
    </div>
  )
}

