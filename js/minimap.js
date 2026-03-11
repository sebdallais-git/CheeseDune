// Game/public/dune/js/minimap.js
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, SIDEBAR_WIDTH, VIEWPORT_WIDTH, VIEWPORT_HEIGHT,
  TILE_SIZE, TERRAIN_COLORS, TOP_BAR_HEIGHT, FogState
} from './constants.js';
import { getMapWidth, getMapHeight, getTile } from './map.js';
import { getCamX, getCamY, getZoom, centerOnTile } from './camera.js';
import { getFogState } from './fog.js';

const MINIMAP_PADDING = 8;
const MINIMAP_MAX_WIDTH = SIDEBAR_WIDTH - MINIMAP_PADDING * 2;
const MINIMAP_MAX_HEIGHT = 140;

let minimapX = 0;
let minimapY = 0;
let minimapW = 0;
let minimapH = 0;
let tileScale = 1;

export function initMinimap() {
  const mapW = getMapWidth();
  const mapH = getMapHeight();

  const scaleX = MINIMAP_MAX_WIDTH / mapW;
  const scaleY = MINIMAP_MAX_HEIGHT / mapH;
  tileScale = Math.min(scaleX, scaleY);
  tileScale = Math.max(tileScale, 1);

  minimapW = Math.floor(mapW * tileScale);
  minimapH = Math.floor(mapH * tileScale);
  minimapX = VIEWPORT_WIDTH + MINIMAP_PADDING + (MINIMAP_MAX_WIDTH - minimapW) / 2;
  minimapY = CANVAS_HEIGHT - minimapH - MINIMAP_PADDING - 10;
}

export function drawMinimap(ctx) {
  const mapW = getMapWidth();
  const mapH = getMapHeight();

  // Background
  ctx.fillStyle = '#000';
  ctx.fillRect(minimapX - 1, minimapY - 1, minimapW + 2, minimapH + 2);

  // Draw terrain tiles
  for (let y = 0; y < mapH; y++) {
    for (let x = 0; x < mapW; x++) {
      const fog = getFogState(x, y);

      if (fog === FogState.HIDDEN) {
        continue;
      }

      const tile = getTile(x, y);
      ctx.fillStyle = TERRAIN_COLORS[tile] || '#ff00ff';
      ctx.fillRect(
        minimapX + x * tileScale,
        minimapY + y * tileScale,
        Math.ceil(tileScale),
        Math.ceil(tileScale)
      );

      if (fog === FogState.REVEALED) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(
          minimapX + x * tileScale,
          minimapY + y * tileScale,
          Math.ceil(tileScale),
          Math.ceil(tileScale)
        );
      }
    }
  }

  // Draw viewport rectangle
  const z = getZoom();
  const viewWorldW = VIEWPORT_WIDTH / z;
  const viewWorldH = VIEWPORT_HEIGHT / z;
  const camTileX = getCamX() / TILE_SIZE;
  const camTileY = getCamY() / TILE_SIZE;
  const viewTileW = viewWorldW / TILE_SIZE;
  const viewTileH = viewWorldH / TILE_SIZE;

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.strokeRect(
    minimapX + camTileX * tileScale,
    minimapY + camTileY * tileScale,
    viewTileW * tileScale,
    viewTileH * tileScale
  );

  // Label
  ctx.fillStyle = '#666';
  ctx.font = '10px monospace';
  ctx.fillText('MAP', minimapX, minimapY - 3);
}

export function handleMinimapClick(screenX, screenY) {
  if (
    screenX >= minimapX && screenX < minimapX + minimapW &&
    screenY >= minimapY && screenY < minimapY + minimapH
  ) {
    const tileX = (screenX - minimapX) / tileScale;
    const tileY = (screenY - minimapY) / tileScale;
    centerOnTile(tileX, tileY);
    return true;
  }
  return false;
}

export function getMinimapBounds() {
  return { x: minimapX, y: minimapY, w: minimapW, h: minimapH };
}
