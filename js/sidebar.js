// Game/public/dune/js/sidebar.js
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, SIDEBAR_WIDTH, VIEWPORT_WIDTH,
  TOP_BAR_HEIGHT, BuildingType, BuildingStats
} from './constants.js';
import { getCheese, getStorageCapacity } from './economy.js';
import { getPowerStatus } from './power.js';
import { canBuildType, getCurrentBuild, startBuilding, cancelBuild } from './construction.js';

// Placement mode state
let placementMode = null;
let placementOwner = 'player';

export function getPlacementMode() { return placementMode; }
export function setPlacementMode(type) { placementMode = type; }
export function clearPlacementMode() { placementMode = null; }

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

// Abbreviated labels for sidebar buttons
const SIDEBAR_LABELS = {
  [BuildingType.POWER_PLANT]: 'PWR',
  [BuildingType.REFINERY]: 'REF',
  [BuildingType.SILO]: 'SIL',
  [BuildingType.BARRACKS]: 'BAR',
  [BuildingType.LIGHT_FACTORY]: 'LGT',
  [BuildingType.HEAVY_FACTORY]: 'HVY',
  [BuildingType.RADAR]: 'RAD',
  [BuildingType.TURRET]: 'TUR',
  [BuildingType.ROCKET_TURRET]: 'RKT',
  [BuildingType.REPAIR_PAD]: 'REP',
  [BuildingType.STARPORT]: 'STP',
  [BuildingType.PALACE]: 'PAL',
};

const BUTTON_W = 70;
const BUTTON_H = 32;
const BUTTON_PAD = 4;
const SIDEBAR_X = VIEWPORT_WIDTH;

/**
 * Draw the sidebar.
 */
export function drawSidebar(ctx) {
  const owner = 'player';

  // Background
  ctx.fillStyle = '#111118';
  ctx.fillRect(SIDEBAR_X, 0, SIDEBAR_WIDTH, CANVAS_HEIGHT);

  // --- Resource display ---
  const cheese = getCheese();
  const storage = getStorageCapacity(owner);
  const power = getPowerStatus(owner);

  ctx.fillStyle = '#ffcc00';
  ctx.font = '11px monospace';
  ctx.fillText(`C: ${Math.floor(cheese)}/${storage}`, SIDEBAR_X + 6, 18);

  // Power bar
  const powerColor = power.lowPower ? '#cc0000' : power.surplus < 10 ? '#cccc00' : '#00cc00';
  ctx.fillStyle = powerColor;
  ctx.fillText(`P: ${power.produced}/${power.consumed}`, SIDEBAR_X + 6, 36);

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
      ctx.fillText('PLACE IT', SIDEBAR_X + 8, barY + barH + 12);
    } else {
      const label = SIDEBAR_LABELS[current.type] || current.type.substring(0, 3).toUpperCase();
      ctx.fillText(`${label} ${Math.floor(frac * 100)}%`, SIDEBAR_X + 8, barY + barH + 12);
    }
  }

  // --- Building buttons ---
  const startY = 80;
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
    ctx.strokeStyle = available ? '#555' : '#333';
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

/**
 * Handle sidebar tap. Returns true if handled.
 */
export function handleSidebarTap(canvasX, canvasY) {
  if (canvasX < SIDEBAR_X) return false;

  const owner = 'player';
  const startY = 80;

  // Check building buttons
  let btnIdx = 0;
  for (const type of SIDEBAR_BUILDINGS) {
    const bx = SIDEBAR_X + 8 + (btnIdx % 2) * (BUTTON_W + BUTTON_PAD);
    const by = startY + Math.floor(btnIdx / 2) * (BUTTON_H + BUTTON_PAD);

    if (canvasX >= bx && canvasX <= bx + BUTTON_W &&
        canvasY >= by && canvasY <= by + BUTTON_H) {
      if (canBuildType(type, owner)) {
        // If already in placement mode for this type, cancel
        if (placementMode === type) {
          placementMode = null;
          return true;
        }
        // Start building if nothing in queue
        const current = getCurrentBuild(owner);
        if (!current) {
          if (startBuilding(type, owner)) {
            // Building started
          }
        } else if (current.pendingPlacement) {
          // Enter placement mode for the completed building
          placementMode = current.type;
        }
        return true;
      }
    }
    btnIdx++;
  }

  return false;
}
