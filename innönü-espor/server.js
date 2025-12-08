const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    socket.on('join-event', (eventId) => {
      socket.join(`event-${eventId}`)
      console.log(`Client ${socket.id} joined event ${eventId}`)
    })

    socket.on('leave-event', (eventId) => {
      socket.leave(`event-${eventId}`)
    })

    socket.on('game-changed', (data) => {
      io.to(`event-${data.eventId}`).emit('game-changed', data)
    })

    socket.on('game-stopped', (data) => {
      io.to(`event-${data.eventId}`).emit('game-stopped', data)
    })

    socket.on('score-update', async (data) => {
      // Skor güncellemesi - burada veritabanına kaydedilebilir
      io.to(`event-${data.eventId}`).emit('leaderboard-updated')
    })

    socket.on('event-updated', (data) => {
      io.to(`event-${data.eventId}`).emit('event-updated', data)
    })

    socket.on('matches-created', (data) => {
      io.to(`event-${data.eventId}`).emit('matches-created', data)
    })

    // Maç atandığında
    socket.on('match-assigned', (match) => {
      // Maçtaki her iki oyuncuya da bildir
      io.to(`event-${match.eventId}`).emit('match-assigned', match)
    })

    // Maç başladığında
    socket.on('match-started', (data) => {
      io.to(`event-${data.eventId}`).emit('match-started', data)
    })

    // Maç bittiğinde
    socket.on('match-finished', (data) => {
      io.to(`event-${data.eventId}`).emit('match-finished', data)
    })

    // Yeni etkinlik oluşturulduğunda tüm kullanıcılara bildir
    socket.on('new-event-created', (event) => {
      if (event.status === 'ACTIVE' && event.isLive) {
        io.emit('new-event-available', event)
      }
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})

