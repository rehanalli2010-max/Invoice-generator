import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_change_this';

// Mocked Tier limits matching old logic
const TIER_LIMITS: Record<string, number> = {
  free: 20,
  pro: 50,
  enterprise: Infinity
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        tier: 'free',
        dailyActionCount: 0,
        tokenVersion: 0
      }
    });

    const token = jwt.sign({ 
      id: newUser.id, // Using 'id' instead of 'userId' for easier standard checking
      email: newUser.email,
      tier: newUser.tier,
      tokenVersion: 0 
    }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ 
      token, 
      user: { 
        id: newUser.id, 
        email: newUser.email, 
        tier: 'free', 
        actionCount: 0, 
        actionLimit: TIER_LIMITS.free 
      } 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ 
      id: user.id, 
      email: user.email,
      tier: user.tier,
      tokenVersion: user.tokenVersion || 0 
    }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        tier: user.tier,
        actionCount: user.dailyActionCount,
        actionLimit: TIER_LIMITS[user.tier] || TIER_LIMITS.free
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
       res.status(401).json({ error: 'Not authenticated' });
       return;
    }
    const user = await prisma.user.findUnique({ 
        where: { id: req.user.id },
        select: { id: true, email: true, tier: true, dailyActionCount: true } 
    });
    
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    
    res.json({ 
        user: {
            ...user,
            actionLimit: TIER_LIMITS[user.tier] || TIER_LIMITS.free
        }
    });
  } catch (err) {
      res.status(500).json({ error: 'Failed to get user' });
  }
};
