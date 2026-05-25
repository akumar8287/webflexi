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

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate limiting
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'WebFlexi API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/submissions', codeSubmissionRoutes);
app.use('/api/reviews', reviewRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // Join room for private messaging
  socket.on('join-room', (data: { roomId: string; peerId?: string } | string) => {
    const roomId = typeof data === 'string' ? data : data.roomId;
    const peerId = typeof data === 'object' ? data.peerId : undefined;
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
    if (peerId) {
      socket.to(roomId).emit('user-joined', { peerId });
    }
  });

  // Leave room
  socket.on('leave-room', (roomId: string) => {
    socket.leave(roomId);
    console.log(`User ${socket.id} left room: ${roomId}`);
  });

  // Handle chat messages
  socket.on('send-message', (data: { roomId: string; message: any }) => {
    io.to(data.roomId).emit('receive-message', data.message);
  });

  // Handle code collaboration
  socket.on('code-change', (data: { roomId: string; code: string }) => {
    socket.to(data.roomId).emit('code-update', { code: data.code });
  });

  // Handle typing indicator
  socket.on('typing', (data: { roomId: string; isTyping: boolean }) => {
    socket.to(data.roomId).emit('user-typing', {
      userId: socket.id,
      isTyping: data.isTyping,
    });
  });

  // Handle video call signaling
  socket.on('call-user', (data: { to: string; signalData: any }) => {
    io.to(data.to).emit('incoming-call', {
      from: socket.id,
      signalData: data.signalData,
    });
  });

  socket.on('accept-call', (data: { to: string; signalData: any }) => {
    io.to(data.to).emit('call-accepted', {
      signalData: data.signalData,
    });
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

export { app, httpServer, io };
