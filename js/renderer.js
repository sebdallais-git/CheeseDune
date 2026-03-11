import {
  CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, TERRAIN_COLORS,
  TOP_BAR_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, SIDEBAR_WIDTH,
  Terrain, FogState
} from './constants.js';
import { getFogState } from './fog.js';
import { getCamX, getCamY, getZoom, getVisibleTileRange } from './camera.js';
import { getTile, getMapWidth, getMapHeight } from './map.js';
import { drawMinimap as drawMinimapImpl } from './minimap.js';
import { getHoverTile } from './input.js';
import { drawUnits as drawUnitsImpl, drawSelectionBox as drawSelectionBoxImpl } from './unit-renderer.js';

let canvas, ctx, dpr;

let frameCount = 0;
let fps = 0;
let fpsTimer = 0;

export function updateFps(dt) {
  frameCount++;
  fpsTimer += dt;
  if (fpsTimer >= 1.0) {
    fps = frameCount;
    frameCount = 0;
    fpsTimer -= 1.0;
  }
}

export function drawDebugInfo() {
  const z = getZoom();
  const cx = getCamX();
  const cy = getCamY();
  const { x: hx, y: hy } = getHoverTile();

  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(0, 0, VIEWPORT_WIDTH, TOP_BAR_HEIGHT);

  ctx.fillStyle = '#888';
  ctx.font = '11px monospace';
  ctx.fillText(
    `Cam: ${Math.round(cx)},${Math.round(cy)}  Zoom: ${z.toFixed(2)}x  Tile: ${hx},${hy}  FPS: ${fps}`,
    10, 20
  );
}

export function initRenderer() {
  canvas = document.getElementById('game');
  ctx = canvas.getContext('2d');
  dpr = window.devicePixelRatio || 1;

  canvas.width = CANVAS_WIDTH * dpr;
  canvas.height = CANVAS_HEIGHT * dpr;
  ctx.scale(dpr, dpr);

  // Scale canvas to fill viewport maintaining aspect ratio
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
  const windowW = window.innerWidth;
  const windowH = window.innerHeight;
  const aspect = CANVAS_WIDTH / CANVAS_HEIGHT;
  const windowAspect = windowW / windowH;

  let cssW, cssH;
  if (windowAspect > aspect) {
    cssH = windowH;
    cssW = windowH * aspect;
  } else {
    cssW = windowW;
    cssH = windowW / aspect;
  }

  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
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

export function drawMinimap() {
  drawMinimapImpl(ctx);
}

export function drawFog() {
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
      const fog = getFogState(x, y);
      if (fog === FogState.VISIBLE) continue;

      const sx = (x * TILE_SIZE - cx) * z;
      const sy = (y * TILE_SIZE - cy) * z + TOP_BAR_HEIGHT;
      const size = TILE_SIZE * z;

      if (fog === FogState.HIDDEN) {
        ctx.fillStyle = '#000';
      } else {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      }
      ctx.fillRect(sx, sy, size + 0.5, size + 0.5);
    }
  }

  ctx.restore();
}

export function drawGrid() {
  const { startX, startY, endX, endY } = getVisibleTileRange();
  const z = getZoom();
  const cx = getCamX();
  const cy = getCamY();

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, TOP_BAR_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
  ctx.clip();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 0.5;

  // Vertical lines
  for (let x = startX; x <= endX + 1; x++) {
    const sx = (x * TILE_SIZE - cx) * z;
    ctx.beginPath();
    ctx.moveTo(sx, TOP_BAR_HEIGHT);
    ctx.lineTo(sx, TOP_BAR_HEIGHT + VIEWPORT_HEIGHT);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = startY; y <= endY + 1; y++) {
    const sy = (y * TILE_SIZE - cy) * z + TOP_BAR_HEIGHT;
    ctx.beginPath();
    ctx.moveTo(0, sy);
    ctx.lineTo(VIEWPORT_WIDTH, sy);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawUnits() {
  drawUnitsImpl(ctx);
}

export function drawSelectionBox(x1, y1, x2, y2) {
  drawSelectionBoxImpl(ctx, x1, y1, x2, y2);
}

export function drawHoverTile() {
  const { x: hx, y: hy } = getHoverTile();
  if (hx < 0 || hy < 0) return;
  if (getFogState(hx, hy) !== FogState.VISIBLE) return;

  const z = getZoom();
  const cx = getCamX();
  const cy = getCamY();
  const sx = (hx * TILE_SIZE - cx) * z;
  const sy = (hy * TILE_SIZE - cy) * z + TOP_BAR_HEIGHT;
  const size = TILE_SIZE * z;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, TOP_BAR_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
  ctx.clip();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(sx + 1, sy + 1, size - 2, size - 2);

  ctx.restore();
}
