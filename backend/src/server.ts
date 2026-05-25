import { config } from 'dotenv';
config();

import { httpServer } from './app';
import prisma from './config/database';
import redis from './config/redis';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Test Redis connection
    await redis.ping();
    console.log('✅ Redis connected successfully');

    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🚀 WebFlexi Backend Server is running`);
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔌 WebSocket: Enabled`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\n⏳ Shutting down gracefully...');

  httpServer.close(async () => {
    console.log('📴 HTTP server closed');

    await prisma.$disconnect();
    console.log('📴 Database disconnected');

    await redis.quit();
    console.log('📴 Redis disconnected');

    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forcing shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

startServer();
