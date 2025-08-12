import mongoose, { Schema, Document } from 'mongoose';
import { Chat } from '@shared/schema';

interface ChatDocument extends Omit<Chat, '_id'>, Document {}

const ChatSchema = new Schema<ChatDocument>({
  name: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  imageUrl: {
    type: String,
  },
  isGroup: {
    type: Boolean,
    default: false,
  },
  isGlobalRoom: {
    type: Boolean,
    default: false,
  },
  category: {
    type: String,
    trim: true,
  },
  maxMembers: {
    type: Number,
    default: 1000,
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: String,
    required: true,
    ref: 'User',
  },
  participants: [{
    type: String,
    ref: 'User',
  }],
}, {
  timestamps: true,
});

// Index for search functionality
ChatSchema.index({ name: 'text', description: 'text', category: 'text' });
ChatSchema.index({ isGlobalRoom: 1, isPublic: 1 });
ChatSchema.index({ participants: 1 });

export default mongoose.models.Chat || mongoose.model<ChatDocument>('Chat', ChatSchema);