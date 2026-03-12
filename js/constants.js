// Game/public/dune/js/constants.js
export const TILE_SIZE = 32;
export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 800;
export const SIDEBAR_WIDTH = 160;
export const BOTTOM_BAR_HEIGHT = 60;
export const TOP_BAR_HEIGHT = 30;
// Viewport = area where the map renders (excluding sidebar and bars)
export const VIEWPORT_WIDTH = CANVAS_WIDTH - SIDEBAR_WIDTH;
export const VIEWPORT_HEIGHT = CANVAS_HEIGHT - TOP_BAR_HEIGHT - BOTTOM_BAR_HEIGHT;

// Terrain tile types
export const Terrain = {
  MEADOW: 0,
  MOUNTAIN: 1,
  PASTURE: 2,
  FOREST: 3,
  RIVER: 4,
  BRIDGE: 5,
  SNOW: 6,
  CONCRETE: 7,
  BARE: 8,
};

// Terrain colors (top-down, base colors — later phases add detail)
export const TERRAIN_COLORS = {
  [Terrain.MEADOW]:   '#4a8c3f',
  [Terrain.MOUNTAIN]: '#6b6b6b',
  [Terrain.PASTURE]:  '#6abf4b',
  [Terrain.FOREST]:   '#2d6b1e',
  [Terrain.RIVER]:    '#3366cc',
  [Terrain.BRIDGE]:   '#8b7355',
  [Terrain.SNOW]:     '#e8e8f0',
  [Terrain.CONCRETE]: '#999999',
  [Terrain.BARE]:     '#a08860',
};

// Terrain properties
export const TERRAIN_PASSABLE = {
  [Terrain.MEADOW]: true,
  [Terrain.MOUNTAIN]: false,
  [Terrain.PASTURE]: true,
  [Terrain.FOREST]: true,
  [Terrain.RIVER]: false,
  [Terrain.BRIDGE]: true,
  [Terrain.SNOW]: true,
  [Terrain.CONCRETE]: true,
  [Terrain.BARE]: true,
};

export const TERRAIN_BUILDABLE = {
  [Terrain.MEADOW]: true,
  [Terrain.CONCRETE]: true,
  [Terrain.BARE]: true,
};

// Movement speed multipliers per terrain
export const TERRAIN_SPEED = {
  [Terrain.MEADOW]: 1.0,
  [Terrain.PASTURE]: 1.0,
  [Terrain.FOREST]: 0.5,
  [Terrain.BRIDGE]: 1.0,
  [Terrain.SNOW]: 0.7,
  [Terrain.CONCRETE]: 1.0,
  [Terrain.BARE]: 1.0,
};

// Fog of war states
export const FogState = {
  HIDDEN: 0,    // Never seen — black
  REVEALED: 1,  // Previously seen — terrain visible, no units
  VISIBLE: 2,   // Currently in vision range — fully visible
};

// Zoom constraints
export const MIN_ZOOM = 1.0;
export const MAX_ZOOM = 2.0;

// Unit type IDs
export const UnitType = {
  HARVESTER: 'harvester',
  LIGHT_INFANTRY: 'lightInfantry',
  HEAVY_INFANTRY: 'heavyInfantry',
  ROCKET_INFANTRY: 'rocketInfantry',
  LIGHT_VEHICLE: 'lightVehicle',
  MEDIUM_VEHICLE: 'mediumVehicle',
  TANK: 'tank',
  SIEGE_TANK: 'siegeTank',
  ROCKET_LAUNCHER: 'rocketLauncher',
  MCV: 'mcv',
};

// Super unit type IDs (one per faction, built at Palace)
export const SuperUnitType = {
  CHEESE_CANNON: 'cheeseCannon',
  WINE_CATAPULT: 'wineCatapult',
  BRATWURST_BLITZ: 'bratwurstBlitz',
};

// Unit stats by type
export const UnitStats = {
  [UnitType.HARVESTER]:        { hp: 600, speed: 2, range: 0, damage: 0,  attackSpeed: 0,   cost: 300,  buildTime: 20, category: 'vehicle',  visionRadius: 5 },
  [UnitType.LIGHT_INFANTRY]:   { hp: 50,  speed: 4, range: 3, damage: 8,  attackSpeed: 1.0, cost: 40,   buildTime: 8,  category: 'infantry', visionRadius: 4 },
  [UnitType.HEAVY_INFANTRY]:   { hp: 100, speed: 3, range: 4, damage: 15, attackSpeed: 0.8, cost: 80,   buildTime: 12, category: 'infantry', visionRadius: 4 },
  [UnitType.ROCKET_INFANTRY]:  { hp: 60,  speed: 3, range: 5, damage: 30, attackSpeed: 0.6, cost: 100,  buildTime: 15, category: 'infantry', visionRadius: 4 },
  [UnitType.LIGHT_VEHICLE]:    { hp: 150, speed: 6, range: 3, damage: 12, attackSpeed: 1.2, cost: 150,  buildTime: 12, category: 'vehicle',  visionRadius: 5 },
  [UnitType.MEDIUM_VEHICLE]:   { hp: 200, speed: 6, range: 3, damage: 18, attackSpeed: 0.8, cost: 200,  buildTime: 15, category: 'vehicle',  visionRadius: 5, shotsPerAttack: 2 },
  [UnitType.TANK]:             { hp: 400, speed: 4, range: 4, damage: 35, attackSpeed: 0.6, cost: 400,  buildTime: 20, category: 'vehicle',  visionRadius: 5 },
  [UnitType.SIEGE_TANK]:       { hp: 500, speed: 3, range: 6, damage: 50, attackSpeed: 0.4, cost: 500,  buildTime: 25, category: 'vehicle',  visionRadius: 5, splash: true },
  [UnitType.ROCKET_LAUNCHER]:  { hp: 300, speed: 3, range: 7, damage: 40, attackSpeed: 0.5, cost: 600,  buildTime: 25, category: 'vehicle',  visionRadius: 5 },
  [UnitType.MCV]:              { hp: 800, speed: 2, range: 0, damage: 0,  attackSpeed: 0,   cost: 1000, buildTime: 30, category: 'vehicle',  visionRadius: 5 },
  [SuperUnitType.CHEESE_CANNON]:   { hp: 350, speed: 4, range: 5, damage: 45, attackSpeed: 0.5, cost: 700, buildTime: 25, category: 'vehicle', visionRadius: 5, superAbility: 'cheeseZone' },
  [SuperUnitType.WINE_CATAPULT]:   { hp: 300, speed: 4, range: 6, damage: 30, attackSpeed: 0.5, cost: 650, buildTime: 25, category: 'vehicle', visionRadius: 5, superAbility: 'drunk' },
  [SuperUnitType.BRATWURST_BLITZ]: { hp: 500, speed: 6, range: 3, damage: 40, attackSpeed: 0.8, cost: 750, buildTime: 25, category: 'vehicle', visionRadius: 5 },
};

// Faction → super unit mapping (keyed by FactionId string values)
export const FACTION_SUPER_UNIT = {
  swiss: SuperUnitType.CHEESE_CANNON,
  french: SuperUnitType.WINE_CATAPULT,
  german: SuperUnitType.BRATWURST_BLITZ,
};

// AI difficulty settings
export const AIDifficulty = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
};

export const AI_SETTINGS = {
  easy:   { buildTimeMult: 4.0, armyThreshold: 8,  startingCheese: 800,  rebuildDelay: 25, maxUnitTier: 1, damageMult: 0.35, attackFraction: 0.6 },
  medium: { buildTimeMult: 1.0, armyThreshold: 12, startingCheese: 2500, rebuildDelay: 2,  maxUnitTier: 2, damageMult: 1.0, attackFraction: 1.0 },
  hard:   { buildTimeMult: 0.75, armyThreshold: 16, startingCheese: 3000, rebuildDelay: 0,  maxUnitTier: 3, damageMult: 1.0, attackFraction: 1.0 },
};

// Cheese zone constants (Käsekanone)
export const CHEESE_ZONE_DURATION = 2.0;
export const CHEESE_ZONE_DPS = 10;

// Drunk effect duration (Catapulte à Vin)
export const DRUNK_DURATION = 5.0;

// Unit rendering sizes (radius in pixels at 1x zoom)
export const UnitSize = {
  infantry: 6,
  vehicle: 10,
};

// Damage modifiers
export const DAMAGE_ROCKET_VS_VEHICLE = 2.0;
export const DAMAGE_ROCKET_VS_INFANTRY = 0.5;
export const DAMAGE_FOREST_COVER = 0.75;

// Splash damage radius (in world pixels)
export const SPLASH_RADIUS = 48; // 1.5 tiles

// Projectile speed (world pixels per second)
export const PROJECTILE_SPEED = 300;

// Building type IDs
export const BuildingType = {
  CONSTRUCTION_YARD: 'constructionYard',
  POWER_PLANT: 'powerPlant',
  REFINERY: 'refinery',
  SILO: 'silo',
  BARRACKS: 'barracks',
  LIGHT_FACTORY: 'lightFactory',
  HEAVY_FACTORY: 'heavyFactory',
  RADAR: 'radar',
  TURRET: 'turret',
  ROCKET_TURRET: 'rocketTurret',
  REPAIR_PAD: 'repairPad',
  STARPORT: 'starport',
  PALACE: 'palace',
};

// Building stats
// footprint: [width, height] in tiles
// power: positive = produces, negative = consumes
// requires: array of BuildingType prerequisites
export const BuildingStats = {
  [BuildingType.CONSTRUCTION_YARD]: {
    hp: 1000, power: 20, cost: 0, buildTime: 0,
    footprint: [3, 3], concreteRadius: 6,
    requires: [], produces: [],
  },
  [BuildingType.POWER_PLANT]: {
    hp: 400, power: 30, cost: 200, buildTime: 15,
    footprint: [2, 2],
    requires: [BuildingType.CONSTRUCTION_YARD], produces: [],
  },
  [BuildingType.REFINERY]: {
    hp: 600, power: -15, cost: 300, buildTime: 20,
    footprint: [3, 2], storage: 1000, freeUnit: 'harvester',
    requires: [BuildingType.CONSTRUCTION_YARD], produces: ['harvester'],
  },
  [BuildingType.SILO]: {
    hp: 300, power: -3, cost: 100, buildTime: 10,
    footprint: [1, 1], storage: 500,
    requires: [BuildingType.REFINERY], produces: [],
  },
  [BuildingType.BARRACKS]: {
    hp: 500, power: -10, cost: 250, buildTime: 15,
    footprint: [2, 2],
    requires: [BuildingType.CONSTRUCTION_YARD],
    produces: ['lightInfantry', 'heavyInfantry', 'rocketInfantry'],
  },
  [BuildingType.LIGHT_FACTORY]: {
    hp: 500, power: -15, cost: 400, buildTime: 20,
    footprint: [3, 2],
    requires: [BuildingType.BARRACKS],
    produces: ['lightVehicle', 'mediumVehicle'],
  },
  [BuildingType.HEAVY_FACTORY]: {
    hp: 600, power: -20, cost: 600, buildTime: 25,
    footprint: [3, 3],
    requires: [BuildingType.LIGHT_FACTORY],
    produces: ['tank', 'siegeTank', 'rocketLauncher', 'mcv'],
  },
  [BuildingType.RADAR]: {
    hp: 400, power: -15, cost: 350, buildTime: 20,
    footprint: [2, 2],
    requires: [BuildingType.CONSTRUCTION_YARD], produces: [],
  },
  [BuildingType.TURRET]: {
    hp: 300, power: -5, cost: 150, buildTime: 10,
    footprint: [1, 1],
    range: 4, damage: 20, attackSpeed: 1.0,
    requires: [BuildingType.CONSTRUCTION_YARD], produces: [],
  },
  [BuildingType.ROCKET_TURRET]: {
    hp: 350, power: -8, cost: 250, buildTime: 15,
    footprint: [1, 1],
    range: 6, damage: 50, attackSpeed: 0.5,
    requires: [BuildingType.RADAR], produces: [],
  },
  [BuildingType.REPAIR_PAD]: {
    hp: 400, power: -10, cost: 300, buildTime: 15,
    footprint: [2, 2], healRate: 10, healCost: 5,
    requires: [BuildingType.HEAVY_FACTORY], produces: [],
  },
  [BuildingType.STARPORT]: {
    hp: 500, power: -20, cost: 500, buildTime: 25,
    footprint: [3, 3],
    requires: [BuildingType.RADAR], produces: [],
  },
  [BuildingType.PALACE]: {
    hp: 800, power: -25, cost: 800, buildTime: 30,
    footprint: [3, 3],
    requires: [BuildingType.HEAVY_FACTORY, BuildingType.RADAR],
    produces: ['superUnit'],
  },
};

// Harvester constants
export const HARVESTER_CAPACITY = 700;   // Max cheese a harvester can carry
export const HARVEST_RATE = 50;          // Cheese per second while harvesting
export const UNLOAD_RATE = 100;          // Cheese per second while unloading
export const PASTURE_CHEESE = 2000;      // Total cheese in a pasture tile
export const PASTURE_REGEN_RATE = 2;     // Cheese per second regeneration
export const BUILDING_DECAY_RATE = 5;    // HP/s for buildings not on concrete

// Base storage (Construction Yard provides this)
export const BASE_STORAGE = 1000;
