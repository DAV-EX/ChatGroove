// Temporary in-memory storage solution
import type { IStorage } from './storage';
import type { UserProfile, Chat, Message, InsertUser, InsertChat, InsertMessage, ChatWithParticipants, MessageWithSender } from '@shared/schema';

// In-memory data stores
const users = new Map<string, UserProfile & { password?: string; emailVerificationToken?: string; resetPasswordToken?: string; resetPasswordExpires?: Date }>();
const chats = new Map<string, Chat>();
const messages = new Map<string, Message>();

// ID generators
let userIdCounter = 1;
let chatIdCounter = 1;
let messageIdCounter = 1;

export class MemoryStorage implements IStorage {
  generateId(type: 'user' | 'chat' | 'message'): string {
    switch (type) {
      case 'user':
        return `user_${userIdCounter++}`;
      case 'chat':
        return `chat_${chatIdCounter++}`;
      case 'message':
        return `message_${messageIdCounter++}`;
    }
  }

  // User operations
  async createUser(userData: any): Promise<UserProfile> {
    const id = this.generateId('user');
    const user = {
      _id: id,
      email: userData.email,
      username: userData.username,
      firstName: userData.firstName,
      lastName: userData.lastName,
      password: userData.password,
      profileImageUrl: userData.profileImageUrl,
      bio: userData.bio,
      phoneNumber: userData.phoneNumber,
      googleId: userData.googleId,
      provider: userData.provider || 'email',
      role: userData.role || 'user',
      emailVerificationToken: userData.emailVerificationToken,
      resetPasswordToken: userData.resetPasswordToken,
      resetPasswordExpires: userData.resetPasswordExpires,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSeen: new Date(),
      isOnline: false,
      status: "Available",
      theme: "light" as const,
      language: "en",
      isEmailVerified: userData.provider === 'google' || userData.isEmailVerified || false,
    };
    
    users.set(id, user);
    
    // Return user without sensitive fields
    const { password, emailVerificationToken, resetPasswordToken, resetPasswordExpires, ...userProfile } = user;
    return userProfile as UserProfile;
  }

  async getUser(id: string): Promise<UserProfile | undefined> {
    const user = users.get(id);
    if (!user) return undefined;
    
    const { password, emailVerificationToken, resetPasswordToken, resetPasswordExpires, ...userProfile } = user;
    return userProfile as UserProfile;
  }

  async getUserByEmail(email: string): Promise<(UserProfile & { password?: string }) | undefined> {
    console.log(`Looking for user with email: ${email}`);
    console.log(`Total users in memory: ${users.size}`);
    const usersArray = Array.from(users.values());
    for (const user of usersArray) {
      console.log(`Checking user: ${user.email}`);
      if (user.email === email) {
        console.log(`Found user: ${user.username}`);
        return user as (UserProfile & { password?: string });
      }
    }
    console.log(`No user found with email: ${email}`);
    return undefined;
  }

  async getUserByUsername(username: string): Promise<UserProfile | undefined> {
    const usersArray = Array.from(users.values());
    for (const user of usersArray) {
      if (user.username === username) {
        const { password, emailVerificationToken, resetPasswordToken, resetPasswordExpires, ...userProfile } = user;
        return userProfile as UserProfile;
      }
    }
    return undefined;
  }

  async getUserWithPassword(email: string): Promise<(UserProfile & { password?: string }) | undefined> {
    const usersArray = Array.from(users.values());
    for (const user of usersArray) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<UserProfile> {
    const user = users.get(id);
    if (!user) throw new Error('User not found');

    const updatedUser = {
      ...user,
      ...updateData,
      updatedAt: new Date(),
    };
    
    users.set(id, updatedUser);
    
    const { password, emailVerificationToken, resetPasswordToken, resetPasswordExpires, ...userProfile } = updatedUser;
    return userProfile as UserProfile;
  }

  async updateUserOnlineStatus(id: string, isOnline: boolean): Promise<void> {
    const user = users.get(id);
    if (user) {
      user.isOnline = isOnline;
      user.lastSeen = new Date();
      users.set(id, user);
    }
  }

  async searchUsers(query: string, currentUserId: string): Promise<UserProfile[]> {
    const results: UserProfile[] = [];
    const usersArray = Array.from(users.values());
    
    for (const user of usersArray) {
      if (user._id === currentUserId) continue;
      
      const searchText = `${user.username} ${user.firstName} ${user.lastName} ${user.email}`.toLowerCase();
      if (searchText.includes(query.toLowerCase())) {
        const { password, emailVerificationToken, resetPasswordToken, resetPasswordExpires, ...userProfile } = user;
        results.push(userProfile as UserProfile);
      }
    }
    
    return results.slice(0, 20); // Limit results
  }

  // Chat operations
  async createChat(chatData: InsertChat): Promise<Chat> {
    const id = this.generateId('chat');
    const chat = {
      _id: id,
      ...chatData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    chats.set(id, chat);
    return chat;
  }

  async getChat(id: string): Promise<Chat | undefined> {
    return chats.get(id);
  }

  async getChatWithParticipants(id: string): Promise<ChatWithParticipants | undefined> {
    const chat = chats.get(id);
    if (!chat) return undefined;
    
    const participantDetails: UserProfile[] = [];
    for (const participantId of chat.participants) {
      const user = await this.getUser(participantId);
      if (user) participantDetails.push(user);
    }
    
    // Get last message
    let lastMessage: MessageWithSender | undefined;
    const messagesArray = Array.from(messages.values());
    for (const message of messagesArray) {
      if (message.chatId === id) {
        if (!lastMessage || message.createdAt > lastMessage.createdAt) {
          const sender = await this.getUser(message.senderId);
          if (sender) {
            lastMessage = { ...message, sender };
          }
        }
      }
    }
    
    return {
      ...chat,
      participantDetails,
      lastMessage,
      unreadCount: 0, // TODO: Calculate unread count
    };
  }

  async getUserChats(userId: string): Promise<ChatWithParticipants[]> {
    const userChats: ChatWithParticipants[] = [];
    const chatsArray = Array.from(chats.values());
    
    for (const chat of chatsArray) {
      if (chat.participants.includes(userId)) {
        const chatWithParticipants = await this.getChatWithParticipants(chat._id!);
        if (chatWithParticipants) {
          userChats.push(chatWithParticipants);
        }
      }
    }
    
    return userChats.sort((a, b) => 
      (b.lastMessage?.createdAt || b.updatedAt).getTime() - (a.lastMessage?.createdAt || a.updatedAt).getTime()
    );
  }

  async getGlobalRoomsInternal(): Promise<ChatWithParticipants[]> {
    const globalRooms: ChatWithParticipants[] = [];
    const chatsArray = Array.from(chats.values());
    
    for (const chat of chatsArray) {
      if (chat.isGlobalRoom && chat.isPublic) {
        const chatWithParticipants = await this.getChatWithParticipants(chat._id!);
        if (chatWithParticipants) {
          globalRooms.push(chatWithParticipants);
        }
      }
    }
    
    return globalRooms;
  }

  async joinChat(chatId: string, userId: string): Promise<void> {
    const chat = chats.get(chatId);
    if (chat && !chat.participants.includes(userId)) {
      chat.participants.push(userId);
      chat.updatedAt = new Date();
      chats.set(chatId, chat);
    }
  }

  async leaveChat(chatId: string, userId: string): Promise<void> {
    const chat = chats.get(chatId);
    if (chat) {
      chat.participants = chat.participants.filter(id => id !== userId);
      chat.updatedAt = new Date();
      chats.set(chatId, chat);
    }
  }

  // Message operations
  async createMessage(messageData: InsertMessage): Promise<Message> {
    const id = this.generateId('message');
    const message = {
      _id: id,
      ...messageData,
      readBy: [],
      createdAt: new Date(),
    };
    
    messages.set(id, message);
    return message;
  }

  async getChatMessages(chatId: string, userId: string, limit = 50, before?: string): Promise<MessageWithSender[]> {
    const chatMessages: MessageWithSender[] = [];
    const messagesArray = Array.from(messages.values());
    
    for (const message of messagesArray) {
      if (message.chatId === chatId) {
        const sender = await this.getUser(message.senderId);
        if (sender) {
          let replyTo: MessageWithSender | undefined;
          if (message.replyToId) {
            const replyMessage = messages.get(message.replyToId);
            if (replyMessage) {
              const replySender = await this.getUser(replyMessage.senderId);
              if (replySender) {
                replyTo = { ...replyMessage, sender: replySender };
              }
            }
          }
          
          chatMessages.push({
            ...message,
            sender,
            replyTo,
            isRead: false, // TODO: Calculate if read by current user
          });
        }
      }
    }
    
    // Sort by creation time (newest first)
    chatMessages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // Apply before filter if provided
    if (before) {
      const beforeIndex = chatMessages.findIndex(m => m._id === before);
      if (beforeIndex > 0) {
        return chatMessages.slice(beforeIndex).slice(0, limit);
      }
    }
    
    return chatMessages.slice(0, limit);
  }

  async markMessagesAsRead(chatId: string, userId: string, messageIds: string[]): Promise<void> {
    for (const messageId of messageIds) {
      const message = messages.get(messageId);
      if (message && message.chatId === chatId) {
        const existingRead = message.readBy.find(r => r.userId === userId);
        if (!existingRead) {
          message.readBy.push({
            userId,
            readAt: new Date(),
          });
          messages.set(messageId, message);
        }
      }
    }
  }

  // Additional interface methods
  async verifyUserEmail(userId: string): Promise<void> {
    const user = users.get(userId);
    if (user) {
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      users.set(userId, user);
    }
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    const message = messages.get(messageId);
    if (message) {
      const existingRead = message.readBy.find(r => r.userId === userId);
      if (!existingRead) {
        message.readBy.push({
          userId,
          readAt: new Date(),
        });
        messages.set(messageId, message);
      }
    }
  }

  async markChatMessagesAsRead(chatId: string, userId: string): Promise<void> {
    const messagesArray = Array.from(messages.values());
    for (const message of messagesArray) {
      if (message.chatId === chatId) {
        const existingRead = message.readBy.find(r => r.userId === userId);
        if (!existingRead) {
          message.readBy.push({
            userId,
            readAt: new Date(),
          });
          messages.set(message._id!, message);
        }
      }
    }
  }

  async getOrCreateDirectChat(userId1: string, userId2: string): Promise<Chat> {
    // Find existing direct chat between these users
    const chatsArray = Array.from(chats.values());
    const existingChat = chatsArray.find(chat => 
      !chat.isGroup && 
      !chat.isGlobalRoom && 
      chat.participants.length === 2 &&
      chat.participants.includes(userId1) && 
      chat.participants.includes(userId2)
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

  // Map interface methods to implementation
  async getChatById(chatId: string): Promise<ChatWithParticipants | undefined> {
    return this.getChatWithParticipants(chatId);
  }

  async addChatParticipant(chatId: string, userId: string): Promise<void> {
    return this.joinChat(chatId, userId);
  }

  async removeChatParticipant(chatId: string, userId: string): Promise<void> {
    return this.leaveChat(chatId, userId);
  }

  async getGlobalRooms(userId: string): Promise<ChatWithParticipants[]> {
    return this.getGlobalRoomsInternal();
  }

  // Admin operations
  async getAllUsers(limit = 50, skip = 0): Promise<UserProfile[]> {
    const usersArray = Array.from(users.values());
    return usersArray
      .slice(skip, skip + limit)
      .map(user => {
        const { password, emailVerificationToken, resetPasswordToken, resetPasswordExpires, ...userProfile } = user;
        return userProfile as UserProfile;
      });
  }

  async getAllChats(limit = 50, skip = 0): Promise<ChatWithParticipants[]> {
    const chatsArray = Array.from(chats.values());
    const result: ChatWithParticipants[] = [];
    
    for (const chat of chatsArray.slice(skip, skip + limit)) {
      const chatWithParticipants = await this.getChatWithParticipants(chat._id!);
      if (chatWithParticipants) {
        result.push(chatWithParticipants);
      }
    }
    
    return result;
  }

  async getAllMessages(limit = 100, skip = 0): Promise<MessageWithSender[]> {
    const messagesArray = Array.from(messages.values());
    const result: MessageWithSender[] = [];
    
    for (const message of messagesArray.slice(skip, skip + limit)) {
      const sender = await this.getUser(message.senderId);
      if (sender) {
        result.push({
          ...message,
          sender,
          isRead: false
        });
      }
    }
    
    return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getUserStats(): Promise<{ totalUsers: number; onlineUsers: number; totalChats: number; totalMessages: number }> {
    const usersArray = Array.from(users.values());
    return {
      totalUsers: usersArray.length,
      onlineUsers: usersArray.filter(user => user.isOnline).length,
      totalChats: chats.size,
      totalMessages: messages.size
    };
  }

  async deleteUser(userId: string): Promise<void> {
    // Remove user from all chats
    for (const chat of chats.values()) {
      chat.participants = chat.participants.filter(id => id !== userId);
    }
    
    // Delete user's messages
    for (const [messageId, message] of messages.entries()) {
      if (message.senderId === userId) {
        messages.delete(messageId);
      }
    }
    
    // Delete user
    users.delete(userId);
  }

  async deleteChat(chatId: string): Promise<void> {
    // Delete all messages in the chat
    for (const [messageId, message] of messages.entries()) {
      if (message.chatId === chatId) {
        messages.delete(messageId);
      }
    }
    
    // Delete the chat
    chats.delete(chatId);
  }

  async deleteMessage(messageId: string): Promise<void> {
    messages.delete(messageId);
  }

  async updateUserRole(userId: string, role: 'user' | 'admin' | 'moderator'): Promise<UserProfile | undefined> {
    const user = users.get(userId);
    if (user) {
      user.role = role;
      users.set(userId, user);
      
      const { password, emailVerificationToken, resetPasswordToken, resetPasswordExpires, ...userProfile } = user;
      return userProfile as UserProfile;
    }
    return undefined;
  }
}

// Create a default set of global rooms and test admin user
export function initializeDefaultRooms(): void {
  // Create a test admin user directly in the global users map
  const adminId = `user_${userIdCounter++}`;
  const adminUser = {
    _id: adminId,
    email: 'admin@chatgroove.com',
    username: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    password: '$2b$12$6qqYSnxm7dFDiLLWqgUaCOE.LJlbypGewLTlgftGxO5N7j3JjVnQe', // password: admin123
    role: 'admin' as const,
    provider: 'email' as const,
    isEmailVerified: true,
    bio: 'System Administrator',
    phoneNumber: undefined,
    profileImageUrl: undefined,
    googleId: undefined,
    emailVerificationToken: undefined,
    resetPasswordToken: undefined,
    resetPasswordExpires: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSeen: new Date(),
    isOnline: false,
    status: "Available",
    theme: "light" as const,
    language: "en",
  };
  
  users.set(adminId, adminUser);
  console.log('✓ Created admin user: admin@chatgroove.com / admin123');
  const defaultRooms = [
    {
      name: "💬 General Chat",
      description: "Welcome to ChatGroove! Introduce yourself and chat with everyone.",
      isGroup: true,
      isGlobalRoom: true,
      category: "general",
      maxMembers: 1000,
      isPublic: true,
      createdBy: "system",
      participants: [],
    },
    {
      name: "🎮 Gaming",
      description: "Discuss your favorite games and find gaming buddies.",
      isGroup: true,
      isGlobalRoom: true,
      category: "gaming",
      maxMembers: 500,
      isPublic: true,
      createdBy: "system",
      participants: [],
    },
    {
      name: "📚 Books & Literature",
      description: "Share book recommendations and discuss your latest reads.",
      isGroup: true,
      isGlobalRoom: true,
      category: "books",
      maxMembers: 300,
      isPublic: true,
      createdBy: "system",
      participants: [],
    },
    {
      name: "🎵 Music",
      description: "Share your favorite songs and discover new music.",
      isGroup: true,
      isGlobalRoom: true,
      category: "music",
      maxMembers: 500,
      isPublic: true,
      createdBy: "system",
      participants: [],
    },
    {
      name: "💻 Tech Talk",
      description: "Discuss the latest in technology and programming.",
      isGroup: true,
      isGlobalRoom: true,
      category: "technology",
      maxMembers: 400,
      isPublic: true,
      createdBy: "system",
      participants: [],
    },
  ];

  // Create rooms directly in the global chats map
  defaultRooms.forEach((room) => {
    const roomId = `chat_${chatIdCounter++}`;
    const chatRoom = {
      _id: roomId,
      ...room,
      participants: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    chats.set(roomId, chatRoom);
  });
  
  console.log(`✓ Created ${defaultRooms.length} default global rooms`);
}