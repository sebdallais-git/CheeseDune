// Game/public/dune/js/building-renderer.js
import {
  TILE_SIZE, TOP_BAR_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT,
  BuildingStats, Terrain, FogState
} from './constants.js';
import { getCamX, getCamY, getZoom, getVisibleTileRange } from './camera.js';
import { getBuildings, hasFullConcrete } from './buildings.js';
import { getFaction } from './factions.js';
import { getTile } from './map.js';
import { getFogState } from './fog.js';

/**
 * Draw all buildings on the map.
 */
export function drawBuildings(ctx) {
  const z = getZoom();
  const cx = getCamX();
  const cy = getCamY();

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, TOP_BAR_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
  ctx.clip();

  for (const b of getBuildings()) {
    // Check if any tile of the building is visible
    const [fw, fh] = b.footprint;
    let visible = false;
    for (let y = b.tileY; y < b.tileY + fh && !visible; y++) {
      for (let x = b.tileX; x < b.tileX + fw && !visible; x++) {
        const fog = getFogState(x, y);
        if (fog === FogState.VISIBLE || fog === FogState.REVEALED) visible = true;
      }
    }
    if (!visible) continue;

    const sx = (b.tileX * TILE_SIZE - cx) * z;
    const sy = (b.tileY * TILE_SIZE - cy) * z + TOP_BAR_HEIGHT;
    const w = fw * TILE_SIZE * z;
    const h = fh * TILE_SIZE * z;

    // Get faction colors
    const faction = getFaction(b.owner === 'player' ? 'swiss' : 'french');
    const fillColor = faction ? faction.colors.primary : '#555';
    const borderColor = faction ? faction.colors.secondary : '#aaa';

    // Building body
    ctx.fillStyle = fillColor;
    ctx.fillRect(sx + 1, sy + 1, w - 2, h - 2);

    // Border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(sx + 1, sy + 1, w - 2, h - 2);

    // Label (abbreviated)
    ctx.fillStyle = '#fff';
    ctx.font = `${Math.max(8, 10 * z)}px monospace`;
    const label = b.type.substring(0, 3).toUpperCase();
    ctx.fillText(label, sx + 3, sy + h / 2 + 3);

    // Health bar if damaged
    if (b.hp < b.maxHp) {
      const barW = w - 4;
      const barH = 3 * z;
      const barX = sx + 2;
      const barY = sy + h - barH - 2;
      const frac = b.hp / b.maxHp;

      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = frac > 0.5 ? '#00cc00' : frac > 0.25 ? '#cccc00' : '#cc0000';
      ctx.fillRect(barX, barY, barW * frac, barH);
    }
  }

  ctx.restore();
}

/**
 * Draw building placement preview (ghost).
 */
export function drawPlacementPreview(ctx, type, tileX, tileY, valid) {
  const stats = BuildingStats[type];
  if (!stats) return;

  const z = getZoom();
  const cx = getCamX();
  const cy = getCamY();
  const [fw, fh] = stats.footprint;

  const sx = (tileX * TILE_SIZE - cx) * z;
  const sy = (tileY * TILE_SIZE - cy) * z + TOP_BAR_HEIGHT;
  const w = fw * TILE_SIZE * z;
  const h = fh * TILE_SIZE * z;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, TOP_BAR_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
  ctx.clip();

  ctx.globalAlpha = 0.5;
  ctx.fillStyle = valid ? '#00cc00' : '#cc0000';
  ctx.fillRect(sx, sy, w, h);
  ctx.globalAlpha = 1;

  ctx.strokeStyle = valid ? '#00ff00' : '#ff0000';
  ctx.lineWidth = 2;
  ctx.strokeRect(sx, sy, w, h);

  ctx.restore();
}
