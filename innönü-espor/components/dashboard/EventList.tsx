'use client'

interface EventListProps {
  events: any[]
  onJoinEvent: (eventId: string) => void
}

export function EventList({ events, onJoinEvent }: EventListProps) {
  if (events.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-400">Henüz katıldığınız etkinlik yok</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {events.map((event) => (
        <div
          key={event.id}
          className="bg-white rounded-xl p-4 sm:p-6 hover:bg-purple-50 transition-all border-2 border-purple-600 shadow-lg"
        >
          <h3 className="text-lg sm:text-xl font-bold mb-2 text-black">{event.name}</h3>
          <p className="text-black text-sm mb-4">{event.description}</p>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <span
              className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold ${
                event.status === 'ACTIVE'
                  ? 'bg-purple-600 text-white'
                  : event.status === 'ENDED'
                  ? 'bg-gray-600 text-white'
                  : 'bg-yellow-500 text-gray-900'
              }`}
            >
              {event.status === 'ACTIVE' && 'Aktif'}
              {event.status === 'ENDED' && 'Bitti'}
              {event.status === 'DRAFT' && 'Taslak'}
            </span>
            {event.status === 'ACTIVE' && (
              <button
                onClick={() => onJoinEvent(event.id)}
                className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition-all transform hover:scale-105"
              >
                Etkinliğe Katıl
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

