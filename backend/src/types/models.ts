// Database Model Types for ShadowLog Backend

export interface UserModel {
  id: string;
  email: string;
  password: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiaryEntryModel {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  aiSentiment?: any; // JSON field
  aiTags?: string[];
  aiSummary?: string;
  searchVector?: string;
}

export interface AICacheModel {
  id: string;
  key: string;
  result: any; // JSON field
  type: string;
  createdAt: Date;
  expiresAt: Date;
}

// Utility types for database operations
export interface CreateUserData {
  email: string;
  password: string;
  name?: string;
}

export interface CreateEntryData {
  title: string;
  content: string;
  userId: string;
}

export interface UpdateEntryData {
  title?: string;
  content?: string;
}

export interface DatabasePagination {
  skip: number;
  take: number;
}

export interface DatabaseFilters {
  userId: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}
