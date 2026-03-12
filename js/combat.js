// Game/public/dune/js/combat.js
import {
  TILE_SIZE, UnitType, Terrain, BuildingStats,
  DAMAGE_ROCKET_VS_VEHICLE, DAMAGE_ROCKET_VS_INFANTRY,
  DAMAGE_FOREST_COVER, SPLASH_RADIUS,
  CHEESE_ZONE_DURATION, CHEESE_ZONE_DPS, DRUNK_DURATION
} from './constants.js';
import {
  getUnits, removeUnit, getEnemiesInRange, getNearestEnemy, moveUnitTo, stopUnit
} from './units.js';
import { getTile } from './map.js';
import { getBuildings } from './buildings.js';
import { getPowerMultiplier } from './power.js';
import { spawnProjectile } from './projectiles.js';
import { spawnDeathEffect } from './particles.js';
import { getFaction } from './factions.js';

/**
 * Calculate damage from attacker to target, applying modifiers.
 */
export function calculateDamage(attacker, target) {
  let damage = attacker.damage;

  // Rocket infantry: 2x vs vehicles, 0.5x vs infantry
  if (attacker.type === UnitType.ROCKET_INFANTRY) {
    if (target.category === 'vehicle') {
      damage *= DAMAGE_ROCKET_VS_VEHICLE;
    } else if (target.category === 'infantry') {
      damage *= DAMAGE_ROCKET_VS_INFANTRY;
    }
  }

  // Forest cover: 25% damage reduction if target is in forest
  const targetTileX = Math.floor(target.x / TILE_SIZE);
  const targetTileY = Math.floor(target.y / TILE_SIZE);
  if (getTile(targetTileX, targetTileY) === Terrain.FOREST) {
    damage *= DAMAGE_FOREST_COVER;
  }

  return Math.round(damage);
}

/**
 * Apply damage to a unit. Returns true if the unit died.
 */
function applyDamage(target, damage) {
  target.hp -= damage;
  if (target.hp <= 0) {
    target.hp = 0;
    handleDeath(target);
    return true;
  }
  return false;
}

/**
 * Handle unit death: spawn particles, remove from game.
 */
function handleDeath(unit) {
  const faction = getFaction(unit.faction);
  const particleCount = unit.category === 'infantry' ? 8 : 16;
  const color = faction ? faction.colors.accent : '#ff6600';
  spawnDeathEffect(unit.x, unit.y, color, particleCount);
  removeUnit(unit);
}

/**
 * Apply splash damage around a position (for siege tank).
 * Hits ALL units (including friendlies) except the primary target (already took direct hit).
 */
function applySplashDamage(primaryTarget, targetX, targetY, damage) {
  const allUnits = [...getUnits()]; // Snapshot — applyDamage may splice the array
  for (const u of allUnits) {
    if (!u.alive || u === primaryTarget) continue;
    const dx = u.x - targetX;
    const dy = u.y - targetY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= SPLASH_RADIUS) {
      // Splash does 50% of base damage
      const splashDmg = Math.round(damage * 0.5);
      applyDamage(u, splashDmg);
    }
  }
}

/**
 * Fire an attack: spawn projectile, apply damage on hit.
 */
function fireAttack(attacker, target) {
  const faction = getFaction(attacker.faction);
  const color = faction ? faction.colors.accent : '#ffaa00';

  // Face the target
  attacker.facing = Math.atan2(target.y - attacker.y, target.x - attacker.x);

  const shotsPerAttack = attacker.shotsPerAttack || 1;
  const targetX = target.x;
  const targetY = target.y;

  for (let i = 0; i < shotsPerAttack; i++) {
    // Slight offset for burst shots
    const offsetX = i > 0 ? (Math.random() - 0.5) * 6 : 0;
    const offsetY = i > 0 ? (Math.random() - 0.5) * 6 : 0;

    spawnProjectile(
      attacker.x + offsetX, attacker.y + offsetY,
      targetX, targetY,
      color,
      () => {
        // Damage applied when projectile arrives
        if (!target.alive) return;
        const dmg = calculateDamage(attacker, target);
        applyDamage(target, dmg);

        // Siege tank splash (exclude primary target — already took direct damage)
        if (attacker.splash) {
          applySplashDamage(target, targetX, targetY, attacker.damage);
        }

        // Super unit abilities
        if (attacker.superAbility === 'cheeseZone') {
          spawnCheeseZone(targetX, targetY);
        }
        if (attacker.superAbility === 'drunk') {
          applyDrunkInRadius(targetX, targetY);
        }
      }
    );
  }
}

/**
 * Check if a unit can attack (has damage, has range, alive).
 */
function canAttack(unit) {
  return unit.alive && unit.damage > 0 && unit.range > 0 && unit.attackSpeed > 0;
}

/**
 * Distance between two units in world pixels.
 */
function distBetween(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check for vehicle-over-infantry squish kills.
 * Vehicles kill enemy infantry on contact (within half a tile).
 */
function checkSquish() {
  const allUnits = [...getUnits()]; // Snapshot — handleDeath splices the live array
  const squishDist = TILE_SIZE * 0.5;

  for (const vehicle of allUnits) {
    if (!vehicle.alive || vehicle.category !== 'vehicle' || !vehicle.moving) continue;
    if (vehicle.damage === 0) continue; // Harvesters/MCVs don't squish

    for (const infantry of allUnits) {
      if (!infantry.alive || infantry.category !== 'infantry') continue;
      if (infantry.owner === vehicle.owner) continue; // No friendly squish

      const dx = vehicle.x - infantry.x;
      const dy = vehicle.y - infantry.y;
      if (Math.sqrt(dx * dx + dy * dy) < squishDist) {
        // Instant kill
        infantry.hp = 0;
        handleDeath(infantry);
      }
    }
  }
}

// Cheese zones (Käsekanone lingering damage)
let cheeseZones = [];

export function getCheeseZones() { return cheeseZones; }
export function clearCheeseZones() { cheeseZones = []; }

function spawnCheeseZone(x, y) {
  cheeseZones.push({ x, y, radius: SPLASH_RADIUS, timer: CHEESE_ZONE_DURATION });
}

function updateCheeseZones(dt) {
  const allUnits = getUnits();
  for (let i = cheeseZones.length - 1; i >= 0; i--) {
    const zone = cheeseZones[i];
    zone.timer -= dt;
    if (zone.timer <= 0) {
      cheeseZones.splice(i, 1);
      continue;
    }
    const dmg = CHEESE_ZONE_DPS * dt;
    for (const u of allUnits) {
      if (!u.alive) continue;
      const dx = u.x - zone.x;
      const dy = u.y - zone.y;
      if (Math.sqrt(dx * dx + dy * dy) <= zone.radius) {
        u.hp -= dmg;
        if (u.hp <= 0) {
          u.hp = 0;
          handleDeath(u);
        }
      }
    }
  }
}

function applyDrunkInRadius(x, y) {
  const allUnits = [...getUnits()];
  for (const u of allUnits) {
    if (!u.alive) continue;
    const dx = u.x - x;
    const dy = u.y - y;
    if (Math.sqrt(dx * dx + dy * dy) <= SPLASH_RADIUS) {
      u.drunkTimer = DRUNK_DURATION;
      u.drunkAngle = Math.random() * Math.PI * 2;
      u.path = [];
      u.target = null;
      u.moving = false;
    }
  }
}

/**
 * Update turret attacks. Turrets auto-target nearest enemy in range.
 */
function updateTurrets(dt) {
  const allUnits = getUnits();
  const buildings = getBuildings();

  for (const b of buildings) {
    if (!b.alive) continue;
    const stats = BuildingStats[b.type];
    if (!stats || !stats.range) continue;

    if (b.attackCooldown > 0) {
      b.attackCooldown -= dt;
      continue;
    }

    const bx = (b.tileX + b.footprint[0] / 2) * TILE_SIZE;
    const by = (b.tileY + b.footprint[1] / 2) * TILE_SIZE;
    const rangePixels = stats.range * TILE_SIZE;

    let target = null;
    let targetDist = Infinity;
    for (const u of allUnits) {
      if (!u.alive || u.owner === b.owner) continue;
      const dx = u.x - bx;
      const dy = u.y - by;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= rangePixels && dist < targetDist) {
        target = u;
        targetDist = dist;
      }
    }

    if (!target) continue;

    const color = '#ffaa00';
    const isRocket = stats.range >= 6;

    spawnProjectile(bx, by, target.x, target.y, color, () => {
      if (!target.alive) return;
      let dmg = stats.damage;

      if (isRocket && target.category === 'vehicle') {
        dmg *= DAMAGE_ROCKET_VS_VEHICLE;
      }

      const ttx = Math.floor(target.x / TILE_SIZE);
      const tty = Math.floor(target.y / TILE_SIZE);
      if (getTile(ttx, tty) === Terrain.FOREST) {
        dmg *= DAMAGE_FOREST_COVER;
      }

      dmg = Math.round(dmg);
      target.hp -= dmg;
      if (target.hp <= 0) {
        target.hp = 0;
        handleDeath(target);
      }
    });

    const baseCooldown = 1 / stats.attackSpeed;
    const powerMult = getPowerMultiplier(b.owner);
    b.attackCooldown = baseCooldown / powerMult;
  }
}

/**
 * Main combat update — called each game tick.
 */
export function updateCombat(dt) {
  updateTurrets(dt);
  updateCheeseZones(dt);
  checkSquish();
  const allUnits = getUnits();

  for (const unit of allUnits) {
    if (!canAttack(unit)) continue;

    // Decrease attack cooldown
    if (unit.attackCooldown > 0) {
      unit.attackCooldown -= dt;
    }

    // Clear dead or invalid targets
    if (unit.target && !unit.target.alive) {
      unit.target = null;
    }

    // Auto-acquire target if idle (no target, not moving or attack-moving)
    if (!unit.target) {
      const enemies = getEnemiesInRange(unit);
      if (enemies.length > 0) {
        // Pick closest enemy in range
        let closest = enemies[0];
        let closestDist = distBetween(unit, enemies[0]);
        for (let i = 1; i < enemies.length; i++) {
          const d = distBetween(unit, enemies[i]);
          if (d < closestDist) {
            closestDist = d;
            closest = enemies[i];
          }
        }
        unit.target = closest;
      }
    }

    if (!unit.target) continue;

    const rangePixels = unit.range * TILE_SIZE;
    const dist = distBetween(unit, unit.target);

    if (dist <= rangePixels) {
      // In range — stop moving and attack
      if (unit.moving && !unit.attackMoving) {
        stopUnit(unit);
      }

      if (unit.attackCooldown <= 0) {
        fireAttack(unit, unit.target);
        unit.attackCooldown = 1 / unit.attackSpeed;
      }
    } else if (!unit.moving) {
      // Out of range and not already moving — move toward target
      const targetTileX = Math.floor(unit.target.x / TILE_SIZE);
      const targetTileY = Math.floor(unit.target.y / TILE_SIZE);
      moveUnitTo(unit, targetTileX, targetTileY);
    }
  }
}

/**
 * Order a unit to attack a specific target.
 */
export function orderAttack(unit, target) {
  if (!canAttack(unit)) return;
  if (unit.drunkTimer > 0) return;
  unit.target = target;
  unit.attackMoving = false;

  // Move toward target if out of range
  const rangePixels = unit.range * TILE_SIZE;
  if (distBetween(unit, target) > rangePixels) {
    const targetTileX = Math.floor(target.x / TILE_SIZE);
    const targetTileY = Math.floor(target.y / TILE_SIZE);
    moveUnitTo(unit, targetTileX, targetTileY);
  }
}

/**
 * Order a unit to attack-move to a destination.
 * Unit moves toward destination but engages enemies encountered en route.
 */
export function orderAttackMove(unit, destTileX, destTileY) {
  if (!canAttack(unit)) return;
  unit.attackMoving = true;
  unit.target = null;
  moveUnitTo(unit, destTileX, destTileY);
}
