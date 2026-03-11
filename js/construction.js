// Game/public/dune/js/construction.js
import { BuildingStats, BuildingType, UnitStats, TILE_SIZE } from './constants.js';
import { placeBuilding, hasBuilding, canPlaceBuilding } from './buildings.js';
import { spendCheese, canAfford } from './economy.js';
import { getPowerMultiplier } from './power.js';
import { spawnUnit } from './units.js';
import { FactionId } from './factions.js';

// Build queue — one item at a time per owner
let buildQueue = [];

/**
 * Check if tech tree prerequisites are met for a building type.
 */
export function canBuildType(type, owner) {
  const stats = BuildingStats[type];
  if (!stats) return false;

  for (const req of stats.requires) {
    if (!hasBuilding(req, owner)) return false;
  }

  return true;
}

/**
 * Check if a unit type can be produced (player has a building that produces it).
 */
export function canProduceUnit(unitType, owner) {
  for (const [bType, bStats] of Object.entries(BuildingStats)) {
    if (bStats.produces && bStats.produces.includes(unitType) && hasBuilding(bType, owner)) {
      return true;
    }
  }
  return false;
}

/**
 * Start building construction. Spends cheese, adds to queue.
 */
export function startBuilding(type, owner) {
  const stats = BuildingStats[type];
  if (!stats) return false;
  if (!canBuildType(type, owner)) return false;
  if (!canAfford(stats.cost)) return false;

  // Only one building in queue at a time
  if (buildQueue.some(q => q.owner === owner && !q.pendingPlacement)) return false;

  spendCheese(stats.cost);

  buildQueue.push({
    type,
    progress: 0,
    buildTime: stats.buildTime,
    owner,
    pendingPlacement: false,
  });

  return true;
}

/**
 * Cancel current build. Returns refund amount (50%).
 */
export function cancelBuild(owner) {
  const idx = buildQueue.findIndex(q => q.owner === owner);
  if (idx === -1) return 0;

  const item = buildQueue[idx];
  const stats = BuildingStats[item.type];
  buildQueue.splice(idx, 1);
  return stats ? Math.round(stats.cost * 0.5) : 0;
}

/**
 * Get current build queue item for an owner.
 */
export function getCurrentBuild(owner) {
  return buildQueue.find(q => q.owner === owner) || null;
}

/**
 * Get all items waiting for placement.
 */
export function getPendingPlacements(owner) {
  return buildQueue.filter(q => q.owner === owner && q.pendingPlacement);
}

/**
 * Place a pending building on the map.
 */
export function placePendingBuilding(owner, tileX, tileY) {
  const pending = buildQueue.find(q => q.owner === owner && q.pendingPlacement);
  if (!pending) return null;

  if (!canPlaceBuilding(pending.type, tileX, tileY, owner)) return null;

  const building = placeBuilding(pending.type, tileX, tileY, owner);

  // Spawn free harvester if refinery
  const stats = BuildingStats[pending.type];
  if (stats.freeUnit === 'harvester') {
    const spawnX = tileX + stats.footprint[0];
    const spawnY = tileY + Math.floor(stats.footprint[1] / 2);
    spawnUnit('harvester', FactionId.SWISS, spawnX, spawnY, owner);
  }

  // Remove from queue
  const idx = buildQueue.indexOf(pending);
  if (idx !== -1) buildQueue.splice(idx, 1);

  return building;
}

/**
 * Update construction progress. Called each game tick.
 */
export function updateConstruction(dt, owner) {
  for (const item of buildQueue) {
    if (item.owner !== owner || item.pendingPlacement) continue;

    const mult = getPowerMultiplier(owner);
    item.progress += dt * mult;

    if (item.progress >= item.buildTime) {
      item.progress = item.buildTime;
      item.pendingPlacement = true;
    }
  }
}

export function getBuildQueue() { return buildQueue; }

export function clearConstruction() {
  buildQueue = [];
}
