import {
  CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, TERRAIN_COLORS,
  TOP_BAR_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, SIDEBAR_WIDTH,
  Terrain
} from './constants.js';
import { getCamX, getCamY, getZoom, getVisibleTileRange } from './camera.js';
import { getTile, getMapWidth, getMapHeight } from './map.js';

let canvas, ctx, dpr;

export function initRenderer() {
  canvas = document.getElementById('game');
  ctx = canvas.getContext('2d');
  dpr = window.devicePixelRatio || 1;

  canvas.width = CANVAS_WIDTH * dpr;
  canvas.height = CANVAS_HEIGHT * dpr;
  canvas.style.width = CANVAS_WIDTH + 'px';
  canvas.style.height = CANVAS_HEIGHT + 'px';
  ctx.scale(dpr, dpr);
}

export function getCanvas() { return canvas; }
export function getCtx() { return ctx; }

export function clearScreen() {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

export function drawTiles() {
  const { startX, startY, endX, endY } = getVisibleTileRange();
  const z = getZoom();
  const cx = getCamX();
  const cy = getCamY();

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, TOP_BAR_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
  ctx.clip();

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      const tile = getTile(x, y);
      const sx = (x * TILE_SIZE - cx) * z;
      const sy = (y * TILE_SIZE - cy) * z + TOP_BAR_HEIGHT;
      const size = TILE_SIZE * z;

      // Base color
      ctx.fillStyle = TERRAIN_COLORS[tile] || '#ff00ff';
      ctx.fillRect(sx, sy, size + 0.5, size + 0.5);

      // Terrain detail overlays
      if (tile === Terrain.PASTURE) {
        ctx.fillStyle = '#ffdd44';
        const dotSize = Math.max(2, 3 * z);
        ctx.fillRect(sx + size * 0.3, sy + size * 0.3, dotSize, dotSize);
        ctx.fillRect(sx + size * 0.6, sy + size * 0.6, dotSize, dotSize);
      } else if (tile === Terrain.FOREST) {
        ctx.fillStyle = '#1a5c10';
        const r = size * 0.25;
        ctx.beginPath();
        ctx.arc(sx + size * 0.5, sy + size * 0.4, r, 0, Math.PI * 2);
        ctx.fill();
      } else if (tile === Terrain.MOUNTAIN) {
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.moveTo(sx + size * 0.5, sy + size * 0.15);
        ctx.lineTo(sx + size * 0.2, sy + size * 0.85);
        ctx.lineTo(sx + size * 0.8, sy + size * 0.85);
        ctx.closePath();
        ctx.fill();
        // Snow cap
        ctx.fillStyle = '#ddd';
        ctx.beginPath();
        ctx.moveTo(sx + size * 0.5, sy + size * 0.15);
        ctx.lineTo(sx + size * 0.35, sy + size * 0.45);
        ctx.lineTo(sx + size * 0.65, sy + size * 0.45);
        ctx.closePath();
        ctx.fill();
      } else if (tile === Terrain.SNOW) {
        ctx.fillStyle = '#fff';
        const d = Math.max(1, 2 * z);
        ctx.fillRect(sx + size * 0.2, sy + size * 0.5, d, d);
        ctx.fillRect(sx + size * 0.7, sy + size * 0.3, d, d);
      }
    }
  }

  ctx.restore();
}

export function drawSidebar() {
  ctx.fillStyle = '#111118';
  ctx.fillRect(VIEWPORT_WIDTH, 0, SIDEBAR_WIDTH, CANVAS_HEIGHT);
}

export function drawTopBar() {
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(0, 0, VIEWPORT_WIDTH, TOP_BAR_HEIGHT);
  ctx.fillStyle = '#888';
  ctx.font = '12px monospace';
  ctx.fillText('Alpine Cheese Rush — Phase 1', 10, 20);
}

export function drawBottomBar() {
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(0, CANVAS_HEIGHT - 60, VIEWPORT_WIDTH, 60);
}
