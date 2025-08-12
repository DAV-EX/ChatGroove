import mongoose, { Schema, Document } from 'mongoose';
import { Message } from '@shared/schema';

interface MessageDocument extends Omit<Message, '_id'>, Document {}

const MessageSchema = new Schema<MessageDocument>({
  chatId: {
    type: String,
    required: true,
    ref: 'Chat',
  },
  senderId: {
    type: String,
    required: true,
    ref: 'User',
  },
  content: {
    type: String,
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'voice_note', 'video_note', 'video_call', 'audio_call'],
    default: 'text',
  },
  fileUrl: {
    type: String,
  },
  fileName: {
    type: String,
  },
  duration: {
    type: Number,
  },
  thumbnailUrl: {
    type: String,
  },
  replyToId: {
    type: String,
    ref: 'Message',
  },
  readBy: [{
    userId: {
      type: String,
      ref: 'User',
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  }],
  editedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes for performance
MessageSchema.index({ chatId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1 });
MessageSchema.index({ replyToId: 1 });

export default mongoose.models.Message || mongoose.model<MessageDocument>('Message', MessageSchema);