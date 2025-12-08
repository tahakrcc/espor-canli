'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Zod error array ise düzgün göster
        if (Array.isArray(data.error)) {
          setError(data.error.map((e: any) => `${e.path}: ${e.message}`).join(', '))
        } else if (typeof data.error === 'string') {
          setError(data.error)
        } else {
          setError('Kayıt başarısız')
        }
      } else {
        setSuccess(true)
        // Başarı mesajını göster ve 2 saniye sonra yönlendir
        setTimeout(() => {
          router.push('/auth/login?registered=true')
        }, 2000)
      }
    } catch (err) {
      console.error('Register error:', err)
      setError('Bağlantı hatası. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-purple-900 to-black p-4">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md border border-purple-200">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-purple-900">Kayıt Ol</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">İsim</label>
              <input
                type="text"
                value={formData.firstName || ''}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Soyisim</label>
              <input
                type="text"
                value={formData.lastName || ''}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Kullanıcı Adı
            </label>
            <input
              type="text"
              value={formData.username || ''}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              required
              minLength={3}
              maxLength={20}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Şifre</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password || ''}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                minLength={6}
                className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-600 focus:outline-none z-10"
                aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
              >
                {showPassword ? (
                  <span className="text-lg">👁️</span>
                ) : (
                  <span className="text-lg">👁️‍🗨️</span>
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Şifre Tekrar
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword || ''}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                required
                className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-600 focus:outline-none z-10"
                aria-label={showConfirmPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
              >
                {showConfirmPassword ? (
                  <span className="text-lg">👁️</span>
                ) : (
                  <span className="text-lg">👁️‍🗨️</span>
                )}
              </button>
            </div>
          </div>
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center">
              <span className="mr-2">✅</span>
              <span>Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...</span>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-all transform hover:scale-105 font-semibold shadow-lg"
          >
            {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Zaten hesabın var mı?{' '}
          <Link href="/auth/login" className="text-purple-600 hover:text-purple-700 font-semibold hover:underline">
            Giriş yap
          </Link>
        </p>
      </div>
    </div>
  )
}

