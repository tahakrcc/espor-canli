const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// CORS configuration
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

// Request Logger
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});

app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const adminRoutes = require('./routes/admin');
const videoRoutes = require('./routes/videoRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/video', videoRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io setup
// Socket.io setup
const { setupEventSocket, notifySecurityAlert } = require('./socket/eventHandler');
const { setupVideoSocket } = require('./socket/videoHandler');
const debugStore = require('./utils/debugStore');
setupEventSocket(io);
setupVideoSocket(io);

// Serve static uploads
// Serve static uploads
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads'), {
  setHeaders: (res, path, stat) => {
    res.set('Access-Control-Allow-Origin', process.env.FRONTEND_URL || "http://localhost:5173");
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Serve Frontend in Production
if (process.env.NODE_ENV === 'production') {
  const frontendBuildPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendBuildPath));

  // SPA Catch-all (must be after API routes)
  app.get('*', (req, res) => {
    // Skip if API request (redundant if placed after api routes, but safe)
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

// Debug endpoint
app.get('/api/debug/log', (req, res) => {
  res.json(debugStore.logs || []);
});

// Security alert notification hook
const securityService = require('./services/security/SecurityService');
const originalCreateAlert = securityService.createSecurityAlert;
securityService.createSecurityAlert = async function (...args) {
  const alert = await originalCreateAlert.apply(this, args);
  if (alert) {
    notifySecurityAlert(alert);
  }
  return alert;
};

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

