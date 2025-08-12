import { z } from "zod";

// Zod schemas for validation
export const userSchema = z.object({
  _id: z.string().optional(),
  email: z.string().email(),
  username: z.string().min(3).max(30),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  password: z.string().min(6).optional(), // Optional for Google auth users
  profileImageUrl: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  phoneNumber: z.string().optional(),
  isOnline: z.boolean().default(false),
  lastSeen: z.date().default(() => new Date()),
  status: z.string().default("Available"),
  theme: z.enum(["light", "dark"]).default("light"),
  language: z.string().default("en"),
  isEmailVerified: z.boolean().default(false),
  emailVerificationToken: z.string().optional(),
  resetPasswordToken: z.string().optional(),
  resetPasswordExpires: z.date().optional(),
  googleId: z.string().optional(), // For Google OAuth
  provider: z.enum(["email", "google"]).default("email"),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const chatSchema = z.object({
  _id: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  isGroup: z.boolean().default(false),
  isGlobalRoom: z.boolean().default(false),
  category: z.string().optional(),
  maxMembers: z.number().default(1000),
  isPublic: z.boolean().default(true),
  createdBy: z.string(),
  participants: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const messageSchema = z.object({
  _id: z.string().optional(),
  chatId: z.string(),
  senderId: z.string(),
  content: z.string().optional(),
  messageType: z.enum(["text", "image", "file", "voice_note", "video_note", "video_call", "audio_call"]).default("text"),
  fileUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  duration: z.number().optional(),
  thumbnailUrl: z.string().url().optional(),
  replyToId: z.string().optional(),
  readBy: z.array(z.object({
    userId: z.string(),
    readAt: z.date().default(() => new Date()),
  })).default([]),
  editedAt: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
});

// Insert schemas (for API validation)
export const insertUserSchema = userSchema.omit({
  _id: true,
  createdAt: true,
  updatedAt: true,
  lastSeen: true,
});

export const insertChatSchema = chatSchema.omit({
  _id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = messageSchema.omit({
  _id: true,
  createdAt: true,
  readBy: true,
});

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6),
});

export const verifyEmailSchema = z.object({
  token: z.string(),
});

// Types
export type User = z.infer<typeof userSchema>;
export type Chat = z.infer<typeof chatSchema>;
export type Message = z.infer<typeof messageSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertChat = z.infer<typeof insertChatSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

// Extended types for API responses
export type UserProfile = Omit<User, 'password' | 'emailVerificationToken' | 'resetPasswordToken' | 'resetPasswordExpires'>;

export type ChatWithParticipants = Chat & {
  participantDetails: UserProfile[];
  lastMessage?: MessageWithSender;
  unreadCount?: number;
};

export type MessageWithSender = Message & {
  sender: UserProfile;
  replyTo?: MessageWithSender;
  isRead?: boolean;
};
