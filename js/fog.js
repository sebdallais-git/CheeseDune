// Game/public/dune/js/fog.js
import { FogState } from './constants.js';
import { getMapWidth, getMapHeight } from './map.js';

let fogGrid = null;
let mapW = 0;
let mapH = 0;

export function initFog() {
  mapW = getMapWidth();
  mapH = getMapHeight();
  fogGrid = new Uint8Array(mapW * mapH);
}

export function getFogState(x, y) {
  if (x < 0 || x >= mapW || y < 0 || y >= mapH) return FogState.HIDDEN;
  return fogGrid[y * mapW + x];
}

export function resetVisibility() {
  for (let i = 0; i < fogGrid.length; i++) {
    if (fogGrid[i] === FogState.VISIBLE) {
      fogGrid[i] = FogState.REVEALED;
    }
  }
}

export function revealArea(cx, cy, radius) {
  const r2 = radius * radius;
  const startX = Math.max(0, Math.floor(cx - radius));
  const startY = Math.max(0, Math.floor(cy - radius));
  const endX = Math.min(mapW - 1, Math.ceil(cx + radius));
  const endY = Math.min(mapH - 1, Math.ceil(cy + radius));

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) {
        fogGrid[y * mapW + x] = FogState.VISIBLE;
      }
    }
  }
}

export function revealAll() {
  fogGrid.fill(FogState.VISIBLE);
}
