import { z } from 'zod';

// Auth validation schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  name: z.string().min(1).max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Diary entry validation schemas
export const createEntrySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  content: z.string().min(1, 'Content is required').max(50000, 'Content must be less than 50,000 characters'),
});

export const updateEntrySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(50000).optional(),
});

// Query validation schemas
export const getEntriesQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
  search: z.string().max(200).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// AI validation schemas
export const aiAnalysisSchema = z.object({
  content: z.string().min(1).max(10000),
  features: z.array(z.enum(['sentiment', 'tags', 'summary'])).min(1),
});

export const writingAssistSchema = z.object({
  prompt: z.string().min(1).max(1000),
  context: z.string().max(5000).optional(),
  maxTokens: z.number().min(10).max(2000).optional(),
});

export const searchSchema = z.object({
  query: z.string().min(1).max(200),
  filters: z.object({
    dateRange: z.object({
      start: z.string().datetime(),
      end: z.string().datetime(),
    }).optional(),
    sentiment: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
  limit: z.number().min(1).max(50).optional(),
});

// Validation helper function
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}
