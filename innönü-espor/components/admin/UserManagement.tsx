'use client'

import { useState } from 'react'

interface UserManagementProps {
  users: any[]
  onRefresh: () => void
}

export function UserManagement({ users, onRefresh }: UserManagementProps) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [action, setAction] = useState<'ban' | 'mute' | 'xp' | 'note' | null>(
    null
  )
  const [formData, setFormData] = useState({ value: '', note: '' })

  const handleUserAction = async () => {
    if (!selectedUser || !action) return

    try {
      let endpoint = `/api/admin/users/${selectedUser}`
      let body: any = {}

      if (action === 'ban') {
        body.isBanned = true
      } else if (action === 'mute') {
        body.isMuted = true
      } else if (action === 'xp') {
        body.xp = parseInt(formData.value)
      } else if (action === 'note') {
        body.profileNote = formData.note
      }

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        onRefresh()
        setSelectedUser(null)
        setAction(null)
        setFormData({ value: '', note: '' })
      }
    } catch (error) {
      console.error('Kullanıcı işlemi hatası:', error)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Kullanıcı Yönetimi</h2>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4">Kullanıcı Adı</th>
              <th className="text-left py-3 px-4">Email</th>
              <th className="text-left py-3 px-4">XP</th>
              <th className="text-left py-3 px-4">Durum</th>
              <th className="text-left py-3 px-4">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-gray-700 hover:bg-gray-700"
              >
                <td className="py-3 px-4">{user.username}</td>
                <td className="py-3 px-4 text-gray-400">{user.email}</td>
                <td className="py-3 px-4">{user.xp}</td>
                <td className="py-3 px-4">
                  <div className="flex space-x-2">
                    {user.isBanned && (
                      <span className="px-2 py-1 bg-red-600 rounded text-xs">
                        Banlı
                      </span>
                    )}
                    {user.isMuted && (
                      <span className="px-2 py-1 bg-yellow-600 rounded text-xs">
                        Susturulmuş
                      </span>
                    )}
                    {user.role === 'ADMIN' && (
                      <span className="px-2 py-1 bg-blue-600 rounded text-xs">
                        Admin
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => setSelectedUser(user.id)}
                    className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 text-sm"
                  >
                    Yönet
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Kullanıcı İşlemleri</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setAction('ban')}
                  className={`px-4 py-2 rounded ${
                    action === 'ban'
                      ? 'bg-red-600'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  Banla
                </button>
                <button
                  onClick={() => setAction('mute')}
                  className={`px-4 py-2 rounded ${
                    action === 'mute'
                      ? 'bg-yellow-600'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  Sustur
                </button>
                <button
                  onClick={() => setAction('xp')}
                  className={`px-4 py-2 rounded ${
                    action === 'xp'
                      ? 'bg-green-600'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  XP Ver
                </button>
                <button
                  onClick={() => setAction('note')}
                  className={`px-4 py-2 rounded ${
                    action === 'note'
                      ? 'bg-blue-600'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  Not Ekle
                </button>
              </div>

              {action === 'xp' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    XP Miktarı
                  </label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({ ...formData, value: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-700 rounded text-white"
                  />
                </div>
              )}

              {action === 'note' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Profil Notu
                  </label>
                  <textarea
                    value={formData.note}
                    onChange={(e) =>
                      setFormData({ ...formData, note: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-700 rounded text-white"
                  />
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={handleUserAction}
                  disabled={!action || (action === 'xp' && !formData.value) || (action === 'note' && !formData.note)}
                  className="flex-1 px-4 py-2 bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Uygula
                </button>
                <button
                  onClick={() => {
                    setSelectedUser(null)
                    setAction(null)
                    setFormData({ value: '', note: '' })
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

