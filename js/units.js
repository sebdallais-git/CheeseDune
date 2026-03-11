// Game/public/dune/js/units.js
import { TILE_SIZE, UnitStats, TERRAIN_SPEED } from './constants.js';
import { getTile, getMapWidth, getMapHeight } from './map.js';
import { findPath } from './pathfinding.js';

let units = [];
let nextUnitId = 1;
export function getUnits() { return units; }

/**
 * Spawn a unit at a tile position.
 * @param {string} type - UnitType key
 * @param {string} faction - FactionId
 * @param {number} tileX - spawn tile X
 * @param {number} tileY - spawn tile Y
 * @param {string} owner - 'player' or 'enemy'
 * @returns {object} the created unit
 */
export function spawnUnit(type, faction, tileX, tileY, owner) {
  const stats = UnitStats[type];
  if (!stats) throw new Error(`Unknown unit type: ${type}`);

  const unit = {
    id: nextUnitId++,
    type,
    faction,
    owner,
    // Position in world pixels (center of unit)
    x: tileX * TILE_SIZE + TILE_SIZE / 2,
    y: tileY * TILE_SIZE + TILE_SIZE / 2,
    // Stats (copied so we can modify per-unit if needed)
    hp: stats.hp,
    maxHp: stats.hp,
    speed: stats.speed,        // tiles per second
    range: stats.range,
    damage: stats.damage,
    category: stats.category,
    visionRadius: stats.visionRadius,
    // Movement state
    path: [],                  // Array of {x, y} tile coords to follow
    pathIndex: 0,
    moving: false,
    // Direction the unit faces (radians, 0 = right)
    facing: Math.PI * 1.5,    // Default: facing up
    // Note: selection state is managed by selection.js, not stored on the unit
  };

  units.push(unit);
  return unit;
}

/**
 * Order a unit to move to a tile destination.
 * Calculates A* path and starts movement.
 */
export function moveUnitTo(unit, destTileX, destTileY) {
  const currentTileX = Math.floor(unit.x / TILE_SIZE);
  const currentTileY = Math.floor(unit.y / TILE_SIZE);

  const path = findPath(currentTileX, currentTileY, destTileX, destTileY);
  if (path.length === 0) return false;

  unit.path = path;
  unit.pathIndex = 0;
  unit.moving = true;
  return true;
}

/**
 * Stop a unit's movement.
 */
export function stopUnit(unit) {
  unit.path = [];
  unit.pathIndex = 0;
  unit.moving = false;
}

/**
 * Update all units (called each game tick).
 * Moves units along their paths based on speed and terrain.
 */
export function updateUnits(dt) {
  for (const unit of units) {
    if (!unit.moving || unit.path.length === 0) continue;

    const target = unit.path[unit.pathIndex];
    if (!target) {
      stopUnit(unit);
      continue;
    }

    // Target position in world pixels (center of target tile)
    const targetX = target.x * TILE_SIZE + TILE_SIZE / 2;
    const targetY = target.y * TILE_SIZE + TILE_SIZE / 2;

    // Distance to target
    const dx = targetX - unit.x;
    const dy = targetY - unit.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Speed adjusted by terrain
    const currentTile = getTile(
      Math.floor(unit.x / TILE_SIZE),
      Math.floor(unit.y / TILE_SIZE)
    );
    const terrainMult = TERRAIN_SPEED[currentTile] || 1;
    const moveSpeed = unit.speed * TILE_SIZE * terrainMult * dt;

    // Update facing direction
    if (dist > 0.1) {
      unit.facing = Math.atan2(dy, dx);
    }

    if (moveSpeed >= dist) {
      // Arrived at waypoint
      unit.x = targetX;
      unit.y = targetY;
      unit.pathIndex++;

      if (unit.pathIndex >= unit.path.length) {
        stopUnit(unit);
      }
    } else {
      // Move toward target
      unit.x += (dx / dist) * moveSpeed;
      unit.y += (dy / dist) * moveSpeed;
    }
  }
}

/**
 * Get the unit at a world pixel position (for tap selection).
 * Returns the closest unit within tap radius, or null.
 */
export function getUnitAtPosition(worldX, worldY, tapRadius) {
  let closest = null;
  let closestDist = tapRadius;

  for (const unit of units) {
    const dx = unit.x - worldX;
    const dy = unit.y - worldY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < closestDist) {
      closestDist = dist;
      closest = unit;
    }
  }

  return closest;
}

/**
 * Get all units within a world-space rectangle (for box select).
 */
export function getUnitsInRect(x1, y1, x2, y2) {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);

  return units.filter(u =>
    u.x >= minX && u.x <= maxX &&
    u.y >= minY && u.y <= maxY
  );
}

/**
 * Get all player units of the same type (map-wide).
 * Used for double-tap select-all.
 */
export function getUnitsOfType(type, owner) {
  return units.filter(u => u.type === type && u.owner === owner);
}

/**
 * Remove a unit (on death).
 */
export function removeUnit(unit) {
  const idx = units.indexOf(unit);
  if (idx !== -1) units.splice(idx, 1);
}

export function clearUnits() {
  units = [];
  nextUnitId = 1;
}
