// Game/public/dune/js/unit-renderer.js — Isometric unit renderer with distinct shapes
import { TILE_SIZE, UnitSize, UnitType, FogState, TOP_BAR_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from './constants.js';
import { worldToScreen, getZoom } from './camera.js';
import { getUnits } from './units.js';
import { getFaction } from './factions.js';
import { getFogState } from './fog.js';
import { isSelected } from './selection.js';

// Per-type draw functions — each receives (ctx, sx, sy, z, facing, colors)
function drawInfantryBase(ctx, sx, sy, z, r, colors) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(sx, sy + 2 * z, r * 1.1, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body circle
  ctx.fillStyle = colors.primary;
  ctx.beginPath();
  ctx.arc(sx, sy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colors.secondary;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawLightInfantry(ctx, sx, sy, z, facing, colors) {
  const r = 5 * z;
  drawInfantryBase(ctx, sx, sy, z, r, colors);
  // Rifle line
  ctx.strokeStyle = colors.secondary;
  ctx.lineWidth = 1.5 * z;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx + Math.cos(facing) * r * 2.2, sy + Math.sin(facing) * r * 2.2);
  ctx.stroke();
}

function drawHeavyInfantry(ctx, sx, sy, z, facing, colors) {
  const r = 6 * z;
  drawInfantryBase(ctx, sx, sy, z, r, colors);
  // Heavy weapon (thick line + muzzle)
  ctx.strokeStyle = colors.secondary;
  ctx.lineWidth = 2.5 * z;
  const ex = sx + Math.cos(facing) * r * 2;
  const ey = sy + Math.sin(facing) * r * 2;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  ctx.fillStyle = colors.accent;
  ctx.beginPath();
  ctx.arc(ex, ey, 2 * z, 0, Math.PI * 2);
  ctx.fill();
}

function drawRocketInfantry(ctx, sx, sy, z, facing, colors) {
  const r = 5 * z;
  drawInfantryBase(ctx, sx, sy, z, r, colors);
  // Rocket tube (angled up)
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 2.5 * z;
  const angle = facing - 0.3;
  ctx.beginPath();
  ctx.moveTo(sx - Math.cos(facing) * r * 0.5, sy - Math.sin(facing) * r * 0.5);
  ctx.lineTo(sx + Math.cos(angle) * r * 2.5, sy + Math.sin(angle) * r * 2.5);
  ctx.stroke();
  // Warhead
  ctx.fillStyle = colors.accent;
  ctx.beginPath();
  ctx.arc(sx + Math.cos(angle) * r * 2.5, sy + Math.sin(angle) * r * 2.5, 1.5 * z, 0, Math.PI * 2);
  ctx.fill();
}

function drawVehicleBody(ctx, sx, sy, z, facing, w, h, colors) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(sx, sy + 3 * z, w * 0.6, h * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(facing);
  // Body
  ctx.fillStyle = colors.primary;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeStyle = colors.secondary;
  ctx.lineWidth = 1;
  ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.restore();
}

function drawHarvester(ctx, sx, sy, z, facing, colors) {
  const w = 18 * z, h = 14 * z;
  drawVehicleBody(ctx, sx, sy, z, facing, w, h, { primary: '#8b7b3a', secondary: colors.secondary });
  // Scoop at front
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(facing);
  ctx.fillStyle = '#aaa';
  ctx.fillRect(w / 2 - 3 * z, -h / 3, 4 * z, h * 0.66);
  // Faction stripe
  ctx.fillStyle = colors.primary;
  ctx.fillRect(-w / 4, -h / 2 - 1, w / 2, 3 * z);
  ctx.restore();
}

function drawLightVehicle(ctx, sx, sy, z, facing, colors) {
  const w = 14 * z, h = 8 * z;
  drawVehicleBody(ctx, sx, sy, z, facing, w, h, colors);
  // Speed lines
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(facing);
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2 + 4 * z, 0);
  ctx.stroke();
  ctx.restore();
}

function drawMediumVehicle(ctx, sx, sy, z, facing, colors) {
  const w = 16 * z, h = 10 * z;
  drawVehicleBody(ctx, sx, sy, z, facing, w, h, colors);
  // Twin guns
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(facing);
  ctx.strokeStyle = colors.secondary;
  ctx.lineWidth = 1.5 * z;
  ctx.beginPath();
  ctx.moveTo(w / 4, -h / 4);
  ctx.lineTo(w / 2 + 4 * z, -h / 4);
  ctx.moveTo(w / 4, h / 4);
  ctx.lineTo(w / 2 + 4 * z, h / 4);
  ctx.stroke();
  ctx.restore();
}

function drawTank(ctx, sx, sy, z, facing, colors) {
  const w = 18 * z, h = 12 * z;
  drawVehicleBody(ctx, sx, sy, z, facing, w, h, colors);
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(facing);
  // Turret circle
  ctx.fillStyle = colors.secondary;
  ctx.beginPath();
  ctx.arc(0, 0, 4 * z, 0, Math.PI * 2);
  ctx.fill();
  // Barrel
  ctx.strokeStyle = colors.secondary;
  ctx.lineWidth = 2.5 * z;
  ctx.beginPath();
  ctx.moveTo(2 * z, 0);
  ctx.lineTo(w / 2 + 5 * z, 0);
  ctx.stroke();
  ctx.restore();
}

function drawSiegeTank(ctx, sx, sy, z, facing, colors) {
  const w = 22 * z, h = 14 * z;
  drawVehicleBody(ctx, sx, sy, z, facing, w, h, colors);
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(facing);
  // Large turret
  ctx.fillStyle = colors.secondary;
  ctx.beginPath();
  ctx.arc(0, 0, 5 * z, 0, Math.PI * 2);
  ctx.fill();
  // Long barrel
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 3 * z;
  ctx.beginPath();
  ctx.moveTo(3 * z, 0);
  ctx.lineTo(w / 2 + 8 * z, 0);
  ctx.stroke();
  ctx.restore();
}

function drawRocketLauncher(ctx, sx, sy, z, facing, colors) {
  const w = 18 * z, h = 12 * z;
  drawVehicleBody(ctx, sx, sy, z, facing, w, h, colors);
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(facing);
  // Missile rack (3 tubes)
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 1.5 * z;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * 3 * z);
    ctx.lineTo(w / 2 + 3 * z, i * 3 * z);
    ctx.stroke();
  }
  // Warheads
  ctx.fillStyle = colors.accent;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.arc(w / 2 + 3 * z, i * 3 * z, 1.5 * z, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawMCV(ctx, sx, sy, z, facing, colors) {
  const w = 22 * z, h = 16 * z;
  drawVehicleBody(ctx, sx, sy, z, facing, w, h, colors);
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(facing);
  // Construction markings — cross symbol
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 2 * z;
  ctx.beginPath();
  ctx.moveTo(-4 * z, 0);
  ctx.lineTo(4 * z, 0);
  ctx.moveTo(0, -4 * z);
  ctx.lineTo(0, 4 * z);
  ctx.stroke();
  ctx.restore();
}

function drawSuperUnit(ctx, sx, sy, z, facing, colors) {
  const w = 20 * z, h = 14 * z;
  drawVehicleBody(ctx, sx, sy, z, facing, w, h, colors);
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(facing);
  // Star symbol
  ctx.fillStyle = colors.accent;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2 / 5) - Math.PI / 2;
    const r = 4 * z;
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    const a2 = a + Math.PI / 5;
    ctx.lineTo(Math.cos(a2) * r * 0.4, Math.sin(a2) * r * 0.4);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

const UNIT_DRAWERS = {
  [UnitType.LIGHT_INFANTRY]: drawLightInfantry,
  [UnitType.HEAVY_INFANTRY]: drawHeavyInfantry,
  [UnitType.ROCKET_INFANTRY]: drawRocketInfantry,
  [UnitType.HARVESTER]: drawHarvester,
  [UnitType.LIGHT_VEHICLE]: drawLightVehicle,
  [UnitType.MEDIUM_VEHICLE]: drawMediumVehicle,
  [UnitType.TANK]: drawTank,
  [UnitType.SIEGE_TANK]: drawSiegeTank,
  [UnitType.ROCKET_LAUNCHER]: drawRocketLauncher,
  [UnitType.MCV]: drawMCV,
};

export function drawUnits(ctx) {
  const units = getUnits();
  const z = getZoom();

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, TOP_BAR_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
  ctx.clip();

  // Sort by depth (world y position) for proper iso overlap
  const sorted = [...units].sort((a, b) => (a.x + a.y) - (b.x + b.y));

  for (const unit of sorted) {
    const tileX = Math.floor(unit.x / TILE_SIZE);
    const tileY = Math.floor(unit.y / TILE_SIZE);
    if (getFogState(tileX, tileY) !== FogState.VISIBLE) continue;

    const s = worldToScreen(unit.x, unit.y);
    const faction = getFaction(unit.faction);
    const colors = faction ? faction.colors : { primary: '#888', secondary: '#ccc', accent: '#ff0' };
    const radius = (UnitSize[unit.category] || 8) * z;

    // Selection indicator
    if (isSelected(unit)) {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y + 2 * z, radius + 4 * z, (radius + 4 * z) * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw unit by type
    const drawer = UNIT_DRAWERS[unit.type] || drawSuperUnit;
    drawer(ctx, s.x, s.y, z, unit.facing, colors);

    // Drunk tint
    if (unit.drunkTimer > 0) {
      ctx.fillStyle = 'rgba(180, 80, 200, 0.4)';
      ctx.beginPath();
      ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Health bar (only when damaged)
    if (unit.hp < unit.maxHp) {
      const barW = radius * 2.5;
      const barH = 3 * z;
      const bx = s.x - barW / 2;
      const by = s.y - radius - 8 * z;
      const frac = unit.hp / unit.maxHp;
      ctx.fillStyle = '#333';
      ctx.fillRect(bx, by, barW, barH);
      ctx.fillStyle = frac > 0.5 ? '#00cc00' : frac > 0.25 ? '#cccc00' : '#cc0000';
      ctx.fillRect(bx, by, barW * frac, barH);
    }
  }

  ctx.restore();
}

export function drawSelectionBox(ctx, x1, y1, x2, y2) {
  // Convert world corners to screen
  const s1 = worldToScreen(x1, y1);
  const s2 = worldToScreen(x2, y2);
  const s3 = worldToScreen(x1, y2);
  const s4 = worldToScreen(x2, y1);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, TOP_BAR_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
  ctx.clip();

  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  // Draw diamond-ish selection area
  const minX = Math.min(s1.x, s2.x, s3.x, s4.x);
  const maxX = Math.max(s1.x, s2.x, s3.x, s4.x);
  const minY = Math.min(s1.y, s2.y, s3.y, s4.y);
  const maxY = Math.max(s1.y, s2.y, s3.y, s4.y);
  ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
  ctx.setLineDash([]);
  ctx.restore();
}
