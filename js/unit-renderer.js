import { TILE_SIZE, UnitSize, FogState, TOP_BAR_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from './constants.js';
import { getCamX, getCamY, getZoom } from './camera.js';
import { getUnits } from './units.js';
import { getFaction } from './factions.js';
import { getFogState } from './fog.js';
import { isSelected } from './selection.js';

/**
 * Draw all visible units on the map.
 */
export function drawUnits(ctx) {
  const units = getUnits();
  const z = getZoom();
  const cx = getCamX();
  const cy = getCamY();

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, TOP_BAR_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
  ctx.clip();

  for (const unit of units) {
    // Check fog — only draw units in VISIBLE tiles
    const tileX = Math.floor(unit.x / TILE_SIZE);
    const tileY = Math.floor(unit.y / TILE_SIZE);
    if (getFogState(tileX, tileY) !== FogState.VISIBLE) continue;

    // World to screen
    const sx = (unit.x - cx) * z;
    const sy = (unit.y - cy) * z + TOP_BAR_HEIGHT;

    const faction = getFaction(unit.faction);
    const radius = (UnitSize[unit.category] || 8) * z;

    // Selection indicator (green circle under unit)
    if (isSelected(unit)) {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(sx, sy, radius + 3 * z, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Unit body
    ctx.fillStyle = faction.colors.primary;

    if (unit.category === 'infantry') {
      // Infantry: small circle
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Secondary color dot
      ctx.fillStyle = faction.colors.secondary;
      ctx.beginPath();
      ctx.arc(sx, sy, radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Vehicle: rounded rectangle (drawn as rect for simplicity)
      const w = radius * 2;
      const h = radius * 1.5;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(unit.facing);
      ctx.fillRect(-w / 2, -h / 2, w, h);

      // Direction indicator (front point)
      ctx.fillStyle = faction.colors.secondary;
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2 - 4 * z, -3 * z);
      ctx.lineTo(w / 2 - 4 * z, 3 * z);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    // Health bar (only when damaged)
    if (unit.hp < unit.maxHp) {
      const barWidth = radius * 2.5;
      const barHeight = 3 * z;
      const barX = sx - barWidth / 2;
      const barY = sy - radius - 6 * z;
      const hpFraction = unit.hp / unit.maxHp;

      // Background
      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      // HP fill
      ctx.fillStyle = hpFraction > 0.5 ? '#00cc00' : hpFraction > 0.25 ? '#cccc00' : '#cc0000';
      ctx.fillRect(barX, barY, barWidth * hpFraction, barHeight);
    }
  }

  ctx.restore();
}

/**
 * Draw the selection box rectangle (when box-selecting).
 */
export function drawSelectionBox(ctx, x1, y1, x2, y2) {
  const z = getZoom();
  const cx = getCamX();
  const cy = getCamY();

  // Convert world coords to screen
  const sx1 = (x1 - cx) * z;
  const sy1 = (y1 - cy) * z + TOP_BAR_HEIGHT;
  const sx2 = (x2 - cx) * z;
  const sy2 = (y2 - cy) * z + TOP_BAR_HEIGHT;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, TOP_BAR_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
  ctx.clip();

  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(
    Math.min(sx1, sx2), Math.min(sy1, sy2),
    Math.abs(sx2 - sx1), Math.abs(sy2 - sy1)
  );
  ctx.setLineDash([]);

  ctx.restore();
}
