import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend the Express Request to include our custom user object
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    tier: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_change_this';
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'your_supabase_secret_key';

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access denied. No token provided.' });
    return;
  }

  // Support both normal JWTs and Supabase JWTs if needed (matching old logic)
  const isSupabaseToken = authHeader && authHeader.startsWith('Bearer eyJ');
  const secret = isSupabaseToken && SUPABASE_JWT_SECRET !== 'your_supabase_secret_key' 
    ? SUPABASE_JWT_SECRET 
    : JWT_SECRET;

  try {
    const verified = jwt.verify(token, secret) as any;
    // Map 'sub' to 'id' if using Supabase tokens
    req.user = {
      id: verified.id || verified.sub,
      email: verified.email,
      tier: verified.tier || 'free'
    };
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token.' });
  }
};
