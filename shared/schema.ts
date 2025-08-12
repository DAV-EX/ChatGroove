import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  uuid,
  serial,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(), // Made required for email registration
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: varchar("username").unique(),
  bio: text("bio"),
  phoneNumber: varchar("phone_number").unique(), // New: for WhatsApp-like features
  isOnline: boolean("is_online").default(false),
  lastSeen: timestamp("last_seen").defaultNow(),
  status: varchar("status").default("Available"), // New: custom status messages
  theme: varchar("theme").default("light"), // New: user theme preference
  language: varchar("language").default("en"), // New: language preference
  isEmailVerified: boolean("is_email_verified").default(false), // New: email verification
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chats table (for direct messages, group chats, and global rooms)
export const chats = pgTable("chats", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name"), // null for direct messages, name for groups/global rooms
  description: text("description"),
  imageUrl: varchar("image_url"),
  isGroup: boolean("is_group").default(false),
  isGlobalRoom: boolean("is_global_room").default(false), // New: for global chat rooms
  category: varchar("category"), // New: categories like "General", "Gaming", "Music", etc.
  maxMembers: integer("max_members").default(1000), // New: limit for global rooms
  isPublic: boolean("is_public").default(true), // New: public/private rooms
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat participants table
export const chatParticipants = pgTable("chat_participants", {
  id: serial("id").primaryKey(),
  chatId: uuid("chat_id").references(() => chats.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role").default("member"), // admin, member
  joinedAt: timestamp("joined_at").defaultNow(),
  lastReadAt: timestamp("last_read_at"),
});

// Messages table
export const messages: any = pgTable("messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  chatId: uuid("chat_id").references(() => chats.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").references(() => users.id, { onDelete: "cascade" }),
  content: text("content"),
  messageType: varchar("message_type").default("text"), // text, image, file, voice_note, video_note, video_call, audio_call
  fileUrl: varchar("file_url"),
  fileName: varchar("file_name"),
  duration: integer("duration"), // New: for voice/video notes duration in seconds
  thumbnailUrl: varchar("thumbnail_url"), // New: for video messages/calls
  replyToId: uuid("reply_to_id"),
  editedAt: timestamp("edited_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Message read receipts
export const messageReads = pgTable("message_reads", {
  id: serial("id").primaryKey(),
  messageId: uuid("message_id").references(() => messages.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  readAt: timestamp("read_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  chatsCreated: many(chats),
  chatParticipants: many(chatParticipants),
  messagesSent: many(messages),
  messageReads: many(messageReads),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  creator: one(users, {
    fields: [chats.createdBy],
    references: [users.id],
  }),
  participants: many(chatParticipants),
  messages: many(messages),
}));

export const chatParticipantsRelations = relations(chatParticipants, ({ one }) => ({
  chat: one(chats, {
    fields: [chatParticipants.chatId],
    references: [chats.id],
  }),
  user: one(users, {
    fields: [chatParticipants.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
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
  reads: many(messageReads),
}));

export const messageReadsRelations = relations(messageReads, ({ one }) => ({
  message: one(messages, {
    fields: [messageReads.messageId],
    references: [messages.id],
  }),
  user: one(users, {
    fields: [messageReads.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatSchema = createInsertSchema(chats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertChatParticipantSchema = createInsertSchema(chatParticipants).omit({
  id: true,
  joinedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Chat = typeof chats.$inferSelect;
export type InsertChat = z.infer<typeof insertChatSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type ChatParticipant = typeof chatParticipants.$inferSelect;
export type InsertChatParticipant = z.infer<typeof insertChatParticipantSchema>;
export type MessageRead = typeof messageReads.$inferSelect;

// Extended types for API responses
export type ChatWithParticipants = Chat & {
  participants: (ChatParticipant & { user: User })[];
  lastMessage?: Message & { sender: User };
  unreadCount?: number;
};

export type MessageWithSender = Message & {
  sender: User;
  replyTo?: Message & { sender: User };
  isRead?: boolean;
};
