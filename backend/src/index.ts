import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import services
import DatabaseService from '@/services/database';
import AIService from '@/services/ai';

// Import middleware
import { generalLimiter } from '@/middleware/rateLimiter';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';

// Import routes
import authRoutes from '@/routes/auth';
import entriesRoutes from '@/routes/entries';
import aiRoutes from '@/routes/ai';
import searchRoutes from '@/routes/search';

import { getEnvVar, isProduction } from '@/utils/helpers';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(getEnvVar('PORT', '3001'));

// Initialize services
const db = DatabaseService.getInstance();
const ai = AIService.getInstance();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// General middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (!isProduction()) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use(generalLimiter);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealthy = await db.healthCheck();
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealthy ? 'healthy' : 'unhealthy',
        ai: 'healthy', // AI service doesn't have a direct health check
      },
      environment: process.env.NODE_ENV,
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: 'Health check failed'
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/entries', entriesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/search', searchRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ShadowLog API Server',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      entries: '/api/entries',
      ai: '/api/ai',
      search: '/api/search',
      health: '/health'
    },
    documentation: 'https://github.com/shadowlog/api-docs'
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown handler
async function gracefulShutdown(signal: string) {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close database connection
    await db.disconnect();
    
    // Close AI service connections
    await ai.disconnect();
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
async function startServer() {
  try {
    // Connect to database
    await db.connect();
    
    // Clean up expired cache entries on startup
    await db.cleanupExpiredCache();
    
    // Start the server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 ShadowLog API Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/`);
    });
    
    // Schedule periodic cache cleanup (every hour)
    setInterval(async () => {
      try {
        await db.cleanupExpiredCache();
      } catch (error) {
        console.error('❌ Scheduled cache cleanup failed:', error);
      }
    }, 60 * 60 * 1000);
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
startServer();
