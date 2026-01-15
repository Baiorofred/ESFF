# Design Guidelines: Text-Based Interactive Fiction Universe

## Design Approach
**Selected Approach:** Design System - Material Design adapted for dark, immersive narrative experience
**Rationale:** Utility-focused application requiring clear information hierarchy, persistent readability, and structured interaction patterns for text-heavy content.

**Key Principles:**
- Immersive narrative focus with minimal UI distraction
- Clear visual distinction between player input, AI narration, and system messages
- Scannable history with contextual threading
- Sophisticated, mature aesthetic appropriate for adult content

---

## Typography System

**Primary Typeface:** Inter (body text, UI elements)
**Secondary Typeface:** Crimson Pro or Merriweather (narrative content)

**Hierarchy:**
- Narrative text: text-lg/text-xl (20-24px), leading-relaxed for comfortable reading
- Player dialogue: text-base (16px), medium weight
- System messages: text-sm (14px), opacity-70
- Section headers: text-2xl (24px), font-semibold
- UI labels: text-xs uppercase tracking-wide

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 8, 12 (p-2, m-4, gap-8, py-12)

**Core Layout:**
- Full-height application (100vh) with fixed header and scrollable content area
- Primary content: max-w-4xl centered narrative feed
- Sidebar: w-80 for world state, character sheets, history navigation
- Input area: Fixed bottom with h-32 for text entry and action buttons

---

## Component Library

### Navigation & Header
- Fixed top bar with game title, world state indicator, settings icon
- Session indicator showing active players (presence badges)
- Quick access menu (hamburger on mobile) for game history, rules, character management

### Content Feed (Primary Interface)
- Message-style threading with clear visual separation:
  - AI Narration: Full-width prose blocks, serif font, subtle border-left accent
  - Player 1 Input: Right-aligned, sans-serif, distinct background treatment
  - Player 2 Input: Left-aligned, sans-serif, alternate background treatment
  - System Events: Centered, italic, reduced opacity
- Timestamps for each entry
- Collapse/expand functionality for long narrative sections

### Sidebar Components
- **World State Panel:** Current location, time, active NPCs, key items
- **Character Sheet:** Stats, inventory, relationship status (collapsible cards)
- **Timeline Navigator:** Scrollable history with chapter markers
- **Quick Actions:** Saved commands, frequently used actions

### Input System
- Multi-line text area with markdown support indicators
- Action button row: Submit, Dice Roll, Inventory, Character Actions
- Character count and AI processing status indicator
- Suggestion chips for contextual actions (appears based on game state)

### Data Displays
- Stat bars for character attributes (horizontal progress bars)
- Inventory grid with icon placeholders + item names
- Relationship meters (NPC affinity/hostility indicators)
- Modal overlays for detailed character/location information

### Overlays & Modals
- Full-screen overlay for game setup/configuration
- Medium modal for character creation/editing (max-w-2xl)
- Small popover for quick stats/tooltips
- Confirmation dialogs for significant choices

---

## Images

**No hero image required** - this is an application interface, not a landing page.

**Icon Usage:** Heroicons via CDN for all UI icons (settings, menu, dice, inventory, etc.)

**Placeholder Areas:**
- Character portraits (circular avatars, 48px in sidebar, 96px in sheets)
- Location thumbnails in timeline (16:9 ratio, 200x112px)
- Item icons in inventory (square 64px)

---

## Animations

**Minimal, purposeful animations only:**
- Fade-in for new narrative entries (200ms)
- Slide-in for sidebar panels
- Pulse effect on AI processing indicator
- NO scroll-triggered effects, NO decorative animations

---

## Accessibility

- Maintain WCAG AA contrast ratios for all text (especially important for long reading sessions)
- Keyboard navigation for all interactive elements (Tab, Arrow keys for history navigation)
- Focus indicators on all inputs and buttons
- Alt text for all character/location imagery
- Screen reader labels for icon-only buttons

---

## Responsive Behavior

**Desktop (lg+):** Full layout with sidebar visible
**Tablet (md):** Collapsible sidebar, full content feed
**Mobile:** Stacked layout, bottom navigation tabs (Feed/World/Characters), input area expands on focus