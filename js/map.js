// Game/public/dune/js/map.js
import { Terrain } from './constants.js';

let mapWidth = 0;
let mapHeight = 0;
let tiles = null; // Flat array: tiles[y * mapWidth + x]

export function initMap(w, h, data) {
  mapWidth = w;
  mapHeight = h;
  tiles = data;
}

export function getMapWidth() { return mapWidth; }
export function getMapHeight() { return mapHeight; }

export function getTile(x, y) {
  if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) return Terrain.MOUNTAIN;
  return tiles[y * mapWidth + x];
}

export function setTile(x, y, terrain) {
  if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) return;
  tiles[y * mapWidth + x] = terrain;
}

export function createTestMap() {
  const w = 40;
  const h = 40;
  const data = new Uint8Array(w * h);

  // Fill with meadow
  data.fill(Terrain.MEADOW);

  // Mountain border (top and bottom rows, left and right cols)
  for (let x = 0; x < w; x++) {
    data[0 * w + x] = Terrain.MOUNTAIN;
    data[(h - 1) * w + x] = Terrain.MOUNTAIN;
  }
  for (let y = 0; y < h; y++) {
    data[y * w + 0] = Terrain.MOUNTAIN;
    data[y * w + (w - 1)] = Terrain.MOUNTAIN;
  }

  // Mountain cluster (top-right)
  for (let y = 2; y < 8; y++) {
    for (let x = 30; x < 38; x++) {
      data[y * w + x] = Terrain.MOUNTAIN;
    }
  }

  // Alpine pasture patches (harvestable cheese)
  const pasturePatches = [[5, 5, 4, 3], [20, 15, 5, 4], [10, 30, 3, 3], [30, 25, 4, 4]];
  for (const [px, py, pw, ph] of pasturePatches) {
    for (let y = py; y < py + ph && y < h; y++) {
      for (let x = px; x < px + pw && x < w; x++) {
        data[y * w + x] = Terrain.PASTURE;
      }
    }
  }

  // Forest area (center-left)
  for (let y = 15; y < 25; y++) {
    for (let x = 2; x < 8; x++) {
      data[y * w + x] = Terrain.FOREST;
    }
  }

  // Snow area (top area near mountains)
  for (let y = 1; y < 4; y++) {
    for (let x = 10; x < 20; x++) {
      data[y * w + x] = Terrain.SNOW;
    }
  }

  // River (vertical, with one bridge)
  for (let y = 5; y < 35; y++) {
    data[y * w + 15] = Terrain.RIVER;
    data[y * w + 16] = Terrain.RIVER;
  }
  // Bridge at y=20
  data[20 * w + 15] = Terrain.BRIDGE;
  data[20 * w + 16] = Terrain.BRIDGE;

  // Concrete pad (player base area)
  for (let y = 33; y < 37; y++) {
    for (let x = 3; x < 9; x++) {
      data[y * w + x] = Terrain.CONCRETE;
    }
  }

  // Bare ground patch
  for (let y = 28; y < 30; y++) {
    for (let x = 25; x < 28; x++) {
      data[y * w + x] = Terrain.BARE;
    }
  }

  return { width: w, height: h, data };
}
