// Game/public/dune/js/sidebar.js
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, SIDEBAR_WIDTH, VIEWPORT_WIDTH,
  TOP_BAR_HEIGHT, BuildingType, BuildingStats, UnitStats, UnitType
} from './constants.js';
import { getCheese, getStorageCapacity, canAfford, spendCheese } from './economy.js';
import { getPowerStatus } from './power.js';
import { canBuildType, getCurrentBuild, startBuilding, cancelBuild, canProduceUnit } from './construction.js';
import { hasBuilding, getPlayerBuildings } from './buildings.js';
import { spawnUnit } from './units.js';

// Placement mode state
let placementMode = null;
let placementOwner = 'player';

let playerFaction = 'swiss';

// Unit training cooldown
let trainCooldown = 0;

export function setPlayerFaction(faction) { playerFaction = faction; }

export function getPlacementMode() { return placementMode; }
export function setPlacementMode(type) { placementMode = type; }
export function clearPlacementMode() { placementMode = null; }

export function updateSidebarCooldown(dt) {
  if (trainCooldown > 0) trainCooldown -= dt;
}

// Building order in sidebar
const SIDEBAR_BUILDINGS = [
  BuildingType.POWER_PLANT,
  BuildingType.REFINERY,
  BuildingType.SILO,
  BuildingType.BARRACKS,
  BuildingType.LIGHT_FACTORY,
  BuildingType.HEAVY_FACTORY,
  BuildingType.RADAR,
  BuildingType.TURRET,
  BuildingType.ROCKET_TURRET,
  BuildingType.REPAIR_PAD,
  BuildingType.STARPORT,
  BuildingType.PALACE,
];

// Sidebar button labels (sized to fit ~10 chars at 10px monospace)
const SIDEBAR_LABELS = {
  [BuildingType.POWER_PLANT]: 'Power',
  [BuildingType.REFINERY]: 'Refinery',
  [BuildingType.SILO]: 'Silo',
  [BuildingType.BARRACKS]: 'Barracks',
  [BuildingType.LIGHT_FACTORY]: 'Lt Factory',
  [BuildingType.HEAVY_FACTORY]: 'Hv Factory',
  [BuildingType.RADAR]: 'Radar',
  [BuildingType.TURRET]: 'Turret',
  [BuildingType.ROCKET_TURRET]: 'Rkt Turret',
  [BuildingType.REPAIR_PAD]: 'Repair Pad',
  [BuildingType.STARPORT]: 'Starport',
  [BuildingType.PALACE]: 'Palace',
};

const UNIT_LABELS = {
  [UnitType.LIGHT_INFANTRY]: 'Rifle',
  [UnitType.HEAVY_INFANTRY]: 'Heavy',
  [UnitType.ROCKET_INFANTRY]: 'Rocket',
  [UnitType.HARVESTER]: 'Harvest',
  [UnitType.LIGHT_VEHICLE]: 'Scout',
  [UnitType.MEDIUM_VEHICLE]: 'APC',
  [UnitType.TANK]: 'Tank',
  [UnitType.SIEGE_TANK]: 'Siege',
  [UnitType.ROCKET_LAUNCHER]: 'MLRS',
  [UnitType.MCV]: 'MCV',
};

const BUTTON_W = 70;
const BUTTON_H = 32;
const BUTTON_PAD = 4;
const SIDEBAR_X = VIEWPORT_WIDTH;

// Tab mode
let activeTab = 'build'; // 'build' or 'units'

/**
 * Get all unit types the player can currently produce.
 */
function getProducibleUnits(owner) {
  const result = [];
  const seen = new Set();
  const myBuildings = getPlayerBuildings(owner);
  for (const b of myBuildings) {
    const stats = BuildingStats[b.type];
    if (!stats || !stats.produces) continue;
    for (const unitType of stats.produces) {
      if (!seen.has(unitType) && UnitStats[unitType]) {
        seen.add(unitType);
        result.push(unitType);
      }
    }
  }
  return result;
}

// Surrender confirmation state
let surrenderConfirm = false;
let onSurrender = null;

export function setOnSurrender(fn) { onSurrender = fn; }

/**
 * Find a spawn tile near a producing building.
 */
function findProducerSpawn(unitType, owner) {
  const myBuildings = getPlayerBuildings(owner);
  for (const b of myBuildings) {
    const stats = BuildingStats[b.type];
    if (stats && stats.produces && stats.produces.includes(unitType)) {
      return {
        x: b.tileX + b.footprint[0],
        y: b.tileY + Math.floor(b.footprint[1] / 2),
      };
    }
  }
  return null;
}

/**
 * Draw the sidebar.
 */
export function drawSidebar(ctx) {
  const owner = 'player';

  // Background
  ctx.fillStyle = '#111118';
  ctx.fillRect(SIDEBAR_X, 0, SIDEBAR_WIDTH, CANVAS_HEIGHT);

  // --- Resource display ---
  const cheese = getCheese('player');
  const storage = getStorageCapacity(owner);
  const power = getPowerStatus(owner);

  ctx.fillStyle = '#ffcc00';
  ctx.font = '11px monospace';
  ctx.fillText(`Cheese: ${Math.floor(cheese)}/${storage}`, SIDEBAR_X + 6, 18);

  const powerColor = power.lowPower ? '#cc0000' : power.surplus < 10 ? '#cccc00' : '#00cc00';
  ctx.fillStyle = powerColor;
  ctx.fillText(`Power: ${power.produced}/${power.consumed}`, SIDEBAR_X + 6, 36);

  // --- Build progress ---
  const current = getCurrentBuild(owner);
  if (current) {
    const barY = 46;
    const barW = SIDEBAR_WIDTH - 16;
    const barH = 10;
    const frac = current.progress / current.buildTime;

    ctx.fillStyle = '#333';
    ctx.fillRect(SIDEBAR_X + 8, barY, barW, barH);
    ctx.fillStyle = current.pendingPlacement ? '#00cc00' : '#3388ff';
    ctx.fillRect(SIDEBAR_X + 8, barY, barW * frac, barH);

    ctx.fillStyle = '#aaa';
    ctx.font = '9px monospace';
    if (current.pendingPlacement) {
      ctx.fillText('CLICK MAP TO PLACE', SIDEBAR_X + 8, barY + barH + 12);
    } else {
      const label = SIDEBAR_LABELS[current.type] || current.type;
      ctx.fillText(`${label} ${Math.floor(frac * 100)}%`, SIDEBAR_X + 8, barY + barH + 12);
    }
  }

  // --- Tab buttons ---
  const tabY = 72;
  const tabW = (SIDEBAR_WIDTH - 16) / 2;
  const tabH = 20;

  // Build tab
  ctx.fillStyle = activeTab === 'build' ? '#2a3a4e' : '#1a1a24';
  ctx.fillRect(SIDEBAR_X + 8, tabY, tabW - 2, tabH);
  ctx.fillStyle = activeTab === 'build' ? '#aaccff' : '#666';
  ctx.font = '10px monospace';
  ctx.fillText('BUILD', SIDEBAR_X + 14, tabY + 14);

  // Units tab
  ctx.fillStyle = activeTab === 'units' ? '#2a3a4e' : '#1a1a24';
  ctx.fillRect(SIDEBAR_X + 8 + tabW + 2, tabY, tabW - 2, tabH);
  ctx.fillStyle = activeTab === 'units' ? '#aaccff' : '#666';
  ctx.fillText('UNITS', SIDEBAR_X + tabW + 16, tabY + 14);

  // --- Content based on tab ---
  const startY = tabY + tabH + 8;

  if (activeTab === 'build') {
    drawBuildTab(ctx, owner, startY);
  } else {
    drawUnitsTab(ctx, owner, startY);
  }

  // --- Surrender button at bottom ---
  const surrenderY = CANVAS_HEIGHT - 40;
  const surrenderW = SIDEBAR_WIDTH - 16;
  const surrenderH = 28;
  ctx.fillStyle = surrenderConfirm ? '#662222' : '#2a1a1a';
  ctx.fillRect(SIDEBAR_X + 8, surrenderY, surrenderW, surrenderH);
  ctx.strokeStyle = '#663333';
  ctx.lineWidth = 1;
  ctx.strokeRect(SIDEBAR_X + 8, surrenderY, surrenderW, surrenderH);
  ctx.fillStyle = surrenderConfirm ? '#ff6666' : '#aa6666';
  ctx.font = '10px monospace';
  ctx.fillText(surrenderConfirm ? 'CONFIRM SURRENDER?' : 'SURRENDER', SIDEBAR_X + 14, surrenderY + 18);
}

function drawBuildTab(ctx, owner, startY) {
  let btnIdx = 0;

  for (const type of SIDEBAR_BUILDINGS) {
    const stats = BuildingStats[type];
    const available = canBuildType(type, owner);

    const bx = SIDEBAR_X + 8 + (btnIdx % 2) * (BUTTON_W + BUTTON_PAD);
    const by = startY + Math.floor(btnIdx / 2) * (BUTTON_H + BUTTON_PAD);

    // Button background
    if (placementMode === type) {
      ctx.fillStyle = '#336633';
    } else if (available) {
      ctx.fillStyle = '#2a2a3e';
    } else {
      ctx.fillStyle = '#1a1a24';
    }
    ctx.fillRect(bx, by, BUTTON_W, BUTTON_H);

    // Border
    ctx.strokeStyle = available ? '#5566aa' : '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, BUTTON_W, BUTTON_H);

    // Label
    ctx.fillStyle = available ? '#ccc' : '#555';
    ctx.font = '10px monospace';
    const label = SIDEBAR_LABELS[type] || type.substring(0, 3).toUpperCase();
    ctx.fillText(label, bx + 4, by + 13);

    // Cost
    ctx.fillStyle = available ? '#888' : '#444';
    ctx.font = '8px monospace';
    ctx.fillText(`$${stats.cost}`, bx + 4, by + 26);

    btnIdx++;
  }
}

function drawUnitsTab(ctx, owner, startY) {
  const producible = getProducibleUnits(owner);

  if (producible.length === 0) {
    ctx.fillStyle = '#666';
    ctx.font = '10px monospace';
    ctx.fillText('Build Barracks or', SIDEBAR_X + 8, startY + 20);
    ctx.fillText('Factory to train', SIDEBAR_X + 8, startY + 34);
    ctx.fillText('units.', SIDEBAR_X + 8, startY + 48);
    return;
  }

  let btnIdx = 0;
  for (const unitType of producible) {
    const stats = UnitStats[unitType];
    if (!stats) continue;
    const affordable = canAfford(stats.cost, owner);
    const ready = trainCooldown <= 0;
    const available = affordable && ready;

    const bx = SIDEBAR_X + 8 + (btnIdx % 2) * (BUTTON_W + BUTTON_PAD);
    const by = startY + Math.floor(btnIdx / 2) * (BUTTON_H + BUTTON_PAD);

    // Button background
    ctx.fillStyle = available ? '#2a3a2a' : '#1a1a24';
    ctx.fillRect(bx, by, BUTTON_W, BUTTON_H);

    // Border
    ctx.strokeStyle = available ? '#5a8a5a' : '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, BUTTON_W, BUTTON_H);

    // Label
    const label = UNIT_LABELS[unitType] || unitType.substring(0, 6);
    ctx.fillStyle = available ? '#cfc' : '#555';
    ctx.font = '10px monospace';
    ctx.fillText(label, bx + 4, by + 13);

    // Cost
    ctx.fillStyle = available ? '#8a8' : '#444';
    ctx.font = '8px monospace';
    ctx.fillText(`$${stats.cost}`, bx + 4, by + 26);

    btnIdx++;
  }

  // Cooldown indicator
  if (trainCooldown > 0) {
    ctx.fillStyle = '#888';
    ctx.font = '9px monospace';
    ctx.fillText(`Ready: ${Math.ceil(trainCooldown)}s`, SIDEBAR_X + 8, startY + Math.ceil(producible.length / 2) * (BUTTON_H + BUTTON_PAD) + 16);
  }
}

/**
 * Handle sidebar tap. Returns true if handled.
 */
export function handleSidebarTap(canvasX, canvasY) {
  if (canvasX < SIDEBAR_X) return false;

  const owner = 'player';

  // Check surrender button
  const surrenderY = CANVAS_HEIGHT - 40;
  const surrenderW = SIDEBAR_WIDTH - 16;
  const surrenderH = 28;
  if (canvasX >= SIDEBAR_X + 8 && canvasX <= SIDEBAR_X + 8 + surrenderW &&
      canvasY >= surrenderY && canvasY <= surrenderY + surrenderH) {
    if (surrenderConfirm) {
      surrenderConfirm = false;
      if (onSurrender) onSurrender();
    } else {
      surrenderConfirm = true;
      // Auto-cancel after 3 seconds
      setTimeout(() => { surrenderConfirm = false; }, 3000);
    }
    return true;
  }
  surrenderConfirm = false;

  // Check tab buttons
  const tabY = 72;
  const tabW = (SIDEBAR_WIDTH - 16) / 2;
  const tabH = 20;
  if (canvasY >= tabY && canvasY <= tabY + tabH) {
    if (canvasX < SIDEBAR_X + 8 + tabW) {
      activeTab = 'build';
      return true;
    } else if (canvasX >= SIDEBAR_X + 8 + tabW + 2) {
      activeTab = 'units';
      return true;
    }
  }

  const startY = tabY + tabH + 8;

  if (activeTab === 'build') {
    return handleBuildTap(canvasX, canvasY, owner, startY);
  } else {
    return handleUnitsTap(canvasX, canvasY, owner, startY);
  }
}

function handleBuildTap(canvasX, canvasY, owner, startY) {
  let btnIdx = 0;
  for (const type of SIDEBAR_BUILDINGS) {
    const bx = SIDEBAR_X + 8 + (btnIdx % 2) * (BUTTON_W + BUTTON_PAD);
    const by = startY + Math.floor(btnIdx / 2) * (BUTTON_H + BUTTON_PAD);

    if (canvasX >= bx && canvasX <= bx + BUTTON_W &&
        canvasY >= by && canvasY <= by + BUTTON_H) {
      if (canBuildType(type, owner)) {
        if (placementMode === type) {
          placementMode = null;
          return true;
        }
        const current = getCurrentBuild(owner);
        if (!current) {
          if (startBuilding(type, owner, playerFaction)) {
            // Building started
          }
        } else if (current.pendingPlacement) {
          placementMode = current.type;
        }
        return true;
      }
    }
    btnIdx++;
  }

  return false;
}

function handleUnitsTap(canvasX, canvasY, owner, startY) {
  const producible = getProducibleUnits(owner);

  let btnIdx = 0;
  for (const unitType of producible) {
    const stats = UnitStats[unitType];
    if (!stats) continue;

    const bx = SIDEBAR_X + 8 + (btnIdx % 2) * (BUTTON_W + BUTTON_PAD);
    const by = startY + Math.floor(btnIdx / 2) * (BUTTON_H + BUTTON_PAD);

    if (canvasX >= bx && canvasX <= bx + BUTTON_W &&
        canvasY >= by && canvasY <= by + BUTTON_H) {
      if (canAfford(stats.cost, owner) && trainCooldown <= 0) {
        spendCheese(stats.cost, owner);
        const spawn = findProducerSpawn(unitType, owner);
        if (spawn) {
          spawnUnit(unitType, playerFaction, spawn.x, spawn.y, owner);
          trainCooldown = Math.max(3, stats.buildTime * 0.3);
        }
      }
      return true;
    }
    btnIdx++;
  }

  return false;
}
