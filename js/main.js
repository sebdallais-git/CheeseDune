// Game/public/dune/js/main.js
import { createTestMap, initMap } from './map.js';
import { initCamera, centerOnTile } from './camera.js';
import {
  initRenderer, clearScreen, drawTiles, drawGrid, drawFog,
  drawHoverTile, drawSidebar, drawMinimap,
  drawDebugInfo, updateFps, drawUnits, drawSelectionBox,
  drawSelectionPanel, drawProjectiles, drawParticles,
  drawBuildings, drawPlacementPreview, getCanvas
} from './renderer.js';
import { startEngine, onDraw, onTick } from './engine.js';
import { initInput, getBoxSelectState, getHoverTile } from './input.js';
import { initFog, resetVisibility, revealArea } from './fog.js';
import { initMinimap } from './minimap.js';
import { spawnUnit, updateUnits, getUnits } from './units.js';
import { getSelectedUnits, cleanSelection } from './selection.js';
import { UnitType, TILE_SIZE, BuildingType } from './constants.js';
import { FactionId } from './factions.js';
import { updateCombat } from './combat.js';
import { updateProjectiles } from './projectiles.js';
import { updateParticles } from './particles.js';
import { placeBuilding, updateBuildings, getBuildings, canPlaceBuilding } from './buildings.js';
import { initEconomy } from './economy.js';
import { updateConstruction } from './construction.js';
import { updateHarvesters } from './harvester-ai.js';
import { getPlacementMode } from './sidebar.js';

function init() {
  const testMap = createTestMap();
  initMap(testMap.width, testMap.height, testMap.data);

  initRenderer();
  initCamera();
  initInput(getCanvas());
  initFog();
  initMinimap();
  initEconomy(2000);

  // Place starting buildings for player
  placeBuilding(BuildingType.CONSTRUCTION_YARD, 4, 33, 'player');
  placeBuilding(BuildingType.POWER_PLANT, 3, 36, 'player');
  placeBuilding(BuildingType.REFINERY, 7, 33, 'player');

  // Spawn test units
  spawnUnit(UnitType.LIGHT_INFANTRY, FactionId.SWISS, 4, 31, 'player');
  spawnUnit(UnitType.LIGHT_INFANTRY, FactionId.SWISS, 5, 31, 'player');
  spawnUnit(UnitType.TANK, FactionId.SWISS, 6, 32, 'player');
  spawnUnit(UnitType.HARVESTER, FactionId.SWISS, 10, 34, 'player');

  // Enemy units
  spawnUnit(UnitType.LIGHT_INFANTRY, FactionId.FRENCH, 22, 18, 'enemy');
  spawnUnit(UnitType.TANK, FactionId.FRENCH, 24, 20, 'enemy');

  centerOnTile(5, 35);

  // Game logic ticks (10/s)
  onTick('construction', (dt) => updateConstruction(dt, 'player'));
  onTick('harvesters', (dt) => updateHarvesters(dt));
  onTick('buildings', (dt) => updateBuildings(dt));
  onTick('combat', (dt) => updateCombat(dt));
  onTick('projectiles', (dt) => updateProjectiles(dt));
  onTick('particles', (dt) => updateParticles(dt));
  onTick('units', (dt) => updateUnits(dt));
  onTick('selection', () => cleanSelection());
  onTick('fog', () => {
    resetVisibility();
    const allUnits = getUnits();
    for (const unit of allUnits) {
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

  // Render callbacks (60fps)
  onDraw('clear', () => clearScreen());
  onDraw('tiles', () => drawTiles());
  onDraw('grid', () => drawGrid());
  onDraw('buildings', () => drawBuildings());
  onDraw('fog', () => drawFog());
  onDraw('units', () => drawUnits());
  onDraw('projectiles', () => drawProjectiles());
  onDraw('particles', () => drawParticles());
  onDraw('hover', () => drawHoverTile());
  onDraw('placement', () => {
    const mode = getPlacementMode();
    if (mode) {
      const hover = getHoverTile();
      if (hover.x >= 0 && hover.y >= 0) {
        const valid = canPlaceBuilding(mode, hover.x, hover.y, 'player');
        drawPlacementPreview(mode, hover.x, hover.y, valid);
      }
    }
  });
  onDraw('boxSelect', () => {
    const box = getBoxSelectState();
    if (box) drawSelectionBox(box.x1, box.y1, box.x2, box.y2);
  });
  onDraw('topBar', (dt) => { updateFps(dt); drawDebugInfo(); });
  onDraw('bottomBar', () => drawSelectionPanel(getSelectedUnits()));
  onDraw('sidebar', () => drawSidebar());
  onDraw('minimap', () => drawMinimap());

  startEngine();
}

init();
