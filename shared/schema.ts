import { z } from "zod";
import { pgTable, text, boolean, timestamp, integer, varchar, uuid, jsonb } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// PostgreSQL Tables with Drizzle ORM
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).unique().notNull(),
  username: varchar("username", { length: 30 }).unique().notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  password: text("password"),
  profileImageUrl: text("profile_image_url"),
  bio: text("bio"),
  phoneNumber: varchar("phone_number", { length: 20 }),
  isOnline: boolean("is_online").default(false),
  lastSeen: timestamp("last_seen").defaultNow(),
  status: varchar("status", { length: 50 }).default("Available"),
  theme: varchar("theme", { length: 10 }).default("light"),
  language: varchar("language", { length: 10 }).default("en"),
  isRestricted: boolean("is_restricted").default(false),
  isBanned: boolean("is_banned").default(false),
  restrictionReason: text("restriction_reason"),
  banReason: text("ban_reason"),
  restrictedAt: timestamp("restricted_at"),
  bannedAt: timestamp("banned_at"),
  isEmailVerified: boolean("is_email_verified").default(false),
  emailVerificationToken: text("email_verification_token"),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordExpires: timestamp("reset_password_expires"),
  googleId: varchar("google_id", { length: 100 }),
  provider: varchar("provider", { length: 20 }).default("email"),
  role: varchar("role", { length: 20 }).default("user"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chats = pgTable("chats", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }),
  description: text("description"),
  imageUrl: text("image_url"),
  isGroup: boolean("is_group").default(false),
  isGlobalRoom: boolean("is_global_room").default(false),
  category: varchar("category", { length: 100 }),
  maxMembers: integer("max_members").default(1000),
  isPublic: boolean("is_public").default(true),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  participants: jsonb("participants").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  chatId: uuid("chat_id").references(() => chats.id).notNull(),
  senderId: uuid("sender_id").references(() => users.id).notNull(),
  content: text("content"),
  messageType: varchar("message_type", { length: 20 }).default("text"),
  fileUrl: text("file_url"),
  fileName: varchar("file_name", { length: 255 }),
  duration: integer("duration"),
  thumbnailUrl: text("thumbnail_url"),
  replyToId: uuid("reply_to_id").references(() => messages.id),
  readBy: jsonb("read_by").$type<{ userId: string; readAt: Date }[]>().default([]),
  editedAt: timestamp("edited_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Session storage table (for authentication)
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  chatsCreated: many(chats),
  messagesSent: many(messages),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  creator: one(users, {
    fields: [chats.createdBy],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  replyTo: one(messages, {
    fields: [messages.replyToId],
    references: [messages.id],
  }),
}));

// Create Zod schemas from Drizzle tables
export const userSchema = createSelectSchema(users);
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSeen: true,
});

export const chatSchema = createSelectSchema(chats);
export const insertChatSchema = createInsertSchema(chats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const messageSchema = createSelectSchema(messages);
export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
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
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Chat = typeof chats.$inferSelect;
export type InsertChat = z.infer<typeof insertChatSchema>;
export type Message = typeof messages.$inferSelect;
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
