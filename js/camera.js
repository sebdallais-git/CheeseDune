import { TILE_SIZE, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, TOP_BAR_HEIGHT, MIN_ZOOM, MAX_ZOOM } from './constants.js';
import { getMapWidth, getMapHeight } from './map.js';

let camX = 0;
let camY = 0;
let zoom = 1.0;

export function initCamera() {
  camX = 0;
  camY = 0;
  zoom = 1.0;
}

export function getCamX() { return camX; }
export function getCamY() { return camY; }
export function getZoom() { return zoom; }

export function moveCamera(dx, dy) {
  camX -= dx;
  camY -= dy;
  clampCamera();
}

export function setZoom(newZoom, screenX, screenY) {
  const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
  if (clamped === zoom) return;

  const worldX = camX + screenX / zoom;
  const worldY = camY + screenY / zoom;

  zoom = clamped;

  camX = worldX - screenX / zoom;
  camY = worldY - screenY / zoom;

  clampCamera();
}

export function centerOnTile(tileX, tileY) {
  const worldX = tileX * TILE_SIZE + TILE_SIZE / 2;
  const worldY = tileY * TILE_SIZE + TILE_SIZE / 2;
  camX = worldX - (VIEWPORT_WIDTH / zoom) / 2;
  camY = worldY - (VIEWPORT_HEIGHT / zoom) / 2;
  clampCamera();
}

function clampCamera() {
  const mapPixelW = getMapWidth() * TILE_SIZE;
  const mapPixelH = getMapHeight() * TILE_SIZE;
  const viewW = VIEWPORT_WIDTH / zoom;
  const viewH = VIEWPORT_HEIGHT / zoom;

  if (mapPixelW <= viewW) {
    camX = (mapPixelW - viewW) / 2;
  } else {
    camX = Math.max(0, Math.min(camX, mapPixelW - viewW));
  }

  if (mapPixelH <= viewH) {
    camY = (mapPixelH - viewH) / 2;
  } else {
    camY = Math.max(0, Math.min(camY, mapPixelH - viewH));
  }
}

export function screenToTile(screenX, screenY) {
  const vx = screenX;
  const vy = screenY - TOP_BAR_HEIGHT;

  if (vx < 0 || vx >= VIEWPORT_WIDTH || vy < 0 || vy >= VIEWPORT_HEIGHT) {
    return null;
  }

  const worldX = camX + vx / zoom;
  const worldY = camY + vy / zoom;
  const tileX = Math.floor(worldX / TILE_SIZE);
  const tileY = Math.floor(worldY / TILE_SIZE);

  return { tileX, tileY };
}

export function worldToScreen(worldX, worldY) {
  return {
    x: (worldX - camX) * zoom,
    y: (worldY - camY) * zoom + TOP_BAR_HEIGHT,
  };
}

export function getVisibleTileRange() {
  const viewW = VIEWPORT_WIDTH / zoom;
  const viewH = VIEWPORT_HEIGHT / zoom;

  const startX = Math.max(0, Math.floor(camX / TILE_SIZE));
  const startY = Math.max(0, Math.floor(camY / TILE_SIZE));
  const endX = Math.min(getMapWidth() - 1, Math.floor((camX + viewW) / TILE_SIZE));
  const endY = Math.min(getMapHeight() - 1, Math.floor((camY + viewH) / TILE_SIZE));

  return { startX, startY, endX, endY };
}
