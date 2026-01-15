import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - players in the game
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Game Worlds - the fictional universes
export const gameWorlds = pgTable("game_worlds", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  genre: text("genre").notNull(),
  setting: text("setting").notNull(),
  rules: text("rules").notNull(),
  themes: text("themes").array().notNull().default(sql`ARRAY[]::text[]`),
  currentLocation: text("current_location"),
  currentTime: text("current_time"),
  worldState: jsonb("world_state").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Character status type for arousal/climax tracking
export type CharacterStatus = {
  arousal: number;      // 0-100, how turned on
  climax: number;       // 0-100, how close to orgasm
  composure: number;    // 0-100, mental clarity/control
};

// Sexual personality determines behavior when composure breaks
export type SexualPersonality = 'dominant' | 'submissive' | 'switch';

// Describes what happens when a character loses composure (0)
// Dominant: Takes primal control, becomes aggressive/demanding
// Submissive: Surrenders completely, gives up all agency
// Switch: Context-dependent, adapts to partner's personality

// Personality matrix based on developmental psychology factors
export type PersonalityMatrix = {
  // Big Five traits (0-100 scale)
  extraversion: number;        // Low = introverted, High = outgoing
  neuroticism: number;         // Low = stable, High = anxious/reactive
  conscientiousness: number;   // Low = spontaneous, High = organized
  
  // Attachment and motivation
  attachmentStyle: 'secure' | 'avoidant' | 'anxious';
  motivationStyle: 'affiliation' | 'achievement' | 'balanced';
  
  // Cultural and life context
  culturalBackground: 'individualist' | 'collectivist' | 'mixed';
  lifeStage: 'adolescence' | 'young_adult' | 'adult' | 'midlife' | 'later_life';
  
  // Formative experiences (affects preferences and triggers)
  earlyExperiences?: string[];  // e.g., 'secure_upbringing', 'permissive_parenting', 'moderate_trauma'
  
  // Sexual/arousal preferences derived from personality
  arousalTriggers?: string[];   // What arouses them: 'attention', 'dominance', 'submission', 'intimacy', 'novelty', 'security'
  arousalInhibitors?: string[]; // What turns them off: 'aggression', 'rejection', 'public_exposure', 'rushed_pace'
};

// Characters - player characters and NPCs
export const characters = pgTable("characters", {
  id: serial("id").primaryKey(),
  worldId: integer("world_id").notNull().references(() => gameWorlds.id, { onDelete: "cascade" }),
  ownerId: varchar("owner_id").references(() => users.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  personality: text("personality"),
  goals: text("goals"),
  background: text("background"),
  isNpc: boolean("is_npc").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  stats: jsonb("stats").$type<Record<string, number>>().default({}),
  status: jsonb("status").$type<CharacterStatus>().default({ arousal: 0, climax: 0, composure: 100 }),
  personalityMatrix: jsonb("personality_matrix").$type<PersonalityMatrix>(),
  sexualPersonality: text("sexual_personality").$type<SexualPersonality>().default("switch"),
  traits: text("traits").array().default(sql`ARRAY[]::text[]`),
  inventory: text("inventory").array().default(sql`ARRAY[]::text[]`),
  relationships: jsonb("relationships").$type<Record<string, string>>().default({}),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Story Entries - the narrative log
export const storyEntries = pgTable("story_entries", {
  id: serial("id").primaryKey(),
  worldId: integer("world_id").notNull().references(() => gameWorlds.id, { onDelete: "cascade" }),
  characterId: integer("character_id").references(() => characters.id),
  playerId: varchar("player_id").references(() => users.id),
  entryType: text("entry_type").notNull(), // 'narration', 'player_action', 'dialogue', 'system', 'world_event'
  content: text("content").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  chapterMarker: text("chapter_marker"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Game Sessions - active play sessions
export const gameSessions = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  worldId: integer("world_id").notNull().references(() => gameWorlds.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").default(true).notNull(),
  player1Id: varchar("player1_id").references(() => users.id),
  player2Id: varchar("player2_id").references(() => users.id),
  lastActivityAt: timestamp("last_activity_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Relations
export const gameWorldsRelations = relations(gameWorlds, ({ many }) => ({
  characters: many(characters),
  storyEntries: many(storyEntries),
  sessions: many(gameSessions),
}));

export const charactersRelations = relations(characters, ({ one, many }) => ({
  world: one(gameWorlds, {
    fields: [characters.worldId],
    references: [gameWorlds.id],
  }),
  owner: one(users, {
    fields: [characters.ownerId],
    references: [users.id],
  }),
  storyEntries: many(storyEntries),
}));

export const storyEntriesRelations = relations(storyEntries, ({ one }) => ({
  world: one(gameWorlds, {
    fields: [storyEntries.worldId],
    references: [gameWorlds.id],
  }),
  character: one(characters, {
    fields: [storyEntries.characterId],
    references: [characters.id],
  }),
  player: one(users, {
    fields: [storyEntries.playerId],
    references: [users.id],
  }),
}));

export const gameSessionsRelations = relations(gameSessions, ({ one }) => ({
  world: one(gameWorlds, {
    fields: [gameSessions.worldId],
    references: [gameWorlds.id],
  }),
  player1: one(users, {
    fields: [gameSessions.player1Id],
    references: [users.id],
    relationName: "player1",
  }),
  player2: one(users, {
    fields: [gameSessions.player2Id],
    references: [users.id],
    relationName: "player2",
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
});

export const insertGameWorldSchema = createInsertSchema(gameWorlds).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCharacterSchema = createInsertSchema(characters).omit({
  id: true,
  createdAt: true,
});

export const insertStoryEntrySchema = createInsertSchema(storyEntries).omit({
  id: true,
  createdAt: true,
});

export const insertGameSessionSchema = createInsertSchema(gameSessions).omit({
  id: true,
  createdAt: true,
  lastActivityAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertGameWorld = z.infer<typeof insertGameWorldSchema>;
export type GameWorld = typeof gameWorlds.$inferSelect;

export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type Character = typeof characters.$inferSelect;

export type InsertStoryEntry = z.infer<typeof insertStoryEntrySchema>;
export type StoryEntry = typeof storyEntries.$inferSelect;

export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type GameSession = typeof gameSessions.$inferSelect;
