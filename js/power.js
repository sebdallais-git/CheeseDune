// Game/public/dune/js/power.js
import { BuildingStats } from './constants.js';
import { getPlayerBuildings } from './buildings.js';

/**
 * Calculate power status for an owner.
 * Returns { produced, consumed, surplus, lowPower }
 */
export function getPowerStatus(owner) {
  let produced = 0;
  let consumed = 0;

  const playerBuildings = getPlayerBuildings(owner);
  for (const b of playerBuildings) {
    const stats = BuildingStats[b.type];
    if (!stats) continue;
    if (stats.power > 0) {
      produced += stats.power;
    } else {
      consumed += Math.abs(stats.power);
    }
  }

  return {
    produced,
    consumed,
    surplus: produced - consumed,
    lowPower: consumed > produced,
  };
}

/**
 * Get the build speed multiplier based on power status.
 * Normal = 1.0, low power = 0.5.
 */
export function getPowerMultiplier(owner) {
  const status = getPowerStatus(owner);
  return status.lowPower ? 0.5 : 1.0;
}
