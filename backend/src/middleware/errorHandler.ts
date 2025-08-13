import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '@/utils/helpers';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', error);

  // Zod validation errors
  if (error instanceof ZodError) {
    const validationErrors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validationErrors
    });
    return;
  }

  // Custom application errors
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message
    });
    return;
  }

  // Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    
    switch (prismaError.code) {
      case 'P2002':
        res.status(409).json({
          success: false,
          error: 'A record with this information already exists'
        });
        return;
      case 'P2025':
        res.status(404).json({
          success: false,
          error: 'Record not found'
        });
        return;
      default:
        res.status(500).json({
          success: false,
          error: 'Database error occurred'
        });
        return;
    }
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Token expired'
    });
    return;
  }

  // Default server error
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message
  });
}

export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`
  });
}
