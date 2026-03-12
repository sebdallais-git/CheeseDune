<div align="center">

# :cheese: ALPINE CHEESE RUSH :cheese:

### *The RTS nobody asked for, but the world desperately needed.*

**A Dune II clone where the spice is cheese, the worms are cows, and geopolitics is settled the way it always should have been — through dairy.**

[![Made With](https://img.shields.io/badge/Made%20With-Unreasonable%20Ambition-ff6b6b?style=for-the-badge)](#)
[![Cheese](https://img.shields.io/badge/Powered%20By-Cheese-ffd700?style=for-the-badge)](#)
[![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=threedotjs&logoColor=white)](#)
[![Lines](https://img.shields.io/badge/Lines%20of%20Code-9558-blue?style=for-the-badge)](#)
[![Framework](https://img.shields.io/badge/Framework-None.%20We%20Die%20Like%20Men-critical?style=for-the-badge)](#)

<br>

> *"In the alpine pastures of Europa, cheese is power. He who controls the cheese controls the continent."*
>
> — Sun Tzu, probably

<br>

<img src="https://img.shields.io/badge/%F0%9F%87%A8%F0%9F%87%AD_SWISS-cc0000?style=for-the-badge" alt="Swiss"> <img src="https://img.shields.io/badge/%F0%9F%87%AB%F0%9F%87%B7_FRENCH-0055a4?style=for-the-badge" alt="French"> <img src="https://img.shields.io/badge/%F0%9F%87%A9%F0%9F%87%AA_GERMAN-222222?style=for-the-badge" alt="German">

**Three nations. One resource. Zero chill.**

---

</div>

## What Is This Glorious Madness?

Alpine Cheese Rush is a **fully-featured real-time strategy game** built entirely in the browser with vanilla JavaScript and Three.js. No React. No webpack. No npm install that takes longer than the game itself. Just 9,500+ lines of handcrafted code and questionable life choices.

It's Dune II, but instead of harvesting spice on Arrakis, you're harvesting **cheese from alpine pastures** while three European nations argue about whose dairy products are superior. As they have for centuries.

### The Pitch

Imagine you're in a boardroom. The lights dim.

> *"What if... Command & Conquer... but fromage?"*

Everyone claps. A single tear rolls down the CEO's cheek. Funding secured.

---

## Features That Somehow Exist

| Feature | Status | Notes |
|---------|--------|-------|
| Full RTS base building | :white_check_mark: | 13 building types with dependency trees |
| 10 combat unit types | :white_check_mark: | Plus 3 faction-specific super units |
| 3 playable factions | :white_check_mark: | Each with full localized unit names |
| A* pathfinding | :white_check_mark: | Your units won't walk into rivers. Usually. |
| Fog of war | :white_check_mark: | Three-tier visibility. Very atmospheric. |
| AI opponents | :white_check_mark: | 5-state AI with 3 difficulty levels |
| 5-mission campaign | :white_check_mark: | With SVG briefings and story narration |
| Procedural terrain | :white_check_mark: | Perlin noise + FBM. Mountains are real. |
| Power management | :white_check_mark: | Brownouts make your turrets sad |
| Splash damage | :white_check_mark: | Siege tanks go boom in a radius |
| Vehicle squishing | :white_check_mark: | Run over infantry. Geneva suggestion. |
| **A unit that makes enemies drunk** | :white_check_mark: | **This is not a joke** |

---

## The Factions

Choose your fighter. Choose your cheese destiny.

### :switzerland: The Swiss Confederation

> *"Neutrality was never about peace. It was about choosing the right moment to strike."*

- **Color:** Red, like the blood of their enemies (and their flag)
- **Architectural Style:** Steep A-frame chalets. Intimidating yet cozy
- **Super Unit:** **Käsekanone** (Cheese Cannon) — fires molten cheese that creates lingering damage zones on the ground. Step in it. We dare you.
- **Vibe:** Precision. Efficiency. Watches that cost more than your base.

### :fr: The French Republic

> *"They laughed at our baguettes. They will not laugh at our tanks."*

- **Color:** Blue, like the sadness of their opponents
- **Architectural Style:** Elegant sloped roofs. Even war is aesthetic
- **Super Unit:** **Catapulte à Vin** (Wine Catapult) — lobs wine projectiles that make enemy units **drunk**, causing them to stumble around uselessly for 5 seconds. This is the most French weapon ever conceived.
- **Vibe:** Sophistication. Fromage. Existential dread inflicted upon others.

### :de: The German Federation

> *"We have calculated the optimal cheese-to-victory ratio. It is all of the cheese."*

- **Color:** Black, like their coffee and their mercy
- **Architectural Style:** Half-timber precision engineering
- **Super Unit:** **Bratwurst Blitz** — a fast, high-damage unit that embodies the German philosophy of *"what if we just... went faster?"*
- **Vibe:** Efficiency. Bratwurst. Overwhelming force applied methodically.

---

## The Economy of Cheese

Forget gold. Forget spice. **Cheese** is the only resource that matters.

```
                    :cow: Pasture
                        |
                        | (harvester goes brrr)
                        v
                  :cheese: Refinery ──────> :moneybag: Cheese
                        |
                        v
                   :house: Silo (stores 500 more)
                        |
                        v
              :crossed_swords: Train units and build structures
                        |
                        v
                   :trophy: Victory (or glorious defeat)
```

- Harvesters autonomously find pastures, collect cheese, and return to refineries
- Pastures regenerate at 2 cheese/sec — infinite cheese, finite patience
- No cheese = no army = existential crisis

---

## Buildings

Your cheese empire requires infrastructure.

| Building | Size | Power | Cost | What It Does |
|----------|------|-------|------|-------------|
| Construction Yard | 3x3 | +20 | — | The sacred foundation. Lose it, lose everything. |
| Power Plant | 2x2 | +30 | 200 | Keeps the lights on. Literally. |
| Refinery | 3x2 | -15 | 300 | Turns raw cheese into spendable cheese |
| Silo | 1x1 | -3 | 100 | Cheese storage. You can never have too much. |
| Barracks | 2x2 | -10 | 250 | Where boys become cheese soldiers |
| Light Factory | 3x2 | -15 | 400 | Vroom vroom |
| Heavy Factory | 3x3 | -20 | 600 | **VROOM VROOM** |
| Radar | 2x2 | -15 | 350 | See the things. Know the things. |
| Turret | 1x1 | -5 | 150 | Pew pew |
| Rocket Turret | 1x1 | -8 | 250 | **PEW PEW** |
| Repair Pad | 2x2 | -10 | 300 | Duct tape for tanks |
| Starport | 3x3 | -20 | 500 | Express delivery from orbit |
| Palace | 3x3 | -25 | 800 | Unlocks your faction's super unit. The endgame. |

---

## Military Units

| Unit | HP | Speed | Range | Damage | Cost | Fun Fact |
|------|------|-------|-------|--------|------|----------|
| Harvester | 600 | 2 | 0 | 0 | 300 | Thicc, defenseless, and absolutely essential |
| Light Infantry | 50 | 4 | 3 | 8 | 40 | Cheap and disposable, like intern labor |
| Heavy Infantry | 100 | 3 | 4 | 15 | 80 | The NCO who actually knows what they're doing |
| Rocket Infantry | 60 | 3 | 5 | 30 | 100 | 2x damage to vehicles, 0.5x to infantry. Specialists. |
| Light Vehicle | 150 | 6 | 3 | 12 | 150 | Zippy. Can squish infantry. |
| Medium Vehicle | 200 | 6 | 3 | 18 | 200 | Double-tap attack. Medium vehicle, maximum chaos. |
| Tank | 400 | 4 | 4 | 35 | 400 | The reliable one. Your emotional support vehicle. |
| Siege Tank | 500 | 3 | 6 | 50 | 500 | Splash damage. Friendly fire is just fire between friends. |
| Rocket Launcher | 300 | 3 | 7 | 40 | 600 | Longest range. Will ruin your day from across the map. |
| MCV | 800 | 2 | 0 | 0 | 1000 | Deploys into a new Construction Yard. Mobile imperialism. |

---

## Campaign

Five missions of escalating cheese-based warfare:

| # | Mission | Difficulty | Map | Opponents | Tagline |
|---|---------|-----------|-----|-----------|---------|
| 1 | First Steps | Easy | 32x32 | 1 | *"Hello world, but with tanks"* |
| 2 | Border Skirmish | Easy | 40x40 | 2 | *"Two enemies. Double the cheese drama."* |
| 3 | Alpine Assault | Medium | 48x48 | 2 | *"They're aggressive. So are your turrets."* |
| 4 | Three-Front War | Medium | 56x56 | 3 | *"Surrounded. Outgunned. Still hungry."* |
| 5 | The Grand Melee | Hard | 64x64 | 3 | *"The final battle for alpine supremacy."* |

Each mission features:
- Custom SVG briefing illustrations (we don't do clip art here)
- Faction-specific narrative and lore
- Post-battle story narration based on victory or defeat
- Campaign progress saved locally (because the cloud is just someone else's cheese)

---

## AI: Artificial Incompetence to Artificial Intelligence

The AI operates on a 5-state decision machine:

```
BUILD_POWER → BUILD_ECONOMY → BUILD_MILITARY → ATTACK → REBUILD
     ↑                                                      |
     └──────────────────────────────────────────────────────┘
```

| Difficulty | Speed | Army Cap | Damage | Behavior |
|-----------|-------|----------|--------|----------|
| **Easy** | 4x slower | 8 units | 35% | Politely incompetent |
| **Medium** | Normal | 12 units | 100% | A fair fight |
| **Hard** | 25% faster | 16 units | 100% | Targets your refineries first. Rude. |

Hard AI specifically targets your economy. It knows cheese is power. It will take yours.

---

## Tech Stack

```
Frontend:     Vanilla JavaScript (ES6 modules)
Rendering:    Three.js v0.170.0
3D Pipeline:  PBR materials, shadow mapping, particle systems
Terrain:      Perlin noise + Fractional Brownian Motion
Pathfinding:  A* (pronounced "A-star", not "A-asterisk")
UI:           HTML5 overlay + CSS (backdrop-filter blur, because we're fancy)
State:        Custom game state machine
Storage:      LocalStorage (your campaign progress survives browser crashes)
Build Tool:   None. We serve raw JS files like our ancestors intended.
Framework:    Also none. We are framework-free and emotionally unavailable.
Dependencies: Three.js. That's it. That's the list.
```

---

## Controls

| Input | Action |
|-------|--------|
| **Left Click** | Select unit / Place building |
| **Right Click** | Move / Attack target |
| **WASD / Arrows** | Pan camera |
| **Mouse Wheel** | Zoom (1x - 2x) |
| **Mouse Drag** | Orbital camera rotation |
| **Minimap Click** | Jump to location |
| **Tab** | Switch sidebar tabs |
| **Esc** | Deselect / Back to menu |

---

## How to Play

```bash
# Step 1: Clone this masterpiece
git clone https://github.com/sebdallais-git/claude-workspace.git

# Step 2: Serve it (any static server works)
cd Game/public/dune
python3 -m http.server 8000
# or
npx serve .

# Step 3: Open your browser
open http://localhost:8000

# Step 4: Choose your faction
# Step 5: Harvest cheese
# Step 6: Build an army
# Step 7: Question your life choices
# Step 8: Victory (or cheese-flavored defeat)
```

> **Note:** No `npm install`. No `node_modules` black hole consuming your disk space. Just files. Served. Like cheese on a platter.

---

## Project Structure

```
dune/
├── index.html                  # The one HTML file to rule them all
└── js/                         # 35 modules of pure determination
    ├── main.js                 # Entry point. Where dreams begin.
    ├── engine.js               # The game loop. It never stops. Never.
    ├── constants.js            # Every number that matters
    ├── game-states.js          # Menu → Game → Victory → Existential void
    │
    ├── # Rendering (the pretty part)
    ├── three-renderer.js       # Scene setup, lights, camera
    ├── three-camera.js         # Orbital camera that makes you feel powerful
    ├── three-unit-renderer.js  # 3D unit geometry (no models, just math)
    ├── three-building-renderer.js  # Procedural architecture
    ├── three-environment.js    # Terrain, skybox, vibes
    ├── three-fog.js            # Fog of war (spooky)
    ├── three-particles.js      # Explosions! (tasteful ones)
    ├── three-projectiles.js    # Things that fly and hurt
    │
    ├── # Game Logic (the smart part)
    ├── map.js                  # Tile data access
    ├── mapgen.js               # Procedural worlds via Perlin noise
    ├── units.js                # Unit lifecycle management
    ├── buildings.js            # Building lifecycle management
    ├── combat.js               # Who hits whom and how hard
    ├── economy.js              # Cheese accounting (serious business)
    ├── power.js                # Electricity management
    ├── construction.js         # Build queue with timers
    ├── fog.js                  # What you can and can't see
    ├── pathfinding.js          # A* — because units deserve dignity
    │
    ├── # AI (the scary part)
    ├── ai.js                   # AI state machine & decisions
    ├── harvester-ai.js         # Autonomous cheese collection
    │
    ├── # Features (the fun part)
    ├── campaign-stories.js     # 62KB of narrative cheese lore
    ├── factions.js             # Faction definitions & localized names
    ├── starport.js             # Orbital cheese delivery
    │
    └── # Input & UI
        ├── input.js            # Keyboard & mouse handling
        ├── sidebar.js          # Build/unit panel
        └── selection.js        # Box select & unit management
```

---

## Fun Facts

- The **Wine Catapult** applies a "drunk" debuff that makes enemy units wander randomly for 5 seconds. This is historically accurate for French warfare.
- Vehicles can **squish infantry** by driving over them. The Geneva Convention is more of a Geneva Suggestion in the Alps.
- Buildings placed **without concrete foundations** decay at 5 HP/second. Infrastructure matters.
- The **Cheese Cannon** creates lingering damage zones — essentially napalm, but dairy.
- All 3D models are **procedurally generated** from basic geometries. No artist was harmed (or hired) in the making of this game.
- The entire game runs on **one dependency** (Three.js). Your `node_modules` folder could never.
- The **Bratwurst Blitz** is the fastest super unit because of course it is. It's German.
- Campaign progress persists in **LocalStorage** because the cloud is just someone else's silo.

---

## Mandatory Disclaimers

- No actual cheese was harmed in the development of this game
- The Swiss, French, and German governments have not endorsed this product (yet)
- Side effects may include: an overwhelming urge to eat fondue, spontaneous use of the word "fromage" in daily conversation, and a newfound respect for dairy-based economies
- This game contains scenes of simulated cheese harvesting that some viewers may find... *grating*

---

<div align="center">

### Built with :cheese: and questionable priorities

*"The cheese must flow."*

<sub>9,558 lines of JavaScript · 35 modules · 0 frameworks · 1 vision · ∞ cheese</sub>

<br>

[![Star This](https://img.shields.io/badge/If%20You%20Enjoyed%20This-Star%20It-ffd700?style=for-the-badge)](#)

<br>

*the Dune abides* :sunglasses:

</div>
