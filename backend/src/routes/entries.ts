import { Router, Request, Response, NextFunction } from 'express';
import { validateRequest, createEntrySchema, updateEntrySchema, getEntriesQuerySchema } from '@/utils/validation';
import { AppError, calculatePagination, createPaginationResponse } from '@/utils/helpers';
import { authenticateToken } from '@/middleware/auth';
import DatabaseService from '@/services/database';
import AIService from '@/services/ai';
import { 
  CreateEntryRequest, 
  UpdateEntryRequest, 
  DiaryEntryResponse, 
  GetEntriesQuery,
  EntriesListResponse,
  ApiResponse 
} from '@/types/api';

const router = Router();
const db = DatabaseService.getInstance();
const ai = AIService.getInstance();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all entries for authenticated user
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = validateRequest(getEntriesQuerySchema, req.query) as GetEntriesQuery;
    const userId = req.user!.id;
    
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 50); // Max 50 entries per page
    const { skip, take } = calculatePagination(page, limit);
    
    // Build where clause
    const where: any = { userId };
    
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
        { aiTags: { hasSome: [query.search] } }
      ];
    }
    
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }
    
    // Build orderBy clause
    const orderBy: any = {};
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    orderBy[sortBy] = sortOrder;
    
    // Get entries and total count
    const [entries, total] = await Promise.all([
      db.getClient().diaryEntry.findMany({
        where,
        orderBy,
        skip,
        take,
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
    
    const pagination = createPaginationResponse(page, limit, total);
    
    const response: ApiResponse<EntriesListResponse> = {
      success: true,
      data: {
        entries: transformedEntries,
        pagination,
      }
    };
    
    res.json(response);
  } catch (error) {
    return next(error);
  }
});

// Get single entry by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: 'Entry ID is required' });
    }
    const userId = req.user!.id;
    
    const entry = await db.getClient().diaryEntry.findFirst({
      where: { id, userId },
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
    });
    
    if (!entry) {
      throw new AppError('Entry not found', 404);
    }
    
    const transformedEntry: DiaryEntryResponse = {
      id: entry.id,
      title: entry.title,
      content: entry.content,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
      aiSentiment: entry.aiSentiment as any,
      aiTags: entry.aiTags,
      aiSummary: entry.aiSummary,
    };
    
    const response: ApiResponse<DiaryEntryResponse> = {
      success: true,
      data: transformedEntry,
    };
    
    return res.json(response);
  } catch (error) {
    return next(error);
  }
});

// Create new entry
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = validateRequest(createEntrySchema, req.body) as CreateEntryRequest;
    const userId = req.user!.id;
    
    // Create entry in database
    const entry = await db.getClient().diaryEntry.create({
      data: {
        title: data.title,
        content: data.content,
        userId,
      },
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
    });
    
    // Process AI analysis in background (don't wait for it)
    processAIAnalysis(entry.id, data.content).catch(error => {
      console.error('AI analysis failed for entry:', entry.id, error);
    });
    
    const transformedEntry: DiaryEntryResponse = {
      id: entry.id,
      title: entry.title,
      content: entry.content,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
      aiSentiment: entry.aiSentiment as any,
      aiTags: entry.aiTags,
      aiSummary: entry.aiSummary,
    };
    
    const response: ApiResponse<DiaryEntryResponse> = {
      success: true,
      data: transformedEntry,
      message: 'Entry created successfully'
    };
    
    res.status(201).json(response);
  } catch (error) {
    return next(error);
  }
});

// Update entry
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: 'Entry ID is required' });
    }
    const data = validateRequest(updateEntrySchema, req.body) as UpdateEntryRequest;
    const userId = req.user!.id;
    
    // Check if entry exists and belongs to user
    const existingEntry = await db.getClient().diaryEntry.findFirst({
      where: { id, userId }
    });
    
    if (!existingEntry) {
      throw new AppError('Entry not found', 404);
    }
    
    // Update entry
    const updatedEntry = await db.getClient().diaryEntry.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.content && { content: data.content }),
      },
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
    });
    
    // Re-process AI analysis if content changed
    if (data.content) {
      processAIAnalysis(updatedEntry.id, data.content).catch(error => {
        console.error('AI analysis failed for entry:', updatedEntry.id, error);
      });
    }
    
    const transformedEntry: DiaryEntryResponse = {
      id: updatedEntry.id,
      title: updatedEntry.title,
      content: updatedEntry.content,
      createdAt: updatedEntry.createdAt.toISOString(),
      updatedAt: updatedEntry.updatedAt.toISOString(),
      aiSentiment: updatedEntry.aiSentiment as any,
      aiTags: updatedEntry.aiTags,
      aiSummary: updatedEntry.aiSummary,
    };
    
    const response: ApiResponse<DiaryEntryResponse> = {
      success: true,
      data: transformedEntry,
      message: 'Entry updated successfully'
    };
    
    return res.json(response);
  } catch (error) {
    return next(error);
  }
});

// Delete entry
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: 'Entry ID is required' });
    }
    const userId = req.user!.id;
    
    // Check if entry exists and belongs to user
    const existingEntry = await db.getClient().diaryEntry.findFirst({
      where: { id, userId }
    });
    
    if (!existingEntry) {
      throw new AppError('Entry not found', 404);
    }
    
    // Delete entry
    await db.getClient().diaryEntry.delete({
      where: { id }
    });
    
    const response: ApiResponse<null> = {
      success: true,
      data: null,
      message: 'Entry deleted successfully'
    };
    
    return res.json(response);
  } catch (error) {
    return next(error);
  }
});

// ...
async function processAIAnalysis(entryId: string, content: string): Promise<void> {
  try {
    const [sentiment, tags, summary] = await Promise.all([
      ai.analyzeSentiment(content),
      ai.generateTags(content),
      ai.generateSummary(content)
    ]);
    
    await db.getClient().diaryEntry.update({
      where: { id: entryId },
      data: {
        aiSentiment: sentiment,
        aiTags: tags,
        aiSummary: summary,
      }
    });
    
    console.log(`✅ AI analysis completed for entry: ${entryId}`);
  } catch (error) {
    console.error(`❌ AI analysis failed for entry: ${entryId}`, error);
  }
}

export default router;
