import OpenAI from 'openai';
import Redis from 'ioredis';
import { generateCacheKey, AppError, getEnvVar } from '@/utils/helpers';
import { SentimentAnalysis } from '@/types/api';
import DatabaseService from './database';

class AIService {
  private static instance: AIService;
  private openai: OpenAI | null;
  private redis: Redis | null = null;
  private db: DatabaseService;

  private constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
    } else {
      console.warn('OPENAI_API_KEY not provided, AI features disabled');
      this.openai = null;
    }
    
    // Make Redis optional for development
    try {
      this.redis = new Redis(getEnvVar('REDIS_URL', 'redis://localhost:6379'));
      this.redis.on('error', (err) => {
        console.warn('Redis connection failed, caching disabled:', err.message);
      });
    } catch (error) {
      console.warn('Redis not available, caching disabled');
    }
    
    this.db = DatabaseService.getInstance();
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  // Sentiment Analysis
  public async analyzeSentiment(content: string): Promise<SentimentAnalysis> {
    if (!this.openai) {
      console.warn('OpenAI not available, returning neutral sentiment');
      return {
        score: 0,
        label: 'neutral',
        confidence: 0,
        emotions: []
      };
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: getEnvVar('OPENAI_MODEL', 'gpt-3.5-turbo'),
        messages: [
          {
            role: 'system',
            content: `Analyze the sentiment of the following diary entry. Return a JSON object with:
            - score: number between -1 (very negative) and 1 (very positive)
            - label: one of "positive", "negative", "neutral", "mixed"
            - confidence: number between 0 and 1
            - emotions: array of emotion keywords (max 5)
            
            Be empathetic and understanding when analyzing personal diary content.`
          },
          {
            role: 'user',
            content: content
          }
        ],
        temperature: 0.3,
        max_tokens: 200,
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');
      
      // Cache the result
      await this.cacheResult(cacheKey, 'sentiment', result);
      
      return result;
    } catch (error) {
      console.error('Sentiment analysis failed:', error);
      throw new AppError('Failed to analyze sentiment', 500);
    }
  }

  // Generate Tags
  public async generateTags(content: string): Promise<string[]> {
    if (!this.openai) {
      console.warn('OpenAI not available, returning empty tags');
      return [];
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: getEnvVar('OPENAI_MODEL', 'gpt-3.5-turbo'),
        messages: [
          {
            role: 'system',
            content: `Generate relevant tags for this diary entry. Return a JSON array of 3-8 tags.
            Tags should be:
            - Relevant to the content
            - Concise (1-2 words)
            - In the same language as the content
            - Helpful for categorization and search
            
            Example: ["工作", "心情", "反思", "成长"]`
          },
          {
            role: 'user',
            content: content
          }
        ],
        temperature: 0.5,
        max_tokens: 100,
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '[]');
      
      await this.cacheResult(cacheKey, 'tags', result);
      
      return result;
    } catch (error) {
      console.error('Tag generation failed:', error);
      throw new AppError('Failed to generate tags', 500);
    }
  }

  // Generate Summary
  public async generateSummary(content: string): Promise<string> {
    const cacheKey = generateCacheKey(content, 'summary');
    
    const cached = await this.getCachedResult(cacheKey, 'summary');
    if (cached) {
      return cached as string;
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: getEnvVar('OPENAI_MODEL', 'gpt-3.5-turbo'),
        messages: [
          {
            role: 'system',
            content: `Create a brief, empathetic summary of this diary entry in 1-2 sentences.
            Focus on the main theme, emotions, or events mentioned.
            Use the same language as the original content.`
          },
          {
            role: 'user',
            content: content
          }
        ],
        temperature: 0.4,
        max_tokens: 150,
      });

      const result = response.choices[0]?.message?.content || '';
      
      await this.cacheResult(cacheKey, 'summary', result);
      
      return result;
    } catch (error) {
      console.error('Summary generation failed:', error);
      throw new AppError('Failed to generate summary', 500);
    }
  }

  // Writing Assistant
  public async assistWriting(prompt: string, context?: string, maxTokens: number = 500): Promise<string[]> {
    try {
      const systemMessage = `You are a helpful writing assistant for diary entries.
      Provide thoughtful suggestions to help improve or continue the writing.
      Be empathetic, supportive, and respectful of personal experiences.
      Return suggestions as a JSON array of strings.`;

      const userMessage = context 
        ? `Context: ${context}\n\nPrompt: ${prompt}`
        : prompt;

      const response = await this.openai.chat.completions.create({
        model: getEnvVar('OPENAI_MODEL', 'gpt-3.5-turbo'),
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '[]');
      return Array.isArray(result) ? result : [result];
    } catch (error) {
      console.error('Writing assistance failed:', error);
      throw new AppError('Failed to provide writing assistance', 500);
    }
  }

  // Cache management
  private async getCachedResult(key: string, type: string): Promise<any | null> {
    try {
      // Try Redis first (if available)
      if (this.redis) {
        const redisResult = await this.redis.get(key);
        if (redisResult) {
          return JSON.parse(redisResult);
        }
      }

      // Try database cache
      const dbResult = await this.db.getClient().aICache.findFirst({
        where: {
          key,
          type,
          expiresAt: { gt: new Date() }
        }
      });

      if (dbResult) {
        // Update Redis cache (if available)
        if (this.redis) {
          await this.redis.setex(key, 3600, JSON.stringify(dbResult.result));
        }
        return dbResult.result;
      }

      return null;
    } catch (error) {
      console.error('Cache retrieval failed:', error);
      return null;
    }
  }

  private async cacheResult(key: string, type: string, result: any): Promise<void> {
    const ttl = parseInt(getEnvVar('AI_CACHE_TTL', '3600'));
    const expiresAt = new Date(Date.now() + ttl * 1000);

    try {
      // Cache in Redis (if available)
      if (this.redis) {
        await this.redis.setex(key, ttl, JSON.stringify(result));
      }

      // Cache in database
      await this.db.getClient().aICache.upsert({
        where: { key },
        update: {
          result,
          type,
          expiresAt
        },
        create: {
          key,
          result,
          type,
          expiresAt
        }
      });
    } catch (error) {
      console.error('Cache storage failed:', error);
      // Don't throw error, caching failure shouldn't break the main functionality
    }
  }

  public async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

export default AIService;
