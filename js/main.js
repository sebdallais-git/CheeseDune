// Game/public/dune/js/main.js
import { createTestMap, getTile, getMapWidth, getMapHeight, initMap } from './map.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, TERRAIN_COLORS } from './constants.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const dpr = window.devicePixelRatio || 1;
canvas.width = CANVAS_WIDTH * dpr;
canvas.height = CANVAS_HEIGHT * dpr;
canvas.style.width = CANVAS_WIDTH + 'px';
canvas.style.height = CANVAS_HEIGHT + 'px';
ctx.scale(dpr, dpr);

const testMap = createTestMap();
initMap(testMap.width, testMap.height, testMap.data);

// Draw first 30x25 tiles (fits 960x800 viewport)
for (let y = 0; y < 25; y++) {
  for (let x = 0; x < 30; x++) {
    const tile = getTile(x, y);
    ctx.fillStyle = TERRAIN_COLORS[tile] || '#ff00ff';
    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }
}
