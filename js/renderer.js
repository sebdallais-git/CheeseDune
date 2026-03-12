// Game/public/dune/js/renderer.js — Isometric renderer
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, TERRAIN_COLORS,
  TOP_BAR_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, SIDEBAR_WIDTH,
  Terrain, FogState, BOTTOM_BAR_HEIGHT
} from './constants.js';
import { getFogState } from './fog.js';
import { getZoom, getVisibleTileRange, worldToScreen, tileDiamondPath } from './camera.js';
import { getTile, getMapWidth, getMapHeight } from './map.js';
import { drawMinimap as drawMinimapImpl } from './minimap.js';
import { getHoverTile } from './input.js';
import { drawUnits as drawUnitsImpl, drawSelectionBox as drawSelectionBoxImpl } from './unit-renderer.js';
import { drawBuildings as drawBuildingsImpl, drawPlacementPreview as drawPlacementPreviewImpl } from './building-renderer.js';
import { drawSidebar as drawSidebarImpl } from './sidebar.js';
import { drawProjectiles as drawProjectilesImpl } from './projectiles.js';
import { drawParticles as drawParticlesImpl } from './particles.js';
import { getCheeseZones } from './combat.js';

let canvas, ctx, dpr;
let frameCount = 0, fps = 0, fpsTimer = 0;

export function updateFps(dt) {
  frameCount++;
  fpsTimer += dt;
  if (fpsTimer >= 1.0) { fps = frameCount; frameCount = 0; fpsTimer -= 1.0; }
}

export function drawDebugInfo() {
  const { x: hx, y: hy } = getHoverTile();
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(0, 0, VIEWPORT_WIDTH, TOP_BAR_HEIGHT);
  ctx.fillStyle = '#888';
  ctx.font = '11px monospace';
  ctx.fillText(`Tile: ${hx},${hy}  Zoom: ${getZoom().toFixed(2)}x  FPS: ${fps}`, 10, 20);
}

export function initRenderer() {
  canvas = document.getElementById('game');
  ctx = canvas.getContext('2d');
  dpr = window.devicePixelRatio || 1;
  canvas.width = CANVAS_WIDTH * dpr;
  canvas.height = CANVAS_HEIGHT * dpr;
  ctx.scale(dpr, dpr);
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
  const ww = window.innerWidth, wh = window.innerHeight;
  const aspect = CANVAS_WIDTH / CANVAS_HEIGHT;
  const wa = ww / wh;
  let cw, ch;
  if (wa > aspect) { ch = wh; cw = wh * aspect; } else { cw = ww; ch = ww / aspect; }
  canvas.style.width = cw + 'px';
  canvas.style.height = ch + 'px';
}

export function getCanvas() { return canvas; }
export function getCtx() { return ctx; }

export function clearScreen() {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

// Viewport clip helper
function clipViewport() {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, TOP_BAR_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
  ctx.clip();
}

export function drawTiles() {
  const { startX, startY, endX, endY } = getVisibleTileRange();
  const z = getZoom();
  clipViewport();

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      const tile = getTile(x, y);
      ctx.fillStyle = TERRAIN_COLORS[tile] || '#ff00ff';
      tileDiamondPath(ctx, x, y);
      ctx.fill();

      // Terrain details
      const center = worldToScreen((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
      if (tile === Terrain.PASTURE) {
        ctx.fillStyle = '#ffdd44';
        const d = Math.max(2, 3 * z);
        ctx.fillRect(center.x - 6 * z, center.y - 2 * z, d, d);
        ctx.fillRect(center.x + 4 * z, center.y + 2 * z, d, d);
      } else if (tile === Terrain.FOREST) {
        ctx.fillStyle = '#1a5c10';
        ctx.beginPath();
        ctx.arc(center.x, center.y - 2 * z, 6 * z, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4a3020';
        ctx.fillRect(center.x - 1 * z, center.y + 2 * z, 2 * z, 4 * z);
      } else if (tile === Terrain.MOUNTAIN) {
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.moveTo(center.x, center.y - 8 * z);
        ctx.lineTo(center.x - 8 * z, center.y + 4 * z);
        ctx.lineTo(center.x + 8 * z, center.y + 4 * z);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ddd';
        ctx.beginPath();
        ctx.moveTo(center.x, center.y - 8 * z);
        ctx.lineTo(center.x - 4 * z, center.y - 2 * z);
        ctx.lineTo(center.x + 4 * z, center.y - 2 * z);
        ctx.closePath();
        ctx.fill();
      } else if (tile === Terrain.SNOW) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        const d = Math.max(1, 2 * z);
        ctx.fillRect(center.x - 5 * z, center.y, d, d);
        ctx.fillRect(center.x + 3 * z, center.y - 3 * z, d, d);
      }
    }
  }
  ctx.restore();
}

export function drawGrid() {
  const { startX, startY, endX, endY } = getVisibleTileRange();
  clipViewport();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 0.5;
  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      tileDiamondPath(ctx, x, y);
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function drawFog() {
  const { startX, startY, endX, endY } = getVisibleTileRange();
  clipViewport();
  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      const fog = getFogState(x, y);
      if (fog === FogState.VISIBLE) continue;
      ctx.fillStyle = fog === FogState.HIDDEN ? '#000' : 'rgba(0,0,0,0.5)';
      tileDiamondPath(ctx, x, y);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function drawHoverTile() {
  const { x: hx, y: hy } = getHoverTile();
  if (hx < 0 || hy < 0) return;
  if (getFogState(hx, hy) !== FogState.VISIBLE) return;
  clipViewport();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 2;
  tileDiamondPath(ctx, hx, hy);
  ctx.stroke();
  ctx.restore();
}

export function drawCheeseZones() {
  const zones = getCheeseZones();
  if (zones.length === 0) return;
  clipViewport();
  for (const zone of zones) {
    const s = worldToScreen(zone.x, zone.y);
    const r = zone.radius * getZoom();
    const alpha = Math.max(0, zone.timer / 2.0) * 0.4;
    ctx.fillStyle = `rgba(255, 180, 0, ${alpha})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawSidebar() { drawSidebarImpl(ctx); }
export function drawMinimap() { drawMinimapImpl(ctx); }
export function drawUnits() { drawUnitsImpl(ctx); }
export function drawSelectionBox(x1, y1, x2, y2) { drawSelectionBoxImpl(ctx, x1, y1, x2, y2); }
export function drawProjectiles() { drawProjectilesImpl(ctx); }
export function drawParticles() { drawParticlesImpl(ctx); }
export function drawBuildings() { drawBuildingsImpl(ctx); }
export function drawPlacementPreview(type, tileX, tileY, valid) { drawPlacementPreviewImpl(ctx, type, tileX, tileY, valid); }

export function drawSelectionPanel(selected) {
  const y = CANVAS_HEIGHT - BOTTOM_BAR_HEIGHT;
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(0, y, VIEWPORT_WIDTH, BOTTOM_BAR_HEIGHT);
  if (selected.length === 0) return;
  ctx.fillStyle = '#aaa';
  ctx.font = '12px monospace';
  if (selected.length === 1) {
    const u = selected[0];
    ctx.fillText(`${u.type}  HP: ${u.hp}/${u.maxHp}`, 10, y + 20);
    const barX = 10, barY = y + 30, barW = 120, barH = 8;
    const frac = u.hp / u.maxHp;
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = frac > 0.5 ? '#00cc00' : frac > 0.25 ? '#cccc00' : '#cc0000';
    ctx.fillRect(barX, barY, barW * frac, barH);
  } else {
    ctx.fillText(`${selected.length} units selected`, 10, y + 20);
    const counts = {};
    for (const u of selected) counts[u.type] = (counts[u.type] || 0) + 1;
    let xOff = 10;
    ctx.font = '10px monospace';
    ctx.fillStyle = '#888';
    for (const [type, count] of Object.entries(counts)) {
      ctx.fillText(`${type}: ${count}`, xOff, y + 42);
      xOff += 120;
      if (xOff > VIEWPORT_WIDTH - 50) break;
    }
  }
}
