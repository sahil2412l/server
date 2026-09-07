import { Server } from 'socket.io';

let io = null;

export const initSocket = (httpServer, allowedOrigins = ['http://localhost:3000', '*']) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*', // Allow connections from frontend clients
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`⚡ [Socket.io] New client connected: ${socket.id}`);

    // Allow client to identify with user details
    socket.on('user:join', (userData) => {
      socket.userData = userData;
      console.log(`👤 User joined live room: ${userData?.userId || socket.id}`);
      socket.broadcast.emit('user:online', {
        userId: userData?.userId,
        name: userData?.name,
        socketId: socket.id,
      });
    });

    // Real-time Comment event from Socket client
    socket.on('comment:send', (data) => {
      console.log(`💬 Live comment received:`, data);
      io.emit('comment:new', data);
    });

    // Real-time Review event from Socket client
    socket.on('review:send', (data) => {
      console.log(`⭐ Live review received:`, data);
      io.emit('review:new', data);
    });

    // Real-time Performance update from Socket client
    socket.on('performance:send', (data) => {
      console.log(`📊 Live performance received:`, data);
      io.emit('performance:update', data);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 [Socket.io] Client disconnected: ${socket.id}`);
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

// Helper broadcaster functions
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
