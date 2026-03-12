// Game/public/dune/js/camera.js — Isometric camera system
import { TILE_SIZE, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, TOP_BAR_HEIGHT, MIN_ZOOM, MAX_ZOOM } from './constants.js';
import { getMapWidth, getMapHeight } from './map.js';

// Isometric tile visual dimensions (2:1 ratio)
export const ISO_TILE_W = 64;
export const ISO_TILE_H = 32;
const ISO_HW = ISO_TILE_W / 2;
const ISO_HH = ISO_TILE_H / 2;

// Camera position in iso screen space
let camX = 0;
let camY = 0;
let zoom = 1.0;

export function initCamera() { camX = 0; camY = 0; zoom = 1.0; }
export function getCamX() { return camX; }
export function getCamY() { return camY; }
export function getZoom() { return zoom; }

// World pixel → iso screen → final canvas position
export function worldToScreen(worldX, worldY) {
  const tx = worldX / TILE_SIZE;
  const ty = worldY / TILE_SIZE;
  return {
    x: ((tx - ty) * ISO_HW - camX) * zoom,
    y: ((tx + ty) * ISO_HH - camY) * zoom + TOP_BAR_HEIGHT,
  };
}

// Canvas position → world pixel position
export function screenToWorldPos(canvasX, canvasY) {
  const isoX = canvasX / zoom + camX;
  const isoY = (canvasY - TOP_BAR_HEIGHT) / zoom + camY;
  const tx = (isoX / ISO_HW + isoY / ISO_HH) / 2;
  const ty = (isoY / ISO_HH - isoX / ISO_HW) / 2;
  return { x: tx * TILE_SIZE, y: ty * TILE_SIZE };
}

// Tile (integer) → iso screen coordinates of tile center
export function tileToScreen(tileX, tileY) {
  return worldToScreen((tileX + 0.5) * TILE_SIZE, (tileY + 0.5) * TILE_SIZE);
}

// Draw a diamond path for tile (tx, ty) — call ctx.fill()/stroke() after
export function tileDiamondPath(ctx, tx, ty) {
  const top = worldToScreen(tx * TILE_SIZE, ty * TILE_SIZE);
  const right = worldToScreen((tx + 1) * TILE_SIZE, ty * TILE_SIZE);
  const bottom = worldToScreen((tx + 1) * TILE_SIZE, (ty + 1) * TILE_SIZE);
  const left = worldToScreen(tx * TILE_SIZE, (ty + 1) * TILE_SIZE);
  ctx.beginPath();
  ctx.moveTo(top.x, top.y);
  ctx.lineTo(right.x, right.y);
  ctx.lineTo(bottom.x, bottom.y);
  ctx.lineTo(left.x, left.y);
  ctx.closePath();
  return { top, right, bottom, left };
}

export function moveCamera(dx, dy) {
  camX -= dx;
  camY -= dy;
  clampCamera();
}

export function setZoom(newZoom, screenX, screenY) {
  const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
  if (clamped === zoom) return;
  const isoX = screenX / zoom + camX;
  const isoY = screenY / zoom + camY;
  zoom = clamped;
  camX = isoX - screenX / zoom;
  camY = isoY - screenY / zoom;
  clampCamera();
}

export function centerOnTile(tileX, tileY) {
  const tx = tileX + 0.5;
  const ty = tileY + 0.5;
  const isoX = (tx - ty) * ISO_HW;
  const isoY = (tx + ty) * ISO_HH;
  camX = isoX - (VIEWPORT_WIDTH / zoom) / 2;
  camY = isoY - (VIEWPORT_HEIGHT / zoom) / 2;
  clampCamera();
}

function clampCamera() {
  const mw = getMapWidth();
  const mh = getMapHeight();
  // Iso bounding box of the map: corners at (0,0), (mw,0), (0,mh), (mw,mh) in tile space
  const pts = [
    [0, 0], [mw, 0], [0, mh], [mw, mh],
  ];
  let minIX = Infinity, maxIX = -Infinity, minIY = Infinity, maxIY = -Infinity;
  for (const [x, y] of pts) {
    const ix = (x - y) * ISO_HW;
    const iy = (x + y) * ISO_HH;
    minIX = Math.min(minIX, ix); maxIX = Math.max(maxIX, ix);
    minIY = Math.min(minIY, iy); maxIY = Math.max(maxIY, iy);
  }
  const vw = VIEWPORT_WIDTH / zoom;
  const vh = VIEWPORT_HEIGHT / zoom;
  const iw = maxIX - minIX;
  const ih = maxIY - minIY;
  camX = iw <= vw ? minIX + (iw - vw) / 2 : Math.max(minIX, Math.min(camX, maxIX - vw));
  camY = ih <= vh ? minIY + (ih - vh) / 2 : Math.max(minIY, Math.min(camY, maxIY - vh));
}

export function screenToTile(screenX, screenY) {
  const vx = screenX;
  const vy = screenY - TOP_BAR_HEIGHT;
  if (vx < 0 || vx >= VIEWPORT_WIDTH || vy < 0 || vy >= VIEWPORT_HEIGHT) return null;
  const w = screenToWorldPos(screenX, screenY);
  return { tileX: Math.floor(w.x / TILE_SIZE), tileY: Math.floor(w.y / TILE_SIZE) };
}

export function getVisibleTileRange() {
  const mw = getMapWidth();
  const mh = getMapHeight();
  const corners = [
    screenToWorldPos(0, TOP_BAR_HEIGHT),
    screenToWorldPos(VIEWPORT_WIDTH, TOP_BAR_HEIGHT),
    screenToWorldPos(0, TOP_BAR_HEIGHT + VIEWPORT_HEIGHT),
    screenToWorldPos(VIEWPORT_WIDTH, TOP_BAR_HEIGHT + VIEWPORT_HEIGHT),
  ];
  let minTX = Infinity, maxTX = -Infinity, minTY = Infinity, maxTY = -Infinity;
  for (const c of corners) {
    const tx = c.x / TILE_SIZE;
    const ty = c.y / TILE_SIZE;
    minTX = Math.min(minTX, tx); maxTX = Math.max(maxTX, tx);
    minTY = Math.min(minTY, ty); maxTY = Math.max(maxTY, ty);
  }
  return {
    startX: Math.max(0, Math.floor(minTX) - 1),
    startY: Math.max(0, Math.floor(minTY) - 1),
    endX: Math.min(mw - 1, Math.ceil(maxTX) + 1),
    endY: Math.min(mh - 1, Math.ceil(maxTY) + 1),
  };
}
