import {
  type User,
  type UserProfile,
  type Chat,
  type InsertChat,
  type Message,
  type InsertMessage,
  type ChatWithParticipants,
  type MessageWithSender,
  users,
  chats,
  messages,
} from "@shared/schema";
import { db, testConnection } from "./db";
import { eq, and, sql, desc, asc, like, ne, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<UserProfile | undefined>;
  getUserByEmail(email: string): Promise<(UserProfile & { password?: string }) | undefined>;
  createUser(userData: any): Promise<UserProfile>;
  updateUser(id: string, userData: Partial<User>): Promise<UserProfile | undefined>;
  updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void>;
  searchUsers(query: string, excludeUserId: string): Promise<UserProfile[]>;
  verifyUserEmail(userId: string): Promise<void>;

  // Chat operations
  createChat(chat: InsertChat): Promise<Chat>;
  getUserChats(userId: string): Promise<ChatWithParticipants[]>;
  getGlobalRooms(userId: string): Promise<ChatWithParticipants[]>;
  getChatById(chatId: string): Promise<ChatWithParticipants | undefined>;
  addChatParticipant(chatId: string, userId: string): Promise<void>;
  removeChatParticipant(chatId: string, userId: string): Promise<void>;

  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getChatMessages(chatId: string, userId: string, limit?: number): Promise<MessageWithSender[]>;
  getMessageById(messageId: string): Promise<Message | undefined>;
  updateMessage(messageId: string, updates: Partial<Message>): Promise<Message | undefined>;
  markMessageAsRead(messageId: string, userId: string): Promise<void>;
  markChatMessagesAsRead(chatId: string, userId: string): Promise<void>;

  // Direct message helper
  getOrCreateDirectChat(userId1: string, userId2: string): Promise<Chat>;
  
  // Admin operations
  getAllUsers(limit?: number, skip?: number): Promise<UserProfile[]>;
  getAllChats(limit?: number, skip?: number): Promise<ChatWithParticipants[]>;
  getAllMessages(limit?: number, skip?: number): Promise<MessageWithSender[]>;
  getUserStats(): Promise<{ totalUsers: number; onlineUsers: number; totalChats: number; totalMessages: number }>;
  deleteUser(userId: string): Promise<void>;
  deleteChat(chatId: string): Promise<void>;
  deleteMessage(messageId: string): Promise<void>;
  updateUserRole(userId: string, role: 'user' | 'admin' | 'moderator'): Promise<UserProfile | undefined>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeConnection();
  }

  private async initializeConnection() {
    const connected = await testConnection();
    if (connected) {
      console.log('✓ Using PostgreSQL database storage');
    } else {
      console.error('✗ Failed to connect to PostgreSQL database');
    }
  }

  // User operations
  async getUser(id: string): Promise<UserProfile | undefined> {
    try {
      const [user] = await db.select({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        bio: users.bio,
        phoneNumber: users.phoneNumber,
        isOnline: users.isOnline,
        lastSeen: users.lastSeen,
        status: users.status,
        theme: users.theme,
        language: users.language,
        isRestricted: users.isRestricted,
        isBanned: users.isBanned,
        restrictionReason: users.restrictionReason,
        banReason: users.banReason,
        restrictedAt: users.restrictedAt,
        bannedAt: users.bannedAt,
        isEmailVerified: users.isEmailVerified,
        googleId: users.googleId,
        provider: users.provider,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id));
      
      return user || undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()));
      
      return user || undefined;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async createUser(userData: Partial<User>): Promise<UserProfile> {
    const [user] = await db.insert(users)
      .values({
        ...userData,
        email: userData.email?.toLowerCase(),
      })
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        bio: users.bio,
        phoneNumber: users.phoneNumber,
        isOnline: users.isOnline,
        lastSeen: users.lastSeen,
        status: users.status,
        theme: users.theme,
        language: users.language,
        isRestricted: users.isRestricted,
        isBanned: users.isBanned,
        restrictionReason: users.restrictionReason,
        banReason: users.banReason,
        restrictedAt: users.restrictedAt,
        bannedAt: users.bannedAt,
        isEmailVerified: users.isEmailVerified,
        googleId: users.googleId,
        provider: users.provider,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });
    
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<UserProfile | undefined> {
    try {
      const [user] = await db.update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          email: users.email,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          bio: users.bio,
          phoneNumber: users.phoneNumber,
          isOnline: users.isOnline,
          lastSeen: users.lastSeen,
          status: users.status,
          theme: users.theme,
          language: users.language,
          isRestricted: users.isRestricted,
          isBanned: users.isBanned,
          restrictionReason: users.restrictionReason,
          banReason: users.banReason,
          restrictedAt: users.restrictedAt,
          bannedAt: users.bannedAt,
          isEmailVerified: users.isEmailVerified,
          googleId: users.googleId,
          provider: users.provider,
          role: users.role,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        });
      
      return user || undefined;
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  async updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    await db.update(users)
      .set({
        isOnline,
        lastSeen: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async searchUsers(query: string, excludeUserId: string): Promise<UserProfile[]> {
    const searchPattern = `%${query}%`;
    
    const foundUsers = await db.select({
      id: users.id,
      email: users.email,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
      bio: users.bio,
      phoneNumber: users.phoneNumber,
      isOnline: users.isOnline,
      lastSeen: users.lastSeen,
      status: users.status,
      theme: users.theme,
      language: users.language,
      isRestricted: users.isRestricted,
      isBanned: users.isBanned,
      restrictionReason: users.restrictionReason,
      banReason: users.banReason,
      restrictedAt: users.restrictedAt,
      bannedAt: users.bannedAt,
      isEmailVerified: users.isEmailVerified,
      googleId: users.googleId,
      provider: users.provider,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(
      and(
        ne(users.id, excludeUserId),
        sql`(
          ${users.username} ILIKE ${searchPattern} OR
          ${users.firstName} ILIKE ${searchPattern} OR
          ${users.lastName} ILIKE ${searchPattern} OR
          ${users.email} ILIKE ${searchPattern}
        )`
      )
    )
    .limit(20);

    return foundUsers;
  }

  async verifyUserEmail(userId: string): Promise<void> {
    await db.update(users)
      .set({
        isEmailVerified: true,
        emailVerificationToken: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // Chat operations
  async createChat(chatData: InsertChat): Promise<Chat> {
    const [chat] = await db.insert(chats)
      .values(chatData)
      .returning();
    
    return chat;
  }

  async getUserChats(userId: string): Promise<ChatWithParticipants[]> {
    const userChats = await db.select()
      .from(chats)
      .where(
        and(
          sql`${userId} = ANY(${chats.participants})`,
          eq(chats.isGlobalRoom, false)
        )
      )
      .orderBy(desc(chats.updatedAt));

    const chatsWithDetails: ChatWithParticipants[] = [];

    for (const chat of userChats) {
      // Get participant details
      const participantDetails = await db.select({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        bio: users.bio,
        phoneNumber: users.phoneNumber,
        isOnline: users.isOnline,
        lastSeen: users.lastSeen,
        status: users.status,
        theme: users.theme,
        language: users.language,
        isRestricted: users.isRestricted,
        isBanned: users.isBanned,
        restrictionReason: users.restrictionReason,
        banReason: users.banReason,
        restrictedAt: users.restrictedAt,
        bannedAt: users.bannedAt,
        isEmailVerified: users.isEmailVerified,
        googleId: users.googleId,
        provider: users.provider,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(inArray(users.id, chat.participants || []));

      // Get last message
      const [lastMessageData] = await db.select({
        id: messages.id,
        chatId: messages.chatId,
        senderId: messages.senderId,
        content: messages.content,
        messageType: messages.messageType,
        fileUrl: messages.fileUrl,
        fileName: messages.fileName,
        duration: messages.duration,
        thumbnailUrl: messages.thumbnailUrl,
        replyToId: messages.replyToId,
        readBy: messages.readBy,
        editedAt: messages.editedAt,
        createdAt: messages.createdAt,
        senderUsername: users.username,
        senderFirstName: users.firstName,
        senderLastName: users.lastName,
        senderProfileImageUrl: users.profileImageUrl,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.chatId, chat.id))
      .orderBy(desc(messages.createdAt))
      .limit(1);

      let lastMessage = undefined;
      if (lastMessageData) {
        lastMessage = {
          id: lastMessageData.id,
          chatId: lastMessageData.chatId,
          senderId: lastMessageData.senderId,
          content: lastMessageData.content,
          messageType: lastMessageData.messageType,
          fileUrl: lastMessageData.fileUrl,
          fileName: lastMessageData.fileName,
          duration: lastMessageData.duration,
          thumbnailUrl: lastMessageData.thumbnailUrl,
          replyToId: lastMessageData.replyToId,
          readBy: lastMessageData.readBy,
          editedAt: lastMessageData.editedAt,
          createdAt: lastMessageData.createdAt,
          sender: {
            id: lastMessageData.senderId,
            username: lastMessageData.senderUsername,
            firstName: lastMessageData.senderFirstName,
            lastName: lastMessageData.senderLastName,
            profileImageUrl: lastMessageData.senderProfileImageUrl,
          }
        };
      }

      // Count unread messages
      const [unreadResult] = await db.select({
        count: sql<number>`count(*)`
      })
      .from(messages)
      .where(
        and(
          eq(messages.chatId, chat.id),
          sql`NOT (${userId} = ANY(SELECT jsonb_array_elements_text(${messages.readBy} -> 'userId')))`
        )
      );

      chatsWithDetails.push({
        ...chat,
        participantDetails,
        lastMessage,
        unreadCount: unreadResult?.count || 0,
      });
    }

    return chatsWithDetails;
  }

  async getGlobalRooms(userId: string): Promise<ChatWithParticipants[]> {
    const rooms = await db.select()
      .from(chats)
      .where(
        and(
          eq(chats.isGlobalRoom, true),
          eq(chats.isPublic, true)
        )
      )
      .orderBy(desc(chats.createdAt));

    const roomsWithDetails: ChatWithParticipants[] = [];

    for (const room of rooms) {
      // Get participant details
      const participantDetails = await db.select({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        bio: users.bio,
        phoneNumber: users.phoneNumber,
        isOnline: users.isOnline,
        lastSeen: users.lastSeen,
        status: users.status,
        theme: users.theme,
        language: users.language,
        isRestricted: users.isRestricted,
        isBanned: users.isBanned,
        restrictionReason: users.restrictionReason,
        banReason: users.banReason,
        restrictedAt: users.restrictedAt,
        bannedAt: users.bannedAt,
        isEmailVerified: users.isEmailVerified,
        googleId: users.googleId,
        provider: users.provider,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(inArray(users.id, room.participants || []));

      roomsWithDetails.push({
        ...room,
        participantDetails,
        unreadCount: 0, // Global rooms don't track individual unread counts
      });
    }

    return roomsWithDetails;
  }

  async getChatById(chatId: string): Promise<ChatWithParticipants | undefined> {
    try {
      const [chat] = await db.select()
        .from(chats)
        .where(eq(chats.id, chatId));

      if (!chat) return undefined;

      // Get participant details
      const participantDetails = await db.select({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        bio: users.bio,
        phoneNumber: users.phoneNumber,
        isOnline: users.isOnline,
        lastSeen: users.lastSeen,
        status: users.status,
        theme: users.theme,
        language: users.language,
        isRestricted: users.isRestricted,
        isBanned: users.isBanned,
        restrictionReason: users.restrictionReason,
        banReason: users.banReason,
        restrictedAt: users.restrictedAt,
        bannedAt: users.bannedAt,
        isEmailVerified: users.isEmailVerified,
        googleId: users.googleId,
        provider: users.provider,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(inArray(users.id, chat.participants || []));

      return {
        ...chat,
        participantDetails,
      };
    } catch (error) {
      console.error('Error getting chat by ID:', error);
      return undefined;
    }
  }

  async addChatParticipant(chatId: string, userId: string): Promise<void> {
    const [chat] = await db.select()
      .from(chats)
      .where(eq(chats.id, chatId));

    if (chat && !chat.participants?.includes(userId)) {
      const updatedParticipants = [...(chat.participants || []), userId];
      await db.update(chats)
        .set({
          participants: updatedParticipants,
          updatedAt: new Date(),
        })
        .where(eq(chats.id, chatId));
    }
  }

  async removeChatParticipant(chatId: string, userId: string): Promise<void> {
    const [chat] = await db.select()
      .from(chats)
      .where(eq(chats.id, chatId));

    if (chat && chat.participants?.includes(userId)) {
      const updatedParticipants = chat.participants.filter(id => id !== userId);
      await db.update(chats)
        .set({
          participants: updatedParticipants,
          updatedAt: new Date(),
        })
        .where(eq(chats.id, chatId));
    }
  }

  // Message operations
  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages)
      .values(messageData)
      .returning();
    
    // Update chat's updatedAt timestamp
    await db.update(chats)
      .set({ updatedAt: new Date() })
      .where(eq(chats.id, messageData.chatId));
    
    return message;
  }

  async getChatMessages(chatId: string, userId: string, limit = 50): Promise<MessageWithSender[]> {
    const chatMessages = await db.select({
      id: messages.id,
      chatId: messages.chatId,
      senderId: messages.senderId,
      content: messages.content,
      messageType: messages.messageType,
      fileUrl: messages.fileUrl,
      fileName: messages.fileName,
      duration: messages.duration,
      thumbnailUrl: messages.thumbnailUrl,
      replyToId: messages.replyToId,
      readBy: messages.readBy,
      editedAt: messages.editedAt,
      createdAt: messages.createdAt,
      senderUsername: users.username,
      senderFirstName: users.firstName,
      senderLastName: users.lastName,
      senderProfileImageUrl: users.profileImageUrl,
      senderEmail: users.email,
    })
    .from(messages)
    .innerJoin(users, eq(messages.senderId, users.id))
    .where(eq(messages.chatId, chatId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);

    return chatMessages.reverse().map(msg => ({
      id: msg.id,
      chatId: msg.chatId,
      senderId: msg.senderId,
      content: msg.content,
      messageType: msg.messageType,
      fileUrl: msg.fileUrl,
      fileName: msg.fileName,
      duration: msg.duration,
      thumbnailUrl: msg.thumbnailUrl,
      replyToId: msg.replyToId,
      readBy: msg.readBy,
      editedAt: msg.editedAt,
      createdAt: msg.createdAt,
      sender: {
        id: msg.senderId,
        email: msg.senderEmail,
        username: msg.senderUsername,
        firstName: msg.senderFirstName,
        lastName: msg.senderLastName,
        profileImageUrl: msg.senderProfileImageUrl,
      },
      isRead: Array.isArray(msg.readBy) 
        ? msg.readBy.some((read: any) => read.userId === userId) 
        : false,
    }));
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    const [message] = await db.select()
      .from(messages)
      .where(eq(messages.id, messageId));

    if (message) {
      const readBy = Array.isArray(message.readBy) ? message.readBy : [];
      const hasRead = readBy.some((read: any) => read.userId === userId);
      
      if (!hasRead) {
        const updatedReadBy = [...readBy, { userId, readAt: new Date() }];
        await db.update(messages)
          .set({ readBy: updatedReadBy })
          .where(eq(messages.id, messageId));
      }
    }
  }

  async markChatMessagesAsRead(chatId: string, userId: string): Promise<void> {
    // This would be complex in SQL, so we'll handle it differently
    // For now, we'll mark messages as read one by one
    const chatMessages = await db.select({ id: messages.id, readBy: messages.readBy })
      .from(messages)
      .where(eq(messages.chatId, chatId));

    for (const message of chatMessages) {
      const readBy = Array.isArray(message.readBy) ? message.readBy : [];
      const hasRead = readBy.some((read: any) => read.userId === userId);
      
      if (!hasRead) {
        const updatedReadBy = [...readBy, { userId, readAt: new Date() }];
        await db.update(messages)
          .set({ readBy: updatedReadBy })
          .where(eq(messages.id, message.id));
      }
    }
  }

  async getMessageById(messageId: string): Promise<Message | undefined> {
    try {
      const [message] = await db.select()
        .from(messages)
        .where(eq(messages.id, messageId));
      
      return message || undefined;
    } catch (error) {
      console.error('Error getting message by ID:', error);
      return undefined;
    }
  }

  async updateMessage(messageId: string, updates: Partial<Message>): Promise<Message | undefined> {
    try {
      const [message] = await db.update(messages)
        .set(updates)
        .where(eq(messages.id, messageId))
        .returning();
      
      return message || undefined;
    } catch (error) {
      console.error('Error updating message:', error);
      return undefined;
    }
  }

  // Direct message helper
  async getOrCreateDirectChat(userId1: string, userId2: string): Promise<Chat> {
    // Find existing direct chat between these users
    const [existingChat] = await db.select()
      .from(chats)
      .where(
        and(
          eq(chats.isGroup, false),
          eq(chats.isGlobalRoom, false),
          sql`${chats.participants} @> ${JSON.stringify([userId1, userId2])} AND jsonb_array_length(${chats.participants}) = 2`
        )
      );

    if (existingChat) {
      return existingChat;
    }

    // Create new direct chat
    const newChat = await this.createChat({
      isGroup: false,
      isGlobalRoom: false,
      maxMembers: 2,
      isPublic: false,
      createdBy: userId1,
      participants: [userId1, userId2]
    });

    return newChat;
  }

  // Admin operations
  async getAllUsers(limit = 50, skip = 0): Promise<UserProfile[]> {
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
      bio: users.bio,
      phoneNumber: users.phoneNumber,
      isOnline: users.isOnline,
      lastSeen: users.lastSeen,
      status: users.status,
      theme: users.theme,
      language: users.language,
      isRestricted: users.isRestricted,
      isBanned: users.isBanned,
      restrictionReason: users.restrictionReason,
      banReason: users.banReason,
      restrictedAt: users.restrictedAt,
      bannedAt: users.bannedAt,
      isEmailVerified: users.isEmailVerified,
      googleId: users.googleId,
      provider: users.provider,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(skip);
    
    return allUsers;
  }

  async getAllChats(limit = 50, skip = 0): Promise<ChatWithParticipants[]> {
    const allChats = await db.select()
      .from(chats)
      .orderBy(desc(chats.createdAt))
      .limit(limit)
      .offset(skip);

    const chatsWithDetails: ChatWithParticipants[] = [];

    for (const chat of allChats) {
      const participantDetails = await db.select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
      })
      .from(users)
      .where(inArray(users.id, chat.participants || []));

      chatsWithDetails.push({
        ...chat,
        participantDetails,
      });
    }

    return chatsWithDetails;
  }

  async getAllMessages(limit = 100, skip = 0): Promise<MessageWithSender[]> {
    const allMessages = await db.select({
      id: messages.id,
      chatId: messages.chatId,
      senderId: messages.senderId,
      content: messages.content,
      messageType: messages.messageType,
      fileUrl: messages.fileUrl,
      fileName: messages.fileName,
      duration: messages.duration,
      thumbnailUrl: messages.thumbnailUrl,
      replyToId: messages.replyToId,
      readBy: messages.readBy,
      editedAt: messages.editedAt,
      createdAt: messages.createdAt,
      senderUsername: users.username,
      senderFirstName: users.firstName,
      senderLastName: users.lastName,
      senderProfileImageUrl: users.profileImageUrl,
      chatName: chats.name,
      chatIsGroup: chats.isGroup,
      chatIsGlobalRoom: chats.isGlobalRoom,
    })
    .from(messages)
    .innerJoin(users, eq(messages.senderId, users.id))
    .innerJoin(chats, eq(messages.chatId, chats.id))
    .orderBy(desc(messages.createdAt))
    .limit(limit)
    .offset(skip);

    return allMessages.map(msg => ({
      id: msg.id,
      chatId: msg.chatId,
      senderId: msg.senderId,
      content: msg.content,
      messageType: msg.messageType,
      fileUrl: msg.fileUrl,
      fileName: msg.fileName,
      duration: msg.duration,
      thumbnailUrl: msg.thumbnailUrl,
      replyToId: msg.replyToId,
      readBy: msg.readBy,
      editedAt: msg.editedAt,
      createdAt: msg.createdAt,
      sender: {
        id: msg.senderId,
        username: msg.senderUsername,
        firstName: msg.senderFirstName,
        lastName: msg.senderLastName,
        profileImageUrl: msg.senderProfileImageUrl,
      },
      chat: {
        id: msg.chatId,
        name: msg.chatName,
        isGroup: msg.chatIsGroup,
        isGlobalRoom: msg.chatIsGlobalRoom,
      }
    }));
  }

  async getUserStats(): Promise<{ totalUsers: number; onlineUsers: number; totalChats: number; totalMessages: number }> {
    const [totalUsersResult] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [onlineUsersResult] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.isOnline, true));
    const [totalChatsResult] = await db.select({ count: sql<number>`count(*)` }).from(chats);
    const [totalMessagesResult] = await db.select({ count: sql<number>`count(*)` }).from(messages);

    return {
      totalUsers: totalUsersResult?.count || 0,
      onlineUsers: onlineUsersResult?.count || 0,
      totalChats: totalChatsResult?.count || 0,
      totalMessages: totalMessagesResult?.count || 0,
    };
  }

  async deleteUser(userId: string): Promise<void> {
    // Delete user's messages
    await db.delete(messages).where(eq(messages.senderId, userId));
    
    // Remove user from chat participants
    const userChats = await db.select().from(chats).where(sql`${userId} = ANY(${chats.participants})`);
    for (const chat of userChats) {
      const updatedParticipants = (chat.participants || []).filter(id => id !== userId);
      await db.update(chats)
        .set({ participants: updatedParticipants })
        .where(eq(chats.id, chat.id));
    }
    
    // Delete user
    await db.delete(users).where(eq(users.id, userId));
  }

  async deleteChat(chatId: string): Promise<void> {
    // Delete all messages in the chat
    await db.delete(messages).where(eq(messages.chatId, chatId));
    
    // Delete the chat
    await db.delete(chats).where(eq(chats.id, chatId));
  }

  async deleteMessage(messageId: string): Promise<void> {
    await db.delete(messages).where(eq(messages.id, messageId));
  }

  async updateUserRole(userId: string, role: 'user' | 'admin' | 'moderator'): Promise<UserProfile | undefined> {
    const [user] = await db.update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        bio: users.bio,
        phoneNumber: users.phoneNumber,
        isOnline: users.isOnline,
        lastSeen: users.lastSeen,
        status: users.status,
        theme: users.theme,
        language: users.language,
        isRestricted: users.isRestricted,
        isBanned: users.isBanned,
        restrictionReason: users.restrictionReason,
        banReason: users.banReason,
        restrictedAt: users.restrictedAt,
        bannedAt: users.bannedAt,
        isEmailVerified: users.isEmailVerified,
        googleId: users.googleId,
        provider: users.provider,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });
    
    return user || undefined;
  }
}

// Initialize database storage
export const storage = new DatabaseStorage();

console.log('✓ Using PostgreSQL database storage');