// Game/public/dune/js/projectiles.js — game logic only (rendering in three-projectiles.js)
import { PROJECTILE_SPEED } from './constants.js';

let projectiles = [];

/**
 * Spawn a projectile from source to target position.
 * @param {number} fromX - start world X
 * @param {number} fromY - start world Y
 * @param {number} toX - target world X
 * @param {number} toY - target world Y
 * @param {string} color - projectile color
 * @param {function} onHit - callback when projectile reaches target
 */
export function spawnProjectile(fromX, fromY, toX, toY, color, onHit) {
  projectiles.push({
    x: fromX,
    y: fromY,
    toX,
    toY,
    color,
    onHit,
    alive: true,
  });
}

/**
 * Update all projectiles (move toward target, trigger hit).
 */
export function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    if (!p.alive) {
      projectiles.splice(i, 1);
      continue;
    }

    const dx = p.toX - p.x;
    const dy = p.toY - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const moveAmount = PROJECTILE_SPEED * dt;

    if (moveAmount >= dist) {
      // Arrived at target
      p.x = p.toX;
      p.y = p.toY;
      p.alive = false;
      if (p.onHit) p.onHit();
      projectiles.splice(i, 1);
    } else {
      p.x += (dx / dist) * moveAmount;
      p.y += (dy / dist) * moveAmount;
    }
  }
}

export function getProjectiles() {
  return projectiles;
}

export function clearProjectiles() {
  projectiles = [];
}
