import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateNarrative, generateWorldIntroduction, generateNPC, generateAmbientUpdate, generateSceneGoal, generateScenarioGoal, generateImpendingClimaxEvent } from "./narrative";
import { detectStimulationType, applyStimulation, applyNpcStimulation, inferSexFromDescription, CharacterSex } from "./statusEngine";
import { CharacterStatus, PersonalityMatrix } from "@shared/schema";
import { 
  insertGameWorldSchema, 
  insertCharacterSchema, 
  insertStoryEntrySchema 
} from "@shared/schema";
import { z } from "zod";

// Format action type for display: "kiss_neck" -> "kissing your neck"
function formatActionType(actionType: string): string {
  const actionMap: Record<string, string> = {
    'kiss': 'kissing you',
    'kiss_neck': 'kissing your neck',
    'kiss_lips': 'kissing your lips',
    'grab_wrist': 'grabbing your wrist',
    'grab_arm': 'grabbing your arm',
    'grab_hand': 'grabbing your hand',
    'grab_shoulder': 'grabbing your shoulder',
    'grab_waist': 'grabbing your waist',
    'pull_closer': 'pulling you closer',
    'push_down': 'pushing you down',
    'touch_arm': 'touching your arm',
    'touch_face': 'touching your face',
    'touch_chest': 'touching your chest',
    'touch_leg': 'touching your leg',
    'hold': 'holding you',
    'embrace': 'embracing you',
    'pin': 'pinning you',
    'restrain': 'restraining you',
  };
  
  if (actionMap[actionType]) {
    return actionMap[actionType];
  }
  
  // Fallback: replace underscores and add "ing" if it looks like a verb
  const words = actionType.replace(/_/g, ' ').split(' ');
  if (words.length >= 1) {
    const verb = words[0];
    const rest = words.slice(1).join(' ');
    // Simple -ing conversion
    const gerund = verb.endsWith('e') ? verb.slice(0, -1) + 'ing' : verb + 'ing';
    return rest ? `${gerund} your ${rest}` : `${gerund} you`;
  }
  
  return actionType.replace(/_/g, ' ');
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ============= WORLDS =============
  
  // Get all worlds
  app.get("/api/worlds", async (req: Request, res: Response) => {
    try {
      const worlds = await storage.getAllWorlds();
      res.json(worlds);
    } catch (error) {
      console.error("Error fetching worlds:", error);
      res.status(500).json({ error: "Failed to fetch worlds" });
    }
  });

  // Get single world
  app.get("/api/worlds/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const world = await storage.getWorld(id);
      if (!world) {
        return res.status(404).json({ error: "World not found" });
      }
      res.json(world);
    } catch (error) {
      console.error("Error fetching world:", error);
      res.status(500).json({ error: "Failed to fetch world" });
    }
  });

  // Create world
  app.post("/api/worlds", async (req: Request, res: Response) => {
    try {
      const parsed = insertGameWorldSchema.parse(req.body);
      const world = await storage.createWorld(parsed);
      
      // Generate and save introductory narration
      try {
        const intro = await generateWorldIntroduction(world);
        await storage.createStoryEntry({
          worldId: world.id,
          entryType: "narration",
          content: intro,
          chapterMarker: "Prologue",
        });
      } catch (aiError) {
        console.error("Failed to generate intro:", aiError);
      }
      
      res.status(201).json(world);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating world:", error);
      res.status(500).json({ error: "Failed to create world" });
    }
  });

  // Update world
  app.patch("/api/worlds/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertGameWorldSchema.partial().parse(req.body);
      const world = await storage.updateWorld(id, updates);
      if (!world) {
        return res.status(404).json({ error: "World not found" });
      }
      res.json(world);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating world:", error);
      res.status(500).json({ error: "Failed to update world" });
    }
  });

  // Delete world
  app.delete("/api/worlds/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteWorld(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting world:", error);
      res.status(500).json({ error: "Failed to delete world" });
    }
  });

  // ============= CHARACTERS =============

  // Get characters for a world
  app.get("/api/worlds/:id/characters", async (req: Request, res: Response) => {
    try {
      const worldId = parseInt(req.params.id);
      const chars = await storage.getCharactersByWorld(worldId);
      res.json(chars);
    } catch (error) {
      console.error("Error fetching characters:", error);
      res.status(500).json({ error: "Failed to fetch characters" });
    }
  });

  // Create character
  app.post("/api/worlds/:id/characters", async (req: Request, res: Response) => {
    try {
      const worldId = parseInt(req.params.id);
      const parsed = insertCharacterSchema.parse({ ...req.body, worldId });
      const character = await storage.createCharacter(parsed);
      res.status(201).json(character);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating character:", error);
      res.status(500).json({ error: "Failed to create character" });
    }
  });

  // Update character
  app.patch("/api/characters/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertCharacterSchema.partial().parse(req.body);
      const character = await storage.updateCharacter(id, updates);
      if (!character) {
        return res.status(404).json({ error: "Character not found" });
      }
      res.json(character);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating character:", error);
      res.status(500).json({ error: "Failed to update character" });
    }
  });

  // Get NPC debug info - full personality, description, and current goal
  app.get("/api/characters/:id/debug", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const character = await storage.getCharacter(id);
      if (!character) {
        return res.status(404).json({ error: "Character not found" });
      }
      
      // Get recent story entries to determine intimacy stage
      const recentEntries = await storage.getRecentStoryEntries(character.worldId, 10);
      
      // Calculate current intimacy stage from recent entries
      let currentIntimacyStage = 0;
      for (const entry of recentEntries) {
        if (entry.entryType === 'narration') {
          const content = entry.content.toLowerCase();
          if (content.includes('oral') || content.includes('penis') || content.includes('vagina')) currentIntimacyStage = Math.max(currentIntimacyStage, 70);
          else if (content.includes('genital') || content.includes('groin')) currentIntimacyStage = Math.max(currentIntimacyStage, 60);
          else if (content.includes('undress') || content.includes('strip') || content.includes('naked')) currentIntimacyStage = Math.max(currentIntimacyStage, 50);
          else if (content.includes('kiss') || content.includes('chest') || content.includes('breast')) currentIntimacyStage = Math.max(currentIntimacyStage, 35);
          else if (content.includes('touch') || content.includes('close')) currentIntimacyStage = Math.max(currentIntimacyStage, 20);
        }
      }
      
      // Generate current scene goal
      const sceneGoal = generateSceneGoal(character, currentIntimacyStage);
      
      // Get world state for clothing/position info
      const world = await storage.getWorld(character.worldId);
      const worldState = (world?.worldState || {}) as Record<string, unknown>;
      const npcStates = (worldState.npcStates || {}) as Record<string, string>;
      const npcClothing = (worldState.npcClothing || {}) as Record<string, string>;
      
      // Get scenario goal from world state (or generate one if missing)
      const scenarioGoal = (worldState.scenarioGoal as string) || "No scenario goal set";
      const currentActivityMode = (worldState.currentActivityMode as string) || "none";
      const playerClothing = (worldState.playerClothing as string) || "fully clothed";
      const stateHistory = (worldState.stateHistory as Array<{
        timestamp: number;
        npcPosition: string;
        npcClothing: string;
        playerClothing: string;
        activityMode: string;
      }>) || [];
      
      res.json({
        id: character.id,
        name: character.name,
        description: character.description,
        personality: character.personality,
        background: character.background,
        goals: character.goals,
        traits: character.traits,
        sexualPersonality: character.sexualPersonality || 'switch',
        personalityMatrix: character.personalityMatrix,
        arousalTriggers: (character as any).arousalTriggers || [],
        arousalInhibitors: (character as any).arousalInhibitors || [],
        status: character.status,
        currentPosition: npcStates[character.name] || 'unknown',
        currentClothing: npcClothing[character.name] || 'as originally described',
        currentIntimacyStage,
        sceneGoal: {
          objective: sceneGoal.objective,
          approach: sceneGoal.approach,
          paceModifier: sceneGoal.paceModifier,
          preferredActions: sceneGoal.preferredActions,
        },
        scenarioGoal,
        currentActivityMode,
        playerClothing,
        stateHistory,
      });
    } catch (error) {
      console.error("Error getting character debug info:", error);
      res.status(500).json({ error: "Failed to get character debug info" });
    }
  });

  // Save a debug snapshot for a world (for reviewing prior states)
  app.post("/api/worlds/:id/debug-snapshot", async (req: Request, res: Response) => {
    try {
      const worldId = parseInt(req.params.id);
      const world = await storage.getWorld(worldId);
      if (!world) {
        return res.status(404).json({ error: "World not found" });
      }
      
      const worldState = (world.worldState || {}) as Record<string, unknown>;
      const characters = await storage.getCharactersByWorld(worldId);
      const recentEntries = await storage.getRecentStoryEntries(worldId, 5);
      
      // Build snapshot
      const snapshot = {
        timestamp: Date.now(),
        label: req.body.label || `Snapshot at ${new Date().toLocaleTimeString()}`,
        worldState: {
          scenarioGoal: worldState.scenarioGoal,
          currentActivityMode: worldState.currentActivityMode,
          playerClothing: worldState.playerClothing,
          npcStates: worldState.npcStates,
          npcClothing: worldState.npcClothing,
        },
        characters: characters.map(c => ({
          name: c.name,
          isNpc: c.isNpc,
          status: c.status,
        })),
        recentNarration: recentEntries.slice(-3).map(e => e.content.slice(0, 200)),
      };
      
      // Store in world's debugHistory (keep last 20)
      const debugHistory = (worldState.debugHistory || []) as Array<typeof snapshot>;
      debugHistory.push(snapshot);
      if (debugHistory.length > 20) debugHistory.shift();
      
      await storage.updateWorld(worldId, {
        worldState: { ...worldState, debugHistory }
      });
      
      res.json({ success: true, snapshotCount: debugHistory.length });
    } catch (error) {
      console.error("Error saving debug snapshot:", error);
      res.status(500).json({ error: "Failed to save debug snapshot" });
    }
  });

  // Get debug history for a world
  app.get("/api/worlds/:id/debug-history", async (req: Request, res: Response) => {
    try {
      const worldId = parseInt(req.params.id);
      const world = await storage.getWorld(worldId);
      if (!world) {
        return res.status(404).json({ error: "World not found" });
      }
      
      const worldState = (world.worldState || {}) as Record<string, unknown>;
      const debugHistory = (worldState.debugHistory || []) as Array<{
        timestamp: number;
        label: string;
        worldState: Record<string, unknown>;
        characters: Array<{ name: string; isNpc: boolean; status: unknown }>;
        recentNarration: string[];
      }>;
      
      res.json(debugHistory);
    } catch (error) {
      console.error("Error getting debug history:", error);
      res.status(500).json({ error: "Failed to get debug history" });
    }
  });

  // Generate NPC with psychological profile
  app.post("/api/worlds/:id/generate-npc", async (req: Request, res: Response) => {
    try {
      const worldId = parseInt(req.params.id);
      const world = await storage.getWorld(worldId);
      if (!world) {
        return res.status(404).json({ error: "World not found" });
      }
      
      const { context, age } = req.body;
      const npcData = await generateNPC(
        world, 
        context || "A new character the players might encounter",
        age ? parseInt(age) : undefined
      );
      
      const npc = await storage.createCharacter({
        worldId,
        name: npcData.name,
        description: npcData.description,
        personality: npcData.personality,
        goals: npcData.goals,
        isNpc: true,
        isActive: true,
      });
      
      // Return NPC with the generation factors for transparency
      res.status(201).json({ 
        ...npc, 
        generationFactors: npcData.factors 
      });
    } catch (error) {
      console.error("Error generating NPC:", error);
      res.status(500).json({ error: "Failed to generate NPC" });
    }
  });

  // ============= STORY ENTRIES =============

  // Get story for a world
  app.get("/api/worlds/:id/story", async (req: Request, res: Response) => {
    try {
      const worldId = parseInt(req.params.id);
      const entries = await storage.getStoryEntriesByWorld(worldId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching story:", error);
      res.status(500).json({ error: "Failed to fetch story" });
    }
  });

  // Submit player action (with streaming AI response)
  app.post("/api/worlds/:id/action", async (req: Request, res: Response) => {
    try {
      const worldId = parseInt(req.params.id);
      const { content, actionType = "player_action", characterId } = req.body;

      if (!content || typeof content !== "string") {
        return res.status(400).json({ error: "Content is required" });
      }

      // Get world and context
      const world = await storage.getWorld(worldId);
      if (!world) {
        return res.status(404).json({ error: "World not found" });
      }

      // Clear awaiting response flag - player has responded
      const currentState = (world.worldState || {}) as Record<string, unknown>;
      
      // Clear awaiting flag when player responds
      await storage.updateWorld(worldId, {
        worldState: { 
          ...currentState, 
          awaitingPlayerResponse: false
        }
      });

      const characters = await storage.getCharactersByWorld(worldId);
      const recentEntries = await storage.getRecentStoryEntries(worldId, 20);
      const actingCharacter = characterId 
        ? characters.find(c => c.id === characterId) 
        : undefined;

      // Generate scenario goal if none exists
      if (!currentState.scenarioGoal && characters.some(c => c.isNpc)) {
        try {
          const scenarioGoal = await generateScenarioGoal(world, characters);
          await storage.updateWorld(worldId, {
            worldState: { ...currentState, scenarioGoal }
          });
          console.log('[Narrative] Generated scenario goal:', scenarioGoal);
        } catch (err) {
          console.error('[Narrative] Failed to generate scenario goal:', err);
        }
      }

      // Save player action
      await storage.createStoryEntry({
        worldId,
        entryType: actionType,
        content,
        characterId: characterId || null,
      });

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Generate AI response
      let fullResponse = "";
      
      try {
        for await (const chunk of generateNarrative({
          world,
          characters,
          recentEntries: recentEntries.reverse(),
          playerAction: content,
          actingCharacter,
        })) {
          fullResponse += chunk;
          res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        }

        // Save the AI narration
        await storage.createStoryEntry({
          worldId,
          entryType: "narration",
          content: fullResponse,
        });

        // Detect stimulation and update character status
        const stimType = detectStimulationType(fullResponse);
        if (stimType) {
          // Find player character to update their status
          const playerChar = characters.find(c => !c.isNpc);
          if (playerChar) {
            const currentStatus = (playerChar.status as CharacterStatus) || { arousal: 0, climax: 0, composure: 100 };
            const traits = (playerChar.traits as string[]) || [];
            const sex = inferSexFromDescription(playerChar.description || '') as CharacterSex;
            const result = applyStimulation(currentStatus, stimType, traits, sex);
            
            await storage.updateCharacter(playerChar.id, { status: result.newStatus });
            
            // Send status update to client
            res.write(`data: ${JSON.stringify({ statusUpdate: result.newStatus, climaxed: result.climaxed })}\n\n`);
            
            if (result.climaxed) {
              res.write(`data: ${JSON.stringify({ content: "\n\n[You climax!]" })}\n\n`);
            }
          }
        }

        // Update NPC arousal based on player action and narrative
        const combinedActionText = content + " " + fullResponse;
        const activeNpcs = characters.filter(c => c.isNpc && c.isActive);
        
        for (const npc of activeNpcs) {
          if (npc.personalityMatrix) {
            const currentStatus = (npc.status as CharacterStatus) || { arousal: 0, climax: 0, composure: 100 };
            const matrix = npc.personalityMatrix as PersonalityMatrix;
            const traits = (npc.traits as string[]) || [];
            
            const npcResult = applyNpcStimulation(currentStatus, combinedActionText, matrix, traits);
            
            // Only update if there's a meaningful change
            if (npcResult.newStatus.arousal !== currentStatus.arousal || 
                npcResult.newStatus.climax !== currentStatus.climax) {
              await storage.updateCharacter(npc.id, { status: npcResult.newStatus });
              
              // If NPC climaxed, we could add that to the narrative
              if (npcResult.climaxed) {
                res.write(`data: ${JSON.stringify({ content: `\n\n[${npc.name} reaches climax!]` })}\n\n`);
              }
            }
          }
        }

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      } catch (aiError) {
        console.error("AI generation error:", aiError);
        res.write(`data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`);
      }

      res.end();
    } catch (error) {
      console.error("Error processing action:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to process action" });
      }
    }
  });

  // ============= AMBIENT UPDATES =============

  // Pause/unpause endpoint - sets server-side pause state
  app.post("/api/worlds/:id/pause", async (req: Request, res: Response) => {
    try {
      const worldId = parseInt(req.params.id);
      const { paused } = req.body;
      
      const world = await storage.getWorld(worldId);
      if (!world) {
        return res.status(404).json({ error: "World not found" });
      }
      
      const currentState = (world.worldState || {}) as Record<string, unknown>;
      await storage.updateWorld(worldId, {
        worldState: { 
          ...currentState, 
          gamePaused: paused,
          pausedAt: paused ? Date.now() : null 
        }
      });
      
      res.json({ success: true, paused });
    } catch (error) {
      console.error("Error setting pause state:", error);
      res.status(500).json({ error: "Failed to set pause state" });
    }
  });

  // Generate ambient NPC action/world event
  app.post("/api/worlds/:id/ambient", async (req: Request, res: Response) => {
    try {
      const worldId = parseInt(req.params.id);
      const requestTime = Date.now();
      
      const world = await storage.getWorld(worldId);
      if (!world) {
        return res.status(404).json({ error: "World not found" });
      }
      
      // Check if game is paused
      const worldState = (world.worldState || {}) as Record<string, unknown>;
      if (worldState.gamePaused) {
        return res.json({ skipped: true, reason: "game_paused" });
      }

      const characters = await storage.getCharactersByWorld(worldId);
      const playerChar = characters.find(c => !c.isNpc && c.isActive);
      const playerStatus = playerChar?.status as CharacterStatus | null;
      const playerComposure = playerStatus?.composure ?? 100;
      const playerLostControl = playerComposure <= 0;
      
      // Detect and store player sex if not already known
      if (playerChar && !worldState.playerSex) {
        const detectedSex = inferSexFromDescription(playerChar.description || '');
        if (detectedSex !== 'other') {
          worldState.playerSex = detectedSex;
          await storage.updateWorld(worldId, { worldState: { ...worldState, playerSex: detectedSex } });
        }
      }

      // Skip ambient updates if waiting for player response to NPC action
      // UNLESS player has 0 composure (lost control) - then NPC takes over
      if (worldState.awaitingPlayerResponse && !playerLostControl) {
        return res.json({ skipped: true, reason: "awaiting_player_response" });
      }
      
      // Check if another ambient generation is already in progress (race condition prevention)
      const ambientInProgress = worldState.ambientGenerationStarted as number | undefined;
      if (ambientInProgress && (Date.now() - ambientInProgress) < 60000) {
        console.log('[Ambient] Skipping - another generation in progress');
        return res.json({ skipped: true, reason: "generation_in_progress" });
      }
      
      // Mark that we're starting ambient generation (prevents race conditions)
      const preGenState = { ...worldState, ambientGenerationStarted: Date.now() };
      await storage.updateWorld(worldId, { worldState: preGenState });

      const recentEntries = await storage.getRecentStoryEntries(worldId, 10);
      
      // Generate ambient update
      const ambientResult = await generateAmbientUpdate(world, characters, recentEntries);
      
      // Re-check pause state AFTER generation (user may have paused during)
      const updatedWorld = await storage.getWorld(worldId);
      const updatedState = (updatedWorld?.worldState || {}) as Record<string, unknown>;
      const pausedAt = updatedState.pausedAt as number | null;
      
      // If paused after we started, discard the result
      if (updatedState.gamePaused || (pausedAt && pausedAt > requestTime)) {
        console.log('[Ambient] Discarding result - game was paused during generation');
        return res.json({ skipped: true, reason: "paused_during_generation" });
      }
      
      if (ambientResult && ambientResult.actionText) {
        // Update the world state with NPC's new state and clothing
        const currentState = (world.worldState || {}) as Record<string, unknown>;
        const npcStates = (currentState.npcStates || {}) as Record<string, string>;
        const npcClothing = (currentState.npcClothing || {}) as Record<string, string>;
        let playerClothing = (currentState.playerClothing || "fully clothed") as string;
        
        if (ambientResult.npcName) {
          npcStates[ambientResult.npcName] = ambientResult.newState;
          if (ambientResult.clothingChange) {
            npcClothing[ambientResult.npcName] = ambientResult.clothingChange;
          }
        }
        
        // Track player clothing changes based on action text
        const actionLower = ambientResult.actionText.toLowerCase();
        
        // Pants/trousers removal
        if ((actionLower.includes('pants') || actionLower.includes('trousers') || actionLower.includes('jeans')) && 
            (actionLower.includes('pull') || actionLower.includes('yank') || actionLower.includes('down') || actionLower.includes('remove'))) {
          if (!playerClothing.includes('pants off') && !playerClothing.includes('naked')) {
            playerClothing = 'pants down, genitals exposed';
            console.log('[Ambient] Detected pants removal, updating playerClothing');
          }
        }
        // Underwear removal
        if (actionLower.includes('underwear') && (actionLower.includes('rip') || actionLower.includes('pull') || actionLower.includes('yank') || actionLower.includes('remove'))) {
          if (!playerClothing.includes('no underwear')) {
            playerClothing = playerClothing.includes('naked') ? playerClothing : 'no underwear - genitals exposed';
          }
        }
        // General genital exposure
        if ((actionLower.includes('expos') && (actionLower.includes('penis') || actionLower.includes('vagina') || actionLower.includes('genital'))) ||
            (actionLower.includes('penis') && actionLower.includes('testicle'))) {
          if (!playerClothing.includes('exposed') && !playerClothing.includes('naked')) {
            playerClothing = 'genitals exposed';
          }
        }
        // Shirt removal
        if ((actionLower.includes('shirt') || actionLower.includes('top')) && 
            (actionLower.includes('pull') || actionLower.includes('rip') || actionLower.includes('remove') || actionLower.includes('off'))) {
          if (!playerClothing.includes('shirtless') && !playerClothing.includes('naked')) {
            playerClothing = playerClothing.includes('pants') ? 'shirtless, pants down' : 'shirtless';
          }
        }
        // Full nudity
        if (actionLower.includes('naked') || actionLower.includes('completely nude')) {
          playerClothing = 'completely naked';
        }
        
        // Track state history (keep last 5 snapshots)
        const stateHistory = (currentState.stateHistory || []) as Array<{
          timestamp: number;
          npcPosition: string;
          npcClothing: string;
          playerClothing: string;
          activityMode: string;
        }>;
        const newSnapshot = {
          timestamp: Date.now(),
          npcPosition: ambientResult.npcName ? npcStates[ambientResult.npcName] : 'unknown',
          npcClothing: ambientResult.npcName ? (npcClothing[ambientResult.npcName] || 'as described') : 'unknown',
          playerClothing,
          activityMode: (currentState.currentActivityMode as string) || 'none',
        };
        stateHistory.push(newSnapshot);
        if (stateHistory.length > 5) stateHistory.shift();
        
        // BUILD UP A UNIFIED STATE OBJECT - only saved ONCE at the end
        // This prevents stale state from overwriting concurrent updates
        let unifiedState: Record<string, unknown> = { 
          ...currentState, 
          npcStates, 
          npcClothing, 
          playerClothing, 
          stateHistory 
        };
        
        // If NPC is acting on player, behavior depends on player composure
        let content = ambientResult.actionText;
        if (ambientResult.attemptOnPlayer) {
          if (playerLostControl) {
            // Player has 0 composure - NPC is in full control, no prompt needed
            content += `\n\n[You have no composure left to resist.]`;
            unifiedState.awaitingPlayerResponse = false;
          } else {
            // Normal case - add resist prompt and pause for player response
            const actionLabel = formatActionType(ambientResult.actionType || 'acting on you');
            content += `\n\n[${ambientResult.npcName} is ${actionLabel}. You can: allow or resist]`;
            unifiedState.awaitingPlayerResponse = true;
          }
        }
        
        // DO NOT apply stimulation during ambient - player must respond first!
        // Status changes only happen when player responds (allow/resist) in the action endpoint
        const stimType = detectStimulationType(ambientResult.actionText);
        
        // Player stats are NOT modified here - they're modified only when player responds
        // This ensures the player always gets a chance to react before their stats change
        if (playerChar && ambientResult.attemptOnPlayer && stimType) {
          console.log(`[Ambient] Detected stimulation type: ${stimType} - will apply ONLY after player responds`);
          // Store pending stimulation type in world state so it can be applied when player responds
          unifiedState.pendingStimulation = {
            type: stimType,
            characterId: playerChar.id,
            timestamp: Date.now()
          };
        }
        
        // NPC status is also stored but not applied until player responds
        // This prevents stats from changing without player input
        const npc = characters.find(c => c.name === ambientResult.npcName && c.isNpc);
        if (npc && stimType) {
          // Store pending NPC stimulation info (will be applied when player responds)
          unifiedState.pendingNpcStimulation = {
            npcId: npc.id,
            npcName: npc.name,
            stimType,
            actionText: ambientResult.actionText,
            timestamp: Date.now()
          };
          console.log(`[Ambient] NPC ${npc.name} stimulation stored for after player response`);
        }
        
        // No climax events are generated during ambient - they're generated when player responds
        // This ensures player always gets a chance to react before any climax mechanics trigger
        
        // Clear pending climax decision if it was consumed by this ambient update
        if (ambientResult.consumedClimaxDecision) {
          // Refetch fresh state to avoid overwriting concurrent updates
          const freshWorld = await storage.getWorld(worldId);
          const freshState = (freshWorld?.worldState || {}) as Record<string, unknown>;
          if (freshState.pendingClimaxDecision) {
            console.log('[Ambient] Clearing consumed pendingClimaxDecision');
            await storage.updateWorld(worldId, {
              worldState: { ...freshState, pendingClimaxDecision: null }
            });
          }
        }
        
        // Also clear stale decisions (older than 2 minutes that weren't consumed)
        if (!ambientResult.consumedClimaxDecision) {
          const freshWorld = await storage.getWorld(worldId);
          const freshState = (freshWorld?.worldState || {}) as Record<string, unknown>;
          if (freshState.pendingClimaxDecision) {
            const pendingDecision = freshState.pendingClimaxDecision as { timestamp?: number };
            if (!pendingDecision.timestamp || (Date.now() - pendingDecision.timestamp) > 120000) {
              console.log('[Ambient] Clearing stale pendingClimaxDecision');
              await storage.updateWorld(worldId, {
                worldState: { ...freshState, pendingClimaxDecision: null }
              });
            }
          }
        }
        // Climax events are handled when player responds (in action endpoint)
        // This ensures the player always has a chance to react
        
        // Track activity mode (oral vs penetration) to prevent jarring switches
        const isOralAction = actionLower.includes('suck') || 
                             (actionLower.includes('mouth') && (actionLower.includes('penis') || actionLower.includes('cock'))) ||
                             (actionLower.includes('lips') && actionLower.includes('shaft')) ||
                             (actionLower.includes('tongue') && actionLower.includes('penis')) ||
                             actionLower.includes('bobbing') || actionLower.includes('licking his');
        const isPenetrationAction = actionLower.includes('penetrat') || actionLower.includes('thrust') ||
                                     (actionLower.includes('inside') && actionLower.includes('vagina')) ||
                                     actionLower.includes('rides') || actionLower.includes('sinks down') ||
                                     (actionLower.includes('vagina') && actionLower.includes('penis')) ||
                                     actionLower.includes('grinding') || actionLower.includes('bounces');
        
        // Determine activity mode and add to unified state
        if (isOralAction) {
          unifiedState.currentActivityMode = 'oral';
          console.log(`[Ambient] Activity mode detected: ORAL`);
        } else if (isPenetrationAction) {
          unifiedState.currentActivityMode = 'penetration';
          console.log(`[Ambient] Activity mode detected: PENETRATION`);
        }
        
        // Save as narration so it looks like narrator text
        const entry = await storage.createStoryEntry({
          worldId,
          entryType: "narration",
          content,
        });
        
        // Auto-save debug snapshot every 10 ambient updates
        const ambientCount = ((currentState.ambientCount as number) || 0) + 1;
        unifiedState.ambientCount = ambientCount;
        
        if (ambientCount % 10 === 0) {
          const snapshotCharacters = await storage.getCharactersByWorld(worldId);
          const snapshotEntries = await storage.getRecentStoryEntries(worldId, 3);
          const snapshot = {
            timestamp: Date.now(),
            label: `Auto-snapshot #${ambientCount}`,
            worldState: {
              scenarioGoal: currentState.scenarioGoal,
              currentActivityMode: unifiedState.currentActivityMode,
              playerClothing,
              npcStates,
              npcClothing,
            },
            characters: snapshotCharacters.map(c => ({ name: c.name, isNpc: c.isNpc, status: c.status })),
            recentNarration: snapshotEntries.map(e => e.content.slice(0, 200)),
          };
          const debugHistory = (unifiedState.debugHistory || []) as Array<typeof snapshot>;
          debugHistory.push(snapshot);
          if (debugHistory.length > 20) debugHistory.shift();
          unifiedState.debugHistory = debugHistory;
        }
        
        // Clear the ambient generation lock
        unifiedState.ambientGenerationStarted = null;
        
        // SINGLE DATABASE SAVE - all state changes accumulated in unifiedState
        await storage.updateWorld(worldId, { worldState: unifiedState });
        
        res.json({ 
          ...entry, 
          attemptOnPlayer: ambientResult.attemptOnPlayer && !playerLostControl,
          actionType: ambientResult.actionType,
          npcName: ambientResult.npcName,
          playerLostControl
        });
      } else {
        // Clear lock even if no ambient generated
        const clearLockState = { ...worldState, ambientGenerationStarted: null };
        await storage.updateWorld(worldId, { worldState: clearLockState });
        res.json({ skipped: true });
      }
    } catch (error) {
      console.error("Error generating ambient update:", error);
      // Clear lock on error
      try {
        const errWorldId = parseInt(req.params.id);
        const world = await storage.getWorld(errWorldId);
        if (world) {
          const currentState = (world.worldState || {}) as Record<string, unknown>;
          await storage.updateWorld(errWorldId, { worldState: { ...currentState, ambientGenerationStarted: null } });
        }
      } catch (e) { /* ignore cleanup errors */ }
      res.status(500).json({ error: "Failed to generate ambient update" });
    }
  });

  return httpServer;
}
