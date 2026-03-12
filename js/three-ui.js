// Game/public/dune/js/three-ui.js — HTML overlay UI manager
// Wires DOM elements from index.html to game state, sidebar, minimap, and selection panel.

import {
  GameStateId, getGameState, setGameState,
  getSkirmishSettings, setSkirmishSettings,
  setOnStartGame, getCampaignMission,
  getGameTime, getOwnerFaction,
  setCampaignFaction, setActiveMission
} from './game-states.js';
import { getCheese, getStorageCapacity, canAfford, spendCheese } from './economy.js';
import { getPowerStatus } from './power.js';
import {
  canBuildType, getCurrentBuild, startBuilding
} from './construction.js';
import {
  getPlacementMode, setPlacementMode, clearPlacementMode
} from './sidebar.js';
import { setPlaying } from './engine.js';
import { getSelectedUnits } from './selection.js';
import { getPlayerBuildings, getBuildings } from './buildings.js';
import { spawnUnit, getUnits } from './units.js';
import { centerOnTile, getVisibleTileRange } from './three-camera.js';
import { getTile, getMapWidth, getMapHeight } from './map.js';
import { getFogState } from './fog.js';
import {
  TERRAIN_COLORS, TILE_SIZE, FogState,
  BuildingType, BuildingStats,
  UnitType, UnitStats,
  FACTION_SUPER_UNIT
} from './constants.js';

// ---- Campaign data (hardcoded, matches game-states.js) ----

const CAMPAIGN_MISSIONS = [
  { name: 'First Steps', desc: 'Establish your base and defeat a single opponent.' },
  { name: 'Border Skirmish', desc: 'Two enemies challenge your territory.' },
  { name: 'Alpine Assault', desc: 'Hold your ground against two aggressive foes.' },
  { name: 'Three-Front War', desc: 'Surrounded on all sides. Survive and conquer.' },
  { name: 'The Grand Melee', desc: 'A massive battle for alpine supremacy.' },
];

// Sidebar building order
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

// ---- Module-level state ----

let activeTab = 'build';
let surrenderConfirm = false;
let surrenderTimer = null;
let trainCooldown = 0;
let activeMission = 0;
let campaignFaction = 'swiss';
let lastGameState = null;
let minimapCtx = null;
let minimapCanvas = null;
let onStartGameCb = null;
let playerFaction = 'swiss';

// Frame-rate throttle for minimap (expensive to redraw every frame)
let minimapFrameCount = 0;
const MINIMAP_REDRAW_INTERVAL = 5;

// ---- DOM references (cached on init) ----

let dom = {};

// ---- Helper: get producible units for an owner ----

function getProducibleUnits(owner) {
  const result = [];
  const seen = new Set();
  const myBuildings = getPlayerBuildings(owner);
  for (const b of myBuildings) {
    const stats = BuildingStats[b.type];
    if (!stats || !stats.produces) continue;
    for (const unitType of stats.produces) {
      if (unitType === 'superUnit') {
        const faction = getOwnerFaction(owner);
        const resolved = FACTION_SUPER_UNIT[faction];
        if (resolved && !seen.has(resolved) && UnitStats[resolved]) {
          seen.add(resolved);
          result.push(resolved);
        }
      } else if (!seen.has(unitType) && UnitStats[unitType]) {
        seen.add(unitType);
        result.push(unitType);
      }
    }
  }
  return result;
}

// ---- Helper: find a spawn tile near a producing building ----

function findProducerSpawn(unitType, owner) {
  const myBuildings = getPlayerBuildings(owner);
  for (const b of myBuildings) {
    const stats = BuildingStats[b.type];
    if (!stats || !stats.produces) continue;
    const produces = stats.produces.some(p => {
      if (p === unitType) return true;
      if (p === 'superUnit') {
        const faction = getOwnerFaction(owner);
        return FACTION_SUPER_UNIT[faction] === unitType;
      }
      return false;
    });
    if (produces) {
      return {
        x: b.tileX + b.footprint[0],
        y: b.tileY + Math.floor(b.footprint[1] / 2),
      };
    }
  }
  return null;
}

// ---- Helper: format time ----

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ================================================================
// initUI — Wire all DOM event handlers
// ================================================================

export function initUI() {
  // Cache DOM references
  dom = {
    // Menu screens
    menuMain: document.getElementById('menu-main'),
    menuSkirmish: document.getElementById('menu-skirmish'),
    menuCampaign: document.getElementById('menu-campaign'),
    menuResult: document.getElementById('menu-result'),
    // Main menu buttons
    btnSkirmish: document.getElementById('btn-skirmish'),
    btnCampaign: document.getElementById('btn-campaign'),
    // Skirmish setup
    skirmishFaction: document.getElementById('skirmish-faction'),
    skirmishMapsize: document.getElementById('skirmish-mapsize'),
    skirmishOpponents: document.getElementById('skirmish-opponents'),
    skirmishDifficulty: document.getElementById('skirmish-difficulty'),
    btnStartSkirmish: document.getElementById('btn-start-skirmish'),
    btnBackSkirmish: document.getElementById('btn-back-skirmish'),
    // Campaign setup
    campaignFaction: document.getElementById('campaign-faction'),
    campaignMissions: document.getElementById('campaign-missions'),
    btnStartCampaign: document.getElementById('btn-start-campaign'),
    btnBackCampaign: document.getElementById('btn-back-campaign'),
    // Result
    resultTitle: document.getElementById('result-title'),
    resultTime: document.getElementById('result-time'),
    btnReturnMenu: document.getElementById('btn-return-menu'),
    // Game UI
    resourceBar: document.getElementById('resource-bar'),
    sidebar: document.getElementById('sidebar'),
    selectionPanel: document.getElementById('selection-panel'),
    // Resource bar values
    resCheese: document.getElementById('res-cheese'),
    resPower: document.getElementById('res-power'),
    resUnits: document.getElementById('res-units'),
    resFps: document.getElementById('res-fps'),
    resTile: document.getElementById('res-tile'),
    // Sidebar elements
    sidebarTabs: document.getElementById('sidebar-tabs'),
    sidebarButtons: document.getElementById('sidebar-buttons'),
    buildProgress: document.getElementById('build-progress'),
    buildProgressLabel: document.getElementById('build-progress-label'),
    buildProgressFill: document.getElementById('build-progress-fill'),
    surrenderBtn: document.getElementById('surrender-btn'),
    // Minimap
    minimapCanvas: document.getElementById('minimap-canvas'),
    // Selection
    selectionInfo: document.getElementById('selection-info'),
  };

  // Initialize minimap 2D context
  minimapCanvas = dom.minimapCanvas;
  if (minimapCanvas) {
    minimapCanvas.width = minimapCanvas.clientWidth || 168;
    minimapCanvas.height = minimapCanvas.clientHeight || 140;
    minimapCtx = minimapCanvas.getContext('2d');
  }

  // ---- Main menu ----
  if (dom.btnSkirmish) {
    dom.btnSkirmish.addEventListener('click', () => {
      showMenu(GameStateId.SKIRMISH_SETUP);
    });
  }
  if (dom.btnCampaign) {
    dom.btnCampaign.addEventListener('click', () => {
      showMenu(GameStateId.CAMPAIGN_SETUP);
    });
  }

  // ---- Skirmish setup ----
  populateSkirmishSetup();

  if (dom.btnStartSkirmish) {
    dom.btnStartSkirmish.addEventListener('click', () => {
      const settings = getSkirmishSettings();
      settings.seed = Date.now();
      setSkirmishSettings(settings);
      onStartGameCb && onStartGameCb('skirmish');
    });
  }
  if (dom.btnBackSkirmish) {
    dom.btnBackSkirmish.addEventListener('click', () => {
      showMenu(GameStateId.MAIN_MENU);
    });
  }

  // ---- Campaign setup ----
  populateCampaignSetup();

  if (dom.btnStartCampaign) {
    dom.btnStartCampaign.addEventListener('click', () => {
      onStartGameCb && onStartGameCb('campaign');
    });
  }
  if (dom.btnBackCampaign) {
    dom.btnBackCampaign.addEventListener('click', () => {
      showMenu(GameStateId.MAIN_MENU);
    });
  }

  // ---- Result overlay ----
  if (dom.btnReturnMenu) {
    dom.btnReturnMenu.addEventListener('click', () => {
      hideGameUI();
      showMenu(GameStateId.MAIN_MENU);
    });
  }

  // ---- Sidebar tabs ----
  if (dom.sidebarTabs) {
    const tabButtons = dom.sidebarTabs.querySelectorAll('button');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        if (tab) {
          activeTab = tab;
          tabButtons.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
          populateSidebarContent();
        }
      });
    });
  }

  // ---- Surrender button ----
  if (dom.surrenderBtn) {
    dom.surrenderBtn.addEventListener('click', () => {
      if (surrenderConfirm) {
        surrenderConfirm = false;
        dom.surrenderBtn.textContent = 'SURRENDER';
        dom.surrenderBtn.classList.remove('confirm');
        if (surrenderTimer) { clearTimeout(surrenderTimer); surrenderTimer = null; }
        // Trigger defeat — stop game engine before changing state
        setPlaying(false);
        setGameState(GameStateId.DEFEAT);
      } else {
        surrenderConfirm = true;
        dom.surrenderBtn.textContent = 'CONFIRM SURRENDER?';
        dom.surrenderBtn.classList.add('confirm');
        surrenderTimer = setTimeout(() => {
          surrenderConfirm = false;
          if (dom.surrenderBtn) {
            dom.surrenderBtn.textContent = 'SURRENDER';
            dom.surrenderBtn.classList.remove('confirm');
          }
        }, 3000);
      }
    });
  }

  // ---- Minimap click ----
  if (minimapCanvas) {
    minimapCanvas.addEventListener('click', (e) => {
      const mapW = getMapWidth();
      const mapH = getMapHeight();
      if (!mapW || !mapH) return;

      const rect = minimapCanvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Convert click to canvas-space
      const scaleX = minimapCanvas.width / rect.width;
      const scaleY = minimapCanvas.height / rect.height;
      const canvasX = clickX * scaleX;
      const canvasY = clickY * scaleY;

      // Convert to tile coordinates
      const tileX = (canvasX / minimapCanvas.width) * mapW;
      const tileY = (canvasY / minimapCanvas.height) * mapH;

      centerOnTile(Math.floor(tileX), Math.floor(tileY));
    });
  }
}

// Called by main.js to give us the startGame callback reference.
// main.js calls setOnStartGame(startGame) for game-states.js internal use,
// and also needs to provide the same callback to the UI.
export function setUIStartCallback(fn) {
  onStartGameCb = fn;
}

// ================================================================
// Skirmish Setup Population
// ================================================================

function populateSkirmishSetup() {
  const settings = getSkirmishSettings();

  const factions = [
    { id: 'swiss', label: 'Swiss' },
    { id: 'french', label: 'French' },
    { id: 'german', label: 'German' },
  ];
  populateOptionRow(dom.skirmishFaction, factions, settings.faction, (id) => {
    setSkirmishSettings({ faction: id });
  });

  const mapSizes = [
    { id: 32, label: 'S (32)' },
    { id: 48, label: 'M (48)' },
    { id: 64, label: 'L (64)' },
    { id: 80, label: 'XL (80)' },
  ];
  populateOptionRow(dom.skirmishMapsize, mapSizes, settings.mapSize, (id) => {
    setSkirmishSettings({ mapSize: id });
  });

  const opponents = [
    { id: 1, label: '1' },
    { id: 2, label: '2' },
    { id: 3, label: '3' },
  ];
  populateOptionRow(dom.skirmishOpponents, opponents, settings.opponents, (id) => {
    setSkirmishSettings({ opponents: id });
  });

  const difficulties = [
    { id: 'easy', label: 'Easy' },
    { id: 'medium', label: 'Medium' },
    { id: 'hard', label: 'Hard' },
  ];
  populateOptionRow(dom.skirmishDifficulty, difficulties, settings.difficulty, (id) => {
    setSkirmishSettings({ difficulty: id });
  });
}

function populateOptionRow(container, options, selectedValue, onChange) {
  if (!container) return;
  // Clear children safely
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  for (const opt of options) {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt.label;
    btn.dataset.value = String(opt.id);

    if (opt.id === selectedValue) {
      btn.classList.add('selected');
    }

    btn.addEventListener('click', () => {
      container.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      onChange(opt.id);
    });

    container.appendChild(btn);
  }
}

// ================================================================
// Campaign Setup Population
// ================================================================

function populateCampaignSetup() {
  const factions = [
    { id: 'swiss', label: 'Swiss' },
    { id: 'french', label: 'French' },
    { id: 'german', label: 'German' },
  ];
  populateOptionRow(dom.campaignFaction, factions, campaignFaction, (id) => {
    campaignFaction = id;
    setCampaignFaction(id);
  });

  refreshMissionList();
}

function refreshMissionList() {
  if (!dom.campaignMissions) return;
  while (dom.campaignMissions.firstChild) {
    dom.campaignMissions.removeChild(dom.campaignMissions.firstChild);
  }

  const progress = parseInt(localStorage.getItem('cheesedune_campaign') || '0', 10);

  for (let i = 0; i < CAMPAIGN_MISSIONS.length; i++) {
    const m = CAMPAIGN_MISSIONS[i];
    const unlocked = i <= progress;
    const completed = i < progress;
    const isActive = i === activeMission;

    const item = document.createElement('div');
    item.className = 'mission-item';
    if (isActive && unlocked) item.classList.add('selected');
    if (!unlocked) item.classList.add('locked');

    const nameDiv = document.createElement('div');
    nameDiv.className = 'mission-name';
    nameDiv.textContent = (i + 1) + '. ' + m.name + (completed ? ' \u2713' : '');

    const descDiv = document.createElement('div');
    descDiv.className = 'mission-desc';
    descDiv.textContent = unlocked ? m.desc : 'Locked';

    item.appendChild(nameDiv);
    item.appendChild(descDiv);

    if (unlocked) {
      item.addEventListener('click', () => {
        activeMission = i;
        setActiveMission(i);
        refreshMissionList();
      });
    }

    dom.campaignMissions.appendChild(item);
  }
}

// ================================================================
// showMenu — Show specific menu screen, hide others
// ================================================================

export function showMenu(stateId) {
  const allMenus = document.querySelectorAll('.menu-screen, .result-overlay');
  allMenus.forEach(el => el.classList.add('hidden'));

  if (stateId === GameStateId.MAIN_MENU) {
    if (dom.menuMain) dom.menuMain.classList.remove('hidden');
  } else if (stateId === GameStateId.SKIRMISH_SETUP) {
    if (dom.menuSkirmish) dom.menuSkirmish.classList.remove('hidden');
    populateSkirmishSetup();
  } else if (stateId === GameStateId.CAMPAIGN_SETUP) {
    if (dom.menuCampaign) dom.menuCampaign.classList.remove('hidden');
    refreshMissionList();
  } else if (stateId === GameStateId.VICTORY || stateId === GameStateId.DEFEAT) {
    if (dom.menuResult) {
      dom.menuResult.classList.remove('hidden');

      if (dom.resultTitle) {
        dom.resultTitle.textContent = stateId === GameStateId.VICTORY ? 'VICTORY' : 'DEFEAT';
        dom.resultTitle.className = 'result-title ' + (stateId === GameStateId.VICTORY ? 'victory' : 'defeat');
      }

      if (dom.resultTime) {
        dom.resultTime.textContent = 'Time: ' + formatTime(getGameTime());
      }
    }
  }

  lastGameState = stateId;
}

// ================================================================
// showGameUI / hideGameUI
// ================================================================

export function showGameUI() {
  if (dom.sidebar) dom.sidebar.style.display = '';
  if (dom.resourceBar) dom.resourceBar.style.display = '';
  if (dom.selectionPanel) dom.selectionPanel.style.display = '';

  // Hide all menu screens
  const allMenus = document.querySelectorAll('.menu-screen, .result-overlay');
  allMenus.forEach(el => el.classList.add('hidden'));

  // Reset sidebar state
  activeTab = 'build';
  surrenderConfirm = false;
  if (dom.surrenderBtn) {
    dom.surrenderBtn.textContent = 'SURRENDER';
    dom.surrenderBtn.classList.remove('confirm');
  }

  // Set tab active state
  if (dom.sidebarTabs) {
    const tabButtons = dom.sidebarTabs.querySelectorAll('button');
    tabButtons.forEach(b => b.classList.toggle('active', b.dataset.tab === activeTab));
  }

  // Populate sidebar
  populateSidebarContent();

  // Grab player faction from settings
  const settings = getSkirmishSettings();
  playerFaction = settings.faction || 'swiss';
}

export function hideGameUI() {
  if (dom.sidebar) dom.sidebar.style.display = 'none';
  if (dom.resourceBar) dom.resourceBar.style.display = 'none';
  if (dom.selectionPanel) dom.selectionPanel.style.display = 'none';
}

// ================================================================
// Sidebar Content
// ================================================================

function populateSidebarContent() {
  if (!dom.sidebarButtons) return;
  while (dom.sidebarButtons.firstChild) {
    dom.sidebarButtons.removeChild(dom.sidebarButtons.firstChild);
  }

  if (activeTab === 'build') {
    populateBuildTab();
  } else {
    populateUnitsTab();
  }
}

function populateBuildTab() {
  if (!dom.sidebarButtons) return;
  const owner = 'player';

  for (const type of SIDEBAR_BUILDINGS) {
    const stats = BuildingStats[type];
    const btn = document.createElement('button');

    const labelSpan = document.createTextNode(SIDEBAR_LABELS[type] || type);
    btn.appendChild(labelSpan);
    btn.appendChild(document.createElement('br'));
    const costSpan = document.createElement('span');
    costSpan.style.cssText = 'font-size:9px;color:#888';
    costSpan.textContent = '$' + stats.cost;
    btn.appendChild(costSpan);

    btn.dataset.buildType = type;

    const available = canBuildType(type, owner);
    if (available) {
      btn.classList.add('available');
    } else {
      btn.classList.add('disabled');
    }

    const pm = getPlacementMode();
    if (pm === type) {
      btn.classList.add('selected');
      btn.style.background = 'rgba(51, 102, 51, 0.8)';
      btn.style.borderColor = '#6a6';
    }

    btn.addEventListener('click', () => {
      handleBuildAction(type);
    });

    dom.sidebarButtons.appendChild(btn);
  }
}

function populateUnitsTab() {
  if (!dom.sidebarButtons) return;
  const owner = 'player';
  const producible = getProducibleUnits(owner);

  if (producible.length === 0) {
    const msg = document.createElement('div');
    msg.style.cssText = 'grid-column: 1/-1; color: #666; font-size: 11px; padding: 10px;';
    msg.textContent = 'Build Barracks or Factory to train units.';
    dom.sidebarButtons.appendChild(msg);
    return;
  }

  for (const unitType of producible) {
    const stats = UnitStats[unitType];
    if (!stats) continue;

    const btn = document.createElement('button');
    const label = UNIT_LABELS[unitType] || unitType.substring(0, 6);

    const labelNode = document.createTextNode(label);
    btn.appendChild(labelNode);
    btn.appendChild(document.createElement('br'));
    const costSpan = document.createElement('span');
    costSpan.style.cssText = 'font-size:9px;color:#888';
    costSpan.textContent = '$' + stats.cost;
    btn.appendChild(costSpan);

    btn.dataset.unitType = unitType;

    const affordable = canAfford(stats.cost, owner);
    const ready = trainCooldown <= 0;
    if (affordable && ready) {
      btn.classList.add('available');
    } else {
      btn.classList.add('disabled');
    }

    btn.addEventListener('click', () => {
      handleUnitAction(unitType);
    });

    dom.sidebarButtons.appendChild(btn);
  }
}

function handleBuildAction(type) {
  const owner = 'player';
  if (!canBuildType(type, owner)) return;

  const pm = getPlacementMode();
  if (pm === type) {
    clearPlacementMode();
    populateSidebarContent();
    return;
  }

  const current = getCurrentBuild(owner);
  if (!current) {
    const faction = getOwnerFaction('player');
    if (startBuilding(type, owner, faction)) {
      populateSidebarContent();
    }
  } else if (current.pendingPlacement) {
    setPlacementMode(current.type);
    populateSidebarContent();
  }
}

function handleUnitAction(unitType) {
  const owner = 'player';
  const stats = UnitStats[unitType];
  if (!stats) return;
  if (!canAfford(stats.cost, owner) || trainCooldown > 0) return;

  spendCheese(stats.cost, owner);
  const spawn = findProducerSpawn(unitType, owner);
  if (spawn) {
    const faction = getOwnerFaction('player');
    spawnUnit(unitType, faction, spawn.x, spawn.y, owner);
    trainCooldown = Math.max(3, stats.buildTime * 0.3);
  }
}

// ================================================================
// sync — Per-frame UI updates
// ================================================================

let fpsFrames = 0;
let fpsTime = 0;
let fpsDisplay = 0;

export function sync(dt) {
  if (!dt) dt = 0.016;

  // Update train cooldown
  if (trainCooldown > 0) {
    trainCooldown -= dt;
  }

  // FPS counter
  fpsFrames++;
  fpsTime += dt;
  if (fpsTime >= 1.0) {
    fpsDisplay = Math.round(fpsFrames / fpsTime);
    fpsFrames = 0;
    fpsTime = 0;
  }

  // Check game state changes (victory/defeat auto-show)
  const currentState = getGameState();
  if (currentState !== lastGameState) {
    if (currentState === GameStateId.VICTORY || currentState === GameStateId.DEFEAT) {
      showMenu(currentState);
    }
    lastGameState = currentState;
  }

  // Only update game UI elements when playing
  if (currentState !== GameStateId.PLAYING) return;

  // 1. Resource bar
  updateResourceBar();

  // 2. Build progress
  updateBuildProgress();

  // 3. Sidebar button states
  updateSidebarButtonStates();

  // 4. Minimap (throttled to every N frames)
  minimapFrameCount++;
  if (minimapFrameCount >= MINIMAP_REDRAW_INTERVAL) {
    minimapFrameCount = 0;
    drawMinimap();
  }

  // 5. Selection panel
  updateSelectionPanel();
}

// ================================================================
// Resource Bar Update
// ================================================================

function updateResourceBar() {
  const owner = 'player';
  const cheese = Math.floor(getCheese(owner));
  const storage = getStorageCapacity(owner);
  const power = getPowerStatus(owner);
  const allPlayerUnits = getUnits().filter(u => u.owner === owner).length;

  if (dom.resCheese) {
    dom.resCheese.textContent = cheese + '/' + storage;
  }
  if (dom.resPower) {
    dom.resPower.textContent = power.produced + '/' + power.consumed;
    dom.resPower.style.color = power.lowPower ? '#cc0000' : power.surplus < 10 ? '#cccc00' : '#00cc00';
  }
  if (dom.resUnits) {
    dom.resUnits.textContent = String(allPlayerUnits);
  }
  if (dom.resFps) {
    dom.resFps.textContent = String(fpsDisplay);
  }
}

// ================================================================
// Build Progress Update
// ================================================================

function updateBuildProgress() {
  const owner = 'player';
  const current = getCurrentBuild(owner);

  if (!dom.buildProgress) return;

  if (!current) {
    if (dom.buildProgressLabel) dom.buildProgressLabel.textContent = '';
    if (dom.buildProgressFill) dom.buildProgressFill.style.width = '0%';
    return;
  }

  const frac = current.progress / current.buildTime;
  if (dom.buildProgressFill) {
    dom.buildProgressFill.style.width = Math.floor(frac * 100) + '%';
  }

  if (current.pendingPlacement) {
    if (dom.buildProgressLabel) dom.buildProgressLabel.textContent = 'CLICK MAP TO PLACE';
    if (dom.buildProgressFill) dom.buildProgressFill.style.background = '#00cc00';
  } else {
    const label = SIDEBAR_LABELS[current.type] || current.type;
    if (dom.buildProgressLabel) dom.buildProgressLabel.textContent = label + ' ' + Math.floor(frac * 100) + '%';
    if (dom.buildProgressFill) dom.buildProgressFill.style.background = '#4a8a4a';
  }
}

// ================================================================
// Sidebar Button States Update
// ================================================================

function updateSidebarButtonStates() {
  if (!dom.sidebarButtons) return;
  const owner = 'player';
  const pm = getPlacementMode();

  if (activeTab === 'build') {
    const buttons = dom.sidebarButtons.querySelectorAll('button');
    buttons.forEach(btn => {
      const type = btn.dataset.buildType;
      if (!type) return;

      const available = canBuildType(type, owner);
      btn.classList.toggle('available', available);
      btn.classList.toggle('disabled', !available);

      const isPlacing = pm === type;
      btn.classList.toggle('selected', isPlacing);
      btn.style.background = isPlacing ? 'rgba(51, 102, 51, 0.8)' : '';
      btn.style.borderColor = isPlacing ? '#6a6' : '';
    });
  } else {
    // Check if producible units changed and rebuild if needed
    const producible = getProducibleUnits(owner);
    const buttons = dom.sidebarButtons.querySelectorAll('button[data-unit-type]');
    const currentTypes = [];
    buttons.forEach(btn => {
      if (btn.dataset.unitType) currentTypes.push(btn.dataset.unitType);
    });

    if (currentTypes.length !== producible.length ||
        currentTypes.some((t, i) => t !== producible[i])) {
      populateUnitsTab();
    } else {
      buttons.forEach(btn => {
        const unitType = btn.dataset.unitType;
        if (!unitType) return;
        const stats = UnitStats[unitType];
        if (!stats) return;

        const affordable = canAfford(stats.cost, owner);
        const ready = trainCooldown <= 0;
        btn.classList.toggle('available', affordable && ready);
        btn.classList.toggle('disabled', !(affordable && ready));
      });
    }
  }
}

// ================================================================
// Minimap Drawing (2D Canvas)
// ================================================================

function drawMinimap() {
  if (!minimapCtx || !minimapCanvas) return;

  const mapW = getMapWidth();
  const mapH = getMapHeight();
  if (!mapW || !mapH) return;

  const cw = minimapCanvas.width;
  const ch = minimapCanvas.height;

  // Clear
  minimapCtx.fillStyle = '#000';
  minimapCtx.fillRect(0, 0, cw, ch);

  // Calculate scale to fit map into canvas
  const scaleX = cw / mapW;
  const scaleY = ch / mapH;
  const scale = Math.min(scaleX, scaleY);

  // Offset to center the map in the canvas
  const offsetX = (cw - mapW * scale) / 2;
  const offsetY = (ch - mapH * scale) / 2;

  // Draw terrain tiles
  for (let y = 0; y < mapH; y++) {
    for (let x = 0; x < mapW; x++) {
      const fog = getFogState(x, y);
      if (fog === FogState.HIDDEN) continue;

      const tile = getTile(x, y);
      minimapCtx.fillStyle = TERRAIN_COLORS[tile] || '#ff00ff';
      minimapCtx.fillRect(
        offsetX + x * scale,
        offsetY + y * scale,
        Math.ceil(scale),
        Math.ceil(scale)
      );

      if (fog === FogState.REVEALED) {
        minimapCtx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        minimapCtx.fillRect(
          offsetX + x * scale,
          offsetY + y * scale,
          Math.ceil(scale),
          Math.ceil(scale)
        );
      }
    }
  }

  // Draw building footprints
  const allBuildings = getBuildings();
  for (const b of allBuildings) {
    if (!b.alive) continue;
    const fog = getFogState(b.tileX, b.tileY);
    if (fog === FogState.HIDDEN) continue;
    if (b.owner !== 'player' && fog !== FogState.VISIBLE) continue;

    minimapCtx.fillStyle = b.owner === 'player' ? '#00aa00' : '#aa0000';
    minimapCtx.fillRect(
      offsetX + b.tileX * scale,
      offsetY + b.tileY * scale,
      Math.ceil(b.footprint[0] * scale),
      Math.ceil(b.footprint[1] * scale)
    );
  }

  // Draw unit dots
  const allUnits = getUnits();
  for (const unit of allUnits) {
    if (!unit.alive) continue;
    const utx = Math.floor(unit.x / TILE_SIZE);
    const uty = Math.floor(unit.y / TILE_SIZE);

    if (unit.owner !== 'player' && getFogState(utx, uty) !== FogState.VISIBLE) continue;

    minimapCtx.fillStyle = unit.owner === 'player' ? '#00ff00' : '#ff0000';
    const dotSize = Math.max(2, Math.ceil(scale));
    minimapCtx.fillRect(
      offsetX + utx * scale,
      offsetY + uty * scale,
      dotSize, dotSize
    );
  }

  // Draw viewport rectangle
  try {
    const vr = getVisibleTileRange();
    minimapCtx.strokeStyle = '#ffffff';
    minimapCtx.lineWidth = 1;
    minimapCtx.strokeRect(
      offsetX + vr.startX * scale,
      offsetY + vr.startY * scale,
      (vr.endX - vr.startX) * scale,
      (vr.endY - vr.startY) * scale
    );
  } catch (e) {
    // getVisibleTileRange may fail if camera not initialized
  }
}

// ================================================================
// Selection Panel Update
// ================================================================

function updateSelectionPanel() {
  if (!dom.selectionInfo) return;

  const selected = getSelectedUnits();

  if (selected.length === 0) {
    dom.selectionInfo.textContent = '';
    return;
  }

  // Clear previous content
  while (dom.selectionInfo.firstChild) {
    dom.selectionInfo.removeChild(dom.selectionInfo.firstChild);
  }

  if (selected.length === 1) {
    const unit = selected[0];
    const hpPct = unit.hp / unit.maxHp;
    const hpColor = hpPct > 0.6 ? '#44cc44' : hpPct > 0.3 ? '#cccc44' : '#cc4444';
    const label = UNIT_LABELS[unit.type] || unit.type;

    // Type name
    const nameSpan = document.createElement('span');
    nameSpan.style.cssText = 'color:#ddd;font-weight:bold';
    nameSpan.textContent = label;
    dom.selectionInfo.appendChild(nameSpan);

    // HP text
    const hpSpan = document.createElement('span');
    hpSpan.style.cssText = 'color:#888;margin-left:8px';
    hpSpan.textContent = 'HP: ' + Math.floor(unit.hp) + '/' + unit.maxHp;
    dom.selectionInfo.appendChild(hpSpan);

    // Health bar
    const barOuter = document.createElement('div');
    barOuter.style.cssText = 'display:inline-block;width:60px;height:6px;background:#1a1a2e;margin-left:8px;border-radius:3px;vertical-align:middle;overflow:hidden';
    const barInner = document.createElement('div');
    barInner.style.cssText = 'width:' + Math.floor(hpPct * 100) + '%;height:100%;background:' + hpColor;
    barOuter.appendChild(barInner);
    dom.selectionInfo.appendChild(barOuter);
  } else {
    // Multiple units: count + type breakdown
    const typeCounts = {};
    for (const u of selected) {
      const label = UNIT_LABELS[u.type] || u.type;
      typeCounts[label] = (typeCounts[label] || 0) + 1;
    }
    const breakdown = Object.entries(typeCounts)
      .map(([lbl, count]) => count + 'x ' + lbl)
      .join(', ');

    const countSpan = document.createElement('span');
    countSpan.style.cssText = 'color:#ddd;font-weight:bold';
    countSpan.textContent = selected.length + ' units';
    dom.selectionInfo.appendChild(countSpan);

    const detailSpan = document.createElement('span');
    detailSpan.style.cssText = 'color:#888;margin-left:8px';
    detailSpan.textContent = breakdown;
    dom.selectionInfo.appendChild(detailSpan);
  }
}
