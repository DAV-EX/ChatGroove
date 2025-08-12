import {
  type User,
  type UserProfile,
  type Chat,
  type InsertChat,
  type Message,
  type InsertMessage,
  type ChatWithParticipants,
  type MessageWithSender,
} from "@shared/schema";
import connectDB from "./db";
import UserModel from "./models/User";
import ChatModel from "./models/Chat";
import MessageModel from "./models/Message";
import mongoose from 'mongoose';

export interface IStorage {
  // User operations
  getUser(id: string): Promise<UserProfile | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: Partial<User>): Promise<UserProfile>;
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
  markMessageAsRead(messageId: string, userId: string): Promise<void>;
  markChatMessagesAsRead(chatId: string, userId: string): Promise<void>;

  // Direct message helper
  getOrCreateDirectChat(userId1: string, userId2: string): Promise<Chat>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    connectDB();
  }

  // User operations
  async getUser(id: string): Promise<UserProfile | undefined> {
    try {
      const user = await UserModel.findById(id).select('-password -emailVerificationToken -resetPasswordToken -resetPasswordExpires');
      return user?.toJSON() as UserProfile;
    } catch (error) {
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const user = await UserModel.findOne({ email: email.toLowerCase() });
      return user?.toObject() as User;
    } catch (error) {
      return undefined;
    }
  }

  async createUser(userData: Partial<User>): Promise<UserProfile> {
    const user = new UserModel(userData);
    await user.save();
    return user.toJSON() as UserProfile;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<UserProfile | undefined> {
    try {
      const user = await UserModel.findByIdAndUpdate(
        id,
        { ...userData, updatedAt: new Date() },
        { new: true }
      ).select('-password -emailVerificationToken -resetPasswordToken -resetPasswordExpires');
      
      return user?.toJSON() as UserProfile;
    } catch (error) {
      return undefined;
    }
  }

  async updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, {
      isOnline,
      lastSeen: new Date(),
      updatedAt: new Date(),
    });
  }

  async searchUsers(query: string, excludeUserId: string): Promise<UserProfile[]> {
    const users = await UserModel.find({
      $and: [
        { _id: { $ne: excludeUserId } },
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { firstName: { $regex: query, $options: 'i' } },
            { lastName: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
    .select('-password -emailVerificationToken -resetPasswordToken -resetPasswordExpires')
    .limit(20);

    return users.map(user => user.toJSON() as UserProfile);
  }

  async verifyUserEmail(userId: string): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, {
      isEmailVerified: true,
      emailVerificationToken: undefined,
      updatedAt: new Date(),
    });
  }

  // Chat operations
  async createChat(chatData: InsertChat): Promise<Chat> {
    const chat = new ChatModel(chatData);
    await chat.save();
    return chat.toObject() as Chat;
  }

  async getUserChats(userId: string): Promise<ChatWithParticipants[]> {
    const chats = await ChatModel.find({
      participants: userId,
      isGlobalRoom: false
    })
    .populate('participants', '-password -emailVerificationToken -resetPasswordToken -resetPasswordExpires')
    .sort({ updatedAt: -1 });

    const chatsWithDetails: ChatWithParticipants[] = [];

    for (const chat of chats) {
      // Get last message
      const lastMessage = await MessageModel.findOne({
        chatId: chat._id
      })
      .populate('senderId', '-password -emailVerificationToken -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 });

      // Get unread count for user
      const unreadCount = await MessageModel.countDocuments({
        chatId: chat._id,
        'readBy.userId': { $ne: userId }
      });

      chatsWithDetails.push({
        ...chat.toObject(),
        participantDetails: (chat as any).participants,
        lastMessage: lastMessage ? {
          ...lastMessage.toObject(),
          sender: (lastMessage as any).senderId
        } : undefined,
        unreadCount
      });
    }

    return chatsWithDetails;
  }

  async getGlobalRooms(userId: string): Promise<ChatWithParticipants[]> {
    const rooms = await ChatModel.find({ 
      isGlobalRoom: true,
      isPublic: true 
    })
    .populate('participants', '-password -emailVerificationToken -resetPasswordToken -resetPasswordExpires')
    .sort({ createdAt: -1 });

    const roomsWithDetails: ChatWithParticipants[] = [];

    for (const room of rooms) {
      // Get last message
      const lastMessage = await MessageModel.findOne({
        chatId: room._id
      })
      .populate('senderId', '-password -emailVerificationToken -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 });

      // Get unread count for user
      const unreadCount = await MessageModel.countDocuments({
        chatId: room._id,
        senderId: { $ne: userId },
        'readBy.userId': { $ne: userId }
      });

      roomsWithDetails.push({
        ...room.toObject(),
        participantDetails: (room as any).participants,
        lastMessage: lastMessage ? {
          ...lastMessage.toObject(),
          sender: (lastMessage as any).senderId
        } : undefined,
        unreadCount
      });
    }

    return roomsWithDetails;
  }

  async getChatById(chatId: string): Promise<ChatWithParticipants | undefined> {
    try {
      const chat = await ChatModel.findById(chatId)
        .populate('participants', '-password -emailVerificationToken -resetPasswordToken -resetPasswordExpires');

      if (!chat) return undefined;

      return {
        ...chat.toObject(),
        participantDetails: (chat as any).participants
      };
    } catch (error) {
      return undefined;
    }
  }

  async addChatParticipant(chatId: string, userId: string): Promise<void> {
    await ChatModel.findByIdAndUpdate(chatId, {
      $addToSet: { participants: userId },
      updatedAt: new Date(),
    });
  }

  async removeChatParticipant(chatId: string, userId: string): Promise<void> {
    await ChatModel.findByIdAndUpdate(chatId, {
      $pull: { participants: userId },
      updatedAt: new Date(),
    });
  }

  // Message operations
  async createMessage(messageData: InsertMessage): Promise<Message> {
    const message = new MessageModel(messageData);
    await message.save();
    
    // Update chat's updatedAt timestamp
    await ChatModel.findByIdAndUpdate(messageData.chatId, {
      updatedAt: new Date()
    });
    
    return message.toObject() as Message;
  }

  async getChatMessages(chatId: string, userId: string, limit = 50): Promise<MessageWithSender[]> {
    const messages = await MessageModel.find({ chatId })
      .populate('senderId', '-password -emailVerificationToken -resetPasswordToken -resetPasswordExpires')
      .populate('replyToId')
      .sort({ createdAt: -1 })
      .limit(limit);

    return messages.reverse().map(message => ({
      ...message.toObject(),
      sender: (message as any).senderId,
      replyTo: (message as any).replyToId ? {
        ...(message as any).replyToId.toObject(),
        sender: (message as any).replyToId.senderId
      } : undefined,
      isRead: message.readBy?.some(read => read.userId === userId) || false
    }));
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    await MessageModel.findByIdAndUpdate(messageId, {
      $addToSet: {
        readBy: {
          userId,
          readAt: new Date()
        }
      }
    });
  }

  async markChatMessagesAsRead(chatId: string, userId: string): Promise<void> {
    await MessageModel.updateMany(
      { 
        chatId,
        'readBy.userId': { $ne: userId }
      },
      {
        $addToSet: {
          readBy: {
            userId,
            readAt: new Date()
          }
        }
      }
    );
  }

  // Direct message helper
  async getOrCreateDirectChat(userId1: string, userId2: string): Promise<Chat> {
    // Find existing direct chat between these users
    const existingChat = await ChatModel.findOne({
      isGroup: false,
      isGlobalRoom: false,
      participants: { $all: [userId1, userId2], $size: 2 }
    });

    if (existingChat) {
      return existingChat.toObject() as Chat;
    }

    // Create new direct chat
    const newChat = await this.createChat({
      isGroup: false,
      isGlobalRoom: false,
      createdBy: userId1,
      participants: [userId1, userId2]
    });

    return newChat;
  }
}

// Use memory storage for now due to MongoDB connection issues
import { MemoryStorage, initializeDefaultRooms } from './memoryStorage';

export const storage = new MemoryStorage();

// Initialize default global rooms
initializeDefaultRooms();
