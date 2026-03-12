// Game/public/dune/js/main.js — Main entry point (Three.js migration)
import { initMap } from './map.js';
import {
  initThreeRenderer, rebuildScene, draw as threeDraw,
  getScene, getThreeCanvas, registerSync
} from './three-renderer.js';
import { initCamera, centerOnTile } from './three-camera.js';
import { startEngine, onTick, clearCallbacks, setPlaying, setDrawCallback } from './engine.js';
import { initInput } from './input.js';
import { initFog, resetVisibility, revealArea } from './fog.js';
import { initMinimap } from './minimap.js';
import { spawnUnit, updateUnits, getUnits, clearUnits } from './units.js';
import { cleanSelection } from './selection.js';
import { UnitType, TILE_SIZE, BuildingType } from './constants.js';
import { updateCombat, clearCheeseZones } from './combat.js';
import { updateProjectiles, clearProjectiles } from './projectiles.js';
import { updateParticles, clearParticles } from './particles.js';
import { placeBuilding, updateBuildings, getBuildings, clearBuildings } from './buildings.js';
import { initEconomy, resetEconomy } from './economy.js';
import { updateConstruction, clearConstruction, setOnBuildComplete } from './construction.js';
import { updateHarvesters } from './harvester-ai.js';
import { setPlacementMode, setPlayerFaction, updateSidebarCooldown, setOnSurrender } from './sidebar.js';
import { generateMap } from './mapgen.js';
import { createAI, updateAI, clearAI } from './ai.js';
import { updateStarports } from './starport.js';
import {
  GameStateId, setGameState,
  getSkirmishSettings,
  addGameTime, resetGameTime,
  registerOwnerFaction, clearOwnerFactions,
  setOnStartGame, getCampaignMission, advanceCampaign
} from './game-states.js';

// Sub-renderer stubs
import { init as initFog3D, sync as syncFog3D } from './three-fog.js';
import { init as initUnits3D, sync as syncUnits3D } from './three-unit-renderer.js';
import { init as initBuildings3D, sync as syncBuildings3D } from './three-building-renderer.js';
import { init as initParticles3D, sync as syncParticles3D } from './three-particles.js';
import { init as initProjectiles3D, sync as syncProjectiles3D } from './three-projectiles.js';
import { init as initEnv3D, sync as syncEnv3D, buildEnvironment } from './three-environment.js';
import { initUI, sync as syncUI, showMenu, hideGameUI, showGameUI } from './three-ui.js';

let isCampaignGame = false;

function startGame(mode) {
  let settings;
  if (mode === 'campaign') {
    const mission = getCampaignMission();
    settings = {
      faction: mission.faction,
      mapSize: mission.mapSize,
      opponents: mission.opponents,
      difficulty: mission.difficulty,
      seed: mission.seed,
    };
    isCampaignGame = true;
  } else {
    settings = getSkirmishSettings();
    isCampaignGame = false;
  }
  const size = settings.mapSize;
  const numPlayers = 1 + settings.opponents;

  // Generate map
  const map = generateMap(size, size, settings.seed, numPlayers);

  // Reset everything
  clearCallbacks();
  clearUnits();
  clearBuildings();
  clearProjectiles();
  clearParticles();
  clearCheeseZones();
  clearConstruction();
  clearAI();
  resetEconomy();
  resetGameTime();
  clearOwnerFactions();

  // Initialize systems with new map
  initMap(map.width, map.height, map.data);
  initCamera(map.width, map.height);
  initFog();
  initMinimap();

  // Player setup
  const playerFaction = settings.faction;
  registerOwnerFaction('player', playerFaction);
  setPlayerFaction(playerFaction);

  const playerStart = map.startPositions[0];
  placeBuilding(BuildingType.CONSTRUCTION_YARD, playerStart.x, playerStart.y, 'player');
  placeBuilding(BuildingType.POWER_PLANT, playerStart.x - 2, playerStart.y + 3, 'player');
  placeBuilding(BuildingType.REFINERY, playerStart.x + 3, playerStart.y, 'player');
  spawnUnit(UnitType.LIGHT_INFANTRY, playerFaction, playerStart.x + 1, playerStart.y - 1, 'player');
  spawnUnit(UnitType.LIGHT_INFANTRY, playerFaction, playerStart.x + 2, playerStart.y - 1, 'player');
  spawnUnit(UnitType.HARVESTER, playerFaction, playerStart.x + 4, playerStart.y + 1, 'player');
  initEconomy(2000, 'player');

  // AI setup
  const availableFactions = ['swiss', 'french', 'german'].filter(f => f !== playerFaction);
  for (let i = 0; i < settings.opponents; i++) {
    const aiOwner = 'enemy' + (i + 1);
    const aiFaction = availableFactions[i % availableFactions.length];
    registerOwnerFaction(aiOwner, aiFaction);

    const aiStart = map.startPositions[i + 1];
    placeBuilding(BuildingType.CONSTRUCTION_YARD, aiStart.x, aiStart.y, aiOwner);
    placeBuilding(BuildingType.POWER_PLANT, aiStart.x - 2, aiStart.y + 3, aiOwner);
    placeBuilding(BuildingType.REFINERY, aiStart.x + 3, aiStart.y, aiOwner);
    spawnUnit(UnitType.LIGHT_INFANTRY, aiFaction, aiStart.x + 1, aiStart.y - 1, aiOwner);
    spawnUnit(UnitType.LIGHT_INFANTRY, aiFaction, aiStart.x + 2, aiStart.y - 1, aiOwner);
    spawnUnit(UnitType.HARVESTER, aiFaction, aiStart.x + 4, aiStart.y + 1, aiOwner);

    const startCheese = settings.difficulty === 'easy' ? 2000 : settings.difficulty === 'hard' ? 3000 : 2500;
    initEconomy(startCheese, aiOwner);

    createAI(aiOwner, aiFaction, settings.difficulty);
  }

  // Surrender callback
  setOnSurrender(() => {
    setPlaying(false);
    setGameState(GameStateId.DEFEAT);
  });

  // Auto-enter placement mode when player building completes
  setOnBuildComplete((item) => {
    if (item.owner === 'player') {
      setPlacementMode(item.type);
    }
  });

  // Wire game ticks
  onTick('ai', (dt) => updateAI(dt));
  onTick('construction-player', (dt) => updateConstruction(dt, 'player'));
  for (let i = 0; i < settings.opponents; i++) {
    const aiOwner = 'enemy' + (i + 1);
    onTick('construction-' + aiOwner, (dt) => updateConstruction(dt, aiOwner));
  }
  onTick('harvesters', (dt) => updateHarvesters(dt));
  onTick('buildings', (dt) => updateBuildings(dt));
  onTick('starports', (dt) => updateStarports(dt, getBuildings()));
  onTick('combat', (dt) => updateCombat(dt));
  onTick('projectiles', (dt) => updateProjectiles(dt));
  onTick('particles', (dt) => updateParticles(dt));
  onTick('units', (dt) => updateUnits(dt));
  onTick('selection', () => cleanSelection());
  onTick('sidebarCooldown', (dt) => updateSidebarCooldown(dt));
  onTick('gameTime', (dt) => addGameTime(dt));
  onTick('fog', () => {
    resetVisibility();
    for (const unit of getUnits()) {
      if (unit.owner === 'player') {
        const tileX = Math.floor(unit.x / TILE_SIZE);
        const tileY = Math.floor(unit.y / TILE_SIZE);
        revealArea(tileX, tileY, unit.visionRadius);
      }
    }
    for (const b of getBuildings()) {
      if (b.owner === 'player') {
        const cx = b.tileX + Math.floor(b.footprint[0] / 2);
        const cy = b.tileY + Math.floor(b.footprint[1] / 2);
        revealArea(cx, cy, 5);
      }
    }
  });
  onTick('victory', () => checkVictoryDefeat());

  // Build Three.js terrain and environment
  rebuildScene();
  buildEnvironment();

  // Center camera on player start
  centerOnTile(playerStart.x + 2, playerStart.y + 2);

  // Show game UI, hide menus
  showGameUI();

  setPlaying(true);
  setGameState(GameStateId.PLAYING);
}

function checkVictoryDefeat() {
  const allUnits = getUnits();
  const allBuildings = getBuildings();

  // Check defeat: player has no CY and no MCV
  const playerCY = allBuildings.some(b => b.type === BuildingType.CONSTRUCTION_YARD && b.owner === 'player');
  const playerMCV = allUnits.some(u => u.type === UnitType.MCV && u.owner === 'player' && u.alive);
  if (!playerCY && !playerMCV) {
    setPlaying(false);
    setGameState(GameStateId.DEFEAT);
    return;
  }

  // Check victory: no enemy has CY or MCV
  const enemyCY = allBuildings.some(b => b.type === BuildingType.CONSTRUCTION_YARD && b.owner !== 'player');
  const enemyMCV = allUnits.some(u => u.type === UnitType.MCV && u.owner !== 'player' && u.alive);
  if (!enemyCY && !enemyMCV) {
    setPlaying(false);
    if (isCampaignGame) advanceCampaign();
    setGameState(GameStateId.VICTORY);
  }
}

function init() {
  // Initialize Three.js renderer, scene, lights, post-processing
  initThreeRenderer();

  // Initialize HTML overlay UI
  initUI();

  // Initialize all sub-renderers with the scene
  const scene = getScene();
  initFog3D(scene);
  initUnits3D(scene);
  initBuildings3D(scene);
  initParticles3D(scene);
  initProjectiles3D(scene);
  initEnv3D(scene);

  // Register sync callbacks
  registerSync('fog', syncFog3D);
  registerSync('units', syncUnits3D);
  registerSync('buildings', syncBuildings3D);
  registerSync('particles', syncParticles3D);
  registerSync('projectiles', syncProjectiles3D);
  registerSync('environment', syncEnv3D);
  registerSync('ui', syncUI);

  // Initialize input using Three.js canvas
  initInput(getThreeCanvas());

  // Set the single draw callback (Three.js render loop)
  setDrawCallback(threeDraw);

  // Wire start game callback
  setOnStartGame(startGame);

  // Show main menu, hide game UI
  hideGameUI();
  showMenu(GameStateId.MAIN_MENU);

  // Start the engine loop
  startEngine();
}

init();
