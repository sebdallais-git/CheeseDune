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
