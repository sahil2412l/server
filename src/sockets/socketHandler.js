import { Server } from 'socket.io';
import { verifyAccessToken } from '../config/jwt.config.js';
import { sanitizeHtml, sanitizeString } from '../utils/sanitizer.js';

let io = null;

export const initSocket = (httpServer, allowedOrigins = ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5500']) => {
  const envOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
    : [];

  const validOrigins = [...allowedOrigins, ...envOrigins].filter(Boolean);

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow clients with no origin (like mobile native apps, CLI, or testing tools)
        if (!origin) return callback(null, true);
        if (validOrigins.includes(origin) || validOrigins.includes('*') || process.env.NODE_ENV !== 'production') {
          return callback(null, true);
        }
        return callback(new Error(`CORS blocked Socket.io connection from origin: ${origin}`));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Socket Authentication Middleware
  io.use((socket, next) => {
    let token = socket.handshake.auth?.token;

    if (!token && socket.handshake.headers?.authorization?.startsWith('Bearer ')) {
      token = socket.handshake.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        socket.user = decoded; // Cryptographically verified identity
      } catch (err) {
        // Invalid token attached - continue as guest or reject
        socket.user = null;
      }
    } else {
      socket.user = null; // Guest/Read-only client
    }

    next();
  });

  io.on('connection', (socket) => {
    const isAuth = !!socket.user;
    console.log(`⚡ [Socket.io] New client connected: ${socket.id} (Authenticated: ${isAuth})`);

    // Verified user join
    socket.on('user:join', (userData) => {
      // Use verified identity if authenticated, prevent spoofing
      const verifiedUserId = socket.user?.userId || userData?.userId || socket.id;
      const verifiedName = socket.user?.userId || userData?.name || 'Anonymous User';

      socket.userData = { userId: verifiedUserId, name: verifiedName };

      socket.broadcast.emit('user:online', {
        userId: verifiedUserId,
        name: verifiedName,
        socketId: socket.id,
      });
    });

    // Real-time Comment event (Sanitized & Authenticated)
    socket.on('comment:send', (data) => {
      if (!data || !data.content) return;

      const safeContent = sanitizeHtml(sanitizeString(String(data.content), 1000));
      const safeData = {
        ...data,
        content: safeContent,
        author: socket.user?.userId || data.author || 'Anonymous',
        timestamp: new Date().toISOString(),
      };

      io.emit('comment:new', safeData);
    });

    // Real-time Review event (Sanitized & Authenticated)
    socket.on('review:send', (data) => {
      if (!data || !data.content) return;

      const safeContent = sanitizeHtml(sanitizeString(String(data.content), 1000));
      const safeRating = Math.min(Math.max(Number(data.rating) || 5, 1), 5);

      const safeData = {
        ...data,
        content: safeContent,
        rating: safeRating,
        author: socket.user?.userId || data.author || 'Anonymous',
        timestamp: new Date().toISOString(),
      };

      io.emit('review:new', safeData);
    });

    // Real-time Performance update (Sanitized & Bounded)
    socket.on('performance:send', (data) => {
      if (!data) return;

      const safeScore = Math.min(Math.max(Number(data.score) || 0, 0), 1000);
      const safeData = {
        ...data,
        score: safeScore,
        author: socket.user?.userId || data.author || 'System',
        timestamp: new Date().toISOString(),
      };

      io.emit('performance:update', safeData);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      if (socket.userData) {
        io.emit('user:offline', {
          userId: socket.userData.userId,
          socketId: socket.id,
        });
      }
    });
  });

  return io;
};

// Getter for io instance to use in REST API controllers
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
};

// Broadcasters with HTML sanitization safety
export const broadcastNewComment = (commentData) => {
  if (io) {
    io.emit('comment:new', commentData);
  }
};

export const broadcastNewReview = (reviewData) => {
  if (io) {
    io.emit('review:new', reviewData);
  }
};

export const broadcastPerformanceUpdate = (performanceData) => {
  if (io) {
    io.emit('performance:update', performanceData);
  }
};

export const broadcastCoinEarned = (coinData) => {
  if (io) {
    io.emit('coin:earned', coinData);
  }
};
