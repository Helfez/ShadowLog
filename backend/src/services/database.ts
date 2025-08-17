import { PrismaClient } from '@prisma/client';
import { AppError } from '@/utils/helpers';

class DatabaseService {
  private static instance: DatabaseService;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public getClient(): PrismaClient {
    return this.prisma;
  }

  public async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw new AppError('Database connection failed', 500);
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      console.log('✅ Database disconnected successfully');
    } catch (error) {
      console.error('❌ Database disconnection failed:', error);
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      return false;
    }
  }

  // Cleanup expired AI cache entries
  public async cleanupExpiredCache(): Promise<void> {
    try {
      // Check if ai_cache table exists before cleanup
      await this.prisma.$queryRaw`SELECT 1 FROM ai_cache LIMIT 1`;
      
      const result = await this.prisma.aICache.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
      
      if (result.count > 0) {
        console.log(`🧹 Cleaned up ${result.count} expired cache entries`);
      }
    } catch (error) {
      // Silently ignore if table doesn't exist (during initial setup)
      if (error instanceof Error && error.message.includes('does not exist')) {
        console.log('ℹ️ AI cache table not yet created, skipping cleanup');
      } else {
        console.error('❌ Cache cleanup failed:', error);
      }
    }
  }
}

export default DatabaseService;
