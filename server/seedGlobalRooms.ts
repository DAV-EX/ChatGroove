import { db } from "./db";
import { chats, users } from "@shared/schema";
import { eq } from "drizzle-orm";

const globalRooms = [
  {
    name: "💬 General Chat",
    description: "A place for everyone to chat about anything and everything",
    category: "General",
    isGroup: true,
    isGlobalRoom: true,
    isPublic: true,
    maxMembers: 1000,
  },
  {
    name: "🎮 Gaming Hub",
    description: "Discuss your favorite games, find gaming partners, and share gaming tips",
    category: "Gaming",
    isGroup: true,
    isGlobalRoom: true,
    isPublic: true,
    maxMembers: 1000,
  },
  {
    name: "🎵 Music Lounge",
    description: "Share your favorite music, discover new artists, and discuss all things musical",
    category: "Music",
    isGroup: true,
    isGlobalRoom: true,
    isPublic: true,
    maxMembers: 1000,
  },
  {
    name: "💻 Tech Talk",
    description: "Discuss the latest in technology, programming, and digital innovations",
    category: "Technology",
    isGroup: true,
    isGlobalRoom: true,
    isPublic: true,
    maxMembers: 1000,
  },
  {
    name: "🎨 Creative Corner",
    description: "Share your art, get feedback, and inspire each other's creativity",
    category: "Creative",
    isGroup: true,
    isGlobalRoom: true,
    isPublic: true,
    maxMembers: 1000,
  },
  {
    name: "🍕 Food & Travel",
    description: "Share recipes, restaurant recommendations, and travel experiences",
    category: "Food & Travel",
    isGroup: true,
    isGlobalRoom: true,
    isPublic: true,
    maxMembers: 1000,
  },
];

export async function initializeDefaultRooms(): Promise<void> {
  console.log('Initializing default global rooms...');
  
  try {
    // Create a system user for creating rooms
    const [systemUser] = await db.select()
      .from(users)
      .where(eq(users.email, 'system@chatgroove.com'))
      .limit(1);

    let systemUserId = systemUser?.id;

    if (!systemUser) {
      const [newSystemUser] = await db.insert(users)
        .values({
          email: 'system@chatgroove.com',
          username: 'ChatGroove System',
          firstName: 'ChatGroove',
          lastName: 'System',
          isEmailVerified: true,
          role: 'admin',
        })
        .returning();
      
      systemUserId = newSystemUser.id;
      console.log('Created system user');
    }

    // Check if global rooms already exist
    const [existingRoom] = await db.select()
      .from(chats)
      .where(eq(chats.isGlobalRoom, true))
      .limit(1);

    if (existingRoom) {
      console.log('Global rooms already exist, skipping initialization');
      return;
    }

    // Create global rooms
    for (const room of globalRooms) {
      const [newRoom] = await db.insert(chats)
        .values({
          ...room,
          createdBy: systemUserId!,
          participants: [],
        })
        .returning();
      
      console.log(`Created global room: ${room.name}`);
    }

    console.log('✓ Default global rooms initialized successfully');
  } catch (error) {
    console.error('Error initializing default rooms:', error);
  }
}

// Auto-initialize when imported
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDefaultRooms();
}