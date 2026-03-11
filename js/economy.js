// Game/public/dune/js/economy.js
import { BASE_STORAGE, BuildingType, BuildingStats } from './constants.js';
import { getPlayerBuildings } from './buildings.js';

let cheese = 0;

export function getCheese() { return cheese; }
export function setCheese(amount) { cheese = Math.max(0, amount); }

/**
 * Calculate total storage capacity for an owner.
 */
export function getStorageCapacity(owner) {
  let capacity = BASE_STORAGE;
  const playerBuildings = getPlayerBuildings(owner);
  for (const b of playerBuildings) {
    const stats = BuildingStats[b.type];
    if (stats && stats.storage) {
      capacity += stats.storage;
    }
  }
  return capacity;
}

/**
 * Add cheese (from harvester unload). Capped at storage.
 */
export function addCheese(amount, owner) {
  const cap = getStorageCapacity(owner);
  cheese = Math.min(cheese + amount, cap);
}

/**
 * Spend cheese. Returns true if successful, false if insufficient.
 */
export function spendCheese(amount) {
  if (cheese < amount) return false;
  cheese -= amount;
  return true;
}

/**
 * Check if player can afford a cost.
 */
export function canAfford(amount) {
  return cheese >= amount;
}

export function initEconomy(startingCheese) {
  cheese = startingCheese;
}
