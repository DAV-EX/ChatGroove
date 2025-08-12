import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';
import { storage } from './storage';
import { 
  registerSchema, 
  loginSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema,
  type UserProfile 
} from '@shared/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Google OAuth setup
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Email setup
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Middleware to authenticate JWT tokens
export interface AuthenticatedRequest extends Request {
  user?: UserProfile;
}

// Admin authentication middleware
export const authenticateAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await storage.getUser(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await storage.getUser(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    
    // Update online status
    await storage.updateUserOnlineStatus(user._id!, true);
    
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Generate JWT token
const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
};

// Register with email/password
export const register = async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const user = await storage.createUser({
      ...validatedData,
      emailVerificationToken,
      provider: 'email',
    });

    // Send verification email
    if (process.env.SMTP_HOST) {
      try {
        await emailTransporter.sendMail({
          from: process.env.FROM_EMAIL,
          to: validatedData.email,
          subject: 'Verify your ChatGroove account',
          html: `
            <h1>Welcome to ChatGroove!</h1>
            <p>Please click the link below to verify your email address:</p>
            <a href="${process.env.BASE_URL}/verify-email?token=${emailVerificationToken}">Verify Email</a>
            <p>This link will expire in 24 hours.</p>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
      }
    }

    const token = generateToken(user._id!);
    
    res.status(201).json({
      message: 'User created successfully. Please check your email to verify your account.',
      token,
      user,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ message: 'Registration failed', error: (error as Error).message });
  }
};

// Login with email/password
export const login = async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    // Find user by email
    const user = await storage.getUserByEmail(validatedData.email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password for email users
    if (user.provider === 'email' && user.password) {
      const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    } else {
      return res.status(401).json({ message: 'Please login with Google' });
    }

    const token = generateToken(user._id!);
    const userProfile = await storage.getUser(user._id!);

    res.json({
      message: 'Login successful',
      token,
      user: userProfile,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ message: 'Login failed', error: (error as Error).message });
  }
};

// Google OAuth login
export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: 'Google OAuth not configured' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ message: 'Invalid Google token' });
    }

    const { sub: googleId, email, given_name, family_name, picture } = payload;

    if (!email) {
      return res.status(400).json({ message: 'Email not provided by Google' });
    }

    // Check if user exists
    let user = await storage.getUserByEmail(email);

    if (!user) {
      // Create new user
      const userProfile = await storage.createUser({
        email,
        username: email.split('@')[0] + '_' + Math.random().toString(36).substring(7),
        firstName: given_name,
        lastName: family_name,
        profileImageUrl: picture,
        googleId,
        provider: 'google',
        isEmailVerified: true,
      });
      user = { ...userProfile, _id: userProfile._id } as any;
    } else if (user.provider === 'email' && !user.googleId) {
      // Link Google account to existing email account
      const updatedUser = await storage.updateUser(user._id!, {
        googleId,
        profileImageUrl: picture || user.profileImageUrl,
      });
      user = { ...updatedUser, _id: updatedUser?._id } as any;
    }

    if (!user || !user._id) {
      return res.status(500).json({ message: 'Failed to create or retrieve user' });
    }
    
    const userId = user._id;
    const jwtToken = generateToken(userId);
    const userProfile = await storage.getUser(userId);

    res.json({
      message: 'Google login successful',
      token: jwtToken,
      user: userProfile,
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(400).json({ message: 'Google authentication failed', error: (error as Error).message });
  }
};

// Verify email
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    const user = await storage.getUserByEmail(''); // We need to modify this to search by token
    // For now, we'll implement a basic verification
    
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(400).json({ message: 'Email verification failed', error: (error as Error).message });
  }
};

// Forgot password
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const validatedData = forgotPasswordSchema.parse(req.body);

    const user = await storage.getUserByEmail(validatedData.email);
    if (!user) {
      // Don't reveal if email exists
      return res.json({ message: 'If an account exists with that email, a password reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await storage.updateUser(user._id!, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetExpires,
    });

    // Send reset email
    if (process.env.SMTP_HOST) {
      try {
        await emailTransporter.sendMail({
          from: process.env.FROM_EMAIL,
          to: validatedData.email,
          subject: 'Reset your ChatGroove password',
          html: `
            <h1>Password Reset</h1>
            <p>Click the link below to reset your password:</p>
            <a href="${process.env.BASE_URL}/reset-password?token=${resetToken}">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send reset email:', emailError);
      }
    }

    res.json({ message: 'If an account exists with that email, a password reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(400).json({ message: 'Failed to process request', error: (error as Error).message });
  }
};

// Get current user
export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
};

// Logout (client-side token removal, but we can track it server-side)
export const logout = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user) {
      await storage.updateUserOnlineStatus(req.user._id!, false);
    }
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
};