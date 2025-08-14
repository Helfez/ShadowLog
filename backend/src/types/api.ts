// API Request/Response Types for ShadowLog Backend

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Auth Types
export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name?: string;
  };
  token: string;
}

// Diary Entry Types
export interface CreateEntryRequest {
  title: string;
  content: string;
}

export interface UpdateEntryRequest {
  title?: string;
  content?: string;
}

export interface DiaryEntryResponse {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  aiSentiment?: SentimentAnalysis;
  aiTags?: string[];
  aiSummary?: string | null;
}

export interface GetEntriesQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

export interface EntriesListResponse {
  entries: DiaryEntryResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// AI Types
export interface SentimentAnalysis {
  score: number; // -1 to 1
  label: 'positive' | 'negative' | 'neutral' | 'mixed';
  confidence: number; // 0 to 1
  emotions?: string[];
  [key: string]: any; // Index signature for Prisma JSON compatibility
}

export interface AIAnalysisRequest {
  content: string;
  features: ('sentiment' | 'tags' | 'summary')[];
}

export interface AIAnalysisResponse {
  sentiment?: SentimentAnalysis;
  tags?: string[];
  summary?: string;
}

export interface WritingAssistRequest {
  prompt: string;
  context?: string;
  maxTokens?: number;
}

export interface WritingAssistResponse {
  suggestions: string[];
  improvedText?: string;
}

// Search Types
export interface SearchRequest {
  query: string;
  filters?: {
    dateRange?: {
      start: string;
      end: string;
    };
    sentiment?: string;
    tags?: string[];
  };
  limit?: number;
}

export interface SearchResponse {
  results: DiaryEntryResponse[];
  totalResults: number;
  searchTime: number;
}
