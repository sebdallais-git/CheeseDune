// Game/public/dune/js/construction.js
import { BuildingStats, BuildingType, UnitStats, UnitType, TILE_SIZE, FACTION_SUPER_UNIT } from './constants.js';
import { placeBuilding, hasBuilding, canPlaceBuilding, getBuildingAtTile, removeBuilding, getBuildings as getBuildingsRef } from './buildings.js';
import { spendCheese, canAfford, addCheese } from './economy.js';
import { getPowerMultiplier } from './power.js';
import { spawnUnit, removeUnit, getUnits as getUnitsRef } from './units.js';
import { getMapWidth, getMapHeight } from './map.js';

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
export function startBuilding(type, owner, faction) {
  const stats = BuildingStats[type];
  if (!stats) return false;
  if (!canBuildType(type, owner)) return false;
  if (!canAfford(stats.cost, owner)) return false;

  // Only one building in queue at a time
  if (buildQueue.some(q => q.owner === owner && !q.pendingPlacement)) return false;

  spendCheese(stats.cost, owner);

  buildQueue.push({
    type,
    progress: 0,
    buildTime: stats.buildTime,
    owner,
    faction: faction || 'swiss',
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
  const refund = stats ? Math.round(stats.cost * 0.5) : 0;
  if (refund > 0) {
    addCheese(refund, item.owner);
  }
  return refund;
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
export function placePendingBuilding(owner, tileX, tileY, faction) {
  const pending = buildQueue.find(q => q.owner === owner && q.pendingPlacement);
  if (!pending) return null;

  if (!canPlaceBuilding(pending.type, tileX, tileY, owner)) return null;

  const building = placeBuilding(pending.type, tileX, tileY, owner);

  // Spawn free harvester if refinery
  const stats = BuildingStats[pending.type];
  if (stats.freeUnit === 'harvester') {
    const spawnX = tileX + stats.footprint[0];
    const spawnY = tileY + Math.floor(stats.footprint[1] / 2);
    const factionId = faction || pending.faction || 'swiss';
    spawnUnit('harvester', factionId, spawnX, spawnY, owner);
  }

  // Remove from queue
  const idx = buildQueue.indexOf(pending);
  if (idx !== -1) buildQueue.splice(idx, 1);

  return building;
}

/**
 * Resolve 'superUnit' to faction-specific type.
 */
export function resolveProducedUnit(unitType, faction) {
  if (unitType === 'superUnit') {
    return FACTION_SUPER_UNIT[faction] || unitType;
  }
  return unitType;
}

/**
 * Start MCV deployment (MCV → Construction Yard).
 */
export function startDeploy(unit) {
  if (unit.type !== UnitType.MCV || unit.deploying) return false;
  if (unit.drunkTimer > 0) return false;

  const tileX = Math.floor(unit.x / TILE_SIZE) - 1;
  const tileY = Math.floor(unit.y / TILE_SIZE) - 1;

  const stats = BuildingStats[BuildingType.CONSTRUCTION_YARD];
  const [fw, fh] = stats.footprint;
  const mapW = getMapWidth();
  const mapH = getMapHeight();

  if (tileX < 0 || tileY < 0 || tileX + fw > mapW || tileY + fh > mapH) return false;

  for (let y = tileY; y < tileY + fh; y++) {
    for (let x = tileX; x < tileX + fw; x++) {
      if (getBuildingAtTile(x, y)) return false;
    }
  }

  unit.deploying = true;
  unit.deployTimer = 2.0;
  unit.deployTileX = tileX;
  unit.deployTileY = tileY;
  unit.moving = false;
  unit.path = [];
  return true;
}

/**
 * Undeploy Construction Yard back into MCV.
 */
export function startUndeploy(building) {
  if (building.type !== BuildingType.CONSTRUCTION_YARD) return false;
  building.undeploying = true;
  building.undeployTimer = 2.0;
  return true;
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

  // Handle MCV deployment timers
  const allUnits = getUnitsRef();
  for (const unit of allUnits) {
    if (unit.owner !== owner || !unit.deploying) continue;
    unit.deployTimer -= dt;
    if (unit.deployTimer <= 0) {
      placeBuilding(BuildingType.CONSTRUCTION_YARD, unit.deployTileX, unit.deployTileY, owner);
      removeUnit(unit);
    }
  }

  // Handle Construction Yard undeploy timers
  const allBuildings = getBuildingsRef();
  for (const b of allBuildings) {
    if (b.owner !== owner || !b.undeploying) continue;
    b.undeployTimer -= dt;
    if (b.undeployTimer <= 0) {
      const cx = b.tileX + Math.floor(b.footprint[0] / 2);
      const cy = b.tileY + Math.floor(b.footprint[1] / 2);
      const faction = b.faction || 'swiss';
      removeBuilding(b);
      spawnUnit(UnitType.MCV, faction, cx, cy, b.owner);
    }
  }
}

export function getBuildQueue() { return buildQueue; }

export function clearConstruction() {
  buildQueue = [];
}
