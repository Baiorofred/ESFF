// NPC Generation System based on genetics, life history, and developmental factors

export interface NPCFactors {
  age: number;
  ageCategory: "childhood" | "adolescence" | "adulthood" | "laterLife";
  genetics: GeneticFactors;
  prenatal: PrenatalFactors;
  family: FamilyFactors;
  cultural: CulturalFactors;
  lifeHistory: LifeHistoryFactors[];
}

interface GeneticFactors {
  extraversion: "high" | "low";
  neuroticism: "high" | "low";
  conscientiousness: "high" | "low";
  motivation: "affiliation" | "achievement";
}

interface PrenatalFactors {
  hormones: "typical" | "elevated_testosterone";
  nutrition: "typical" | "suboptimal";
  complications: "none" | "minor";
}

interface FamilyFactors {
  attachment: "secure" | "avoidant" | "anxious";
  parenting: "authoritative" | "permissive";
  trauma: "none" | "moderate";
}

interface CulturalFactors {
  culture: "individualist" | "collectivist";
  peers: "supportive" | "competitive";
  education: "high" | "limited";
}

interface LifeHistoryFactors {
  type: string;
  description: string;
}

// Impact tables based on the provided ruleset
const IMPACT_TABLES = {
  genetics: {
    extraversion: {
      high: {
        childhood: "Energetic play, easy friendships, desires group activities, impulsive if unchecked",
        adolescence: "Seeks popularity and leadership, flirtatious as sexual desires emerge, minor rule-breaking for attention",
        adulthood: "Career goals in social fields, strong affiliation needs, overcommitment flaws, prefers varied partners",
        laterLife: "Community involvement, fears isolation, may have hidden affairs from past"
      },
      low: {
        childhood: "Prefers solo activities, needs quiet time, shy, identity as independent",
        adolescence: "Avoids crowds, personal hobbies, internalized sexual desires, hidden anxieties",
        adulthood: "Career in solitary work, social avoidance, stable but private sexuality",
        laterLife: "Content with small circles, intellectual pursuits, regret over missed connections"
      }
    },
    neuroticism: {
      high: {
        childhood: "Frequent worries, attachment needs, tantrums, desires security",
        adolescence: "Heightened stress in changes, goals for stability, dark secrets from fears",
        adulthood: "Risky behaviors to cope, sexual desires influenced by insecurity, relationship flaws",
        laterLife: "Chronic stress affects health, aspirations for peace, hidden phobias"
      },
      low: {
        childhood: "Calm in crises, goals for exploration, minimal flaws",
        adolescence: "Confident, desires adventure",
        adulthood: "Bold decisions, safe sexual exploration",
        laterLife: "Steady career, wants fulfillment, dark secrets rare"
      }
    },
    conscientiousness: {
      high: {
        childhood: "Structured routines, desires achievement, rigid",
        adolescence: "Good student, goals for rewards",
        adulthood: "Ambitious plans, disciplined sexual desires",
        laterLife: "Successful career, aspirations for leadership"
      },
      low: {
        childhood: "Creative play, disorganized",
        adolescence: "Procrastination, forgotten duties",
        adulthood: "Impulsive choices, sexual risks",
        laterLife: "Adaptable jobs, wants freedom, unreliable"
      }
    },
    motivation: {
      affiliation: {
        childhood: "Seeks bonds, needs belonging",
        adolescence: "Close family ties, desires playmates",
        adulthood: "Romantic pursuits, relational sexual desires",
        laterLife: "Partnership goals, dark secrets from betrayals"
      },
      achievement: {
        childhood: "Competitive games, goals for wins",
        adolescence: "Academic drive, perfectionism flaws",
        adulthood: "Career ambitions, sexual desires secondary",
        laterLife: "Professional peaks, aspirations for status"
      }
    }
  },
  prenatal: {
    hormones: {
      typical: {
        childhood: "Normal development, desires exploration",
        adolescence: "Balanced play, identity formation",
        adulthood: "Typical development, sexual orientation emerges naturally",
        laterLife: "Stable health, goals maintained"
      },
      elevated_testosterone: {
        childhood: "Assertive behaviors, aggressive flaws",
        adolescence: "Rough play, dark secrets from fights",
        adulthood: "Competitive, dominant sexual desires",
        laterLife: "Leadership roles, aspirations for control"
      }
    },
    nutrition: {
      typical: {
        childhood: "Normal growth and development",
        adolescence: "Standard physical development",
        adulthood: "Healthy baseline",
        laterLife: "Normal aging patterns"
      },
      suboptimal: {
        childhood: "Slower growth, needs more support",
        adolescence: "Learning delays, focus flaws",
        adulthood: "Risk for obesity, sexual self-image issues",
        laterLife: "Health management concerns, body image secrets"
      }
    },
    complications: {
      none: {
        childhood: "Robust health",
        adolescence: "Standard development",
        adulthood: "Good baseline health",
        laterLife: "Normal aging"
      },
      minor: {
        childhood: "Vulnerability to illness, desires safety",
        adolescence: "Cautious play, identity as fragile",
        adulthood: "Anxiety in risks, sexual hesitancy",
        laterLife: "Chronic conditions, aspirations for wellness"
      }
    }
  },
  family: {
    attachment: {
      secure: {
        childhood: "Confident exploration, desires trust",
        adolescence: "Strong bonds, goals for sharing",
        adulthood: "Healthy relationships, open sexual desires",
        laterLife: "Committed partnerships, aspirations for family"
      },
      avoidant: {
        childhood: "Independent, emotionally distant",
        adolescence: "Solo activities, hidden dark secrets",
        adulthood: "Guarded romances, sexual detachment",
        laterLife: "Career focus, wants autonomy"
      },
      anxious: {
        childhood: "Clingy, needs reassurance",
        adolescence: "Fears abandonment, jealousy flaws",
        adulthood: "Intense crushes, sexual insecurities",
        laterLife: "Volatile relationships, dark secrets from obsessions"
      }
    },
    parenting: {
      authoritative: {
        childhood: "Discipline with warmth, goals for self-reliance",
        adolescence: "Good behavior, positive identity",
        adulthood: "Academic success, healthy sexual education",
        laterLife: "Balanced life, aspirations for growth"
      },
      permissive: {
        childhood: "Freedom, boundary flaws",
        adolescence: "Spoiled tendencies, desires indulgence",
        adulthood: "Risky behaviors, sexual experimentation",
        laterLife: "Adaptability, dark secrets from excesses"
      }
    },
    trauma: {
      none: {
        childhood: "Stable upbringing",
        adolescence: "Normal development",
        adulthood: "Secure foundation",
        laterLife: "Emotional stability"
      },
      moderate: {
        childhood: "Resilience building, needs healing",
        adolescence: "Emotional ups/downs, buried dark secrets",
        adulthood: "Identity crises, possible sexual confusion",
        laterLife: "Therapy-seeking, aspirations for stability"
      }
    }
  },
  cultural: {
    culture: {
      individualist: {
        childhood: "Personal goals, desires independence",
        adolescence: "Achievement focus, unique identity",
        adulthood: "Career planning, sexual freedom",
        laterLife: "Self-made success, aspirations for legacy"
      },
      collectivist: {
        childhood: "Harmony needs, suppression flaws",
        adolescence: "Group play, conformity secrets",
        adulthood: "Duty-bound choices, strict sexual norms",
        laterLife: "Community roles, wants contribution"
      }
    },
    peers: {
      supportive: {
        childhood: "Social skills, desires belonging",
        adolescence: "Playgroups, affirmed identity",
        adulthood: "Positive peer influence, sexual discussions",
        laterLife: "Networks for goals, shared aspirations"
      },
      competitive: {
        childhood: "Drive to excel, envy flaws",
        adolescence: "Comparisons, inadequacy secrets",
        adulthood: "Academic pressure, sexual competition",
        laterLife: "Professional rivalries, wants superiority"
      }
    },
    education: {
      high: {
        childhood: "Knowledge-seeking, career goals",
        adolescence: "Curious learning, intellectual identity",
        adulthood: "Skill-building, sexual maturity through exposure",
        laterLife: "Expertise, aspirations for advancement"
      },
      limited: {
        childhood: "Practical skills, desires stability",
        adolescence: "Hands-on play, self-doubt flaws",
        adulthood: "Trade focus, pragmatic sexual desires",
        laterLife: "Steady jobs, dark secrets about paths not taken"
      }
    }
  }
};

// Life events that can happen at different ages
const LIFE_EVENTS = {
  adulthood: [
    { type: "career_milestone", description: "Significant promotion or career transition" },
    { type: "relationship_start", description: "Entered a significant romantic relationship" },
    { type: "relationship_end", description: "Divorce or major breakup" },
    { type: "job_loss", description: "Lost job, developed coping mechanisms" },
    { type: "opportunity", description: "Unexpected positive turn, new doors opened" },
    { type: "exploration", description: "Period of identity questioning and experimentation" }
  ],
  laterLife: [
    { type: "midlife_stability", description: "Seeking balance between work and personal life" },
    { type: "midlife_crisis", description: "Questioning past choices, seeking change" },
    { type: "health_event", description: "Medical issue that changed perspective" },
    { type: "loss", description: "Death of someone close, period of grief" },
    { type: "reflection", description: "Looking back, making peace with choices" }
  ]
};

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBoolean(probability: number = 0.5): boolean {
  return Math.random() < probability;
}

function getAgeCategory(age: number): "childhood" | "adolescence" | "adulthood" | "laterLife" {
  if (age < 13) return "childhood";
  if (age < 20) return "adolescence";
  if (age < 50) return "adulthood";
  return "laterLife";
}

export function generateRandomFactors(age: number): NPCFactors {
  const ageCategory = getAgeCategory(age);
  
  // Generate genetic factors (these are fixed from birth)
  const genetics: GeneticFactors = {
    extraversion: randomBoolean() ? "high" : "low",
    neuroticism: randomBoolean(0.4) ? "high" : "low", // Slightly less common to be high
    conscientiousness: randomBoolean() ? "high" : "low",
    motivation: randomBoolean() ? "affiliation" : "achievement"
  };
  
  // Generate prenatal factors
  const prenatal: PrenatalFactors = {
    hormones: randomBoolean(0.15) ? "elevated_testosterone" : "typical",
    nutrition: randomBoolean(0.3) ? "suboptimal" : "typical",
    complications: randomBoolean(0.1) ? "minor" : "none"
  };
  
  // Generate family factors
  const family: FamilyFactors = {
    attachment: randomChoice(["secure", "secure", "secure", "avoidant", "anxious"]) as any, // 60% secure
    parenting: randomBoolean(0.7) ? "authoritative" : "permissive",
    trauma: randomBoolean(0.25) ? "moderate" : "none"
  };
  
  // Generate cultural factors
  const cultural: CulturalFactors = {
    culture: randomBoolean() ? "individualist" : "collectivist",
    peers: randomBoolean(0.7) ? "supportive" : "competitive",
    education: randomBoolean(0.6) ? "high" : "limited"
  };
  
  // Generate life history events based on age
  const lifeHistory: LifeHistoryFactors[] = [];
  if (ageCategory === "adulthood" || ageCategory === "laterLife") {
    // Add 1-3 adult life events
    const numEvents = Math.floor(Math.random() * 3) + 1;
    const availableEvents = [...LIFE_EVENTS.adulthood];
    for (let i = 0; i < numEvents && availableEvents.length > 0; i++) {
      const idx = Math.floor(Math.random() * availableEvents.length);
      lifeHistory.push(availableEvents.splice(idx, 1)[0]);
    }
  }
  if (ageCategory === "laterLife") {
    // Add 1-2 later life events
    const numEvents = Math.floor(Math.random() * 2) + 1;
    const availableEvents = [...LIFE_EVENTS.laterLife];
    for (let i = 0; i < numEvents && availableEvents.length > 0; i++) {
      const idx = Math.floor(Math.random() * availableEvents.length);
      lifeHistory.push(availableEvents.splice(idx, 1)[0]);
    }
  }
  
  return {
    age,
    ageCategory,
    genetics,
    prenatal,
    family,
    cultural,
    lifeHistory
  };
}

export function buildNPCPrompt(factors: NPCFactors, worldContext: string): string {
  const cat = factors.ageCategory;
  
  // Gather all the impacts for this age category
  const impacts: string[] = [];
  
  // Genetics impacts
  impacts.push(`Extraversion (${factors.genetics.extraversion}): ${IMPACT_TABLES.genetics.extraversion[factors.genetics.extraversion][cat]}`);
  impacts.push(`Neuroticism (${factors.genetics.neuroticism}): ${IMPACT_TABLES.genetics.neuroticism[factors.genetics.neuroticism][cat]}`);
  impacts.push(`Conscientiousness (${factors.genetics.conscientiousness}): ${IMPACT_TABLES.genetics.conscientiousness[factors.genetics.conscientiousness][cat]}`);
  impacts.push(`Motivation (${factors.genetics.motivation}): ${IMPACT_TABLES.genetics.motivation[factors.genetics.motivation][cat]}`);
  
  // Prenatal impacts
  impacts.push(`Hormonal: ${IMPACT_TABLES.prenatal.hormones[factors.prenatal.hormones][cat]}`);
  if (factors.prenatal.nutrition === "suboptimal") {
    impacts.push(`Nutrition: ${IMPACT_TABLES.prenatal.nutrition.suboptimal[cat]}`);
  }
  if (factors.prenatal.complications === "minor") {
    impacts.push(`Birth complications: ${IMPACT_TABLES.prenatal.complications.minor[cat]}`);
  }
  
  // Family impacts
  impacts.push(`Attachment (${factors.family.attachment}): ${IMPACT_TABLES.family.attachment[factors.family.attachment][cat]}`);
  impacts.push(`Parenting (${factors.family.parenting}): ${IMPACT_TABLES.family.parenting[factors.family.parenting][cat]}`);
  if (factors.family.trauma === "moderate") {
    impacts.push(`Childhood trauma: ${IMPACT_TABLES.family.trauma.moderate[cat]}`);
  }
  
  // Cultural impacts
  impacts.push(`Culture (${factors.cultural.culture}): ${IMPACT_TABLES.cultural.culture[factors.cultural.culture][cat]}`);
  impacts.push(`Peers (${factors.cultural.peers}): ${IMPACT_TABLES.cultural.peers[factors.cultural.peers][cat]}`);
  impacts.push(`Education (${factors.cultural.education}): ${IMPACT_TABLES.cultural.education[factors.cultural.education][cat]}`);
  
  // Life history
  const lifeEvents = factors.lifeHistory.map(e => e.description).join("; ");
  
  return `Generate an NPC for this world: ${worldContext}

AGE: ${factors.age} years old (${factors.ageCategory})

PSYCHOLOGICAL PROFILE (based on genetics, upbringing, and life experiences):
${impacts.map(i => `- ${i}`).join("\n")}

LIFE EVENTS: ${lifeEvents || "None significant yet"}

Based on this profile, create a complete character with:
1. NAME: Appropriate for the setting
2. PHYSICAL APPEARANCE: Describe their body in detail. Their appearance should reflect their age, life history, and personality. Include height, build, skin, hair, face, posture, any scars or marks from their history, how they carry themselves, grooming habits.
3. PERSONALITY: Synthesize the psychological factors above into a coherent personality. Include goals, flaws, desires, and at least one dark secret.
4. CURRENT STATE: What are they doing when encountered? What do they want right now?
5. SEXUAL CHARACTERISTICS: Based on their profile, describe their attitudes, experience level, preferences, and any hang-ups.

Write the character in a way that feels grounded and realistic. Their physical appearance should match their psychology and history.`;
}
