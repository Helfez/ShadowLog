// API Client for ShadowLog Frontend

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Auth Types
export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Diary Entry Types
export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  aiSentiment?: {
    score: number;
    label: 'positive' | 'negative' | 'neutral' | 'mixed';
    confidence: number;
    emotions?: string[];
  };
  aiTags?: string[];
  aiSummary?: string;
}

export interface CreateEntryRequest {
  title: string;
  content: string;
}

export interface UpdateEntryRequest {
  title?: string;
  content?: string;
}

export interface EntriesListResponse {
  entries: DiaryEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Client Class
class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.loadToken();
  }

  private loadToken(): void {
    this.token = localStorage.getItem('auth_token');
  }

  private saveToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  private removeToken(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth Methods
  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.success && response.data?.token) {
      this.saveToken(response.data.token);
    }

    return response;
  }

  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.success && response.data?.token) {
      this.saveToken(response.data.token);
    }

    return response;
  }

  async logout(): Promise<void> {
    this.removeToken();
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<User>('/api/auth/me');
  }

  // Diary Entry Methods
  async getEntries(params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<EntriesListResponse>> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const query = searchParams.toString();
    const endpoint = `/api/entries${query ? `?${query}` : ''}`;

    return this.request<EntriesListResponse>(endpoint);
  }

  async getEntry(id: string): Promise<ApiResponse<DiaryEntry>> {
    return this.request<DiaryEntry>(`/api/entries/${id}`);
  }

  async createEntry(data: CreateEntryRequest): Promise<ApiResponse<DiaryEntry>> {
    return this.request<DiaryEntry>('/api/entries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEntry(id: string, data: UpdateEntryRequest): Promise<ApiResponse<DiaryEntry>> {
    return this.request<DiaryEntry>(`/api/entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEntry(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/entries/${id}`, {
      method: 'DELETE',
    });
  }

  // AI Methods
  async analyzeSentiment(content: string): Promise<ApiResponse<any>> {
    return this.request('/api/ai/sentiment', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async generateTags(content: string): Promise<ApiResponse<any>> {
    return this.request('/api/ai/tags', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async getWritingAssistance(prompt: string, context?: string): Promise<ApiResponse<any>> {
    return this.request('/api/ai/writing-assist', {
      method: 'POST',
      body: JSON.stringify({ prompt, context }),
    });
  }

  // Search Methods
  async search(query: string, filters?: any): Promise<ApiResponse<any>> {
    return this.request('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query, filters }),
    });
  }

  async quickSearch(query: string): Promise<ApiResponse<any>> {
    return this.request(`/api/search/quick?q=${encodeURIComponent(query)}`);
  }

  // Health Check
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.request('/health');
  }

  // Utility Methods
  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
