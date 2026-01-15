# Chronicle - Collaborative Fiction Platform

## Overview

Chronicle is an AI-powered collaborative fiction platform where users create and explore persistent, evolving story worlds. Players define fictional universes with custom settings, rules, and themes, then create characters to interact within those worlds. An AI narrator responds to player actions with immersive prose, managing NPCs and world events to create dynamic interactive fiction experiences.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom dark theme optimized for immersive narrative reading
- **Build Tool**: Vite with HMR support

The frontend follows a page-based structure with reusable components. Key pages include Home (world listing), CreateWorld, GameSetup (character creation), and Game (main narrative interface). The Game page features a narrative feed, player input area, and collapsible world state sidebar.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Style**: RESTful JSON API under `/api/*` prefix
- **Runtime**: Node.js with tsx for TypeScript execution

Routes are registered in `server/routes.ts` covering CRUD operations for worlds, characters, story entries, and game sessions. The narrative engine in `server/narrative.ts` integrates with xAI's Grok-4 (2M token context) to generate contextual story responses based on world settings, character states, and player actions.

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` defines all tables
- **Migrations**: Drizzle Kit with `drizzle-kit push` for schema sync

Core entities:
- `users` - Player accounts
- `gameWorlds` - Fictional universe definitions with genre, setting, rules, themes
- `characters` - Player characters and NPCs with stats, inventory, relationships
- `storyEntries` - Narrative log with typed entries (narration, player_action, dialogue, world_event, system)
- `gameSessions` - Active play session tracking

### AI Integration
- xAI Grok-4 model with 2M token context window via OpenAI-compatible API
- Uses `XAI_API_KEY` secret for authentication, base URL: `https://api.x.ai/v1`
- System prompts constructed from world context, character data, and recent story history
- Supports streaming narrative responses
- Narrative engine includes activity mode locking (oral/penetration), climax mechanics, and composure-based consent systems

### Key Design Decisions

**Shared Schema Pattern**: Database schema and Zod validation schemas live in `shared/` directory, allowing type-safe data structures across client and server.

**Immersive Dark Theme**: CSS custom properties define a dark-first design system optimized for extended reading sessions, with serif fonts for narrative content.

**Streaming Responses**: The Game page supports real-time AI narrative streaming for immediate feedback during gameplay.

## External Dependencies

### Database
- PostgreSQL (connection via `DATABASE_URL` environment variable)
- Drizzle ORM for queries and schema management
- connect-pg-simple for session storage

### AI Services
- xAI Grok-4 via OpenAI-compatible API
- Environment variable: `XAI_API_KEY` (secret)
- Used for narrative generation, NPC creation, ambient actions, and climax event generation

### Frontend Libraries
- Radix UI primitives (dialog, popover, scroll-area, tabs, etc.)
- Embla Carousel for carousel components
- React Hook Form with Zod resolver for form handling
- date-fns for date formatting

### Build & Development
- Vite for frontend bundling with React plugin
- esbuild for server bundling in production
- Replit-specific plugins for development (cartographer, dev-banner, error overlay)

## Key Files

### Server
- `server/routes.ts` - All API endpoints including ambient NPC action generation
- `server/narrative.ts` - AI narrative generation with activity mode locking and climax events
- `server/statusEngine.ts` - Arousal, climax, and composure mechanics with trait modifiers
- `server/npcGenerator.ts` - AI-powered NPC generation with personality matrices
- `server/storage.ts` - Database interface for all CRUD operations

### Frontend Pages
- `client/src/pages/Home.tsx` - World listing and selection
- `client/src/pages/CreateWorld.tsx` - World creation form
- `client/src/pages/GameSetup.tsx` - Character creation before entering game
- `client/src/pages/Game.tsx` - Main gameplay interface with narrative feed

### Frontend Components
- `WorldStateSidebar.tsx` - Collapsible sidebar showing NPC states, clothing, activity mode
- `NarrativeFeed.tsx` - Scrolling narrative display with entry types
- `PlayerInput.tsx` - Player action input with resist/allow prompts
- `StatusDisplay.tsx` - Character arousal/climax/composure display
- `NPCDebugDialog.tsx` - Debug dialog showing NPC personality and status
- `DebugHistoryDialog.tsx` - Debug history with state snapshots

## Game Mechanics

### Character Status System
Characters have three stats tracked in `CharacterStatus`:
- **Arousal** (0-100): How turned on the character is
- **Climax** (0-100): Progress toward orgasm, triggers at 100%
- **Composure** (0-100): Mental clarity and control, at 0 the character loses agency

### Sexual Personality
`SexualPersonality` determines behavior when composure breaks:
- **Dominant**: Takes primal control, becomes aggressive/demanding
- **Submissive**: Surrenders completely, gives up all agency
- **Switch**: Context-dependent, adapts to partner's personality

### Personality Matrix
NPCs have a `PersonalityMatrix` based on developmental psychology:
- Big Five traits (extraversion, neuroticism, conscientiousness)
- Attachment style (secure, avoidant, anxious)
- Motivation style (affiliation, achievement, balanced)
- Cultural background and life stage
- Arousal triggers and inhibitors

### Activity Mode Locking
The system tracks current sexual activity (oral vs penetration) and enforces narrative consistency:
- AI cannot switch between oral and penetration without explicit transition
- Mode is detected from generated text and locked for subsequent generations
- Prevents jarring narrative switches mid-scene

### Climax Mechanics
When a character crosses 85% climax:
- Impending climax event generated with NPC decision
- NPC can accelerate, delay, edge, or stop based on personality
- Player can allow, resist, or push through (roll-based outcomes)
- Climax at 100% restores composure and resets climax to 0

### Consent System
Based on composure levels:
- Player with composure > 0 gets allow/resist prompts for NPC actions
- Player with composure = 0 has no agency, NPC acts without prompts
- Climax restores composure, returning control to player

### Pacing and Player Reaction
- **Pending Stimulation**: During ambient NPC actions, stimulation is stored as "pending" - not immediately applied
- **Player Response Required**: Stats only change when player responds with allow/resist
- **No Penetration in Ambient**: Penetration actions are blocked during ambient - player must explicitly consent first
- **Validation Checks**: AI output is validated for third-person perspective, scene continuity, and pacing rules

### Anti-Repetition Systems
Multiple layers prevent narrative repetition:
- **Similarity Detection**: `isTooSimilar()` function checks word/bigram/trigram overlap against last 5 narrations
- **Retry Loop**: Up to 5 regeneration attempts with escalating temperature (0.85 → 1.0)
- **Phrase Banning**: Recent phrases are extracted and explicitly banned in prompts
- **Continuity Checks**: Position tracking prevents teleporting back to earlier body locations
- **Progression Validation**: Rejects outputs that regress scene intensity (intimacy stage tracking)
- **Clothing State Tracking**: Prevents repeated removal of already-removed clothing
