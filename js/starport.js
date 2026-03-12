// Game/public/dune/js/starport.js
import { UnitStats, UnitType, TILE_SIZE, TERRAIN_PASSABLE } from './constants.js';
import { spendCheese } from './economy.js';
import { spawnUnit } from './units.js';
import { getTile } from './map.js';

const STARPORT_UNITS = [
  UnitType.LIGHT_VEHICLE,
  UnitType.MEDIUM_VEHICLE,
  UnitType.TANK,
  UnitType.SIEGE_TANK,
  UnitType.ROCKET_LAUNCHER,
  UnitType.HARVESTER,
];

const REFRESH_INTERVAL = 60;
const DELIVERY_TIME = 10;

/**
 * Initialize prices for a starport building.
 */
export function initStarportPrices(building) {
  building.starportPrices = {};
  for (const unitType of STARPORT_UNITS) {
    building.starportPrices[unitType] = 0.5 + Math.random() * 1.5;
  }
  building.starportRefreshTimer = REFRESH_INTERVAL;
  building.starportOrder = null;
}

/**
 * Refresh prices for a starport.
 */
export function refreshStarportPrices(building) {
  for (const unitType of STARPORT_UNITS) {
    building.starportPrices[unitType] = 0.5 + Math.random() * 1.5;
  }
  building.starportRefreshTimer = REFRESH_INTERVAL;
}

/**
 * Get inventory with current prices.
 */
export function getStarportInventory(building) {
  if (!building.starportPrices) return [];
  return STARPORT_UNITS.map(unitType => {
    const stats = UnitStats[unitType];
    const mult = building.starportPrices[unitType];
    return {
      unitType,
      basePrice: stats.cost,
      multiplier: mult,
      currentPrice: Math.round(stats.cost * mult),
    };
  });
}

/**
 * Order a unit from starport. Returns true if successful.
 */
export function orderStarportUnit(building, unitType, owner, faction) {
  if (building.starportOrder) return false;
  if (!building.starportPrices || !building.starportPrices[unitType]) return false;

  const price = Math.round(UnitStats[unitType].cost * building.starportPrices[unitType]);
  if (!spendCheese(price, owner)) return false;

  building.starportOrder = { unitType, timer: DELIVERY_TIME, owner, faction: faction || 'swiss' };
  refreshStarportPrices(building);
  return true;
}

/**
 * Get current order for a starport.
 */
export function getStarportOrder(building) {
  return building.starportOrder;
}

/**
 * Find nearest passable tile adjacent to a building for unit spawn.
 */
function findSpawnTile(building) {
  const [fw, fh] = building.footprint;
  for (let d = 0; d <= 2; d++) {
    for (let x = building.tileX - d; x <= building.tileX + fw + d - 1; x++) {
      for (let y = building.tileY - d; y <= building.tileY + fh + d - 1; y++) {
        if (d > 0 && x > building.tileX - d && x < building.tileX + fw + d - 1 &&
            y > building.tileY - d && y < building.tileY + fh + d - 1) continue;
        const tile = getTile(x, y);
        if (TERRAIN_PASSABLE[tile]) {
          return { x, y };
        }
      }
    }
  }
  return { x: building.tileX + fw, y: building.tileY };
}

/**
 * Update all starports. Called each game tick.
 */
export function updateStarports(dt, buildings) {
  for (const b of buildings) {
    if (b.type !== 'starport' || !b.alive) continue;

    if (!b.starportPrices) initStarportPrices(b);

    b.starportRefreshTimer -= dt;
    if (b.starportRefreshTimer <= 0) {
      refreshStarportPrices(b);
    }

    if (b.starportOrder) {
      b.starportOrder.timer -= dt;
      if (b.starportOrder.timer <= 0) {
        const order = b.starportOrder;
        const spawn = findSpawnTile(b);
        spawnUnit(order.unitType, order.faction, spawn.x, spawn.y, order.owner);
        b.starportOrder = null;
      }
    }
  }
}
