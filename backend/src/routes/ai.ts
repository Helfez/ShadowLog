import { Router, Request, Response, NextFunction } from 'express';
import { validateRequest, aiAnalysisSchema, writingAssistSchema } from '@/utils/validation';
import { authenticateToken } from '@/middleware/auth';
import { aiLimiter } from '@/middleware/rateLimiter';
import AIService from '@/services/ai';
import { 
  AIAnalysisRequest, 
  AIAnalysisResponse, 
  WritingAssistRequest, 
  WritingAssistResponse,
  ApiResponse 
} from '@/types/api';

const router: Router = Router();
const ai = AIService.getInstance();

// Apply authentication and rate limiting to all AI routes
router.use(authenticateToken);
router.use(aiLimiter);

// Analyze content with AI
router.post('/analyze', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = validateRequest(aiAnalysisSchema, req.body) as AIAnalysisRequest;
    
    const results: AIAnalysisResponse = {};
    
    // Process requested features in parallel
    const promises: Promise<any>[] = [];
    
    if (data.features.includes('sentiment')) {
      promises.push(
        ai.analyzeSentiment(data.content).then(result => {
          results.sentiment = result;
        })
      );
    }
    
    if (data.features.includes('tags')) {
      promises.push(
        ai.generateTags(data.content).then(result => {
          results.tags = result;
        })
      );
    }
    
    if (data.features.includes('summary')) {
      promises.push(
        ai.generateSummary(data.content).then(result => {
          results.summary = result;
        })
      );
    }
    
    await Promise.all(promises);
    
    const response: ApiResponse<AIAnalysisResponse> = {
      success: true,
      data: results,
      message: 'AI analysis completed successfully'
    };
    
    res.json(response);
  } catch (error) {
    return next(error);
  }
});

// Writing assistance
router.post('/writing-assist', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = validateRequest(writingAssistSchema, req.body) as WritingAssistRequest;
    
    const suggestions = await ai.assistWriting(
      data.prompt,
      data.context,
      data.maxTokens
    );
    
    const response: ApiResponse<WritingAssistResponse> = {
      success: true,
      data: {
        suggestions,
      },
      message: 'Writing assistance provided successfully'
    };
    
    res.json(response);
  } catch (error) {
    return next(error);
  }
});

// Get sentiment analysis only
router.post('/sentiment', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content } = req.body;
    
    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Content is required and must be a string'
      });
    }
    
    const sentiment = await ai.analyzeSentiment(content);
    
    const response: ApiResponse = {
      success: true,
      data: { sentiment },
      message: 'Sentiment analysis completed'
    };
    
    return res.json(response);
  } catch (error) {
    return next(error);
  }
});

// Generate tags only
router.post('/tags', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content } = req.body;
    
    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Content is required and must be a string'
      });
    }
    
    const tags = await ai.generateTags(content);
    
    const response: ApiResponse = {
      success: true,
      data: { tags },
      message: 'Tags generated successfully'
    };
    
    return res.json(response);
  } catch (error) {
    return next(error);
  }
});

// Generate summary only
router.post('/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content } = req.body;
    
    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Content is required and must be a string'
      });
    }
    
    const summary = await ai.generateSummary(content);
    
    const response: ApiResponse = {
      success: true,
      data: { summary },
      message: 'Summary generated successfully'
    };
    
    return res.json(response);
  } catch (error) {
    return next(error);
  }
});

export default router;
