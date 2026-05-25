import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.routes';
import sessionRoutes from './routes/session.routes';
import codeSubmissionRoutes from './routes/codeSubmission.routes';
import reviewRoutes from './routes/review.routes';
import { errorHandler, notFound } from './middlewares/errorHandler';
import { apiLimiter } from './middlewares/rateLimit';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
});

app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use('/api', apiLimiter);

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'WebFlexi API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/submissions', codeSubmissionRoutes);
app.use('/api/reviews', reviewRoutes);

// Room participant registry: roomId → Map<socketId, {userId, name}>
const roomParticipants = new Map<string, Map<string, { userId: string; name: string }>>();

// Code state per room for late-join sync: roomId → {code, language}
const roomCodeState = new Map<string, { code: string; language: string }>();

io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  let currentRoom: string | null = null;

  socket.on('join-room', (data: { roomId: string; userId?: string; name?: string; peerId?: string } | string) => {
    const roomId = typeof data === 'string' ? data : data.roomId;
    const userId = typeof data === 'object' ? (data.userId ?? '') : '';
    const name = typeof data === 'object' ? (data.name ?? 'Unknown') : 'Unknown';
    const peerId = typeof data === 'object' ? data.peerId : undefined;

    currentRoom = roomId;
    socket.join(roomId);
    console.log(`User ${socket.id} (${name}) joined room: ${roomId}`);

    // Track participant
    if (!roomParticipants.has(roomId)) {
      roomParticipants.set(roomId, new Map());
    }
    roomParticipants.get(roomId)!.set(socket.id, { userId, name });

    // Send current participant list to the joining socket
    const participants = Array.from(roomParticipants.get(roomId)!.entries()).map(
      ([socketId, info]) => ({ socketId, ...info })
    );
    socket.emit('room-users', participants);

    // Send current code state to late joiner
    const codeState = roomCodeState.get(roomId);
    if (codeState) {
      socket.emit('sync-response', codeState);
    }

    // Notify everyone else
    socket.to(roomId).emit('user-joined', { socketId: socket.id, userId, name, peerId });
  });

  socket.on('leave-room', (roomId: string) => {
    const info = roomParticipants.get(roomId)?.get(socket.id);
    roomParticipants.get(roomId)?.delete(socket.id);
    socket.leave(roomId);
    socket.to(roomId).emit('user-left', { socketId: socket.id, name: info?.name ?? 'Unknown' });
    console.log(`User ${socket.id} left room: ${roomId}`);
    if (currentRoom === roomId) currentRoom = null;
  });

  // Chat — use socket.to() so sender doesn't receive own message
  socket.on('send-message', (data: { roomId: string; message: unknown }) => {
    socket.to(data.roomId).emit('receive-message', data.message);
  });

  // Code collaboration
  socket.on('code-change', (data: { roomId: string; code: string; language?: string }) => {
    roomCodeState.set(data.roomId, {
      code: data.code,
      language: data.language ?? roomCodeState.get(data.roomId)?.language ?? 'javascript',
    });
    socket.to(data.roomId).emit('code-update', { code: data.code });
  });

  // Language sync
  socket.on('language-change', (data: { roomId: string; language: string }) => {
    const existing = roomCodeState.get(data.roomId);
    if (existing) {
      roomCodeState.set(data.roomId, { ...existing, language: data.language });
    }
    socket.to(data.roomId).emit('language-update', { language: data.language });
  });

  // Cursor presence
  socket.on('cursor-position', (data: { roomId: string; line: number; column: number }) => {
    const info = roomParticipants.get(data.roomId)?.get(socket.id);
    socket.to(data.roomId).emit('cursor-update', {
      socketId: socket.id,
      name: info?.name ?? 'Unknown',
      line: data.line,
      column: data.column,
    });
  });

  // Typing indicator
  socket.on('typing', (data: { roomId: string; isTyping: boolean }) => {
    const info = roomParticipants.get(data.roomId)?.get(socket.id);
    socket.to(data.roomId).emit('user-typing', {
      userId: socket.id,
      name: info?.name ?? 'Unknown',
      isTyping: data.isTyping,
    });
  });

  // WebRTC signaling (PeerJS supplement)
  socket.on('call-user', (data: { to: string; signalData: unknown }) => {
    io.to(data.to).emit('incoming-call', { from: socket.id, signalData: data.signalData });
  });

  socket.on('accept-call', (data: { to: string; signalData: unknown }) => {
    io.to(data.to).emit('call-accepted', { signalData: data.signalData });
  });

  socket.on('disconnect', () => {
    if (currentRoom) {
      const info = roomParticipants.get(currentRoom)?.get(socket.id);
      roomParticipants.get(currentRoom)?.delete(socket.id);

      // Clean up empty rooms
      if (roomParticipants.get(currentRoom)?.size === 0) {
        roomParticipants.delete(currentRoom);
        roomCodeState.delete(currentRoom);
      }

      socket.to(currentRoom).emit('user-left', {
        socketId: socket.id,
        name: info?.name ?? 'Unknown',
      });
    }
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

app.use(notFound);
app.use(errorHandler);

export { app, httpServer, io };
