import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export function initSocket(httpServer: HttpServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*", // Allow all origins for now, restrict in production
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join admin room
    socket.on('join:admin', () => {
      console.log(`Socket ${socket.id} joined admin room`);
      socket.join('admin');
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
}

// Helper to emit events to admin room
export function notifyAdmin(event: string, data: any) {
  try {
    const io = getIO();
    io.to('admin').emit(event, data);
  } catch (error) {
    console.warn('Failed to notify admin (socket not ready):', error);
  }
}
