import { db } from "./db";
import { chats, chatParticipants } from "@shared/schema";

export async function seedGlobalRooms() {
  try {
    // Check if global rooms already exist
    const existingRooms = await db
      .select()
      .from(chats)
      .where(chats.isGlobalRoom === true)
      .limit(1);

    if (existingRooms.length > 0) {
      console.log("Global rooms already exist, skipping seed");
      return;
    }

    console.log("Creating global chat rooms...");

    const globalRooms = [
      {
        name: "🌍 General",
        description: "General discussion for everyone",
        category: "General",
        isGroup: true,
        isGlobalRoom: true,
        isPublic: true,
        maxMembers: 10000,
        imageUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=300&h=300&fit=crop&crop=center"
      },
      {
        name: "🎮 Gaming",
        description: "Talk about your favorite games and gaming experiences",
        category: "Gaming",
        isGroup: true,
        isGlobalRoom: true,
        isPublic: true,
        maxMembers: 5000,
        imageUrl: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=300&h=300&fit=crop&crop=center"
      },
      {
        name: "🎵 Music",
        description: "Share your favorite music and discover new tracks",
        category: "Music",
        isGroup: true,
        isGlobalRoom: true,
        isPublic: true,
        maxMembers: 5000,
        imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&crop=center"
      },
      {
        name: "💼 Technology",
        description: "Discuss the latest in tech, programming, and innovation",
        category: "Technology",
        isGroup: true,
        isGlobalRoom: true,
        isPublic: true,
        maxMembers: 3000,
        imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=300&fit=crop&crop=center"
      },
      {
        name: "🎨 Creative",
        description: "Share your artwork, photography, and creative projects",
        category: "Creative",
        isGroup: true,
        isGlobalRoom: true,
        isPublic: true,
        maxMembers: 2000,
        imageUrl: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&h=300&fit=crop&crop=center"
      },
      {
        name: "🍔 Food & Travel",
        description: "Share food pics, recipes, and travel adventures",
        category: "Lifestyle",
        isGroup: true,
        isGlobalRoom: true,
        isPublic: true,
        maxMembers: 4000,
        imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&h=300&fit=crop&crop=center"
      }
    ];

    for (const room of globalRooms) {
      await db.insert(chats).values(room);
    }

    console.log(`Created ${globalRooms.length} global chat rooms successfully!`);
  } catch (error) {
    console.error("Error seeding global rooms:", error);
  }
}