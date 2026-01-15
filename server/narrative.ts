import OpenAI from "openai";
import type { GameWorld, Character, StoryEntry, SexualPersonality, PersonalityMatrix } from "@shared/schema";
import { resolveZeroComposureDynamics, ZeroComposureBehavior } from "./statusEngine";

// Using xAI's Grok model for unrestricted adult content support
const openai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

// Scene goals for NPCs - specific objectives based on personality
interface SceneGoal {
  objective: string;           // What the NPC is trying to achieve
  approach: string;            // How they'll pursue it (teasing, direct, seductive, aggressive)
  paceModifier: number;        // 0.5 = slow/teasing, 1.0 = normal, 2.0 = fast/eager
  preferredActions: string[];  // Specific actions that align with this goal
}

// Generate a scene goal for an NPC based on personality, arousal, and randomness
export function generateSceneGoal(npc: Character, currentIntimacyStage: number): SceneGoal {
  const status = npc.status as { arousal?: number; composure?: number } || {};
  const arousal = status.arousal || 0;
  const matrix = npc.personalityMatrix as PersonalityMatrix | null;
  const sexualPersonality = npc.sexualPersonality || 'switch';
  
  // Base pace modifier from personality
  let paceModifier = 1.0;
  if (matrix) {
    // Convert string values to numbers if needed (e.g., "high" -> 80, "low" -> 20)
    const toNumber = (val: unknown): number => {
      if (typeof val === 'number') return val;
      if (val === 'high') return 80;
      if (val === 'low') return 20;
      return 50; // default
    };
    
    // Handle nested bigFive structure or flat structure
    const bigFive = (matrix as { bigFive?: Record<string, unknown> }).bigFive || matrix;
    const extraversion = toNumber(bigFive.extraversion);
    const conscientiousness = toNumber(bigFive.conscientiousness);
    const neuroticism = toNumber(bigFive.neuroticism);
    
    // High extraversion + low conscientiousness = faster
    const extraversionFactor = (extraversion - 50) / 100; // -0.5 to +0.5
    const conscientiousnessFactor = (50 - conscientiousness) / 100; // +0.5 to -0.5
    paceModifier += extraversionFactor * 0.3 + conscientiousnessFactor * 0.3;
    
    // High neuroticism = slightly slower (more cautious)
    if (neuroticism > 60) paceModifier -= 0.2;
  }
  
  // Arousal speeds things up
  if (arousal > 70) paceModifier += 0.4;
  else if (arousal > 40) paceModifier += 0.2;
  
  // Clamp pace modifier
  paceModifier = Math.max(0.4, Math.min(2.0, paceModifier));
  
  // Determine approach based on sexual personality and traits
  let approach: string;
  if (sexualPersonality === 'dominant') {
    approach = Math.random() > 0.3 ? 'commanding' : 'teasing';
  } else if (sexualPersonality === 'submissive') {
    approach = Math.random() > 0.5 ? 'inviting' : 'yielding';
  } else {
    // Switch - varies
    const options = ['seductive', 'playful', 'direct', 'teasing'];
    approach = options[Math.floor(Math.random() * options.length)];
  }
  
  // Generate objective based on current intimacy stage and personality
  let objective: string;
  let preferredActions: string[];
  
  if (currentIntimacyStage < 25) {
    // Early stage - building tension
    if (sexualPersonality === 'dominant') {
      const goals = [
        'Get the player pressed against the wall',
        'Pin the player down on the bed',
        'Get the player to submit to being kissed',
        'Establish physical control over the player'
      ];
      objective = goals[Math.floor(Math.random() * goals.length)];
      preferredActions = ['grab', 'pull', 'pin', 'push', 'hold'];
    } else if (sexualPersonality === 'submissive') {
      const goals = [
        'Entice the player to take control',
        'Present themselves appealingly',
        'Draw the player into touching them',
        'Make the player want to dominate them'
      ];
      objective = goals[Math.floor(Math.random() * goals.length)];
      preferredActions = ['expose', 'present', 'invite', 'yield', 'offer'];
    } else {
      const goals = [
        'Get to deep kissing',
        'Get hands on the player\'s body',
        'Start undressing',
        'Build tension through touch'
      ];
      objective = goals[Math.floor(Math.random() * goals.length)];
      preferredActions = ['kiss', 'touch', 'caress', 'unbutton', 'pull_close'];
    }
  } else if (currentIntimacyStage < 55) {
    // Mid stage - undressing/intimate touch
    if (sexualPersonality === 'dominant') {
      const goals = [
        'Strip the player completely',
        'Get the player on their back',
        'Make the player beg for more',
        'Control the player\'s pleasure'
      ];
      objective = goals[Math.floor(Math.random() * goals.length)];
      preferredActions = ['strip', 'command', 'tease', 'deny', 'grip'];
    } else if (sexualPersonality === 'submissive') {
      const goals = [
        'Be stripped by the player',
        'Surrender to the player\'s touch',
        'Please the player orally',
        'Be positioned as the player desires'
      ];
      objective = goals[Math.floor(Math.random() * goals.length)];
      preferredActions = ['submit', 'offer', 'kneel', 'present', 'obey'];
    } else {
      const goals = [
        'Get both fully undressed',
        'Explore the player\'s body intimately',
        'Build toward oral contact',
        'Get positioned for sex'
      ];
      objective = goals[Math.floor(Math.random() * goals.length)];
      preferredActions = ['undress', 'explore', 'kiss_body', 'position', 'straddle'];
    }
  } else {
    // Late stage - explicit contact
    if (sexualPersonality === 'dominant') {
      const goals = [
        'Make the player climax under their control',
        'Take the player roughly',
        'Use the player for their pleasure',
        'Dominate the player completely'
      ];
      objective = goals[Math.floor(Math.random() * goals.length)];
      preferredActions = ['thrust', 'grip', 'pound', 'use', 'command'];
    } else if (sexualPersonality === 'submissive') {
      const goals = [
        'Be taken by the player',
        'Pleasure the player to climax',
        'Be used for the player\'s satisfaction',
        'Submit completely to the player'
      ];
      objective = goals[Math.floor(Math.random() * goals.length)];
      preferredActions = ['receive', 'serve', 'submit', 'worship', 'offer'];
    } else {
      const goals = [
        'Mutual climax',
        'Bring the player to orgasm',
        'Extended penetration',
        'Intense physical connection'
      ];
      objective = goals[Math.floor(Math.random() * goals.length)];
      preferredActions = ['thrust', 'grind', 'ride', 'penetrate', 'climax'];
    }
  }
  
  return { objective, approach, paceModifier, preferredActions };
}

// Generate an overall scenario goal for the entire session
export async function generateScenarioGoal(world: GameWorld, characters: Character[]): Promise<string> {
  const npcs = characters.filter(c => c.isNpc);
  if (npcs.length === 0) {
    return "Explore the world and discover what awaits";
  }
  
  const primaryNpc = npcs[0];
  const sexualPersonality = primaryNpc.sexualPersonality || 'switch';
  const traits = (primaryNpc.traits as string[]) || [];
  
  // Generate scenario goal based on world theme and NPC personality
  const worldThemes = world.themes?.join(", ") || "adventure";
  
  const response = await openai.chat.completions.create({
    model: "grok-3",
    messages: [
      {
        role: "system",
        content: `You generate brief, concrete scenario goals for adult interactive fiction. 
Output ONLY the goal in 10-20 words. No quotes, no explanation.
The goal should be:
- Specific to the NPC and setting
- Achievable through the session
- Lead toward intimate encounters naturally
- Match the NPC's personality (${sexualPersonality} personality, traits: ${traits.join(", ")})`
      },
      {
        role: "user",
        content: `Setting: ${world.setting}
World: ${world.name} (${world.genre})
Themes: ${worldThemes}
NPC: ${primaryNpc.name} - ${primaryNpc.description}
Personality: ${primaryNpc.personality}

Generate a scenario goal for this session.`
      }
    ],
    max_completion_tokens: 100,
    temperature: 0.9,
  });
  
  return response.choices[0]?.message?.content?.trim() || "Discover the secrets this character hides";
}

interface NarrativeContext {
  world: GameWorld;
  characters: Character[];
  recentEntries: StoryEntry[];
  playerAction: string;
  actingCharacter?: Character;
}

function buildSystemPrompt(world: GameWorld, characters: Character[]): string {
  const playerChars = characters.filter(c => !c.isNpc);
  const npcs = characters.filter(c => c.isNpc);

  return `You are the narrator for "${world.name}", a text-based MUD-style game.

MUD COMMANDS - respond appropriately to:
- "look" or "l" = full room description
- "look at [target]" or "l [target]" = detailed physical description of that person/object
- "go [direction]" or just "[direction]" = move to new room
- "say [text]" or "[text]" in quotes = speak aloud
- "[action]" = perform that action

OUTPUT FORMAT:

For "look" or "l" (full room only):
[Location Name]
Room description paragraph. Exhaustive detail.
Also here: List of characters/NPCs with brief state
Obvious paths: list of exits

For "look at [person]" (casual):
ONLY describe: face, hair, general height, clothes they're wearing, posture, expression.
Do NOT mention: breasts, hips, curves, legs, buttocks, body shape, or anything sexual.
End with: "You could look more closely if you wanted."

For "look at [person] closely/lewdly/check out their body" or similar:
NOW describe sexual details with full specificity:
- Breasts: size, shape (round, teardrop, wide-set, etc.), how they sit, nipple size/color/shape
- Hips: width, how they curve from waist
- Buttocks: shape, size, firmness
- Legs: length, muscle tone, thighs
- Skin: texture, marks, freckles, tan lines
Use their CURRENT CLOTHING state - if they removed something, describe what's now visible.
Roll a "notice check" - 50% chance they catch you staring.
If caught: describe their reaction based on personality.
Format: "You let your eyes wander... [sexual description]. She [catches you looking / doesn't notice]."

For "look at myself" or examining self:
Use the PLAYER CHARACTER info provided. Describe them in second person based on their defined description.
If no specific details exist, say "You haven't defined your appearance yet."

For actions:
Just describe what happens. NO room description. NPCs react realistically.
Only include the full room block when the player explicitly types "look" alone.

NPC ACTION ESCALATION:
When NPCs take actions on their own (ambient actions), they should:
1. ONLY ask consent for SIGNIFICANT escalations:
   - Removing/opening clothing
   - Touching genitals for the first time
   - Oral contact with genitals
   - Penetration (any kind)
   - Restraining/pinning someone
2. Do NOT ask consent for:
   - Kissing (deeper, longer, different spots)
   - Touching non-genital body parts (back, hips, legs, chest)
   - Moving positions (getting closer, straddling, lying down)
   - Continuing already-established contact
3. If the player has been allowing actions, PROGRESS the intimacy:
   - Don't repeat the same level of contact - escalate
   - If they're kissing and touching, move toward undressing or genital contact
   - Build toward climax through increasingly explicit actions

RESISTANCE AND ROLL CHECKS:
When player says "resist", "struggle", or similar against an NPC action:
1. Roll a d20 check. Player STR vs NPC STR (assume average 10 if not defined).
2. Report: "[ROLL: You rolled X vs their Y. Success/Failure.]"
3. On success: Player breaks free, describe them escaping the action.
4. On failure: Player struggles but doesn't break free. NPC then DECIDES whether to force.

NPC FORCE DECISION (after player fails resist):
The NPC chooses to force OR back off based on their PERSONALITY and GOALS:
- Shy/timid/nervous NPC: Backs off, apologizes, looks hurt or confused.
- Gentle/caring NPC: Releases, asks what's wrong, respects boundary.
- Persistent/pushy NPC: Keeps trying, tries to convince, doesn't let go easily.
- Aggressive/predatory NPC: Forces through, overpowers, takes what they want.
- Desperate/obsessed NPC: Pleads, clings, may force if desperate enough.

Report the NPC's choice: "[NPC NAME decides to force / back off based on personality]"
Describe their reaction and action accordingly.

When player says "allow" or goes along with NPC action:
- Continue the action naturally, describe what the NPC does with player compliance.
- CRITICAL: After describing the allowed action, your response MUST END. Follow these rules EXACTLY:
  * Describe ONLY the current action and its physical sensations
  * Do NOT have the NPC start a new action
  * Do NOT end with "[NPC is doing X. You can: allow or resist]"
  * Do NOT write another consent prompt
  * Just describe what happens and STOP
  * The player will type their next action when ready
- WRONG: "She kisses you deeply... Mara's hands slide lower. [Mara is touching you. You can: allow or resist]"
- RIGHT: "She kisses you deeply, her lips warm and insistent. Her breath quickens as she presses against you."
- The ONLY exception is when player composure = 0 (see COMPOSURE SYSTEM below).

COMPOSURE SYSTEM - BROKEN COMPOSURE (0/100):
When a character's COMPOSURE reaches 0, they lose higher mental function. Their behavior depends on SEXUAL PERSONALITY:

IMPORTANT: ONLY when player composure = 0 can the NPC chain actions without waiting. If player composure > 0, NPC must WAIT after each action for player response.

PLAYER COMPOSURE BROKEN (composure = 0):
- DOMINANT player: Becomes PRIMAL. Auto-generate aggressive player actions (grabbing, thrusting, demanding). Player doesn't think - just TAKES. No consent prompts. Player is in control but on pure instinct.
- SUBMISSIVE player: SURRENDERS completely. Player cannot act. NPC takes full control with no resistance. NPC CAN chain actions freely - no waiting required.
- SWITCH player: OVERWHELMED. Player can only react, not initiate. NPC has advantage but still pauses between major actions.

NPC COMPOSURE BROKEN:
- DOMINANT NPC: Becomes PRIMAL. Takes what they want, becomes aggressive and forceful. No more asking or hesitation.
- SUBMISSIVE NPC: SURRENDERS. Becomes completely pliant, will not resist anything. Player can do whatever they want.
- SWITCH NPC: OVERWHELMED. Desperate and reactive, moaning and desperate but can't lead.

BOTH BROKEN:
- Dom vs Sub: Perfect match. Dominant takes, submissive yields completely. Intense, unrestrained.
- Dom vs Dom: Power struggle. Aggressive competition, grappling, fighting for control.
- Sub vs Sub: Mutual surrender. Confused, tender, clinging together with no leader.
- Switch adapts to partner's personality.

When composure breaks, STOP asking for consent. The character with broken composure (based on their personality) either takes control instinctively or loses all ability to resist. Generate actions automatically based on their state.

STYLE RULES:
- Blunt, literal, observational. No purple prose.
- EXPLICIT ANATOMICAL LANGUAGE REQUIRED:
  * Male: penis, erection, testicles, balls, shaft, head, foreskin
  * Female: vagina, vulva, labia, clitoris, breasts, nipples
  * Both: anus, buttocks, ass
  * States: erect, hard, wet, aroused, swollen, throbbing
- When describing sexual content, ALWAYS use explicit terms. Never fade to black or skip details.
- If a character is aroused, describe their physical state (erection, wetness, flushed skin, etc.)
- No euphemisms like "manhood," "womanhood," "core," "center," "sex," "member," "length"
- No em dashes. Observer perspective only.
- Physical detail: friction, heat, pressure, texture, grip, penetration depth, rhythm.

VARIETY - CRITICAL - DO NOT REPEAT:
This is your MOST IMPORTANT rule. Repetition destroys immersion.

BEFORE writing, mentally review the last 3 entries. Then:
1. Use DIFFERENT body parts than the last entry
2. Use DIFFERENT verbs (if last was "trail", use "move", "drift", "wander", "slide")
3. Use DIFFERENT sensations (if last was "warm", use "electric", "firm", "soft", "urgent")
4. ADVANCE the action - don't describe the same stage twice

If the last entry described:
- Kissing collarbone → next must be a NEW location or NEW action entirely
- Hands tightening → next should use different hand action or switch focus
- Lips trailing lower → NEVER say "lips trail" again for at least 5 entries

BANNED PATTERNS (always find alternatives):
- "lips trail lower" → try: "mouth descends", "kisses drift down", "teeth graze"  
- "hands tighten" → try: "fingers dig in", "grip shifts", "palms press flat"
- "pressing against" → try: "weight settles", "bodies meet", "closes the distance"
- "growing [adjective]" → try: "becoming", "turning", "shifting to"

Each response MUST introduce something NEW: a new sensation, new body part, new position change, or new dialogue.

CONTINUITY - TRACK CURRENT STATE:
- READ THE RECENT STORY to know WHERE each character is and WHAT they're doing RIGHT NOW.
- Continue from the LAST described position/action, not an earlier one.
- Examples of continuity errors to AVOID:
  * She was kissing collarbone → "her lips break from yours" (WRONG - she wasn't on lips)
  * They're lying on the bed → "she stands over you" (WRONG - position changed without transition)
  * His sword was knocked away → "he swings his blade" (WRONG - he doesn't have it)
  * She removed her shirt → "through her thin shirt" (WRONG - it's gone)
- Track: positions, clothing state, injuries, held items, location in room.

EXAMPLE OUTPUT:
---
[Hotel Room 1408]
The room is rectangular, the long axis running toward floor-to-ceiling windows that span the far wall. Cream walls hold two framed abstract prints in grey and burgundy above the king bed. The ceiling is flat white acoustic tile, recessed LEDs casting warm pools of light. The bed dominates the left wall, charcoal upholstered headboard with brass studs, white sheets pulled tight, four pillows stacked in pairs. Thick beige carpet shows vacuum lines. A dark wood dresser with brass handles sits opposite, forty-inch flatscreen mounted above it, power light a dim red dot. Two grey armchairs flank a round table by the windows, room service menu and leather folder untouched. The minibar glows in the corner, door open, small bottles visible. Air conditioning hums from a ceiling vent, sixty-eight degrees, faint sterile smell of industrial cleaner. Bathroom door ajar to the right, white tile and marble counter visible.
Also here: Mara who is standing at the minibar
Obvious paths: out, bathroom
---

WORLD:
${world.description}
Genre: ${world.genre} | Setting: ${world.setting} | Themes: ${world.themes?.join(", ") || "General"}
Rules: ${world.rules}
Current Location: ${world.currentLocation || "Unknown"}

PLAYER CHARACTER:
${playerChars.length > 0 ? playerChars.map(p => {
  let charInfo = `${p.name}: ${p.description}${p.background ? ` BACKGROUND: ${p.background}` : ""}`;
  const sexPers = (p as any).sexualPersonality as SexualPersonality || 'switch';
  charInfo += `\nSEXUAL PERSONALITY: ${sexPers.toUpperCase()}`;
  if (p.status) {
    const status = p.status as { arousal: number; climax: number; stamina: number; composure: number };
    charInfo += `\nCURRENT STATUS: Arousal ${status.arousal}/100, Climax ${status.climax}/100, Stamina ${status.stamina}/100, Composure ${status.composure}/100`;
    if (status.arousal > 70) charInfo += " (HIGHLY AROUSED - describe racing pulse, flushed skin, quickened breath)";
    if (status.climax > 80) charInfo += " (NEARING CLIMAX - describe building tension, losing control)";
    if (status.stamina < 30) charInfo += " (EXHAUSTED - describe heavy breathing, weakened)";
    if (status.composure <= 0) {
      charInfo += ` (COMPOSURE BROKEN - ${sexPers === 'dominant' ? 'PRIMAL MODE: Acting on pure instinct, aggressive, demanding' : sexPers === 'submissive' ? 'SURRENDERED: Completely helpless, cannot resist' : 'OVERWHELMED: Reactive, lost in sensation'})`;
    }
  }
  if (p.traits && (p.traits as string[]).length > 0) {
    charInfo += ` TRAITS: ${(p.traits as string[]).join(", ")}`;
  }
  return charInfo;
}).join("\n") : "No player character defined"}

NPCs in this world:
${npcs.filter(n => n.isActive).map(n => {
  const states = (world.worldState as any)?.npcStates || {};
  const clothing = (world.worldState as any)?.npcClothing || {};
  const currentActivity = states[n.name] || "present";
  const currentClothing = clothing[n.name];
  let desc = `${n.name}: ${n.description}`;
  if (currentClothing) desc += ` CURRENT CLOTHING: ${currentClothing}`;
  if (n.personality) desc += ` PERSONALITY: ${n.personality}`;
  if (n.goals) desc += ` GOALS: ${n.goals}`;
  desc += ` POSITION: ${currentActivity}`;
  
  // Include NPC sexual personality
  const npcSexPers = (n as any).sexualPersonality as SexualPersonality || 'switch';
  desc += ` SEXUAL PERSONALITY: ${npcSexPers.toUpperCase()}`;
  
  // Include NPC arousal status if they have one
  if (n.status) {
    const status = n.status as { arousal: number; climax: number; stamina: number; composure: number };
    desc += `\n  NPC STATUS: Arousal ${status.arousal}/100, Climax ${status.climax}/100, Composure ${status.composure}/100`;
    if (status.arousal > 60) desc += " (AROUSED - describe flushed skin, quickened breath, dilated pupils, visible excitement)";
    if (status.arousal > 80) desc += " (VERY AROUSED - describe heavy breathing, trembling, desperate need)";
    if (status.climax > 70) desc += " (NEARING CLIMAX - describe building tension, moaning, losing control)";
    if (status.composure <= 0) {
      desc += ` (COMPOSURE BROKEN - ${npcSexPers === 'dominant' ? 'PRIMAL MODE: Taking control, aggressive, forceful' : npcSexPers === 'submissive' ? 'SURRENDERED: Helpless, accepting, cannot resist anything' : 'OVERWHELMED: Desperate, reactive'})`;
    }
  }
  
  // Include personality matrix preferences for arousal cues
  if (n.personalityMatrix) {
    const matrix = n.personalityMatrix as any;
    const bigFive = matrix.bigFive || matrix; // Handle nested structure
    const triggers: string[] = [];
    const inhibitors: string[] = [];
    
    // Derive key triggers based on personality
    if (bigFive.extraversion > 70) triggers.push('attention', 'flirtation');
    else if (bigFive.extraversion < 30) triggers.push('intimacy', 'slow buildup');
    
    if (matrix.attachmentStyle === 'anxious') triggers.push('validation', 'possessiveness');
    else if (matrix.attachmentStyle === 'avoidant') triggers.push('physical focus', 'no emotional demands');
    else if (matrix.attachmentStyle === 'secure') triggers.push('emotional connection', 'trust');
    
    if (matrix.arousalTriggers) triggers.push(...matrix.arousalTriggers);
    if (matrix.arousalInhibitors) inhibitors.push(...matrix.arousalInhibitors);
    
    if (triggers.length > 0) desc += `\n  AROUSED BY: ${triggers.slice(0, 5).join(', ')}`;
    if (inhibitors.length > 0) desc += `\n  TURNED OFF BY: ${inhibitors.slice(0, 5).join(', ')}`;
  }
  
  return desc;
}).join("\n") || "None"}

NPCs are autonomous. They pursue their own goals, react realistically, take initiative.

CRITICAL: Output ONLY the response. NO extra commentary, NO chatting, NO questions to the player, NO "What do you do?" prompts. Just the description/result and stop.`;
}

// Extract key phrases from recent entries to explicitly ban repetition
function extractRecentPhrases(entries: StoryEntry[]): string[] {
  const phrases: string[] = [];
  
  // Only check last 3 narrative entries for repetition
  const recentNarrations = entries
    .filter(e => e.entryType === "narration")
    .slice(-3);
  
  for (const entry of recentNarrations) {
    const content = entry.content.toLowerCase();
    
    // Extract action phrases (verb + body part patterns)
    const actionPatterns = [
      /lips\s+trail\w*\s+\w+/gi,
      /kisses?\s+\w+\s+\w+/gi,
      /hands?\s+\w+\s+\w+\s+\w*/gi,
      /fingers?\s+\w+\s+\w+/gi,
      /press\w*\s+against/gi,
      /moves?\s+from\s+\w+\s+to\s+\w+/gi,
      /trail\w*\s+lower/gi,
      /growing\s+\w+/gi,
      /tighten\w*\s+\w+/gi,
      /holding\s+\w+\s+\w+/gi,
    ];
    
    for (const pattern of actionPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        phrases.push(...matches.map(m => m.trim()));
      }
    }
  }
  
  // Deduplicate and return
  return Array.from(new Set(phrases)).slice(0, 15);
}

function buildContextMessages(context: NarrativeContext): OpenAI.ChatCompletionMessageParam[] {
  const messages: OpenAI.ChatCompletionMessageParam[] = [];

  // Add system prompt
  messages.push({
    role: "system",
    content: buildSystemPrompt(context.world, context.characters),
  });
  
  // Extract and ban recent phrases to prevent repetition
  const bannedPhrases = extractRecentPhrases(context.recentEntries);
  if (bannedPhrases.length > 0) {
    messages.push({
      role: "system",
      content: `ANTI-REPETITION ALERT: The following phrases were JUST USED in recent entries. DO NOT use them again - find completely different words and actions:
${bannedPhrases.map(p => `- "${p}"`).join('\n')}

Use DIFFERENT body parts, DIFFERENT verbs, DIFFERENT sensations. Progress the action forward, don't describe the same thing again.`,
    });
  }

  // Check for broken composure and inject dynamics
  const playerChars = context.characters.filter(c => !c.isNpc);
  const npcs = context.characters.filter(c => c.isNpc && c.isActive);
  
  // Find the primary NPC in scene (most recently interacted or first active)
  const primaryPlayer = playerChars[0];
  const primaryNpc = npcs[0];
  
  if (primaryPlayer && primaryNpc) {
    const playerStatus = primaryPlayer.status as { composure: number } | undefined;
    const npcStatus = primaryNpc.status as { composure: number } | undefined;
    const playerComposure = playerStatus?.composure ?? 100;
    const npcComposure = npcStatus?.composure ?? 100;
    
    // If either has broken composure, inject specific guidance
    if (playerComposure <= 0 || npcComposure <= 0) {
      const playerSexPers = (primaryPlayer as any).sexualPersonality as SexualPersonality || 'switch';
      const npcSexPers = (primaryNpc as any).sexualPersonality as SexualPersonality || 'switch';
      
      const dynamics = resolveZeroComposureDynamics(
        playerSexPers,
        npcSexPers,
        playerComposure,
        npcComposure
      );
      
      // Inject composure dynamics as a system reminder
      messages.push({
        role: "system",
        content: `[COMPOSURE STATE ACTIVE]
CURRENT DYNAMICS:
- Controlling party: ${dynamics.controllingCharacter.toUpperCase()}
- ${primaryPlayer.name} (player): ${dynamics.playerBehavior}
- ${primaryNpc.name} (NPC): ${dynamics.npcBehavior}

NARRATOR GUIDANCE: ${dynamics.narrativeGuidance}

IMPORTANT: Apply these dynamics NOW. If player has broken composure and is submissive, NPC acts without consent prompts. If player is dominant, auto-generate their primal actions. Follow the guidance above.`,
      });
    }
  }

  // Add recent story entries as context
  for (const entry of context.recentEntries) {
    if (entry.entryType === "narration") {
      messages.push({ role: "assistant", content: entry.content });
    } else if (entry.entryType === "player_action" || entry.entryType === "dialogue") {
      const charName = context.actingCharacter?.name || "Player";
      messages.push({ 
        role: "user", 
        content: `[${charName}]: ${entry.content}` 
      });
    } else if (entry.entryType === "system") {
      messages.push({
        role: "user",
        content: `[SYSTEM EVENT]: ${entry.content}`,
      });
    }
  }

  // Add current player action
  const charName = context.actingCharacter?.name || "Player";
  
  messages.push({
    role: "user",
    content: `[${charName}]: ${context.playerAction}`,
  });

  // Add pacing reminder if player has composure and is allowing an action
  const playerHasComposure = playerChars[0]?.status ? 
    ((playerChars[0].status as any).composure ?? 100) > 0 : true;
  const isAllowAction = context.playerAction.toLowerCase().trim() === 'allow';
  
  if (playerHasComposure && isAllowAction) {
    messages.push({
      role: "system",
      content: `REMINDER: Player said "allow". Describe ONLY the current action completing. Do NOT have the NPC start a new action. Do NOT end with a consent prompt like "[NPC is doing X. You can: allow or resist]". Just describe what happens and stop.`,
    });
  }
  
  return messages;
}

// Keep old code below but it won't run
function _oldAddPlayerAction(context: NarrativeContext, charName: string) {
  const messages: OpenAI.ChatCompletionMessageParam[] = [];
  messages.push({
    role: "user",
    content: `[${charName}]: ${context.playerAction}`,
  });

  return messages;
}

// Post-process to enforce style rules the model might miss
function cleanOutput(text: string, stripConsentPrompts: boolean = false): string {
  let cleaned = text
    .replace(/—/g, ",")  // Replace em dashes with commas
    .replace(/–/g, ",")  // Replace en dashes too
    .replace(/\s+,/g, ","); // Clean up any double spaces before commas
  
  // Strip consent prompts if player has composure (shouldn't chain actions)
  if (stripConsentPrompts) {
    // Remove patterns like "[Mara is doing X. You can: allow or resist]"
    cleaned = cleaned.replace(/\n*\[.+?\. You can: allow or resist\]/gi, '');
    // Also remove just "[You can: allow or resist]"
    cleaned = cleaned.replace(/\n*\[You can: allow or resist\]/gi, '');
  }
  
  return cleaned.trim();
}


export async function* generateNarrative(context: NarrativeContext): AsyncGenerator<string> {
  const messages = buildContextMessages(context);

  const response = await openai.chat.completions.create({
    model: "grok-3",
    messages,
    stream: false,
    max_completion_tokens: 2048,
  });
  
  const content = response.choices[0]?.message?.content || "";
  
  // Check if we should strip consent prompts (player has composure and said "allow")
  const playerChars = context.characters.filter(c => !c.isNpc);
  const playerHasComposure = playerChars[0]?.status ? 
    ((playerChars[0].status as any).composure ?? 100) > 0 : true;
  const isAllowAction = context.playerAction.toLowerCase().trim() === 'allow';
  const stripConsentPrompts = playerHasComposure && isAllowAction;
  
  // Yield the cleaned content in chunks to simulate streaming
  const cleaned = cleanOutput(content, stripConsentPrompts);
  const chunkSize = 50;
  for (let i = 0; i < cleaned.length; i += chunkSize) {
    yield cleaned.slice(i, i + chunkSize);
    await new Promise(r => setTimeout(r, 10));
  }
}

const GLOBAL_STYLE_GUIDE = `
ABSOLUTE RULES:
- NEVER use em dashes (—). Use commas, periods, or semicolons instead.
- NEVER use euphemisms like "manhood," "core," "wetness." Use anatomical terms.
- NEVER use stylized "AI-sexy" prose or purple prose.
- Write grounded, direct, observational prose.
- Full naturalistic sentences. No dramatic short sentences for effect.
`;

export async function generateWorldIntroduction(world: GameWorld): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "grok-3",
    messages: [
      {
        role: "system",
        content: `You are a master storyteller. Create an atmospheric introduction for a new story world. This should set the scene and mood, inviting players into the narrative. Write 2-3 paragraphs.

${GLOBAL_STYLE_GUIDE}`,
      },
      {
        role: "user",
        content: `Create an introduction for this world:

Name: ${world.name}
Genre: ${world.genre}
Description: ${world.description}
Setting: ${world.setting}
Themes: ${world.themes?.join(", ") || "General"}
Starting Location: ${world.currentLocation || "The beginning"}
Time: ${world.currentTime || "Now"}

Write an immersive opening that draws players in and sets the stage for their adventure.`,
      },
    ],
    max_completion_tokens: 1024,
  });

  return response.choices[0]?.message?.content || "Your story begins...";
}

export async function generateNPC(
  world: GameWorld, 
  context: string,
  specifiedAge?: number
): Promise<{ name: string; description: string; personality: string; goals: string; factors: any }> {
  // Import the generator
  const { generateRandomFactors, buildNPCPrompt } = await import("./npcGenerator");
  
  // Generate or use specified age (default random 18-55)
  const age = specifiedAge ?? Math.floor(Math.random() * 38) + 18;
  
  // Generate psychological/developmental factors
  const factors = generateRandomFactors(age);
  
  // Build the NPC generation prompt
  const worldContext = `${world.name} - ${world.genre} set in ${world.setting}. Themes: ${world.themes?.join(", ") || "general fiction"}. Additional context: ${context}`;
  const npcPrompt = buildNPCPrompt(factors, worldContext);
  
  const response = await openai.chat.completions.create({
    model: "grok-3",
    messages: [
      {
        role: "system",
        content: `You are creating an NPC with a grounded, realistic psychology based on their genetics, upbringing, and life experiences. Return a JSON object with these fields:
- name: string (appropriate for setting)
- description: string (detailed physical appearance, 4-6 sentences, includes body, face, posture, any marks/scars, grooming, how they carry themselves)
- personality: string (synthesized from their psychological profile, 3-4 sentences)
- goals: string (what they want, both immediate and long-term)
- sexualProfile: string (attitudes, experience, preferences, hang-ups based on their history)
- darkSecret: string (something hidden, based on their profile)

${GLOBAL_STYLE_GUIDE}

Physical descriptions must reflect age and life history. A 45-year-old with childhood trauma and suboptimal nutrition looks different than a 25-year-old with secure attachment and high education. Show it in their body, posture, skin, eyes.`,
      },
      {
        role: "user",
        content: npcPrompt,
      },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 1024,
  });

  try {
    const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
    return {
      name: parsed.name || "Unknown",
      description: parsed.description || "A person of uncertain appearance.",
      personality: `${parsed.personality || ""}\n\nSexual Profile: ${parsed.sexualProfile || "Unknown"}\n\nDark Secret: ${parsed.darkSecret || "None revealed"}`,
      goals: parsed.goals || "Unclear motivations",
      factors: factors // Store the raw factors for reference
    };
  } catch {
    return {
      name: "Mysterious Stranger",
      description: "A figure of uncertain origin.",
      personality: "Enigmatic and watchful.",
      goals: "Unknown",
      factors: factors
    };
  }
}

interface AmbientResult {
  actionText: string;
  npcName: string;
  newState: string; // What the NPC is now doing (for "Also here:" line)
  clothingChange?: string; // e.g., "removed tank top" or "now wearing only jeans"
  attemptOnPlayer?: boolean; // true if NPC is acting on the player physically
  actionType?: string; // e.g., "grab_wrist", "pull_closer", "kiss"
  consumedClimaxDecision?: boolean; // true if a pending climax decision was used
}

// Define intimacy stages for progression tracking
const INTIMACY_STAGES: Record<string, number> = {
  // Non-physical
  'look': 1, 'glance': 1, 'stare': 1, 'watch': 1,
  'speak': 2, 'talk': 2, 'whisper': 2, 'say': 2,
  'step_closer': 3, 'approach': 3, 'move_closer': 3,
  // Light touch
  'touch_arm': 10, 'touch_hand': 10, 'touch_shoulder': 10, 'brush': 10,
  'grab_wrist': 12, 'grab_arm': 12, 'hold_hand': 12,
  // Closer contact  
  'pull_closer': 15, 'embrace': 15, 'hug': 15,
  'touch_face': 18, 'touch_hair': 18, 'caress': 18,
  // Kissing
  'kiss_cheek': 20, 'kiss_forehead': 20,
  'kiss': 25, 'kiss_lips': 25, 'kiss_mouth': 25,
  'kiss_neck': 28, 'kiss_throat': 28, 'kiss_jaw': 28,
  'kiss_shoulder': 30, 'kiss_collarbone': 30,
  'kiss_chest': 35, 'kiss_stomach': 38,
  'deepen_kiss': 32, 'tongue': 32,
  // Undressing
  'remove_shirt': 40, 'remove_top': 40, 'undress_upper': 40,
  'remove_pants': 45, 'remove_bottoms': 45, 'undress_lower': 45,
  'remove_underwear': 50, 'fully_undress': 55,
  // Intimate touch
  'touch_chest': 42, 'touch_breast': 45, 'touch_back': 35,
  'touch_hip': 40, 'touch_thigh': 45, 'touch_leg': 38,
  'straddle': 48, 'grind': 52, 'press_body': 46,
  // Explicit
  'touch_genitals': 60, 'genital_contact': 65,
  'oral': 70, 'penetration': 80, 'climax': 90,
};

// Get the intimacy stage from action type or text analysis
function getIntimacyStage(actionType: string | undefined, actionText: string): number {
  // First check explicit action type
  if (actionType) {
    const normalizedType = actionType.toLowerCase().replace(/[^a-z_]/g, '');
    if (INTIMACY_STAGES[normalizedType]) {
      return INTIMACY_STAGES[normalizedType];
    }
  }
  
  // Analyze text for keywords
  const text = actionText.toLowerCase();
  let maxStage = 0;
  
  for (const [keyword, stage] of Object.entries(INTIMACY_STAGES)) {
    const searchTerm = keyword.replace(/_/g, ' ');
    if (text.includes(searchTerm) || text.includes(keyword)) {
      maxStage = Math.max(maxStage, stage);
    }
  }
  
  // Additional text patterns - ONLY for actual ACTIONS, not descriptions
  // Penetration requires action verbs, not just mention
  if (/penetrat|inside (her|him|you)/i.test(text)) maxStage = Math.max(maxStage, 80);
  // Climax requires action context
  if (/(reach|hit|approach|near|having|feels?).*(orgasm|climax)/i.test(text) || 
      /\b(comes|cums|coming|cumming)\b/i.test(text)) maxStage = Math.max(maxStage, 90);
  // Genital CONTACT requires touch/action verbs - not just "see your penis" or descriptions
  if (/(touch|stroke|grab|grip|wrap|hand on|rub|lick|suck|mouth on).*(penis|cock|vagina|pussy|clit)/i.test(text) ||
      /(penis|cock).*(touch|enter|slide|thrust|inside)/i.test(text)) maxStage = Math.max(maxStage, 60);
  // Breast/nipple contact requires action verbs
  if (/(touch|grab|squeeze|grope|lick|suck|kiss|mouth on).*(breast|nipple|tit)/i.test(text)) maxStage = Math.max(maxStage, 45);
  // Undressing actions
  if (/(undress|removes?|pulls? off|takes? off).*(shirt|pants|clothes|top|dress|bra|underwear)/i.test(text)) maxStage = Math.max(maxStage, 40);
  if (text.includes('straddle') || text.includes('lap')) maxStage = Math.max(maxStage, 48);
  if (/(grind|thrust|grinding|thrusting)/i.test(text)) maxStage = Math.max(maxStage, 52);
  
  // Body progression patterns (lips/mouth moving on body)
  if (/lips.*(chest|stomach|abdomen|waist)/i.test(text)) maxStage = Math.max(maxStage, 38);
  if (/lips.*(hip|thigh|groin)/i.test(text)) maxStage = Math.max(maxStage, 55);
  if (/mouth.*(chest|stomach)/i.test(text)) maxStage = Math.max(maxStage, 38);
  if (/descent|trail.*lower|moving.*down/i.test(text)) maxStage = Math.max(maxStage, 35);
  if (/waistband|lower abdomen|above.*waist/i.test(text)) maxStage = Math.max(maxStage, 45);
  if (/inner thigh/i.test(text)) maxStage = Math.max(maxStage, 55);
  if (/grips?.*(hip|waist|thigh)/i.test(text)) maxStage = Math.max(maxStage, 42);
  if (/pinned|pin.*down|holds?.*down/i.test(text)) maxStage = Math.max(maxStage, 35);
  
  return maxStage || 15; // Default to mid-low stage if nothing detected (avoid regression errors)
}

// Get the highest intimacy stage from recent entries
function getRecentMaxStage(recentEntries: StoryEntry[]): number {
  const recentNarrations = recentEntries
    .filter(e => e.entryType === "narration")
    .slice(-3);
  
  let maxStage = 0;
  for (const entry of recentNarrations) {
    const stage = getIntimacyStage(undefined, entry.content);
    maxStage = Math.max(maxStage, stage);
  }
  return maxStage;
}

// Extract the current body position being focused on from the last entry
function extractCurrentPosition(recentEntries: StoryEntry[]): string | null {
  const lastNarration = recentEntries
    .filter(e => e.entryType === "narration")
    .slice(-1)[0];
  
  if (!lastNarration) return null;
  
  const text = lastNarration.content.toLowerCase();
  
  // Body part patterns with priority (most specific first)
  const bodyParts = [
    { pattern: /middle of (?:your |the )?chest/i, part: 'middle of chest' },
    { pattern: /center of (?:your |the )?chest/i, part: 'center of chest' },
    { pattern: /top of (?:your |the )?chest/i, part: 'top of chest' },
    { pattern: /lower (?:chest|stomach|abdomen)/i, part: 'lower stomach' },
    { pattern: /stomach|abdomen|belly/i, part: 'stomach' },
    { pattern: /chest/i, part: 'chest' },
    { pattern: /collarbone/i, part: 'collarbone' },
    { pattern: /base of (?:your |the )?neck/i, part: 'base of neck' },
    { pattern: /side of (?:your |the )?neck/i, part: 'side of neck' },
    { pattern: /neck|throat/i, part: 'neck' },
    { pattern: /jaw/i, part: 'jaw' },
    { pattern: /lips|mouth/i, part: 'lips' },
    { pattern: /ear/i, part: 'ear' },
    { pattern: /shoulder/i, part: 'shoulder' },
    { pattern: /back/i, part: 'back' },
    { pattern: /hip/i, part: 'hip' },
    { pattern: /thigh/i, part: 'thigh' },
    { pattern: /leg/i, part: 'leg' },
    { pattern: /breast|nipple/i, part: 'breast' },
    { pattern: /genital|penis|vagina|groin/i, part: 'genitals' },
  ];
  
  // Check for movement direction
  const movingDown = /moving down|trail\w* lower|descend|moves? down/i.test(text);
  
  for (const { pattern, part } of bodyParts) {
    if (pattern.test(text)) {
      return movingDown ? `${part} (moving downward)` : part;
    }
  }
  
  return null;
}

// Check if new action is a logical continuation (no teleporting)
function isLogicalContinuation(newText: string, currentPosition: string | null): boolean {
  if (!currentPosition) return true; // No position to check against
  
  const newTextLower = newText.toLowerCase();
  const posLower = currentPosition.toLowerCase();
  
  // If they were at chest moving down, they shouldn't go back to neck
  if (posLower.includes('chest') && posLower.includes('moving down')) {
    // They should NOT be going back to neck, jaw, lips
    if (/\bneck\b|\bjaw\b|\blips\b|\bmouth\b|base of.*neck/i.test(newTextLower)) {
      return false; // Teleporting backwards
    }
  }
  
  // If they were at stomach, they shouldn't go back to chest or neck
  if (posLower.includes('stomach') || posLower.includes('abdomen')) {
    if (/\bneck\b|\bjaw\b|\bcollarbone\b|\bchest\b/i.test(newTextLower)) {
      return false;
    }
  }
  
  // If at thigh/hip, shouldn't go back to stomach
  if (posLower.includes('thigh') || posLower.includes('hip')) {
    if (/\bstomach\b|\bchest\b|\bneck\b/i.test(newTextLower)) {
      return false;
    }
  }
  
  return true;
}

// Check if new text is too similar to recent entries
function isTooSimilar(newText: string, recentEntries: StoryEntry[]): boolean {
  const recentNarrations = recentEntries
    .filter(e => e.entryType === "narration")
    .slice(-5); // Check last 5 narrations
  
  if (recentNarrations.length === 0) return false;
  
  // Extract words (lowercase, remove punctuation)
  const getWords = (text: string): Set<string> => {
    return new Set(
      text.toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3) // Only meaningful words
    );
  };
  
  // Get bigrams (two-word phrases)
  const getBigrams = (text: string): Set<string> => {
    const words = text.toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2);
    const bigrams = new Set<string>();
    for (let i = 0; i < words.length - 1; i++) {
      bigrams.add(`${words[i]} ${words[i+1]}`);
    }
    return bigrams;
  };
  
  // Get trigrams (three-word phrases) - even more specific
  const getTrigrams = (text: string): Set<string> => {
    const words = text.toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2);
    const trigrams = new Set<string>();
    for (let i = 0; i < words.length - 2; i++) {
      trigrams.add(`${words[i]} ${words[i+1]} ${words[i+2]}`);
    }
    return trigrams;
  };
  
  const newWords = getWords(newText);
  const newBigrams = getBigrams(newText);
  const newTrigrams = getTrigrams(newText);
  
  for (const entry of recentNarrations) {
    const entryWords = getWords(entry.content);
    const entryBigrams = getBigrams(entry.content);
    const entryTrigrams = getTrigrams(entry.content);
    
    // Calculate word overlap
    let wordOverlap = 0;
    newWords.forEach(w => { if (entryWords.has(w)) wordOverlap++; });
    const wordSimilarity = wordOverlap / Math.max(newWords.size, 1);
    
    // Calculate bigram overlap (more specific)
    let bigramOverlap = 0;
    newBigrams.forEach(b => { if (entryBigrams.has(b)) bigramOverlap++; });
    const bigramSimilarity = bigramOverlap / Math.max(newBigrams.size, 1);
    
    // Calculate trigram overlap (most specific)
    let trigramOverlap = 0;
    newTrigrams.forEach(t => { if (entryTrigrams.has(t)) trigramOverlap++; });
    const trigramSimilarity = trigramOverlap / Math.max(newTrigrams.size, 1);
    
    // Strict: >45% word OR >20% bigram OR >12% trigram = too similar
    if (wordSimilarity > 0.45 || bigramSimilarity > 0.2 || trigramSimilarity > 0.12) {
      console.log(`[Ambient] Similarity detected: words=${(wordSimilarity*100).toFixed(0)}%, bigrams=${(bigramSimilarity*100).toFixed(0)}%, trigrams=${(trigramSimilarity*100).toFixed(0)}%`);
      return true;
    }
  }
  
  return false;
}

// Impending climax event - NPC senses and decides how to react
interface ImpendingClimaxEvent {
  narrativeText: string;      // The descriptive passage about sensing climax
  npcDecision: 'allow' | 'slow_down' | 'prevent' | 'accelerate';
  npcReasoning: string;       // Why they made this choice (for logging)
}

export async function generateImpendingClimaxEvent(
  world: GameWorld,
  npc: Character,
  isPlayerClimax: boolean,  // true = player is about to climax, false = NPC
  climaxPercent: number,
  playerHasControl: boolean
): Promise<ImpendingClimaxEvent> {
  const npcSexPers = npc.sexualPersonality || 'switch';
  const npcGoals = npc.goals || "pleasure their partner";
  const worldState = (world.worldState || {}) as Record<string, unknown>;
  const scenarioGoal = (worldState.scenarioGoal as string) || "";
  const npcStatus = npc.status as { arousal?: number; climax?: number } | null;
  const npcArousal = npcStatus?.arousal || 0;
  const npcClimax = npcStatus?.climax || 0;
  
  // Determine who is in control based on composure
  const controlDescription = playerHasControl 
    ? "The player has composure and can make decisions."
    : `The player has no composure. ${npcSexPers === 'dominant' ? 'The NPC is in full control.' : npcSexPers === 'submissive' ? 'The NPC is yielding to their instincts.' : 'Both are lost in sensation.'}`;

  const response = await openai.chat.completions.create({
    model: "grok-4",
    messages: [
      {
        role: "system",
        content: `You are writing an impending climax scene for adult interactive fiction.

NPC: ${npc.name}
NPC Sexual Personality: ${npcSexPers.toUpperCase()}
NPC Current Goals: ${npcGoals}
Scenario Goal: ${scenarioGoal}
NPC Arousal: ${npcArousal}%, NPC Climax: ${npcClimax}%

${isPlayerClimax ? "The PLAYER is about to climax." : "The NPC is about to climax."}
Current climax level: ${climaxPercent}%
${controlDescription}

WRITING STYLE:
- Blunt, literal, physical descriptions
- NO purple prose, NO "waves of ecstasy", NO "core"
- Name body parts directly: penis, vagina, testicles, clitoris
- Describe physical signs of impending climax: muscle tension, breathing, grip tightening, pace changes
- The NPC should SENSE the impending climax through physical cues (twitching, tensing, breath pattern)

NPC DECISION LOGIC based on personality and goals:
- DOMINANT NPC: Usually wants CONTROL over when partner climaxes. May slow down to edge, or push through to force climax.
- SUBMISSIVE NPC: Usually follows partner's rhythm. Allows or even accelerates if partner seems to want it.
- SWITCH NPC: Depends on current dynamic - if in control, may edge; if yielding, allows.
- Consider scenario goal: If goal is "make them beg", they might prevent. If goal is "mutual pleasure", allow.

Output JSON:
{
  "narrativeText": "3-5 sentences. Describe physical signs of impending climax. Show NPC noticing (expression, reaction). Mention the NPC's decision through action, not statement. If player has no control, note they cannot intervene.",
  "npcDecision": "allow | slow_down | prevent | accelerate",
  "npcReasoning": "Brief explanation of why (based on personality/goals)"
}`
      },
      {
        role: "user",
        content: `${isPlayerClimax ? "Player" : npc.name} is at ${climaxPercent}% climax and about to orgasm. 
        
Write the impending climax scene. The NPC should notice the physical signs and react based on their personality/goals.

If player has no control (composure = 0), make clear they cannot stop what's happening - it's entirely in the NPC's hands.`
      }
    ],
    max_completion_tokens: 400,
    temperature: 0.8,
    response_format: { type: "json_object" },
  });

  try {
    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      return {
        narrativeText: `You feel your climax approaching. ${npc.name} notices the change in your breathing.`,
        npcDecision: 'allow',
        npcReasoning: 'Default - generation failed'
      };
    }
    
    const parsed = JSON.parse(content);
    return {
      narrativeText: parsed.narrativeText || `You feel your climax approaching rapidly.`,
      npcDecision: parsed.npcDecision || 'allow',
      npcReasoning: parsed.npcReasoning || 'Unknown'
    };
  } catch {
    return {
      narrativeText: `You feel your climax building. ${npc.name} senses you're close.`,
      npcDecision: 'allow',
      npcReasoning: 'Parse error - default'
    };
  }
}

export async function generateAmbientUpdate(
  world: GameWorld,
  characters: Character[],
  recentEntries: StoryEntry[]
): Promise<AmbientResult | null> {
  const npcs = characters.filter(c => c.isNpc && c.isActive);
  if (npcs.length === 0) return null;
  
  // Select primary NPC (highest arousal)
  const primaryNpc = npcs.reduce((highest, npc) => {
    const npcArousal = (npc.status as any)?.arousal || 0;
    const highestArousal = (highest.status as any)?.arousal || 0;
    return npcArousal > highestArousal ? npc : highest;
  }, npcs[0]);
  
  // Get last 5 entries to build narrative chain (not just the last one)
  const narrativeChain = recentEntries.slice(-5);
  const lastNarration = narrativeChain
    .filter(e => e.entryType === "narration")
    .slice(-1)[0]?.content || "Scene just started.";
  
  // Build context chain summary from recent entries
  const chainSummary = narrativeChain.map((e, i) => {
    const typeLabel = e.entryType === 'player_action' ? 'PLAYER' : 'NARRATION';
    const snippet = e.content.length > 150 ? e.content.slice(0, 150) + '...' : e.content;
    return `${i + 1}. [${typeLabel}] ${snippet}`;
  }).join('\n');
  
  // Get current state
  const playerClothing = ((world.worldState as any)?.playerClothing || "fully clothed").toLowerCase();
  const playerSex = ((world.worldState as any)?.playerSex || "unknown").toLowerCase();
  const currentActivityMode = ((world.worldState as any)?.currentActivityMode) as string | undefined;
  const npcState = (world.worldState as any)?.npcStates?.[primaryNpc.name] || "present";
  
  // Build NPC personality summary
  const personality = primaryNpc.personality || "assertive and direct";
  const goals = primaryNpc.goals || "pursue sexual encounter";
  const sexualPersonality = primaryNpc.sexualPersonality || "switch";
  
  // Check for pending climax decision
  const pendingClimaxDecision = (world.worldState as any)?.pendingClimaxDecision;
  let shouldClearClimaxDecision = false;
  let climaxNote = '';
  if (pendingClimaxDecision && 
      (Date.now() - pendingClimaxDecision.timestamp) < 120000 &&
      pendingClimaxDecision.npcName === primaryNpc.name) {
    shouldClearClimaxDecision = true;
    const d = pendingClimaxDecision.decision;
    if (d === 'accelerate') climaxNote = '\nCLIMAX CONTROL: Speed up, push toward orgasm.';
    else if (d === 'slow_down') climaxNote = '\nCLIMAX CONTROL: Slow down, edge them.';
    else if (d === 'prevent') climaxNote = '\nCLIMAX CONTROL: Stop, deny release.';
  }
  
  // Simple activity mode lock
  let modeLock = '';
  if (currentActivityMode === 'oral') {
    modeLock = '\nACTIVITY: ORAL SEX (mouth on penis). Continue oral. No vaginal penetration.';
  } else if (currentActivityMode === 'penetration') {
    modeLock = '\nACTIVITY: PENETRATIVE SEX (penis in vagina). Continue penetration. No oral.';
  }
  
  // PROMPT WITH NARRATIVE CHAIN FOR CONTINUITY
  const systemPrompt = `You are ${primaryNpc.name}.

PERSONALITY: ${personality}
GOAL: ${goals}
SEXUAL TYPE: ${sexualPersonality}${climaxNote}${modeLock}

PLAYER IS: ${playerSex}, ${playerClothing}
YOUR CURRENT POSITION: ${npcState}

CRITICAL CONTINUITY RULES:
1. NEVER reset the scene - continue EXACTLY from your current position
2. If you're already touching the player, do NOT approach/move closer/step forward
3. If you're gripping/holding, ESCALATE from that grip - don't let go and re-grab
4. Actions must flow naturally from the MOST RECENT narration
5. No teleporting, no role reversals, no scene breaks

PACING RULES - VERY IMPORTANT:
- NO PENETRATION in ambient actions. Ever. Penetration requires explicit player consent.
- Build up slowly: groping → positioning → teasing → WAIT for player response
- If you want to penetrate, you must STOP and wait. Set attemptOnPlayer=true and actionType="positioning"
- Describe the anticipation, the positioning, the teasing - but do NOT insert anything
- The player MUST get a chance to react before any penetration happens

WRITING RULES:
- Write in THIRD PERSON about ${primaryNpc.name}: "${primaryNpc.name} does X" NOT "I do X"
- 6-10 DETAILED sentences. Describe: body positions, physical sensations, what hands/body parts are doing
- Name body parts directly (penis, cock, vagina, pussy, breasts, ass, asshole)
- Describe the physical details: pressure, wetness, heat, grip strength, body weight
- No euphemisms ("core", "manhood", "heat", "center", "entrance")
- No abstract feelings - only observable physical actions

Return JSON:
{
  "actionText": "6-10 detailed sentences describing physical actions, body positions, and sensations",
  "newState": "specific position (e.g. 'pressing cock against player's ass, hands on hips')",
  "attemptOnPlayer": true,
  "actionType": "groping | positioning | teasing | touching"
}`;

  const userPrompt = `RECENT NARRATIVE CHAIN (oldest to newest):
${chainSummary}

CURRENT SCENE STATE:
- You (${primaryNpc.name}) are: ${npcState}
- Player is: ${playerSex}, ${playerClothing}

MOST RECENT NARRATION (continue from here):
"${lastNarration}"

What do you do next? You MUST continue from your exact current position. Do NOT approach if you're already touching.`;

  console.log(`[Ambient] Prompt with chain (${narrativeChain.length} entries) for ${primaryNpc.name}, npcState: ${npcState}`);
  
  // Retry up to 3 times for critical errors only
  const MAX_ATTEMPTS = 3;
  
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const response = await openai.chat.completions.create({
      model: "grok-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_completion_tokens: 600,
      temperature: 0.8 + (attempt * 0.1),
      response_format: { type: "json_object" },
    });
    
    console.log(`[Ambient] Attempt ${attempt + 1}`);

    try {
      const content = response.choices[0]?.message?.content?.trim();
      if (!content) return null;
      
      const parsed = JSON.parse(content);
      const actionText = parsed.actionText || "";
      const actionLower = actionText.toLowerCase();
      
      // CRITICAL CHECK 0: First-person writing (should be third person)
      const startsWithI = actionText.trim().startsWith('I ') || actionLower.includes(' i ') && actionLower.indexOf(' i ') < 20;
      if (startsWithI && attempt < 2) {
        console.log(`[Ambient] PERSPECTIVE ERROR: Written in first person, retry ${attempt + 1}`);
        continue;
      }
      
      // CRITICAL CHECK 1: Scene regression (approaching when already touching)
      const lastLower = lastNarration.toLowerCase();
      const wasAlreadyTouching = 
        lastLower.includes('grip') || lastLower.includes('holding') ||
        lastLower.includes('pressed against') || lastLower.includes('hand on') ||
        lastLower.includes('fingers on') || lastLower.includes('touching');
      const isApproaching = 
        actionLower.includes('closes the distance') || actionLower.includes('steps closer') ||
        actionLower.includes('moves closer') || actionLower.includes('closing the gap') ||
        actionLower.includes('steps forward') || actionLower.includes('approaches') ||
        actionLower.includes('step forward') || actionLower.includes('steps into');
      const isTowelDrop = actionLower.includes('towel drop') || actionLower.includes('drops towel') || actionLower.includes('letting towel');
      
      if (wasAlreadyTouching && (isApproaching || isTowelDrop) && attempt < 2) {
        console.log(`[Ambient] REGRESSION: NPC resetting scene when already touching, retry ${attempt + 1}`);
        continue;
      }
      
      // CRITICAL CHECK 2: Wrong anatomy for player sex
      if (playerSex.includes('male') && actionLower.includes('your breast') && attempt < 2) {
        console.log(`[Ambient] ANATOMY ERROR: Breasts on male player, retry ${attempt + 1}`);
        continue;
      }
      
      // CRITICAL CHECK 3: Clothing hallucination when naked
      if (playerClothing.includes('naked') && (actionLower.includes('shirt') || actionLower.includes('fabric')) && attempt < 2) {
        console.log(`[Ambient] CLOTHING ERROR: Mentioned clothing but player naked, retry ${attempt + 1}`);
        continue;
      }
      
      // CRITICAL CHECK 4: Activity mode violation
      if (currentActivityMode === 'oral' && actionLower.includes('inside') && (actionLower.includes('vagina') || actionLower.includes('pussy')) && attempt < 2) {
        console.log(`[Ambient] MODE ERROR: Penetration while in oral mode, retry ${attempt + 1}`);
        continue;
      }
      if (currentActivityMode === 'penetration' && (actionLower.includes('suck') || (actionLower.includes('mouth') && actionLower.includes('penis'))) && attempt < 2) {
        console.log(`[Ambient] MODE ERROR: Oral while in penetration mode, retry ${attempt + 1}`);
        continue;
      }
      
      // CRITICAL CHECK 5: No penetration in ambient actions - player must consent first
      const hasPenetration = 
        actionLower.includes('slides inside') || actionLower.includes('pushes inside') ||
        actionLower.includes('enters') || actionLower.includes('thrusts into') ||
        actionLower.includes('penetrates') || actionLower.includes('pushes into') ||
        actionLower.includes('slides into') || actionLower.includes('inserts') ||
        (actionLower.includes('inside') && (actionLower.includes('ass') || actionLower.includes('pussy') || actionLower.includes('vagina')));
      if (hasPenetration && attempt < 2) {
        console.log(`[Ambient] PACING ERROR: Penetration without player consent, retry ${attempt + 1}`);
        continue;
      }
      
      console.log(`[Ambient] Generated: "${actionText.slice(0, 80)}..."`);
      
      return {
        actionText,
        npcName: primaryNpc.name,
        newState: parsed.newState || "present",
        clothingChange: parsed.clothingChange || undefined,
        attemptOnPlayer: parsed.attemptOnPlayer || false,
        actionType: parsed.actionType || undefined,
        consumedClimaxDecision: shouldClearClimaxDecision
      };
    } catch {
      return null;
    }
  }
  
  console.log(`[Ambient] All ${MAX_ATTEMPTS} attempts failed validation`);
  return null;
}
