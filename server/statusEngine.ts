import { CharacterStatus, PersonalityMatrix, SexualPersonality } from "@shared/schema";

export interface StatusModifier {
  arousal?: number;
  climax?: number;
  composure?: number;
}

export interface TraitEffect {
  name: string;
  description: string;
  modifiers: {
    arousalRate?: number;      // Multiplier for arousal gain
    climaxRate?: number;       // Multiplier for climax buildup
    climaxFromArousal?: boolean; // Arousal directly triggers climax (premature)
    composureBonus?: number;   // Flat bonus to composure checks
  };
}

export const TRAIT_EFFECTS: Record<string, TraitEffect> = {
  'premature_ejaculation': {
    name: 'Premature Ejaculation',
    description: 'High arousal directly builds climax without stimulation (male)',
    modifiers: { climaxFromArousal: true, climaxRate: 1.5 }
  },
  'sensitive': {
    name: 'Sensitive',
    description: 'Arousal builds faster from touch',
    modifiers: { arousalRate: 1.5 }
  },
  'experienced': {
    name: 'Experienced',
    description: 'Better control over climax',
    modifiers: { climaxRate: 0.7, composureBonus: 10 }
  },
  'easily_flustered': {
    name: 'Easily Flustered',
    description: 'Loses composure quickly when aroused',
    modifiers: { composureBonus: -20 }
  },
  'insatiable': {
    name: 'Insatiable',
    description: 'Arousal stays high, recovers slowly',
    modifiers: { arousalRate: 1.3 }
  },
  'high libido': {
    name: 'High Libido',
    description: 'Gets aroused quickly and easily',
    modifiers: { arousalRate: 1.5 }
  },
  'high_libido': {
    name: 'High Libido',
    description: 'Gets aroused quickly and easily',
    modifiers: { arousalRate: 1.5 }
  },
  'low inhibitions': {
    name: 'Low Inhibitions',
    description: 'Less mental resistance to arousal',
    modifiers: { arousalRate: 1.2, composureBonus: -15 }
  },
  'low_inhibitions': {
    name: 'Low Inhibitions',
    description: 'Less mental resistance to arousal',
    modifiers: { arousalRate: 1.2, composureBonus: -15 }
  },
  'quick_recovery': {
    name: 'Quick Recovery',
    description: 'Arousal resets faster after climax',
    modifiers: { arousalRate: 0.8 }
  },
  'multi_orgasmic': {
    name: 'Multi-Orgasmic',
    description: 'Can climax multiple times without reset',
    modifiers: { climaxRate: 0.8 }
  },
  // New climax-specific traits (checked in getClimaxGain, not via modifiers)
  'breast_sensitive': {
    name: 'Breast Sensitive',
    description: 'Can build toward climax from breast stimulation (rare)',
    modifiers: {}
  },
  'vaginal_orgasmic': {
    name: 'Vaginal Orgasmic',
    description: 'Climaxes more easily from vaginal penetration (female)',
    modifiers: {}
  },
  'anal_sensitive': {
    name: 'Anal Sensitive',
    description: 'Can climax from anal stimulation',
    modifiers: {}
  },
  'clit_focused': {
    name: 'Clitorally Focused',
    description: 'Requires direct clitoral stimulation to climax (female default)',
    modifiers: {}
  },
};

// Infer character sex from description text
export function inferSexFromDescription(description: string): CharacterSex {
  const lower = description.toLowerCase();
  
  // Female indicators
  const femaleWords = ['she', 'her', 'woman', 'female', 'girl', 'lady', 'breasts', 'vagina', 'pussy', 'clit'];
  const maleWords = ['he', 'his', 'man', 'male', 'boy', 'cock', 'penis', 'dick', 'balls'];
  
  let femaleScore = 0;
  let maleScore = 0;
  
  for (const word of femaleWords) {
    if (lower.includes(word)) femaleScore++;
  }
  for (const word of maleWords) {
    if (lower.includes(word)) maleScore++;
  }
  
  if (femaleScore > maleScore) return 'female';
  if (maleScore > femaleScore) return 'male';
  return 'other';
}

export function getTraitModifiers(traits: string[]): TraitEffect['modifiers'] {
  const combined: TraitEffect['modifiers'] = {
    arousalRate: 1,
    climaxRate: 1,
    climaxFromArousal: false,
    composureBonus: 0,
  };
  
  for (const trait of traits) {
    const effect = TRAIT_EFFECTS[trait];
    if (effect) {
      if (effect.modifiers.arousalRate) combined.arousalRate! *= effect.modifiers.arousalRate;
      if (effect.modifiers.climaxRate) combined.climaxRate! *= effect.modifiers.climaxRate;
      if (effect.modifiers.climaxFromArousal) combined.climaxFromArousal = true;
      if (effect.modifiers.composureBonus) combined.composureBonus! += effect.modifiers.composureBonus;
    }
  }
  
  return combined;
}

export type StimulationType = 
  | 'kiss' | 'touch_light' | 'touch_intimate' 
  | 'teasing' | 'groping_breast' | 'groping_ass'
  | 'stroking_penis' | 'stroking_clit' | 'fingering_vagina'
  | 'oral_penis' | 'oral_pussy' | 'licking_clit'
  | 'penetration_vaginal' | 'penetration_anal';

export type CharacterSex = 'male' | 'female' | 'other';

// Base arousal values - scaled so early contact is slow, explicit contact is faster
// Arousal is unbounded but 100 = very aroused. Early actions should take many turns.
// Climax values are BASE values that get modified by sex and traits
const STIMULATION_VALUES: Record<StimulationType, { arousal: number; baseClimax: number }> = {
  'kiss': { arousal: 2, baseClimax: 0 },             // Slow - many kisses to build arousal
  'touch_light': { arousal: 1, baseClimax: 0 },      // Very slow - casual touch
  'touch_intimate': { arousal: 4, baseClimax: 0 },   // Moderate - thigh, lower back, etc.
  'teasing': { arousal: 3, baseClimax: 0 },          // Slow - deliberate teasing
  'groping_breast': { arousal: 6, baseClimax: 0 },   // Faster - explicit sexual contact
  'groping_ass': { arousal: 5, baseClimax: 0 },      // Moderate - sexual but common
  'stroking_penis': { arousal: 10, baseClimax: 15 }, // Fast - direct genital stimulation
  'stroking_clit': { arousal: 12, baseClimax: 18 },  // Fast - direct genital stimulation
  'fingering_vagina': { arousal: 10, baseClimax: 8 }, // Moderate climax (trait-dependent)
  'oral_penis': { arousal: 12, baseClimax: 20 },     // Fast - direct male climax path
  'oral_pussy': { arousal: 14, baseClimax: 15 },     // Fast - female arousal high
  'licking_clit': { arousal: 12, baseClimax: 22 },   // Fast - primary female climax path
  'penetration_vaginal': { arousal: 15, baseClimax: 12 }, // High arousal, moderate climax
  'penetration_anal': { arousal: 10, baseClimax: 6 },     // Lower unless trait
};

// Calculate actual climax gain based on sex and traits
function getClimaxGain(
  stimType: StimulationType,
  sex: CharacterSex,
  traits: string[]
): number {
  const base = STIMULATION_VALUES[stimType]?.baseClimax || 0;
  
  // Check for traits that modify climax sensitivity
  const hasPrematureEjac = traits.includes('premature_ejaculation');
  const hasBreastSensitive = traits.includes('breast_sensitive');
  const hasVaginalOrgasmic = traits.includes('vaginal_orgasmic');
  const hasAnalSensitive = traits.includes('anal_sensitive');
  
  switch (stimType) {
    // Penis stimulation - only works for males
    case 'stroking_penis':
    case 'oral_penis':
      return sex === 'male' ? base : 0;
    
    // Vaginal penetration - males get full climax, females depend on traits
    case 'penetration_vaginal':
      if (sex === 'male') return base * 1.5; // Men climax well from penetration
      if (sex === 'female') {
        // Women: base is low unless trait
        return hasVaginalOrgasmic ? base * 1.5 : base * 0.3;
      }
      return base;
    
    // Clitoral stimulation - primary female orgasm path
    case 'stroking_clit':
    case 'licking_clit':
      return sex === 'female' ? base : 0;
    
    // Oral on pussy - effective for females
    case 'oral_pussy':
      return sex === 'female' ? base : 0;
    
    // Fingering vagina - moderate for females, trait-dependent
    case 'fingering_vagina':
      if (sex === 'female') {
        return hasVaginalOrgasmic ? base * 1.3 : base * 0.5;
      }
      return 0;
    
    // Breast groping - almost never causes climax
    case 'groping_breast':
      if (hasBreastSensitive) {
        return 5; // Small climax contribution if trait present
      }
      return 0; // No climax from breast play normally
    
    // Ass groping - never causes climax alone
    case 'groping_ass':
      return 0;
    
    // Anal penetration - low for most, trait-dependent
    case 'penetration_anal':
      if (hasAnalSensitive) {
        return base * 1.5;
      }
      return sex === 'male' ? base * 0.8 : base * 0.3; // Prostate gives males slight edge
    
    // Non-climax actions
    case 'kiss':
    case 'touch_light':
    case 'touch_intimate':
    case 'teasing':
      // Premature ejaculation trait: even non-direct stim builds small climax
      if (hasPrematureEjac && sex === 'male') {
        return 3;
      }
      return 0;
    
    default:
      return 0;
  }
}

export function applyStimulation(
  currentStatus: CharacterStatus,
  stimType: StimulationType,
  traits: string[] = [],
  sex: CharacterSex = 'male'
): { newStatus: CharacterStatus; climaxed: boolean; approachingClimax?: boolean; message?: string } {
  const mods = getTraitModifiers(traits);
  const stim = STIMULATION_VALUES[stimType] || { arousal: 5, baseClimax: 0 };
  
  let newArousal = Math.min(100, currentStatus.arousal + (stim.arousal * (mods.arousalRate || 1)));
  let newClimax = currentStatus.climax;
  let newComposure = currentStatus.composure;
  
  // Arousal affects climax rate: higher arousal = faster climax buildup
  const arousalMultiplier = 1 + (newArousal / 100);
  
  // Get climax gain based on sex and traits (not just base value)
  const baseClimaxGain = getClimaxGain(stimType, sex, traits);
  let climaxGain = baseClimaxGain * (mods.climaxRate || 1) * arousalMultiplier;
  
  newClimax = Math.min(100, newClimax + climaxGain);
  
  // Check for approaching climax (85-99%) and actual climax (100%)
  let climaxed = false;
  let approachingClimax = false;
  let message: string | undefined;
  
  if (newClimax >= 100) {
    climaxed = true;
    newClimax = 0;
    newArousal = Math.max(0, newArousal - 50); // Post-orgasm arousal drop
    newComposure = Math.min(100, newComposure + 85); // Post-climax clarity - restores nearly full control
    message = "Climax!";
  } else if (newClimax >= 85 && currentStatus.climax < 85) {
    // Just crossed the 85% threshold - approaching climax
    approachingClimax = true;
    message = "Approaching climax...";
  }
  
  // High arousal reduces composure
  if (newArousal > 70) {
    newComposure = Math.max(0, newComposure - 5 + (mods.composureBonus || 0));
  }
  
  return {
    newStatus: {
      arousal: Math.round(newArousal),
      climax: Math.round(newClimax),
      composure: Math.round(newComposure),
    },
    climaxed,
    approachingClimax,
    message,
  };
}

export function decayStatus(currentStatus: CharacterStatus): CharacterStatus {
  return {
    arousal: Math.max(0, currentStatus.arousal - 2),
    climax: Math.max(0, currentStatus.climax - 3),
    composure: Math.min(100, currentStatus.composure + 2),
  };
}

// Sexual Personality System - determines behavior when composure breaks (reaches 0)
export interface ZeroComposureBehavior {
  controllingCharacter: 'player' | 'npc' | 'mutual_surrender';
  playerBehavior: string;  // Description of how player behaves
  npcBehavior: string;     // Description of how NPC behaves
  narrativeGuidance: string; // Instructions for the AI narrator
}

// Resolve who takes control when both have 0 composure
export function resolveZeroComposureDynamics(
  playerPersonality: SexualPersonality | undefined,
  npcPersonality: SexualPersonality | undefined,
  playerComposure: number,
  npcComposure: number
): ZeroComposureBehavior {
  const playerBroken = playerComposure <= 0;
  const npcBroken = npcComposure <= 0;
  
  // Default personalities if not set
  const pPersonality = playerPersonality || 'switch';
  const nPersonality = npcPersonality || 'switch';
  
  // Case 1: Only player has broken composure
  if (playerBroken && !npcBroken) {
    return getPlayerBrokenBehavior(pPersonality);
  }
  
  // Case 2: Only NPC has broken composure
  if (!playerBroken && npcBroken) {
    return getNpcBrokenBehavior(nPersonality);
  }
  
  // Case 3: Both have broken composure
  if (playerBroken && npcBroken) {
    return getBothBrokenBehavior(pPersonality, nPersonality);
  }
  
  // Neither broken - normal gameplay
  return {
    controllingCharacter: 'player',
    playerBehavior: 'In control, can act freely',
    npcBehavior: 'Responds to player actions normally',
    narrativeGuidance: 'Normal gameplay - player has initiative',
  };
}

function getPlayerBrokenBehavior(playerPersonality: SexualPersonality): ZeroComposureBehavior {
  switch (playerPersonality) {
    case 'dominant':
      return {
        controllingCharacter: 'player',
        playerBehavior: 'Primal instincts take over. Becomes aggressive, demanding, takes what they want without restraint.',
        npcBehavior: 'Subject to player\'s primal demands',
        narrativeGuidance: 'Player loses mental control but gains PRIMAL control. They act on pure instinct - grabbing, thrusting, demanding. No more asking, only taking. Auto-generate player\'s aggressive actions.',
      };
    case 'submissive':
      return {
        controllingCharacter: 'npc',
        playerBehavior: 'Completely surrenders. Cannot resist, goes limp and pliant, whimpers and accepts whatever happens.',
        npcBehavior: 'Has full control over the helpless player',
        narrativeGuidance: 'Player has SURRENDERED all agency. They cannot act - only react. NPC can do anything to them without resistance. Generate NPC taking full advantage.',
      };
    case 'switch':
    default:
      return {
        controllingCharacter: 'npc',
        playerBehavior: 'Overwhelmed and reactive. May try to reciprocate but cannot initiate.',
        npcBehavior: 'Takes advantage of player\'s compromised state',
        narrativeGuidance: 'Player is OVERWHELMED. They respond to stimulation but can\'t think clearly enough to lead. NPC has advantage and should press it.',
      };
  }
}

function getNpcBrokenBehavior(npcPersonality: SexualPersonality): ZeroComposureBehavior {
  switch (npcPersonality) {
    case 'dominant':
      return {
        controllingCharacter: 'npc',
        playerBehavior: 'Subject to NPC\'s primal demands',
        npcBehavior: 'Primal instincts take over. Becomes aggressive, forceful, takes what they want.',
        narrativeGuidance: 'NPC has lost composure but their DOMINANT nature means they become PRIMAL. They stop asking and start taking. Player must deal with an aggressive, lustful NPC.',
      };
    case 'submissive':
      return {
        controllingCharacter: 'player',
        playerBehavior: 'Has full control over the helpless NPC',
        npcBehavior: 'Completely surrenders. Cannot resist, becomes utterly pliant and accepting.',
        narrativeGuidance: 'NPC has SURRENDERED. They will not resist anything. Player can do whatever they want to the willing, helpless NPC. NPC begs and whimpers but never refuses.',
      };
    case 'switch':
    default:
      return {
        controllingCharacter: 'player',
        playerBehavior: 'Takes advantage of NPC\'s compromised state',
        npcBehavior: 'Overwhelmed and reactive, responds desperately to stimulation.',
        narrativeGuidance: 'NPC is OVERWHELMED. They\'re desperate and reactive, moaning and squirming. Player has the initiative to push them further.',
      };
  }
}

function getBothBrokenBehavior(
  playerPersonality: SexualPersonality,
  npcPersonality: SexualPersonality
): ZeroComposureBehavior {
  // Both broken - resolve based on personality clash
  
  // Dom vs Sub = Dom wins
  if (playerPersonality === 'dominant' && npcPersonality === 'submissive') {
    return {
      controllingCharacter: 'player',
      playerBehavior: 'Primal dominant - takes the willing submissive without restraint',
      npcBehavior: 'Total surrender to the dominant player',
      narrativeGuidance: 'PERFECT MATCH: Primal dominant player meets surrendered submissive NPC. Player automatically takes aggressive control while NPC accepts everything. Generate intense, unrestrained action.',
    };
  }
  
  if (playerPersonality === 'submissive' && npcPersonality === 'dominant') {
    return {
      controllingCharacter: 'npc',
      playerBehavior: 'Total surrender to the dominant NPC',
      npcBehavior: 'Primal dominant - takes the willing submissive without restraint',
      narrativeGuidance: 'PERFECT MATCH: Primal dominant NPC meets surrendered submissive player. NPC automatically takes aggressive control. Player is helpless, accepting, possibly begging. Generate intense scene where NPC uses player completely.',
    };
  }
  
  // Dom vs Dom = power struggle, more aggressive partner wins (NPC for drama)
  if (playerPersonality === 'dominant' && npcPersonality === 'dominant') {
    return {
      controllingCharacter: 'mutual_surrender',
      playerBehavior: 'Primal and aggressive, fighting for dominance',
      npcBehavior: 'Primal and aggressive, fighting for dominance',
      narrativeGuidance: 'POWER CLASH: Two primal dominants with broken composure. Generate aggressive competition - grappling, pinning, each trying to mount the other. Neither yields easily. Raw, animalistic power struggle.',
    };
  }
  
  // Sub vs Sub = mutual surrender, tender and lost
  if (playerPersonality === 'submissive' && npcPersonality === 'submissive') {
    return {
      controllingCharacter: 'mutual_surrender',
      playerBehavior: 'Surrendered but partner also surrendered - confused, needy',
      npcBehavior: 'Surrendered but partner also surrendered - confused, needy',
      narrativeGuidance: 'MUTUAL SURRENDER: Both submissives at 0 composure. Neither leads, both wait to be taken. Generate tender, confused intimacy - clinging to each other, whimpering, grinding together with no one in control.',
    };
  }
  
  // Switch involved - adapts to partner
  if (playerPersonality === 'switch') {
    // Switch adapts to partner
    if (npcPersonality === 'dominant') {
      return {
        controllingCharacter: 'npc',
        playerBehavior: 'Adapts to dominant partner, becomes submissive',
        npcBehavior: 'Primal dominant, takes control',
        narrativeGuidance: 'Switch player adapts to dominant NPC\'s primal state. Player becomes reactive and accepting while NPC takes aggressive control.',
      };
    }
    if (npcPersonality === 'submissive') {
      return {
        controllingCharacter: 'player',
        playerBehavior: 'Adapts to submissive partner, becomes dominant',
        npcBehavior: 'Total surrender',
        narrativeGuidance: 'Switch player adapts to submissive NPC\'s surrender. Player takes control while NPC becomes pliant and accepting.',
      };
    }
  }
  
  if (npcPersonality === 'switch') {
    // NPC switch adapts to player
    if (playerPersonality === 'dominant') {
      return {
        controllingCharacter: 'player',
        playerBehavior: 'Primal dominant, takes control',
        npcBehavior: 'Adapts to dominant partner, becomes submissive',
        narrativeGuidance: 'Switch NPC adapts to dominant player\'s primal state. Player takes aggressive control while NPC becomes accepting.',
      };
    }
    if (playerPersonality === 'submissive') {
      return {
        controllingCharacter: 'npc',
        playerBehavior: 'Total surrender',
        npcBehavior: 'Adapts to submissive partner, becomes dominant',
        narrativeGuidance: 'Switch NPC adapts to submissive player\'s surrender. NPC takes control while player becomes helpless.',
      };
    }
  }
  
  // Switch vs Switch - random element, favor NPC for drama
  return {
    controllingCharacter: 'mutual_surrender',
    playerBehavior: 'Neither leads nor follows clearly - overwhelmed',
    npcBehavior: 'Neither leads nor follows clearly - overwhelmed',
    narrativeGuidance: 'Two switches at 0 composure - chaotic, reactive intimacy. Both are desperate and overwhelmed. Generate scenes where control shifts moment to moment.',
  };
}

export function detectStimulationType(actionText: string): StimulationType | null {
  const lower = actionText.toLowerCase();
  
  // Penetration - detect target (vaginal vs anal)
  if (lower.includes('penetrat') || lower.includes('fuck') || lower.includes('thrust') || lower.includes('inside')) {
    if (lower.includes('ass') || lower.includes('anal') || lower.includes('anus') || lower.includes('behind')) {
      return 'penetration_anal';
    }
    return 'penetration_vaginal'; // Default to vaginal
  }
  
  // Oral - detect target (penis vs pussy/clit)
  if (lower.includes('suck') || lower.includes('blowjob') || lower.includes('mouth on') || lower.includes('lips around')) {
    if (lower.includes('cock') || lower.includes('penis') || lower.includes('dick')) {
      return 'oral_penis';
    }
    if (lower.includes('clit')) {
      return 'licking_clit';
    }
    if (lower.includes('pussy') || lower.includes('vagina')) {
      return 'oral_pussy';
    }
    // Default based on context
    return 'oral_penis';
  }
  
  // Licking - detect target
  if (lower.includes('lick') || lower.includes('tongue')) {
    if (lower.includes('clit')) {
      return 'licking_clit';
    }
    if (lower.includes('pussy') || lower.includes('vagina')) {
      return 'oral_pussy';
    }
    if (lower.includes('cock') || lower.includes('penis')) {
      return 'oral_penis';
    }
    return 'teasing'; // General licking is just teasing
  }
  
  // Fingering - specifically vaginal (must be explicit about insertion, NOT just "her fingers")
  // Check for explicit fingering phrases
  if (lower.includes('fingers inside') || lower.includes('finger her') || lower.includes('fingering her') ||
      lower.includes('finger into her') || lower.includes('fingers into her') ||
      (lower.includes('finger') && (lower.includes('her pussy') || lower.includes('her vagina')))) {
    return 'fingering_vagina';
  }
  
  // Stroking - detect target (penis vs clit)
  if (lower.includes('stroke') || lower.includes('hand on') || lower.includes('jerking') || lower.includes('pumping')) {
    if (lower.includes('cock') || lower.includes('penis') || lower.includes('dick') || lower.includes('his')) {
      return 'stroking_penis';
    }
    if (lower.includes('clit')) {
      return 'stroking_clit';
    }
    return 'stroking_penis'; // Default to penis if ambiguous
  }
  
  // Rubbing clit specifically
  if (lower.includes('rub') && lower.includes('clit')) {
    return 'stroking_clit';
  }
  
  // Groping - distinguish breast vs ass
  if (lower.includes('grope') || lower.includes('squeeze') || lower.includes('grab') || lower.includes('fondle')) {
    if (lower.includes('breast') || lower.includes('tit') || lower.includes('nipple') || lower.includes('chest')) {
      return 'groping_breast';
    }
    if (lower.includes('ass') || lower.includes('buttock') || lower.includes('butt') || lower.includes('cheek')) {
      return 'groping_ass';
    }
    // If groping cock/balls, that's stroking
    if (lower.includes('cock') || lower.includes('penis') || lower.includes('balls')) {
      return 'stroking_penis';
    }
  }
  
  // Teasing - general
  if (lower.includes('tease') || 
      (lower.includes('trail') && (lower.includes('finger') || lower.includes('nipple') || lower.includes('inner thigh') || lower.includes('groin'))) ||
      (lower.includes('brush') && (lower.includes('nipple') || lower.includes('clit') || lower.includes('cock') || lower.includes('penis')))) {
    return 'teasing';
  }
  
  // Intimate touch
  if (lower.includes('touch') && (lower.includes('breast') || lower.includes('chest') || lower.includes('thigh') || lower.includes('between'))) {
    return 'touch_intimate';
  }
  
  // Light touch
  if (lower.includes('touch') || lower.includes('caress')) {
    return 'touch_light';
  }
  
  // Kissing
  if (lower.includes('kiss')) {
    return 'kiss';
  }
  
  return null;
}

// ================== NPC PERSONALITY-BASED AROUSAL ==================

// Derive arousal triggers from personality matrix
export function deriveArousalPreferences(matrix: PersonalityMatrix): {
  triggers: string[];
  inhibitors: string[];
  arousalRate: number;
  climaxRate: number;
} {
  const triggers: string[] = [];
  const inhibitors: string[] = [];
  let arousalRate = 1.0;
  let climaxRate = 1.0;

  // Handle nested bigFive structure or flat structure
  const bigFive = (matrix as { bigFive?: Record<string, unknown> }).bigFive || matrix;
  const extraversion = typeof bigFive.extraversion === 'number' ? bigFive.extraversion : 50;
  const neuroticism = typeof bigFive.neuroticism === 'number' ? bigFive.neuroticism : 50;
  const conscientiousness = typeof bigFive.conscientiousness === 'number' ? bigFive.conscientiousness : 50;

  // Extraversion effects
  if (extraversion > 70) {
    triggers.push('attention', 'flirtation', 'social_validation', 'variety');
    arousalRate *= 1.2; // More easily aroused by social stimuli
  } else if (extraversion < 30) {
    triggers.push('intimacy', 'privacy', 'slow_buildup', 'emotional_connection');
    inhibitors.push('public_exposure', 'rushed_pace');
    arousalRate *= 0.8; // Slower to show arousal
  }

  // Neuroticism effects
  if (neuroticism > 70) {
    triggers.push('security', 'reassurance', 'control');
    inhibitors.push('unpredictability', 'aggression', 'rejection');
    climaxRate *= 1.3; // Intense but volatile
    arousalRate *= 1.1;
  } else if (neuroticism < 30) {
    triggers.push('adventure', 'novelty', 'experimentation');
    arousalRate *= 0.9; // More controlled
    climaxRate *= 0.8;
  }

  // Conscientiousness effects
  if (conscientiousness > 70) {
    triggers.push('anticipation', 'planned_encounters', 'control');
    inhibitors.push('spontaneity', 'messiness', 'loss_of_control');
  } else if (conscientiousness < 30) {
    triggers.push('spontaneity', 'impulsiveness', 'risk');
    inhibitors.push('rigid_expectations', 'routine');
  }

  // Attachment style effects
  switch (matrix.attachmentStyle) {
    case 'secure':
      triggers.push('intimacy', 'trust', 'vulnerability', 'emotional_connection');
      arousalRate *= 1.0;
      climaxRate *= 1.0;
      break;
    case 'avoidant':
      triggers.push('independence', 'physical_focus', 'no_strings');
      inhibitors.push('emotional_demands', 'clingy_behavior', 'commitment_talk');
      arousalRate *= 0.7; // Slower emotional engagement
      climaxRate *= 1.1; // But physical response normal
      break;
    case 'anxious':
      triggers.push('attention', 'validation', 'possessiveness', 'intensity');
      inhibitors.push('rejection', 'indifference', 'distance');
      arousalRate *= 1.4; // Intense arousal seeking
      climaxRate *= 1.2;
      break;
  }

  // Motivation style effects
  if (matrix.motivationStyle === 'affiliation') {
    triggers.push('emotional_bonding', 'pleasing_partner', 'reciprocity');
  } else if (matrix.motivationStyle === 'achievement') {
    triggers.push('conquest', 'performance', 'skill_display', 'dominance');
    inhibitors.push('passivity', 'lack_of_response');
  }

  // Cultural background effects
  if (matrix.culturalBackground === 'collectivist') {
    inhibitors.push('public_display', 'shame_risk');
    arousalRate *= 0.8; // More reserved initially
  } else if (matrix.culturalBackground === 'individualist') {
    triggers.push('self_expression', 'freedom');
    arousalRate *= 1.1;
  }

  // Life stage effects
  switch (matrix.lifeStage) {
    case 'adolescence':
    case 'young_adult':
      arousalRate *= 1.3;
      climaxRate *= 1.2;
      triggers.push('novelty', 'experimentation');
      break;
    case 'adult':
      // Baseline rates
      break;
    case 'midlife':
      triggers.push('rediscovery', 'emotional_depth');
      climaxRate *= 0.9;
      break;
    case 'later_life':
      triggers.push('intimacy', 'comfort', 'familiarity');
      arousalRate *= 0.7;
      climaxRate *= 0.7;
      break;
  }

  // Add any explicit triggers/inhibitors from the matrix
  if (matrix.arousalTriggers) {
    triggers.push(...matrix.arousalTriggers);
  }
  if (matrix.arousalInhibitors) {
    inhibitors.push(...matrix.arousalInhibitors);
  }

  // Remove duplicates
  return {
    triggers: Array.from(new Set(triggers)),
    inhibitors: Array.from(new Set(inhibitors)),
    arousalRate: Math.round(arousalRate * 100) / 100,
    climaxRate: Math.round(climaxRate * 100) / 100,
  };
}

// Check if a narrative action matches NPC's arousal triggers or inhibitors
export function evaluateNpcArousalFromAction(
  actionText: string,
  matrix: PersonalityMatrix
): { arousalChange: number; message?: string } {
  const prefs = deriveArousalPreferences(matrix);
  const lower = actionText.toLowerCase();
  
  let arousalChange = 0;
  const messages: string[] = [];

  // Check triggers
  for (const trigger of prefs.triggers) {
    const triggerPatterns = getTriggerPatterns(trigger);
    for (const pattern of triggerPatterns) {
      if (lower.includes(pattern)) {
        arousalChange += 8 * prefs.arousalRate;
        break;
      }
    }
  }

  // Check inhibitors (reduce arousal)
  for (const inhibitor of prefs.inhibitors) {
    const inhibitorPatterns = getInhibitorPatterns(inhibitor);
    for (const pattern of inhibitorPatterns) {
      if (lower.includes(pattern)) {
        arousalChange -= 10;
        break;
      }
    }
  }

  // Also apply basic stimulation detection
  const stimType = detectStimulationType(actionText);
  if (stimType) {
    const baseValues: Record<StimulationType, number> = {
      'kiss': 8,
      'touch_light': 5,
      'touch_intimate': 15,
      'teasing': 10,
      'groping_breast': 18,
      'groping_ass': 15,
      'stroking_penis': 22,
      'stroking_clit': 25,
      'fingering_vagina': 22,
      'licking_clit': 25,
      'oral_penis': 25,
      'oral_pussy': 28,
      'penetration_vaginal': 30,
      'penetration_anal': 25,
    };
    arousalChange += (baseValues[stimType] || 10) * prefs.arousalRate;
  }

  return {
    arousalChange: Math.round(arousalChange),
    message: messages.length > 0 ? messages.join(' ') : undefined,
  };
}

// Map trigger keywords to text patterns
function getTriggerPatterns(trigger: string): string[] {
  const patternMap: Record<string, string[]> = {
    'attention': ['look at', 'stare', 'watching', 'eyes on', 'gaze'],
    'flirtation': ['flirt', 'tease', 'playful', 'wink', 'smile'],
    'social_validation': ['compliment', 'beautiful', 'gorgeous', 'attractive', 'hot'],
    'variety': ['new', 'different', 'surprise', 'unexpected'],
    'intimacy': ['close', 'hold', 'embrace', 'together', 'near'],
    'privacy': ['alone', 'private', 'just us', 'no one'],
    'slow_buildup': ['slowly', 'gentle', 'soft', 'careful'],
    'emotional_connection': ['feel', 'care', 'trust', 'love', 'connection'],
    'security': ['safe', 'protect', 'trust', 'secure'],
    'reassurance': ['okay', 'it\'s fine', 'don\'t worry', 'i\'m here'],
    'control': ['let me', 'i\'ll', 'take charge', 'lead'],
    'adventure': ['dare', 'risk', 'try', 'explore'],
    'novelty': ['first time', 'never', 'new'],
    'experimentation': ['try', 'experiment', 'what if'],
    'anticipation': ['wait', 'later', 'soon', 'build'],
    'spontaneity': ['sudden', 'impulse', 'now', 'quick'],
    'vulnerability': ['open', 'honest', 'real', 'vulnerable'],
    'dominance': ['command', 'order', 'make you', 'obey'],
    'submission': ['please', 'yours', 'do what you want', 'surrender'],
    'intensity': ['hard', 'deep', 'more', 'intense'],
    'conquest': ['take', 'claim', 'win', 'conquer'],
    'performance': ['show', 'watch me', 'skill'],
    'possessiveness': ['mine', 'belong', 'only me'],
    'validation': ['want you', 'need you', 'desire'],
  };
  return patternMap[trigger] || [];
}

// Map inhibitor keywords to text patterns
function getInhibitorPatterns(inhibitor: string): string[] {
  const patternMap: Record<string, string[]> = {
    'public_exposure': ['everyone', 'people', 'watching', 'public', 'someone might'],
    'rushed_pace': ['hurry', 'quick', 'fast', 'now now', 'impatient'],
    'aggression': ['force', 'hurt', 'rough', 'violent', 'hit'],
    'rejection': ['no', 'stop', 'don\'t want', 'not interested', 'leave'],
    'unpredictability': ['random', 'chaotic', 'confusing'],
    'emotional_demands': ['commit', 'forever', 'promise', 'love me'],
    'clingy_behavior': ['don\'t leave', 'stay with me', 'never go'],
    'indifference': ['don\'t care', 'whatever', 'fine'],
    'distance': ['away', 'leave', 'space', 'alone'],
    'shame_risk': ['what if', 'they\'ll know', 'embarrass'],
  };
  return patternMap[inhibitor] || [];
}

// Apply stimulation to an NPC using their personality matrix
export function applyNpcStimulation(
  currentStatus: CharacterStatus,
  actionText: string,
  matrix: PersonalityMatrix,
  traits: string[] = []
): { newStatus: CharacterStatus; climaxed: boolean; approachingClimax?: boolean; arousalMessage?: string } {
  const prefs = deriveArousalPreferences(matrix);
  const { arousalChange, message } = evaluateNpcArousalFromAction(actionText, matrix);
  const traitMods = getTraitModifiers(traits);

  // Calculate new arousal - apply trait modifiers
  const traitArousalRate = traitMods.arousalRate || 1;
  let newArousal = Math.min(100, Math.max(0, currentStatus.arousal + (arousalChange * traitArousalRate)));
  
  // Calculate climax buildup based on arousal level
  const arousalMultiplier = 1 + (newArousal / 100);
  let climaxGain = 0;
  
  if (newArousal > 30) {
    // Only build climax when sufficiently aroused
    // NOTE: For NPCs, we assume female sex for now - can be enhanced to read from character data
    const stimType = detectStimulationType(actionText);
    if (stimType) {
      // NPC climax values - these will be zero for non-direct stimulation
      // The actual climax should come from applyStimulation with sex param
      const climaxValues: Record<StimulationType, number> = {
        'kiss': 0,
        'touch_light': 0,
        'touch_intimate': 0,
        'teasing': 0,
        'groping_breast': 0,  // No climax from breast alone
        'groping_ass': 0,     // No climax from ass alone
        'stroking_penis': 0,  // NPC assumed female
        'stroking_clit': 20,  // Primary female climax
        'fingering_vagina': 8, // Secondary, trait dependent
        'licking_clit': 22,   // Primary female climax
        'oral_penis': 0,      // NPC assumed female
        'oral_pussy': 18,     // Good for female
        'penetration_vaginal': 5, // Low unless vaginal_orgasmic trait
        'penetration_anal': 2,    // Very low
      };
      climaxGain = (climaxValues[stimType] || 0) * prefs.climaxRate * arousalMultiplier * (traitMods.climaxRate || 1);
    }
  }

  let newClimax = Math.min(100, currentStatus.climax + climaxGain);
  let newComposure = currentStatus.composure;

  // Check for approaching climax and actual climax
  let climaxed = false;
  let approachingClimax = false;
  if (newClimax >= 100) {
    climaxed = true;
    newClimax = 0;
    newArousal = Math.max(0, newArousal - 40);
    newComposure = Math.min(100, newComposure + 85); // Post-climax clarity - restores nearly full control
  } else if (newClimax >= 85 && currentStatus.climax < 85) {
    approachingClimax = true;
  }

  // High arousal affects composure
  if (newArousal > 60) {
    newComposure = Math.max(0, newComposure - 3);
  }

  return {
    newStatus: {
      arousal: Math.round(newArousal),
      climax: Math.round(newClimax),
      composure: Math.round(newComposure),
    },
    climaxed,
    approachingClimax,
    arousalMessage: message,
  };
}
