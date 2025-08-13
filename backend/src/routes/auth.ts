import { Router, Request, Response, NextFunction } from 'express';
import { validateRequest, registerSchema, loginSchema } from '@/utils/validation';
import { hashPassword, comparePassword, generateToken, AppError } from '@/utils/helpers';
import DatabaseService from '@/services/database';
import { authLimiter } from '@/middleware/rateLimiter';
import { RegisterRequest, LoginRequest, AuthResponse, ApiResponse } from '@/types/api';

const router = Router();
const db = DatabaseService.getInstance();

// Apply rate limiting to all auth routes
router.use(authLimiter);

// Register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = validateRequest(registerSchema, req.body) as RegisterRequest;
    
    // Check if user already exists
    const existingUser = await db.getClient().user.findUnique({
      where: { email: data.email }
    });
    
    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }
    
    // Hash password and create user
    const hashedPassword = await hashPassword(data.password);
    
    const user = await db.getClient().user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      }
    });
    
    // Generate JWT token
    const token = generateToken({ 
      id: user.id, 
      email: user.email 
    });
    
    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token,
      },
      message: 'User registered successfully'
    };
    
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = validateRequest(loginSchema, req.body) as LoginRequest;
    
    // Find user by email
    const user = await db.getClient().user.findUnique({
      where: { email: data.email }
    });
    
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }
    
    // Verify password
    const isValidPassword = await comparePassword(data.password, user.password);
    
    if (!isValidPassword) {
      throw new AppError('Invalid email or password', 401);
    }
    
    // Generate JWT token
    const token = generateToken({ 
      id: user.id, 
      email: user.email 
    });
    
    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token,
      },
      message: 'Login successful'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get current user profile
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      throw new AppError('Access token required', 401);
    }
    
    const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    
    const user = await db.getClient().user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      }
    });
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    const response: ApiResponse = {
      success: true,
      data: user,
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      throw new AppError('Access token required', 401);
    }
    
    const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    
    // Verify user still exists
    const user = await db.getClient().user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true }
    });
    
    if (!user) {
      throw new AppError('User not found', 401);
    }
    
    // Generate new token
    const newToken = generateToken({ 
      id: user.id, 
      email: user.email 
    });
    
    const response: ApiResponse<{ token: string }> = {
      success: true,
      data: { token: newToken },
      message: 'Token refreshed successfully'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
