import { Router, Request, Response, NextFunction } from 'express';
import { validateRequest, searchSchema } from '@/utils/validation';
import { authenticateToken } from '@/middleware/auth';
import DatabaseService from '@/services/database';
import { SearchRequest, SearchResponse, DiaryEntryResponse, ApiResponse } from '@/types/api';

const router = Router();
const db = DatabaseService.getInstance();

// Apply authentication to all search routes
router.use(authenticateToken);

// Search entries
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = validateRequest(searchSchema, req.body) as SearchRequest;
    const userId = req.user!.id;
    const limit = Math.min(data.limit || 20, 50);
    
    const startTime = Date.now();
    
    // Build where clause
    const where: any = { userId };
    
    // Text search
    where.OR = [
      { title: { contains: data.query, mode: 'insensitive' } },
      { content: { contains: data.query, mode: 'insensitive' } },
      { aiTags: { hasSome: [data.query] } },
      { aiSummary: { contains: data.query, mode: 'insensitive' } }
    ];
    
    // Apply filters
    if (data.filters) {
      if (data.filters.dateRange) {
        where.createdAt = {
          gte: new Date(data.filters.dateRange.start),
          lte: new Date(data.filters.dateRange.end)
        };
      }
      
      if (data.filters.sentiment) {
        where.aiSentiment = {
          path: ['label'],
          equals: data.filters.sentiment
        };
      }
      
      if (data.filters.tags && data.filters.tags.length > 0) {
        where.aiTags = {
          hasSome: data.filters.tags
        };
      }
    }
    
    // Execute search
    const [entries, total] = await Promise.all([
      db.getClient().diaryEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          aiSentiment: true,
          aiTags: true,
          aiSummary: true,
        }
      }),
      db.getClient().diaryEntry.count({ where })
    ]);
    
    const searchTime = Date.now() - startTime;
    
    // Transform entries to response format
    const transformedEntries: DiaryEntryResponse[] = entries.map(entry => ({
      id: entry.id,
      title: entry.title,
      content: entry.content,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
      aiSentiment: entry.aiSentiment as any,
      aiTags: entry.aiTags,
      aiSummary: entry.aiSummary,
    }));
    
    const searchResult: SearchResponse = {
      results: transformedEntries,
      totalResults: total,
      searchTime
    };
    
    const response: ApiResponse<SearchResponse> = {
      success: true,
      data: searchResult,
      message: `Found ${total} results in ${searchTime}ms`
    };
    
    res.json(response);
  } catch (error) {
    return next(error);
  }
});

// Quick search (simplified endpoint for autocomplete)
router.get('/quick', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    const userId = req.user!.id;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required'
      });
    }
    
    const entries = await db.getClient().diaryEntry.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { aiTags: { hasSome: [q] } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        createdAt: true,
        aiTags: true,
      }
    });
    
    const suggestions = entries.map(entry => ({
      id: entry.id,
      title: entry.title,
      createdAt: entry.createdAt.toISOString(),
      tags: entry.aiTags
    }));
    
    const response: ApiResponse = {
      success: true,
      data: { suggestions },
    };
    
    return res.json(response);
  } catch (error) {
    return next(error);
  }
});

export default router;
