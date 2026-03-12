// Game/public/dune/js/sidebar.js
import {
  BuildingType, BuildingStats, UnitStats, UnitType
} from './constants.js';
import { getCheese, getStorageCapacity, canAfford, spendCheese } from './economy.js';
import { getPowerStatus } from './power.js';
import { canBuildType, getCurrentBuild, startBuilding, cancelBuild, canProduceUnit } from './construction.js';
import { hasBuilding, getPlayerBuildings } from './buildings.js';
import { spawnUnit } from './units.js';

// Placement mode state
let placementMode = null;
let placementOwner = 'player';

let playerFaction = 'swiss';

// Unit training cooldown
let trainCooldown = 0;

export function setPlayerFaction(faction) { playerFaction = faction; }

export function getPlacementMode() { return placementMode; }
export function setPlacementMode(type) { placementMode = type; }
export function clearPlacementMode() { placementMode = null; }

export function updateSidebarCooldown(dt) {
  if (trainCooldown > 0) trainCooldown -= dt;
}

// Building order in sidebar
export const SIDEBAR_BUILDINGS = [
  BuildingType.POWER_PLANT,
  BuildingType.REFINERY,
  BuildingType.SILO,
  BuildingType.BARRACKS,
  BuildingType.LIGHT_FACTORY,
  BuildingType.HEAVY_FACTORY,
  BuildingType.RADAR,
  BuildingType.TURRET,
  BuildingType.ROCKET_TURRET,
  BuildingType.REPAIR_PAD,
  BuildingType.STARPORT,
  BuildingType.PALACE,
];

// Sidebar button labels
export const SIDEBAR_LABELS = {
  [BuildingType.POWER_PLANT]: 'Power',
  [BuildingType.REFINERY]: 'Refinery',
  [BuildingType.SILO]: 'Silo',
  [BuildingType.BARRACKS]: 'Barracks',
  [BuildingType.LIGHT_FACTORY]: 'Lt Factory',
  [BuildingType.HEAVY_FACTORY]: 'Hv Factory',
  [BuildingType.RADAR]: 'Radar',
  [BuildingType.TURRET]: 'Turret',
  [BuildingType.ROCKET_TURRET]: 'Rkt Turret',
  [BuildingType.REPAIR_PAD]: 'Repair Pad',
  [BuildingType.STARPORT]: 'Starport',
  [BuildingType.PALACE]: 'Palace',
};

export const UNIT_LABELS = {
  [UnitType.LIGHT_INFANTRY]: 'Rifle',
  [UnitType.HEAVY_INFANTRY]: 'Heavy',
  [UnitType.ROCKET_INFANTRY]: 'Rocket',
  [UnitType.HARVESTER]: 'Harvest',
  [UnitType.LIGHT_VEHICLE]: 'Scout',
  [UnitType.MEDIUM_VEHICLE]: 'APC',
  [UnitType.TANK]: 'Tank',
  [UnitType.SIEGE_TANK]: 'Siege',
  [UnitType.ROCKET_LAUNCHER]: 'MLRS',
  [UnitType.MCV]: 'MCV',
};

// Tab mode
let activeTab = 'build'; // 'build' or 'units'

/**
 * Get all unit types the player can currently produce.
 */
export function getProducibleUnits(owner) {
  const result = [];
  const seen = new Set();
  const myBuildings = getPlayerBuildings(owner);
  for (const b of myBuildings) {
    const stats = BuildingStats[b.type];
    if (!stats || !stats.produces) continue;
    for (const unitType of stats.produces) {
      if (!seen.has(unitType) && UnitStats[unitType]) {
        seen.add(unitType);
        result.push(unitType);
      }
    }
  }
  return result;
}

// Surrender confirmation state
let surrenderConfirm = false;
let onSurrender = null;

export function setOnSurrender(fn) { onSurrender = fn; }

/**
 * Find a spawn tile near a producing building.
 */
export function findProducerSpawn(unitType, owner) {
  const myBuildings = getPlayerBuildings(owner);
  for (const b of myBuildings) {
    const stats = BuildingStats[b.type];
    if (stats && stats.produces && stats.produces.includes(unitType)) {
      return {
        x: b.tileX + b.footprint[0],
        y: b.tileY + Math.floor(b.footprint[1] / 2),
      };
    }
  }
  return null;
}

/**
 * Handle sidebar tap. Returns true if handled.
 * Note: This function uses canvas-space coordinates from the old 2D layout.
 * The HTML overlay UI (three-ui.js) now handles sidebar clicks directly.
 * This is kept for backward compatibility with any remaining callers.
 */
export function handleSidebarTap(canvasX, canvasY) {
  // Sidebar is now an HTML overlay — taps are handled by three-ui.js
  return false;
}

function handleBuildTap(canvasX, canvasY, owner, startY) {
  let btnIdx = 0;
  for (const type of SIDEBAR_BUILDINGS) {
    if (canBuildType(type, owner)) {
      if (placementMode === type) {
        placementMode = null;
        return true;
      }
      const current = getCurrentBuild(owner);
      if (!current) {
        if (startBuilding(type, owner, playerFaction)) {
          // Building started
        }
      } else if (current.pendingPlacement) {
        placementMode = current.type;
      }
      return true;
    }
    btnIdx++;
  }

  return false;
}

function handleUnitsTap(canvasX, canvasY, owner, startY) {
  const producible = getProducibleUnits(owner);

  let btnIdx = 0;
  for (const unitType of producible) {
    const stats = UnitStats[unitType];
    if (!stats) continue;

    if (canAfford(stats.cost, owner) && trainCooldown <= 0) {
      spendCheese(stats.cost, owner);
      const spawn = findProducerSpawn(unitType, owner);
      if (spawn) {
        spawnUnit(unitType, playerFaction, spawn.x, spawn.y, owner);
        trainCooldown = Math.max(3, stats.buildTime * 0.3);
      }
    }
    return true;
    btnIdx++;
  }

  return false;
}
