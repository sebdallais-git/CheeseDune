// Game/public/dune/js/harvester-ai.js
import {
  TILE_SIZE, Terrain, UnitType,
  HARVESTER_CAPACITY, HARVEST_RATE, UNLOAD_RATE
} from './constants.js';
import { getUnits, moveUnitTo } from './units.js';
import { getTile, setTile, getMapWidth, getMapHeight } from './map.js';
import { getNearestRefinery } from './buildings.js';
import { addCheese } from './economy.js';

const HarvesterState = {
  IDLE: 'idle',
  SEEKING: 'seeking',
  HARVESTING: 'harvesting',
  RETURNING: 'returning',
  UNLOADING: 'unloading',
};

// Harvester state stored per unit as extra properties
function initHarvesterState(unit) {
  if (unit.harvesterState) return;
  unit.harvesterState = HarvesterState.IDLE;
  unit.cheeseCarried = 0;
  unit.harvestTargetX = -1;
  unit.harvestTargetY = -1;
}

/**
 * Find nearest pasture tile from a world position.
 */
function findNearestPasture(worldX, worldY) {
  const tileX = Math.floor(worldX / TILE_SIZE);
  const tileY = Math.floor(worldY / TILE_SIZE);
  const mapW = getMapWidth();
  const mapH = getMapHeight();

  let bestX = -1, bestY = -1;
  let bestDist = Infinity;

  // Search in expanding rings (max 20 tile radius)
  for (let r = 0; r < 20; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue; // Ring only
        const x = tileX + dx;
        const y = tileY + dy;
        if (x < 0 || x >= mapW || y < 0 || y >= mapH) continue;
        if (getTile(x, y) === Terrain.PASTURE) {
          const dist = Math.abs(dx) + Math.abs(dy);
          if (dist < bestDist) {
            bestDist = dist;
            bestX = x;
            bestY = y;
          }
        }
      }
    }
    if (bestX !== -1) break; // Found one at this radius
  }

  return bestX !== -1 ? { x: bestX, y: bestY } : null;
}

/**
 * Update all harvesters. Called each game tick.
 */
export function updateHarvesters(dt) {
  const units = getUnits();

  for (const unit of units) {
    if (unit.type !== UnitType.HARVESTER || !unit.alive) continue;
    if (unit.owner !== 'player') continue; // Only player harvesters auto-harvest

    initHarvesterState(unit);

    switch (unit.harvesterState) {
      case HarvesterState.IDLE: {
        // Find nearest pasture
        const pasture = findNearestPasture(unit.x, unit.y);
        if (pasture) {
          unit.harvestTargetX = pasture.x;
          unit.harvestTargetY = pasture.y;
          moveUnitTo(unit, pasture.x, pasture.y);
          unit.harvesterState = HarvesterState.SEEKING;
        }
        break;
      }

      case HarvesterState.SEEKING: {
        // Check if arrived at pasture
        if (!unit.moving) {
          const tileX = Math.floor(unit.x / TILE_SIZE);
          const tileY = Math.floor(unit.y / TILE_SIZE);
          if (getTile(tileX, tileY) === Terrain.PASTURE) {
            unit.harvesterState = HarvesterState.HARVESTING;
          } else {
            // Pasture depleted or couldn't reach — go idle to re-search
            unit.harvesterState = HarvesterState.IDLE;
          }
        }
        break;
      }

      case HarvesterState.HARVESTING: {
        const tileX = Math.floor(unit.x / TILE_SIZE);
        const tileY = Math.floor(unit.y / TILE_SIZE);

        if (getTile(tileX, tileY) !== Terrain.PASTURE) {
          // Pasture depleted — go find another or return if carrying
          if (unit.cheeseCarried > 0) {
            const refinery = getNearestRefinery(unit.x, unit.y, unit.owner);
            if (refinery) {
              const rx = refinery.tileX + Math.floor(refinery.footprint[0] / 2);
              const ry = refinery.tileY + Math.floor(refinery.footprint[1] / 2);
              moveUnitTo(unit, rx, ry);
              unit.harvesterState = HarvesterState.RETURNING;
            } else {
              unit.harvesterState = HarvesterState.IDLE;
            }
          } else {
            unit.harvesterState = HarvesterState.IDLE;
          }
          break;
        }

        // Harvest
        const amount = HARVEST_RATE * dt;
        unit.cheeseCarried += amount;

        if (unit.cheeseCarried >= HARVESTER_CAPACITY) {
          unit.cheeseCarried = HARVESTER_CAPACITY;
          // Full — return to refinery
          const refinery = getNearestRefinery(unit.x, unit.y, unit.owner);
          if (refinery) {
            const rx = refinery.tileX + Math.floor(refinery.footprint[0] / 2);
            const ry = refinery.tileY + Math.floor(refinery.footprint[1] / 2);
            moveUnitTo(unit, rx, ry);
            unit.harvesterState = HarvesterState.RETURNING;
          } else {
            unit.harvesterState = HarvesterState.IDLE;
          }
        }
        break;
      }

      case HarvesterState.RETURNING: {
        if (!unit.moving) {
          // Arrived at refinery area — start unloading
          unit.harvesterState = HarvesterState.UNLOADING;
        }
        break;
      }

      case HarvesterState.UNLOADING: {
        const amount = Math.min(UNLOAD_RATE * dt, unit.cheeseCarried);
        unit.cheeseCarried -= amount;
        addCheese(amount, unit.owner);

        if (unit.cheeseCarried <= 0) {
          unit.cheeseCarried = 0;
          // Go back to harvesting
          unit.harvesterState = HarvesterState.IDLE;
        }
        break;
      }
    }
  }
}
