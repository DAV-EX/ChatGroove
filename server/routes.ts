import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  register, 
  login, 
  googleAuth, 
  verifyEmail, 
  forgotPassword, 
  getMe, 
  logout,
  authenticateToken,
  authenticateAdmin,
  type AuthenticatedRequest 
} from "./auth";
import { insertMessageSchema, insertChatSchema } from "@shared/schema";

export function registerRoutes(app: Express): Server {
  // Auth routes (public)
  app.post('/api/auth/register', register);
  app.post('/api/auth/login', login);
  app.post('/api/auth/google', googleAuth);
  app.post('/api/auth/verify-email', verifyEmail);
  app.post('/api/auth/forgot-password', forgotPassword);
  app.get('/api/user', authenticateToken, getMe);
  app.post('/api/auth/logout', authenticateToken, logout);

  // User routes (protected)
  app.put('/api/users/profile', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!._id!;
      const updateData = req.body;
      
      const user = await storage.updateUser(userId, updateData);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get('/api/users/search', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!._id!;
      const query = req.query.q as string;
      
      if (!query || query.length < 2) {
        return res.json([]);
      }
      
      const users = await storage.searchUsers(query, userId);
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  app.post('/api/users/status', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!._id!;
      const { isOnline } = req.body;
      
      await storage.updateUserOnlineStatus(userId, isOnline);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating status:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  // Chat routes (protected)
  app.get('/api/chats', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!._id!;
      const chats = await storage.getUserChats(userId);
      res.json(chats);
    } catch (error) {
      console.error("Error fetching chats:", error);
      res.status(500).json({ message: "Failed to fetch chats" });
    }
  });

  app.get('/api/chats/global', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!._id!;
      const globalRooms = await storage.getGlobalRooms(userId);
      res.json(globalRooms);
    } catch (error) {
      console.error("Error fetching global rooms:", error);
      res.status(500).json({ message: "Failed to fetch global rooms" });
    }
  });

  app.post('/api/chats/global/:roomId/join', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!._id!;
      const { roomId } = req.params;
      
      // Check if room exists and is global
      const room = await storage.getChatById(roomId);
      if (!room || !room.isGlobalRoom) {
        return res.status(404).json({ message: "Global room not found" });
      }
      
      // Check if user is already a participant
      const isParticipant = room.participants.includes(userId);
      if (isParticipant) {
        return res.json({ message: "Already a member" });
      }
      
      // Add user as participant
      await storage.addChatParticipant(roomId, userId);
      
      res.json({ message: "Joined global room successfully" });
    } catch (error) {
      console.error("Error joining global room:", error);
      res.status(500).json({ message: "Failed to join global room" });
    }
  });

  app.post('/api/chats', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!._id!;
      const chatData = insertChatSchema.parse(req.body);
      
      const chat = await storage.createChat({
        ...chatData,
        createdBy: userId,
        participants: [userId, ...(chatData.participants || [])],
      });
      
      const fullChat = await storage.getChatById(chat._id!);
      res.status(201).json(fullChat);
    } catch (error) {
      console.error("Error creating chat:", error);
      res.status(500).json({ message: "Failed to create chat" });
    }
  });

  app.get('/api/chats/:chatId', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!._id!;
      const { chatId } = req.params;
      
      const chat = await storage.getChatById(chatId);
      
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      // Check if user is participant
      if (!chat.participants.includes(userId)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(chat);
    } catch (error) {
      console.error("Error fetching chat:", error);
      res.status(500).json({ message: "Failed to fetch chat" });
    }
  });

  app.post('/api/chats/direct', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!._id!;
      const { otherUserId } = req.body;
      
      if (!otherUserId) {
        return res.status(400).json({ message: "Other user ID is required" });
      }
      
      const chat = await storage.getOrCreateDirectChat(userId, otherUserId);
      const fullChat = await storage.getChatById(chat._id!);
      res.json(fullChat);
    } catch (error) {
      console.error("Error creating direct chat:", error);
      res.status(500).json({ message: "Failed to create direct chat" });
    }
  });

  // Message routes (protected)
  app.get('/api/chats/:chatId/messages', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!._id!;
      const { chatId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      
      // Verify user is participant (skip check for global rooms)
      const chat = await storage.getChatById(chatId);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      // Allow access to global rooms without being a participant
      if (!chat.isGlobalRoom && !chat.participants.includes(userId)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const messages = await storage.getChatMessages(chatId, userId, limit);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/chats/:chatId/messages', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!._id!;
      const { chatId } = req.params;
      const messageData = insertMessageSchema.parse(req.body);
      
      // Verify user can send messages (allow global rooms)
      const chat = await storage.getChatById(chatId);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      // Allow messages in global rooms without being a participant
      if (!chat.isGlobalRoom && !chat.participants.includes(userId)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const message = await storage.createMessage({
        ...messageData,
        chatId,
        senderId: userId,
      });
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.post('/api/chats/:chatId/read', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!._id!;
      const { chatId } = req.params;
      
      await storage.markChatMessagesAsRead(chatId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });

  // Message edit/delete routes
  app.put('/api/messages/:messageId', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!._id!;
      const { messageId } = req.params;
      const { content } = req.body;
      
      if (!content?.trim()) {
        return res.status(400).json({ message: "Content is required" });
      }
      
      // Get message to verify ownership
      const message = await storage.getMessageById(messageId);
      if (!message || message.senderId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedMessage = await storage.updateMessage(messageId, {
        content: content.trim(),
        editedAt: new Date(),
      });
      
      res.json(updatedMessage);
    } catch (error) {
      console.error("Error updating message:", error);
      res.status(500).json({ message: "Failed to update message" });
    }
  });

  app.delete('/api/messages/:messageId', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!._id!;
      const { messageId } = req.params;
      
      // Get message to verify ownership
      const message = await storage.getMessageById(messageId);
      if (!message || message.senderId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteMessage(messageId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // Posts routes (protected)
  app.post('/api/posts', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!._id!;
      const { content } = req.body;
      
      if (!content?.trim()) {
        return res.status(400).json({ message: "Content is required" });
      }
      
      // For now, we'll simulate post creation
      const post = {
        id: Date.now().toString(),
        content: content.trim(),
        authorId: userId,
        createdAt: new Date(),
        likes: 0,
        comments: []
      };
      
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.get('/api/posts', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // For now, return sample posts
      const posts = [
        {
          id: "1",
          content: "Welcome to ChatGroove! This is your social messaging platform.",
          authorId: "system",
          authorName: "ChatGroove Team",
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          likes: 15,
          comments: 3
        }
      ];
      
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  // User suggestions route (protected)
  app.get('/api/users/suggested', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!._id!;
      
      // Get recent users for suggestions (excluding current user)
      const users = await storage.getAllUsers(10, 0);
      const suggestedUsers = users.filter(user => user._id !== userId).slice(0, 5);
      
      res.json(suggestedUsers);
    } catch (error) {
      console.error("Error fetching suggested users:", error);
      res.status(500).json({ message: "Failed to fetch suggested users" });
    }
  });

  // Admin routes (protected)
  app.get('/api/admin/stats', authenticateAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const stats = await storage.getUserStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get('/api/admin/users', authenticateAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = parseInt(req.query.skip as string) || 0;
      const users = await storage.getAllUsers(limit, skip);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/chats', authenticateAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = parseInt(req.query.skip as string) || 0;
      const chats = await storage.getAllChats(limit, skip);
      res.json(chats);
    } catch (error) {
      console.error("Error fetching chats:", error);
      res.status(500).json({ message: "Failed to fetch chats" });
    }
  });

  app.get('/api/admin/messages', authenticateAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const skip = parseInt(req.query.skip as string) || 0;
      const messages = await storage.getAllMessages(limit, skip);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.put('/api/admin/users/:userId/role', authenticateAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      
      if (!['user', 'admin', 'moderator'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const updatedUser = await storage.updateUserRole(userId, role);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.delete('/api/admin/users/:userId', authenticateAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { userId } = req.params;
      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.delete('/api/admin/chats/:chatId', authenticateAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { chatId } = req.params;
      await storage.deleteChat(chatId);
      res.json({ message: "Chat deleted successfully" });
    } catch (error) {
      console.error("Error deleting chat:", error);
      res.status(500).json({ message: "Failed to delete chat" });
    }
  });

  app.delete('/api/admin/messages/:messageId', authenticateAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { messageId } = req.params;
      await storage.deleteMessage(messageId);
      res.json({ message: "Message deleted successfully" });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // Admin: Restrict user
  app.patch('/api/admin/users/:userId/restrict', authenticateAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { reason } = req.body;
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      await storage.updateUser(req.params.userId, {
        isRestricted: true,
        restrictionReason: reason || 'No reason provided',
        restrictedAt: new Date(),
      });

      res.json({ message: 'User restricted successfully' });
    } catch (error) {
      console.error('Restrict user error:', error);
      res.status(500).json({ message: 'Failed to restrict user' });
    }
  });

  // Admin: Unrestrict user
  app.patch('/api/admin/users/:userId/unrestrict', authenticateAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.updateUser(req.params.userId, {
        isRestricted: false,
        restrictionReason: undefined,
        restrictedAt: undefined,
      });

      res.json({ message: 'User unrestricted successfully' });
    } catch (error) {
      console.error('Unrestrict user error:', error);
      res.status(500).json({ message: 'Failed to unrestrict user' });
    }
  });

  // Admin: Ban user
  app.patch('/api/admin/users/:userId/ban', authenticateAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { reason } = req.body;
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      await storage.updateUser(req.params.userId, {
        isBanned: true,
        banReason: reason || 'No reason provided',
        bannedAt: new Date(),
      });

      res.json({ message: 'User banned successfully' });
    } catch (error) {
      console.error('Ban user error:', error);
      res.status(500).json({ message: 'Failed to ban user' });
    }
  });

  // Admin: Unban user
  app.patch('/api/admin/users/:userId/unban', authenticateAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.updateUser(req.params.userId, {
        isBanned: false,
        banReason: undefined,
        bannedAt: undefined,
      });

      res.json({ message: 'User unbanned successfully' });
    } catch (error) {
      console.error('Unban user error:', error);
      res.status(500).json({ message: 'Failed to unban user' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
