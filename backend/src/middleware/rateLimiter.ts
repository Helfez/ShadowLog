import rateLimit from 'express-rate-limit';
import { getEnvVar } from '@/utils/helpers';

// General API rate limiting
export const generalLimiter = rateLimit({
  windowMs: parseInt(getEnvVar('RATE_LIMIT_WINDOW_MS', '900000')), // 15 minutes
  max: parseInt(getEnvVar('RATE_LIMIT_MAX_REQUESTS', '100')), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI endpoints rate limiting (more restrictive due to cost)
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 AI requests per minute
  message: {
    success: false,
    error: 'Too many AI requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
