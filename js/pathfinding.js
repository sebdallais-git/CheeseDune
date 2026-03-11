// Game/public/dune/js/pathfinding.js
import { Terrain, TERRAIN_PASSABLE, TERRAIN_SPEED } from './constants.js';
import { getTile, getMapWidth, getMapHeight } from './map.js';

/**
 * Find a path from (startX, startY) to (endX, endY) using A*.
 * Returns array of {x, y} tile coords (including start, excluding end if blocked),
 * or empty array if no path exists.
 * @param {number} startX - start tile X
 * @param {number} startY - start tile Y
 * @param {number} endX - destination tile X
 * @param {number} endY - destination tile Y
 * @returns {{x: number, y: number}[]}
 */
export function findPath(startX, startY, endX, endY) {
  const mapW = getMapWidth();
  const mapH = getMapHeight();

  // Bounds check
  if (endX < 0 || endX >= mapW || endY < 0 || endY >= mapH) return [];
  if (!TERRAIN_PASSABLE[getTile(endX, endY)]) return [];
  if (startX === endX && startY === endY) return []; // Already there — caller should treat as success

  // Note: gScore serves as combined open+closed tracking. No separate closed set needed
  // because Manhattan heuristic on 4-directional grid is consistent (monotone).
  // Note: Building occupancy is not checked here — will be added in Phase 4 via a
  // callback or by marking building tiles as impassable in the map.
  const key = (x, y) => y * mapW + x;
  const startKey = key(startX, startY);
  const endKey = key(endX, endY);

  // Use Manhattan distance for 4-directional grid
  const heuristic = (x, y) => Math.abs(x - endX) + Math.abs(y - endY);

  const openSet = new Map(); // key -> {x, y, g, f}
  const cameFrom = new Map(); // key -> parentKey
  const gScore = new Map();   // key -> best known cost

  gScore.set(startKey, 0);
  openSet.set(startKey, {
    x: startX, y: startY,
    g: 0,
    f: heuristic(startX, startY),
  });

  // 4-directional neighbors
  const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];

  let iterations = 0;
  const MAX_ITERATIONS = mapW * mapH; // Scale with map size (up to 6400 for 80x80)

  while (openSet.size > 0 && iterations < MAX_ITERATIONS) {
    iterations++;

    // Find node with lowest f in open set
    let bestKey = null;
    let bestF = Infinity;
    for (const [k, node] of openSet) {
      if (node.f < bestF) {
        bestF = node.f;
        bestKey = k;
      }
    }

    const current = openSet.get(bestKey);
    openSet.delete(bestKey);

    if (bestKey === endKey) {
      // Reconstruct path
      return reconstructPath(cameFrom, bestKey, startKey, mapW);
    }

    for (const [dx, dy] of dirs) {
      const nx = current.x + dx;
      const ny = current.y + dy;

      if (nx < 0 || nx >= mapW || ny < 0 || ny >= mapH) continue;

      const tile = getTile(nx, ny);
      if (!TERRAIN_PASSABLE[tile]) continue;

      const nKey = key(nx, ny);
      // Cost = 1/speed: forest (speed 0.5) → cost 2, snow (0.7) → cost ~1.4, meadow (1.0) → cost 1
      const moveCost = 1 / (TERRAIN_SPEED[tile] || 1);
      const tentativeG = current.g + moveCost;

      const prevG = gScore.get(nKey);
      if (prevG !== undefined && tentativeG >= prevG) continue;

      gScore.set(nKey, tentativeG);
      cameFrom.set(nKey, bestKey);

      openSet.set(nKey, {
        x: nx, y: ny,
        g: tentativeG,
        f: tentativeG + heuristic(nx, ny),
      });
    }
  }

  return []; // No path found
}

function reconstructPath(cameFrom, endKey, startKey, mapW) {
  const path = [];
  let current = endKey;

  while (current !== startKey) {
    const x = current % mapW;
    const y = Math.floor(current / mapW);
    path.push({ x, y });
    current = cameFrom.get(current);
    if (current === undefined) return []; // Broken chain
  }

  path.reverse();
  return path;
}
