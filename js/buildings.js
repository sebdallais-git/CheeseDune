// Game/public/dune/js/buildings.js
import { BuildingStats, BuildingType, Terrain, TILE_SIZE } from './constants.js';
import { getTile, setTile, getMapWidth, getMapHeight } from './map.js';
import { getUnits } from './units.js';
import { spendCheese } from './economy.js';

let buildings = [];
let nextBuildingId = 1;

export function getBuildings() { return buildings; }

/**
 * Place a building at tile position.
 * Does NOT validate placement — caller must check first.
 */
export function placeBuilding(type, tileX, tileY, owner) {
  const stats = BuildingStats[type];
  if (!stats) throw new Error(`Unknown building type: ${type}`);

  const building = {
    id: nextBuildingId++,
    type,
    owner,
    tileX,
    tileY,
    hp: stats.hp,
    maxHp: stats.hp,
    footprint: stats.footprint,
    faction: null,
    alive: true,
    attackCooldown: 0,
  };

  buildings.push(building);

  // Spread concrete if this is a construction yard
  if (type === BuildingType.CONSTRUCTION_YARD && stats.concreteRadius) {
    spreadConcrete(tileX, tileY, stats.footprint, stats.concreteRadius);
  }

  return building;
}

/**
 * Spread concrete around a building center within radius.
 */
function spreadConcrete(tileX, tileY, footprint, radius) {
  const [fw, fh] = footprint;
  const centerX = tileX + fw / 2;
  const centerY = tileY + fh / 2;
  const mapW = getMapWidth();
  const mapH = getMapHeight();

  for (let y = Math.floor(centerY - radius); y <= Math.ceil(centerY + radius); y++) {
    for (let x = Math.floor(centerX - radius); x <= Math.ceil(centerX + radius); x++) {
      if (x < 0 || x >= mapW || y < 0 || y >= mapH) continue;
      const dx = x + 0.5 - centerX;
      const dy = y + 0.5 - centerY;
      if (Math.sqrt(dx * dx + dy * dy) > radius) continue;

      const tile = getTile(x, y);
      // Only convert passable, non-special tiles to concrete
      if (tile === Terrain.MEADOW || tile === Terrain.BARE) {
        setTile(x, y, Terrain.CONCRETE);
      }
    }
  }
}

/**
 * Check if a building can be placed at the given tile position.
 * Rules: on concrete, near existing building, no overlap, in bounds.
 */
export function canPlaceBuilding(type, tileX, tileY, owner) {
  const stats = BuildingStats[type];
  if (!stats) return false;
  const [fw, fh] = stats.footprint;
  const mapW = getMapWidth();
  const mapH = getMapHeight();

  // Bounds check
  if (tileX < 0 || tileY < 0 || tileX + fw > mapW || tileY + fh > mapH) return false;

  for (let y = tileY; y < tileY + fh; y++) {
    for (let x = tileX; x < tileX + fw; x++) {
      // No overlap with existing buildings
      if (getBuildingAtTile(x, y)) return false;
    }
  }

  // Must be near an existing owned building (within 8 tiles)
  const ownedBuildings = buildings.filter(b => b.owner === owner && b.alive);
  if (ownedBuildings.length > 0) {
    let nearBase = false;
    for (const b of ownedBuildings) {
      const bCenterX = b.tileX + b.footprint[0] / 2;
      const bCenterY = b.tileY + b.footprint[1] / 2;
      const pCenterX = tileX + fw / 2;
      const pCenterY = tileY + fh / 2;
      const dist = Math.abs(bCenterX - pCenterX) + Math.abs(bCenterY - pCenterY);
      if (dist <= 8) { nearBase = true; break; }
    }
    if (!nearBase) return false;
  }

  return true;
}

/**
 * Whether placement position has full concrete coverage.
 */
export function hasFullConcrete(type, tileX, tileY) {
  const stats = BuildingStats[type];
  if (!stats) return false;
  const [fw, fh] = stats.footprint;
  for (let y = tileY; y < tileY + fh; y++) {
    for (let x = tileX; x < tileX + fw; x++) {
      if (getTile(x, y) !== Terrain.CONCRETE) return false;
    }
  }
  return true;
}

/**
 * Get building at a specific tile (checking footprints).
 */
export function getBuildingAtTile(tileX, tileY) {
  for (const b of buildings) {
    if (!b.alive) continue;
    const [fw, fh] = b.footprint;
    if (tileX >= b.tileX && tileX < b.tileX + fw &&
        tileY >= b.tileY && tileY < b.tileY + fh) {
      return b;
    }
  }
  return null;
}

/**
 * Get all buildings owned by a specific owner.
 */
export function getPlayerBuildings(owner) {
  return buildings.filter(b => b.owner === owner && b.alive);
}

/**
 * Check if player owns at least one building of given type.
 */
export function hasBuilding(type, owner) {
  return buildings.some(b => b.type === type && b.owner === owner && b.alive);
}

/**
 * Get the nearest refinery to a world position (for harvester return).
 */
export function getNearestRefinery(worldX, worldY, owner) {
  let nearest = null;
  let nearestDist = Infinity;

  for (const b of buildings) {
    if (b.type !== BuildingType.REFINERY || b.owner !== owner || !b.alive) continue;
    const bx = (b.tileX + b.footprint[0] / 2) * TILE_SIZE;
    const by = (b.tileY + b.footprint[1] / 2) * TILE_SIZE;
    const dx = bx - worldX;
    const dy = by - worldY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = b;
    }
  }

  return nearest;
}

/**
 * Remove a building (on destruction).
 */
export function removeBuilding(building) {
  building.alive = false;
  const idx = buildings.indexOf(building);
  if (idx !== -1) buildings.splice(idx, 1);
}

/**
 * Update buildings each tick (decay for buildings not on concrete).
 */
export function updateBuildings(dt) {
  // Repair pad healing
  for (const b of buildings) {
    if (!b.alive || b.type !== BuildingType.REPAIR_PAD) continue;
    const stats = BuildingStats[b.type];

    const padLeft = b.tileX * TILE_SIZE;
    const padRight = (b.tileX + b.footprint[0]) * TILE_SIZE;
    const padTop = b.tileY * TILE_SIZE;
    const padBottom = (b.tileY + b.footprint[1]) * TILE_SIZE;

    const allUnits = getUnits();
    for (const u of allUnits) {
      if (!u.alive || u.owner !== b.owner || u.category !== 'vehicle') continue;
      if (u.hp >= u.maxHp) continue;

      if (u.x >= padLeft && u.x <= padRight && u.y >= padTop && u.y <= padBottom) {
        const healCost = stats.healCost * dt;
        if (spendCheese(healCost, b.owner)) {
          u.hp = Math.min(u.hp + stats.healRate * dt, u.maxHp);
        }
      }
    }
  }

  // Decay for buildings not on concrete
  for (const b of buildings) {
    if (!b.alive) continue;
    if (!hasFullConcrete(b.type, b.tileX, b.tileY)) {
      b.hp -= 5 * dt;
      if (b.hp <= 0) {
        b.hp = 0;
        removeBuilding(b);
      }
    }
  }
}

export function clearBuildings() {
  buildings = [];
  nextBuildingId = 1;
}
