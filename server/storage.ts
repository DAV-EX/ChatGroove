import {
  users,
  chats,
  messages,
  chatParticipants,
  messageReads,
  type User,
  type UpsertUser,
  type Chat,
  type InsertChat,
  type Message,
  type InsertMessage,
  type ChatParticipant,
  type InsertChatParticipant,
  type ChatWithParticipants,
  type MessageWithSender,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, or, like, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void>;
  searchUsers(query: string, excludeUserId: string): Promise<User[]>;

  // Chat operations
  createChat(chat: InsertChat): Promise<Chat>;
  getUserChats(userId: string): Promise<ChatWithParticipants[]>;
  getChatById(chatId: string): Promise<ChatWithParticipants | undefined>;
  addChatParticipant(participant: InsertChatParticipant): Promise<ChatParticipant>;
  removeChatParticipant(chatId: string, userId: string): Promise<void>;

  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getChatMessages(chatId: string, userId: string, limit?: number): Promise<MessageWithSender[]>;
  markMessageAsRead(messageId: string, userId: string): Promise<void>;
  markChatMessagesAsRead(chatId: string, userId: string): Promise<void>;

  // Direct message helper
  getOrCreateDirectChat(userId1: string, userId2: string): Promise<Chat>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    await db
      .update(users)
      .set({
        isOnline,
        lastSeen: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async searchUsers(query: string, excludeUserId: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(
        and(
          or(
            like(users.firstName, `%${query}%`),
            like(users.lastName, `%${query}%`),
            like(users.username, `%${query}%`),
            like(users.email, `%${query}%`)
          ),
          eq(users.id, excludeUserId) === false
        )
      )
      .limit(20);
  }

  // Chat operations
  async createChat(chat: InsertChat): Promise<Chat> {
    const [newChat] = await db.insert(chats).values(chat).returning();
    return newChat;
  }

  async getUserChats(userId: string): Promise<ChatWithParticipants[]> {
    const userChats = await db
      .select({
        chat: chats,
        participant: chatParticipants,
        user: users,
      })
      .from(chats)
      .innerJoin(chatParticipants, eq(chats.id, chatParticipants.chatId))
      .innerJoin(users, eq(chatParticipants.userId, users.id))
      .where(
        sql`${chats.id} IN (
          SELECT chat_id FROM ${chatParticipants} WHERE user_id = ${userId}
        )`
      )
      .orderBy(desc(chats.updatedAt));

    // Group by chat and get last message + unread count
    const chatMap = new Map<string, ChatWithParticipants>();
    
    for (const row of userChats) {
      if (!chatMap.has(row.chat.id)) {
        chatMap.set(row.chat.id, {
          ...row.chat,
          participants: [],
          unreadCount: 0,
        });
      }
      
      const chat = chatMap.get(row.chat.id)!;
      chat.participants.push({
        ...row.participant,
        user: row.user,
      });
    }

    // Get last messages and unread counts for each chat
    for (const chat of chatMap.values()) {
      // Get last message
      const [lastMessage] = await db
        .select({
          message: messages,
          sender: users,
        })
        .from(messages)
        .innerJoin(users, eq(messages.senderId, users.id))
        .where(eq(messages.chatId, chat.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      if (lastMessage) {
        chat.lastMessage = {
          ...lastMessage.message,
          sender: lastMessage.sender,
        };
      }

      // Get unread count
      const [unreadResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(messages)
        .leftJoin(
          messageReads,
          and(
            eq(messageReads.messageId, messages.id),
            eq(messageReads.userId, userId)
          )
        )
        .where(
          and(
            eq(messages.chatId, chat.id),
            isNull(messageReads.id)
          )
        );

      chat.unreadCount = Number(unreadResult?.count || 0);
    }

    return Array.from(chatMap.values());
  }

  async getChatById(chatId: string): Promise<ChatWithParticipants | undefined> {
    const chatData = await db
      .select({
        chat: chats,
        participant: chatParticipants,
        user: users,
      })
      .from(chats)
      .leftJoin(chatParticipants, eq(chats.id, chatParticipants.chatId))
      .leftJoin(users, eq(chatParticipants.userId, users.id))
      .where(eq(chats.id, chatId));

    if (chatData.length === 0) return undefined;

    const chat = chatData[0].chat;
    const participants = chatData
      .filter(row => row.participant && row.user)
      .map(row => ({
        ...row.participant!,
        user: row.user!,
      }));

    return {
      ...chat,
      participants,
    };
  }

  async addChatParticipant(participant: InsertChatParticipant): Promise<ChatParticipant> {
    const [newParticipant] = await db
      .insert(chatParticipants)
      .values(participant)
      .returning();
    return newParticipant;
  }

  async removeChatParticipant(chatId: string, userId: string): Promise<void> {
    await db
      .delete(chatParticipants)
      .where(
        and(
          eq(chatParticipants.chatId, chatId),
          eq(chatParticipants.userId, userId)
        )
      );
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    
    // Update chat's updatedAt timestamp
    await db
      .update(chats)
      .set({ updatedAt: new Date() })
      .where(eq(chats.id, message.chatId));
    
    return newMessage;
  }

  async getChatMessages(chatId: string, userId: string, limit = 50): Promise<MessageWithSender[]> {
    const chatMessages = await db
      .select({
        message: messages,
        sender: users,
        replyToMessage: sql`NULL`,
        replyToSender: sql`NULL`,
        read: messageReads,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .leftJoin(
        messageReads,
        and(
          eq(messageReads.messageId, messages.id),
          eq(messageReads.userId, userId)
        )
      )
      .where(eq(messages.chatId, chatId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);

    return chatMessages.map(row => ({
      ...row.message,
      sender: row.sender,
      isRead: !!row.read,
    })).reverse();
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    await db
      .insert(messageReads)
      .values({
        messageId,
        userId,
      })
      .onConflictDoNothing();
  }

  async markChatMessagesAsRead(chatId: string, userId: string): Promise<void> {
    // Get all unread messages in the chat
    const unreadMessages = await db
      .select({ id: messages.id })
      .from(messages)
      .leftJoin(
        messageReads,
        and(
          eq(messageReads.messageId, messages.id),
          eq(messageReads.userId, userId)
        )
      )
      .where(
        and(
          eq(messages.chatId, chatId),
          isNull(messageReads.id)
        )
      );

    // Mark them as read
    if (unreadMessages.length > 0) {
      const readRecords = unreadMessages.map(msg => ({
        messageId: msg.id,
        userId,
      }));

      await db.insert(messageReads).values(readRecords).onConflictDoNothing();
    }
  }

  // Direct message helper
  async getOrCreateDirectChat(userId1: string, userId2: string): Promise<Chat> {
    // Find existing direct chat between these users
    const existingChat = await db
      .select({ chat: chats })
      .from(chats)
      .innerJoin(chatParticipants, eq(chats.id, chatParticipants.chatId))
      .where(
        and(
          eq(chats.isGroup, false),
          sql`${chats.id} IN (
            SELECT cp1.chat_id 
            FROM ${chatParticipants} cp1
            INNER JOIN ${chatParticipants} cp2 ON cp1.chat_id = cp2.chat_id
            WHERE cp1.user_id = ${userId1} AND cp2.user_id = ${userId2}
            GROUP BY cp1.chat_id
            HAVING COUNT(*) = 2
          )`
        )
      )
      .limit(1);

    if (existingChat.length > 0) {
      return existingChat[0].chat;
    }

    // Create new direct chat
    const newChat = await this.createChat({
      isGroup: false,
      createdBy: userId1,
    });

    // Add both participants
    await this.addChatParticipant({
      chatId: newChat.id,
      userId: userId1,
    });

    await this.addChatParticipant({
      chatId: newChat.id,
      userId: userId2,
    });

    return newChat;
  }
}

export const storage = new DatabaseStorage();
