import { 
  users, 
  gameWorlds, 
  characters, 
  storyEntries, 
  gameSessions,
  type User, 
  type InsertUser,
  type GameWorld,
  type InsertGameWorld,
  type Character,
  type InsertCharacter,
  type StoryEntry,
  type InsertStoryEntry,
  type GameSession,
  type InsertGameSession,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Game Worlds
  getAllWorlds(): Promise<GameWorld[]>;
  getWorld(id: number): Promise<GameWorld | undefined>;
  createWorld(world: InsertGameWorld): Promise<GameWorld>;
  updateWorld(id: number, updates: Partial<InsertGameWorld>): Promise<GameWorld | undefined>;
  deleteWorld(id: number): Promise<void>;

  // Characters
  getCharactersByWorld(worldId: number): Promise<Character[]>;
  getCharacter(id: number): Promise<Character | undefined>;
  createCharacter(character: InsertCharacter): Promise<Character>;
  updateCharacter(id: number, updates: Partial<InsertCharacter>): Promise<Character | undefined>;
  deleteCharacter(id: number): Promise<void>;

  // Story Entries
  getStoryEntriesByWorld(worldId: number): Promise<StoryEntry[]>;
  createStoryEntry(entry: InsertStoryEntry): Promise<StoryEntry>;
  getRecentStoryEntries(worldId: number, limit: number): Promise<StoryEntry[]>;

  // Game Sessions
  getActiveSession(worldId: number): Promise<GameSession | undefined>;
  createSession(session: InsertGameSession): Promise<GameSession>;
  updateSessionActivity(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Game Worlds
  async getAllWorlds(): Promise<GameWorld[]> {
    return db.select().from(gameWorlds).orderBy(desc(gameWorlds.createdAt));
  }

  async getWorld(id: number): Promise<GameWorld | undefined> {
    const [world] = await db.select().from(gameWorlds).where(eq(gameWorlds.id, id));
    return world || undefined;
  }

  async createWorld(world: InsertGameWorld): Promise<GameWorld> {
    const [created] = await db.insert(gameWorlds).values(world).returning();
    return created;
  }

  async updateWorld(id: number, updates: Partial<InsertGameWorld>): Promise<GameWorld | undefined> {
    const [updated] = await db
      .update(gameWorlds)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(gameWorlds.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteWorld(id: number): Promise<void> {
    await db.delete(gameWorlds).where(eq(gameWorlds.id, id));
  }

  // Characters
  async getCharactersByWorld(worldId: number): Promise<Character[]> {
    return db.select().from(characters).where(eq(characters.worldId, worldId));
  }

  async getCharacter(id: number): Promise<Character | undefined> {
    const [character] = await db.select().from(characters).where(eq(characters.id, id));
    return character || undefined;
  }

  async createCharacter(character: InsertCharacter): Promise<Character> {
    const [created] = await db.insert(characters).values(character).returning();
    return created;
  }

  async updateCharacter(id: number, updates: Partial<InsertCharacter>): Promise<Character | undefined> {
    const [updated] = await db
      .update(characters)
      .set(updates)
      .where(eq(characters.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCharacter(id: number): Promise<void> {
    await db.delete(characters).where(eq(characters.id, id));
  }

  // Story Entries
  async getStoryEntriesByWorld(worldId: number): Promise<StoryEntry[]> {
    return db
      .select()
      .from(storyEntries)
      .where(eq(storyEntries.worldId, worldId))
      .orderBy(storyEntries.createdAt);
  }

  async createStoryEntry(entry: InsertStoryEntry): Promise<StoryEntry> {
    const [created] = await db.insert(storyEntries).values(entry).returning();
    return created;
  }

  async getRecentStoryEntries(worldId: number, limit: number): Promise<StoryEntry[]> {
    return db
      .select()
      .from(storyEntries)
      .where(eq(storyEntries.worldId, worldId))
      .orderBy(desc(storyEntries.createdAt))
      .limit(limit);
  }

  // Game Sessions
  async getActiveSession(worldId: number): Promise<GameSession | undefined> {
    const [session] = await db
      .select()
      .from(gameSessions)
      .where(and(eq(gameSessions.worldId, worldId), eq(gameSessions.isActive, true)));
    return session || undefined;
  }

  async createSession(session: InsertGameSession): Promise<GameSession> {
    const [created] = await db.insert(gameSessions).values(session).returning();
    return created;
  }

  async updateSessionActivity(id: number): Promise<void> {
    await db
      .update(gameSessions)
      .set({ lastActivityAt: new Date() })
      .where(eq(gameSessions.id, id));
  }
}

export const storage = new DatabaseStorage();
