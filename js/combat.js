// Game/public/dune/js/combat.js
import {
  TILE_SIZE, UnitType, Terrain,
  DAMAGE_ROCKET_VS_VEHICLE, DAMAGE_ROCKET_VS_INFANTRY,
  DAMAGE_FOREST_COVER, SPLASH_RADIUS
} from './constants.js';
import {
  getUnits, removeUnit, getEnemiesInRange, getNearestEnemy, moveUnitTo, stopUnit
} from './units.js';
import { getTile } from './map.js';
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
 * Main combat update — called each game tick.
 */
export function updateCombat(dt) {
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
