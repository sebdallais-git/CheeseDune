// Game/public/dune/js/mapgen.js
import { Terrain } from './constants.js';

/**
 * Seeded pseudo-random number generator (mulberry32).
 */
function createRng(seed) {
  let s = seed | 0;
  return function() {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate a permutation table for noise.
 */
function createPermTable(rng) {
  const p = new Uint8Array(512);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 256; i++) p[i + 256] = p[i];
  return p;
}

/**
 * 2D value noise with smoothstep interpolation.
 */
function valueNoise(x, y, perm) {
  const xi = Math.floor(x) & 255;
  const yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);

  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);

  const aa = perm[perm[xi] + yi] / 255;
  const ab = perm[perm[xi] + yi + 1] / 255;
  const ba = perm[perm[xi + 1] + yi] / 255;
  const bb = perm[perm[xi + 1] + yi + 1] / 255;

  const x1 = aa + u * (ba - aa);
  const x2 = ab + u * (bb - ab);
  return x1 + v * (x2 - x1);
}

/**
 * Multi-octave noise.
 */
function fbm(x, y, perm, octaves, lacunarity, gain) {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let max = 0;

  for (let i = 0; i < octaves; i++) {
    value += amplitude * valueNoise(x * frequency, y * frequency, perm);
    max += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }

  return value / max;
}

/**
 * Generate starting positions for players.
 */
function getStartPositions(width, height, numPlayers, margin) {
  const m = margin;
  const positions = [
    { x: m, y: height - m - 3 },
    { x: width - m - 3, y: m },
    { x: width - m - 3, y: height - m - 3 },
    { x: m, y: m },
  ];
  return positions.slice(0, numPlayers);
}

/**
 * Generate a random map.
 * @param {number} width - map width in tiles
 * @param {number} height - map height in tiles
 * @param {number} seed - integer seed
 * @param {number} numPlayers - total players (human + AI)
 * @returns {{ data: Uint8Array, width: number, height: number, startPositions: Array }}
 */
export function generateMap(width, height, seed, numPlayers) {
  const rng = createRng(seed);
  const perm1 = createPermTable(rng);
  const perm2 = createPermTable(rng);

  const data = new Uint8Array(width * height);
  const scale1 = 0.08;
  const scale2 = 0.12;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const elev = fbm(x * scale1, y * scale1, perm1, 3, 2.0, 0.5);
      const pastureNoise = fbm(x * scale2, y * scale2, perm2, 2, 2.0, 0.5);

      let terrain;
      if (elev < 0.2) {
        terrain = Terrain.RIVER;
      } else if (elev < 0.35) {
        terrain = Terrain.MEADOW;
      } else if (elev < 0.65) {
        terrain = (pastureNoise > 0.6) ? Terrain.PASTURE : Terrain.MEADOW;
      } else if (elev < 0.8) {
        terrain = Terrain.FOREST;
      } else if (elev > 0.9 && y < height / 3) {
        terrain = Terrain.SNOW;
      } else {
        terrain = Terrain.MOUNTAIN;
      }

      data[y * width + x] = terrain;
    }
  }

  // Place bridges at narrow river crossings
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (data[y * width + x] !== Terrain.RIVER) continue;

      const leftOk = x > 0 && data[y * width + x - 1] !== Terrain.RIVER;
      const rightOk = x < width - 1 && data[y * width + x + 1] !== Terrain.RIVER;
      const topRiver = y > 0 && data[(y - 1) * width + x] === Terrain.RIVER;
      const botRiver = y < height - 1 && data[(y + 1) * width + x] === Terrain.RIVER;

      if (leftOk && rightOk && !topRiver && !botRiver) {
        if (rng() < 0.3) data[y * width + x] = Terrain.BRIDGE;
      }

      const topOk = y > 0 && data[(y - 1) * width + x] !== Terrain.RIVER;
      const botOk = y < height - 1 && data[(y + 1) * width + x] !== Terrain.RIVER;
      const leftRiver = x > 0 && data[y * width + x - 1] === Terrain.RIVER;
      const rightRiver = x < width - 1 && data[y * width + x + 1] === Terrain.RIVER;

      if (topOk && botOk && !leftRiver && !rightRiver) {
        if (rng() < 0.3) data[y * width + x] = Terrain.BRIDGE;
      }
    }
  }

  const margin = 5;
  const startPositions = getStartPositions(width, height, numPlayers, margin);

  // Clear area around each start position
  for (const pos of startPositions) {
    const clearRadius = 10;
    for (let dy = -clearRadius; dy <= clearRadius; dy++) {
      for (let dx = -clearRadius; dx <= clearRadius; dx++) {
        const tx = pos.x + dx;
        const ty = pos.y + dy;
        if (tx < 0 || tx >= width || ty < 0 || ty >= height) continue;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= clearRadius) {
          data[ty * width + tx] = Terrain.MEADOW;
        }
      }
    }

    // Place pasture clusters near start
    for (let c = 0; c < 4; c++) {
      const angle = (Math.PI * 2 * c) / 4 + rng() * 0.5;
      const dist = 10 + rng() * 5;
      const px = Math.floor(pos.x + Math.cos(angle) * dist);
      const py = Math.floor(pos.y + Math.sin(angle) * dist);

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const tx = px + dx;
          const ty = py + dy;
          if (tx >= 0 && tx < width && ty >= 0 && ty < height) {
            data[ty * width + tx] = Terrain.PASTURE;
          }
        }
      }
    }
  }

  return { data, width, height, startPositions };
}
