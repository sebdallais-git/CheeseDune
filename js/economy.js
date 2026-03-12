// Game/public/dune/js/economy.js
import { BASE_STORAGE, BuildingType, BuildingStats } from './constants.js';
import { getPlayerBuildings } from './buildings.js';

const cheeseByOwner = {};

export function getCheese(owner = 'player') {
  return cheeseByOwner[owner] || 0;
}

export function setCheese(amount, owner = 'player') {
  cheeseByOwner[owner] = Math.max(0, amount);
}

/**
 * Calculate total storage capacity for an owner.
 */
export function getStorageCapacity(owner = 'player') {
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
export function addCheese(amount, owner = 'player') {
  const cap = getStorageCapacity(owner);
  const current = cheeseByOwner[owner] || 0;
  cheeseByOwner[owner] = Math.min(current + amount, cap);
}

/**
 * Spend cheese. Returns true if successful, false if insufficient.
 */
export function spendCheese(amount, owner = 'player') {
  const current = cheeseByOwner[owner] || 0;
  if (current < amount) return false;
  cheeseByOwner[owner] = current - amount;
  return true;
}

/**
 * Check if owner can afford a cost.
 */
export function canAfford(amount, owner = 'player') {
  return (cheeseByOwner[owner] || 0) >= amount;
}

export function initEconomy(startingCheese, owner = 'player') {
  cheeseByOwner[owner] = startingCheese;
}

export function resetEconomy() {
  for (const key in cheeseByOwner) {
    delete cheeseByOwner[key];
  }
}
