import { createTestMap, getTile, initMap } from './map.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, TERRAIN_COLORS, TOP_BAR_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from './constants.js';
import { initCamera, getCamX, getCamY, getZoom, getVisibleTileRange, centerOnTile } from './camera.js';

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
initCamera();
centerOnTile(20, 20); // Center on middle of 40x40 map

function draw() {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const { startX, startY, endX, endY } = getVisibleTileRange();
  const z = getZoom();
  const cx = getCamX();
  const cy = getCamY();

  ctx.save();
  // Clip to viewport area
  ctx.beginPath();
  ctx.rect(0, TOP_BAR_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
  ctx.clip();

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      const tile = getTile(x, y);
      const sx = (x * TILE_SIZE - cx) * z;
      const sy = (y * TILE_SIZE - cy) * z + TOP_BAR_HEIGHT;
      const size = TILE_SIZE * z;
      ctx.fillStyle = TERRAIN_COLORS[tile] || '#ff00ff';
      ctx.fillRect(sx, sy, size + 0.5, size + 0.5); // +0.5 avoids subpixel gaps
    }
  }

  ctx.restore();

  // Draw placeholder sidebar
  ctx.fillStyle = '#111';
  ctx.fillRect(VIEWPORT_WIDTH, 0, 160, CANVAS_HEIGHT);
  ctx.fillStyle = '#555';
  ctx.font = '12px monospace';
  ctx.fillText('SIDEBAR', VIEWPORT_WIDTH + 40, 50);

  requestAnimationFrame(draw);
}

draw();
