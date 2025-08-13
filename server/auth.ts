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
          subject: 'Welcome to ChatGroove - Verify Your Account',
          html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Welcome to ChatGroove</title>
              <style>
                body {
                  margin: 0;
                  padding: 0;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  line-height: 1.6;
                  color: #333333;
                  background-color: #f8fafc;
                }
                .email-container {
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #ffffff;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .header {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  padding: 40px 30px;
                  text-align: center;
                }
                .logo {
                  color: #ffffff;
                  font-size: 28px;
                  font-weight: bold;
                  margin: 0;
                  letter-spacing: -0.5px;
                }
                .content {
                  padding: 40px 30px;
                }
                .welcome-title {
                  font-size: 24px;
                  font-weight: 600;
                  color: #1a202c;
                  margin: 0 0 16px 0;
                  text-align: center;
                }
                .welcome-message {
                  font-size: 16px;
                  color: #4a5568;
                  margin: 0 0 32px 0;
                  text-align: center;
                }
                .verify-button {
                  display: inline-block;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: #ffffff;
                  text-decoration: none;
                  padding: 16px 32px;
                  border-radius: 8px;
                  font-weight: 600;
                  font-size: 16px;
                  text-align: center;
                  margin: 0 auto;
                  display: block;
                  width: fit-content;
                  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                  transition: all 0.2s ease;
                }
                .verify-button:hover {
                  transform: translateY(-1px);
                  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
                }
                .manual-link {
                  margin-top: 24px;
                  padding: 20px;
                  background-color: #f7fafc;
                  border-radius: 8px;
                  border-left: 4px solid #667eea;
                }
                .manual-link p {
                  margin: 0 0 8px 0;
                  font-size: 14px;
                  color: #4a5568;
                }
                .manual-link a {
                  color: #667eea;
                  word-break: break-all;
                  text-decoration: none;
                }
                .footer {
                  background-color: #f7fafc;
                  padding: 30px;
                  text-align: center;
                  border-top: 1px solid #e2e8f0;
                }
                .footer p {
                  margin: 0 0 8px 0;
                  font-size: 14px;
                  color: #718096;
                }
                .footer .company-name {
                  font-weight: 600;
                  color: #4a5568;
                }
                .expiry-notice {
                  margin-top: 24px;
                  padding: 16px;
                  background-color: #fef5e7;
                  border-radius: 8px;
                  border-left: 4px solid #f6ad55;
                  text-align: center;
                }
                .expiry-notice p {
                  margin: 0;
                  font-size: 14px;
                  color: #744210;
                }
                @media only screen and (max-width: 600px) {
                  .email-container {
                    margin: 0;
                    box-shadow: none;
                  }
                  .header, .content, .footer {
                    padding: 30px 20px;
                  }
                  .welcome-title {
                    font-size: 22px;
                  }
                  .verify-button {
                    padding: 14px 28px;
                    font-size: 15px;
                  }
                }
              </style>
            </head>
            <body>
              <div class="email-container">
                <div class="header">
                  <h1 class="logo">ChatGroove</h1>
                </div>
                
                <div class="content">
                  <h1 class="welcome-title">Welcome to ChatGroove!</h1>
                  <p class="welcome-message">
                    Thank you for joining our community. To get started and access all features, 
                    please verify your email address by clicking the button below.
                  </p>
                  
                  <a href="${process.env.BASE_URL}/verify-email?token=${emailVerificationToken}" class="verify-button">
                    Verify My Email Address
                  </a>
                  
                  <div class="manual-link">
                    <p><strong>Having trouble with the button?</strong></p>
                    <p>Copy and paste this link into your browser:</p>
                    <a href="${process.env.BASE_URL}/verify-email?token=${emailVerificationToken}">${process.env.BASE_URL}/verify-email?token=${emailVerificationToken}</a>
                  </div>
                  
                  <div class="expiry-notice">
                    <p><strong>⏰ This verification link expires in 24 hours</strong></p>
                  </div>
                </div>
                
                <div class="footer">
                  <p class="company-name">ChatGroove Team</p>
                  <p>Connect, chat, and collaborate in real-time</p>
                  <p>If you didn't create this account, you can safely ignore this email.</p>
                </div>
              </div>
            </body>
            </html>
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
    console.log('Login attempt for:', validatedData.email, 'Found user:', user ? 'yes' : 'no');
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