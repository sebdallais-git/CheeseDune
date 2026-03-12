// Game/public/dune/js/building-renderer.js — Isometric building renderer
import {
  TILE_SIZE, TOP_BAR_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT,
  BuildingStats, BuildingType, FogState
} from './constants.js';
import { getZoom, worldToScreen, tileDiamondPath } from './camera.js';
import { getBuildings } from './buildings.js';
import { getFaction } from './factions.js';
import { getFogState } from './fog.js';
import { getOwnerFaction } from './game-states.js';

// Building height in pixels (at 1x zoom)
const BUILDING_HEIGHT = 14;

// Darken/lighten a hex color
function shadeColor(hex, factor) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const f = factor;
  return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`;
}

// Building type abbreviations for labels
const BUILDING_LABELS = {
  [BuildingType.CONSTRUCTION_YARD]: 'CY',
  [BuildingType.POWER_PLANT]: 'PWR',
  [BuildingType.REFINERY]: 'REF',
  [BuildingType.SILO]: 'SIL',
  [BuildingType.BARRACKS]: 'BAR',
  [BuildingType.LIGHT_FACTORY]: 'LF',
  [BuildingType.HEAVY_FACTORY]: 'HF',
  [BuildingType.RADAR]: 'RAD',
  [BuildingType.TURRET]: 'T',
  [BuildingType.ROCKET_TURRET]: 'RT',
  [BuildingType.REPAIR_PAD]: 'REP',
  [BuildingType.STARPORT]: 'STP',
  [BuildingType.PALACE]: 'PAL',
};

export function drawBuildings(ctx) {
  const z = getZoom();
  const h = BUILDING_HEIGHT * z;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, TOP_BAR_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
  ctx.clip();

  // Sort by depth for proper overlap
  const sorted = [...getBuildings()].sort((a, b) => {
    return (a.tileX + a.tileY) - (b.tileX + b.tileY);
  });

  for (const b of sorted) {
    const [fw, fh] = b.footprint;
    // Check visibility
    let visible = false;
    for (let y = b.tileY; y < b.tileY + fh && !visible; y++) {
      for (let x = b.tileX; x < b.tileX + fw && !visible; x++) {
        const fog = getFogState(x, y);
        if (fog === FogState.VISIBLE || fog === FogState.REVEALED) visible = true;
      }
    }
    if (!visible) continue;

    // Get faction colors
    const factionId = getOwnerFaction(b.owner);
    const faction = getFaction(factionId);
    const primary = faction ? faction.colors.primary : '#555';
    const secondary = faction ? faction.colors.secondary : '#aaa';

    // Compute the 4 base diamond corners (covering the full footprint)
    const topPt = worldToScreen(b.tileX * TILE_SIZE, b.tileY * TILE_SIZE);
    const rightPt = worldToScreen((b.tileX + fw) * TILE_SIZE, b.tileY * TILE_SIZE);
    const bottomPt = worldToScreen((b.tileX + fw) * TILE_SIZE, (b.tileY + fh) * TILE_SIZE);
    const leftPt = worldToScreen(b.tileX * TILE_SIZE, (b.tileY + fh) * TILE_SIZE);

    // Raised versions (shifted up by height)
    const topR = { x: topPt.x, y: topPt.y - h };
    const rightR = { x: rightPt.x, y: rightPt.y - h };
    const bottomR = { x: bottomPt.x, y: bottomPt.y - h };
    const leftR = { x: leftPt.x, y: leftPt.y - h };

    // Left wall (dark)
    ctx.fillStyle = shadeColor(primary, 0.6);
    ctx.beginPath();
    ctx.moveTo(leftPt.x, leftPt.y);
    ctx.lineTo(leftR.x, leftR.y);
    ctx.lineTo(bottomR.x, bottomR.y);
    ctx.lineTo(bottomPt.x, bottomPt.y);
    ctx.closePath();
    ctx.fill();

    // Right wall (medium)
    ctx.fillStyle = shadeColor(primary, 0.8);
    ctx.beginPath();
    ctx.moveTo(rightPt.x, rightPt.y);
    ctx.lineTo(rightR.x, rightR.y);
    ctx.lineTo(bottomR.x, bottomR.y);
    ctx.lineTo(bottomPt.x, bottomPt.y);
    ctx.closePath();
    ctx.fill();

    // Top face (bright)
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.moveTo(topR.x, topR.y);
    ctx.lineTo(rightR.x, rightR.y);
    ctx.lineTo(bottomR.x, bottomR.y);
    ctx.lineTo(leftR.x, leftR.y);
    ctx.closePath();
    ctx.fill();

    // Top face border
    ctx.strokeStyle = secondary;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(topR.x, topR.y);
    ctx.lineTo(rightR.x, rightR.y);
    ctx.lineTo(bottomR.x, bottomR.y);
    ctx.lineTo(leftR.x, leftR.y);
    ctx.closePath();
    ctx.stroke();

    // Center of top face for details
    const cx = (topR.x + bottomR.x) / 2;
    const cy = (topR.y + bottomR.y) / 2;

    // Type-specific roof details
    drawBuildingDetail(ctx, b.type, cx, cy, z, secondary);

    // Label
    const label = BUILDING_LABELS[b.type] || '?';
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.max(7, 9 * z)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(label, cx, cy + (fw > 1 ? 8 * z : 4 * z));
    ctx.textAlign = 'left';

    // Health bar if damaged
    if (b.hp < b.maxHp) {
      const barW = Math.max(20, fw * 16 * z);
      const barH = 3 * z;
      const bx = cx - barW / 2;
      const by = topR.y - 6 * z;
      const frac = b.hp / b.maxHp;
      ctx.fillStyle = '#333';
      ctx.fillRect(bx, by, barW, barH);
      ctx.fillStyle = frac > 0.5 ? '#00cc00' : frac > 0.25 ? '#cccc00' : '#cc0000';
      ctx.fillRect(bx, by, barW * frac, barH);
    }
  }

  ctx.restore();
}

function drawBuildingDetail(ctx, type, cx, cy, z, color) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;

  switch (type) {
    case BuildingType.POWER_PLANT:
      // Lightning bolt
      ctx.lineWidth = 2 * z;
      ctx.beginPath();
      ctx.moveTo(cx - 2 * z, cy - 6 * z);
      ctx.lineTo(cx + 1 * z, cy - 1 * z);
      ctx.lineTo(cx - 1 * z, cy);
      ctx.lineTo(cx + 2 * z, cy + 5 * z);
      ctx.stroke();
      break;
    case BuildingType.REFINERY:
      // Vat circle
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy - 2 * z, 4 * z, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case BuildingType.BARRACKS:
      // Cross/target
      ctx.lineWidth = 1.5 * z;
      ctx.beginPath();
      ctx.moveTo(cx - 4 * z, cy - 4 * z);
      ctx.lineTo(cx + 4 * z, cy + 4 * z);
      ctx.moveTo(cx + 4 * z, cy - 4 * z);
      ctx.lineTo(cx - 4 * z, cy + 4 * z);
      ctx.stroke();
      break;
    case BuildingType.RADAR:
      // Dish
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy - 2 * z, 5 * z, Math.PI * 0.8, Math.PI * 2.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy - 2 * z, 1.5 * z, 0, Math.PI * 2);
      ctx.fill();
      break;
    case BuildingType.TURRET:
      // Gun barrel
      ctx.lineWidth = 2.5 * z;
      ctx.beginPath();
      ctx.arc(cx, cy, 3 * z, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#888';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + 8 * z, cy - 4 * z);
      ctx.stroke();
      break;
    case BuildingType.ROCKET_TURRET:
      // Multiple barrels
      ctx.lineWidth = 1.5 * z;
      ctx.beginPath();
      ctx.arc(cx, cy, 3 * z, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#888';
      for (let i = -1; i <= 1; i += 2) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + 7 * z, cy + i * 4 * z);
        ctx.stroke();
      }
      break;
    case BuildingType.CONSTRUCTION_YARD:
      // Gear symbol
      ctx.lineWidth = 1.5 * z;
      ctx.beginPath();
      ctx.arc(cx, cy - 2 * z, 5 * z, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy - 2 * z, 2 * z, 0, Math.PI * 2);
      ctx.fill();
      break;
    case BuildingType.REPAIR_PAD:
      // Wrench
      ctx.lineWidth = 2 * z;
      ctx.beginPath();
      ctx.moveTo(cx - 4 * z, cy - 4 * z);
      ctx.lineTo(cx + 4 * z, cy + 4 * z);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 4 * z, cy + 4 * z, 2 * z, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case BuildingType.PALACE:
      // Crown/star
      ctx.beginPath();
      ctx.moveTo(cx, cy - 6 * z);
      ctx.lineTo(cx + 5 * z, cy + 3 * z);
      ctx.lineTo(cx - 5 * z, cy + 3 * z);
      ctx.closePath();
      ctx.fill();
      break;
    default:
      break;
  }
}

export function drawPlacementPreview(ctx, type, tileX, tileY, valid) {
  const stats = BuildingStats[type];
  if (!stats) return;
  const [fw, fh] = stats.footprint;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, TOP_BAR_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
  ctx.clip();

  ctx.globalAlpha = 0.5;
  ctx.fillStyle = valid ? '#00cc00' : '#cc0000';
  // Draw footprint as diamonds
  for (let y = tileY; y < tileY + fh; y++) {
    for (let x = tileX; x < tileX + fw; x++) {
      tileDiamondPath(ctx, x, y);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // Border
  const topPt = worldToScreen(tileX * TILE_SIZE, tileY * TILE_SIZE);
  const rightPt = worldToScreen((tileX + fw) * TILE_SIZE, tileY * TILE_SIZE);
  const bottomPt = worldToScreen((tileX + fw) * TILE_SIZE, (tileY + fh) * TILE_SIZE);
  const leftPt = worldToScreen(tileX * TILE_SIZE, (tileY + fh) * TILE_SIZE);
  ctx.strokeStyle = valid ? '#00ff00' : '#ff0000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(topPt.x, topPt.y);
  ctx.lineTo(rightPt.x, rightPt.y);
  ctx.lineTo(bottomPt.x, bottomPt.y);
  ctx.lineTo(leftPt.x, leftPt.y);
  ctx.closePath();
  ctx.stroke();

  ctx.restore();
}
