// Game/public/dune/js/main.js
import { createTestMap, initMap } from './map.js';
import { initCamera, centerOnTile } from './camera.js';
import {
  initRenderer, clearScreen, drawTiles, drawGrid, drawFog,
  drawHoverTile, drawSidebar, drawMinimap,
  drawDebugInfo, updateFps, drawUnits, drawSelectionBox,
  drawSelectionPanel, getCanvas
} from './renderer.js';
import { startEngine, onDraw, onTick } from './engine.js';
import { initInput, getBoxSelectState } from './input.js';
import { initFog, resetVisibility, revealArea } from './fog.js';
import { initMinimap } from './minimap.js';
import { spawnUnit, updateUnits, getUnits } from './units.js';
import { getSelectedUnits } from './selection.js';
import { UnitType, TILE_SIZE } from './constants.js';
import { FactionId } from './factions.js';

function init() {
  const testMap = createTestMap();
  initMap(testMap.width, testMap.height, testMap.data);

  initRenderer();
  initCamera();
  initInput(getCanvas());
  initFog();
  initMinimap();

  // Spawn test units for Phase 2 development
  // Player units (Swiss) near the concrete base area
  spawnUnit(UnitType.LIGHT_INFANTRY, FactionId.SWISS, 4, 34, 'player');
  spawnUnit(UnitType.LIGHT_INFANTRY, FactionId.SWISS, 5, 34, 'player');
  spawnUnit(UnitType.LIGHT_INFANTRY, FactionId.SWISS, 6, 34, 'player');
  spawnUnit(UnitType.HEAVY_INFANTRY, FactionId.SWISS, 4, 35, 'player');
  spawnUnit(UnitType.TANK, FactionId.SWISS, 6, 36, 'player');
  spawnUnit(UnitType.LIGHT_VEHICLE, FactionId.SWISS, 7, 35, 'player');

  // Enemy units (French) across the river
  spawnUnit(UnitType.LIGHT_INFANTRY, FactionId.FRENCH, 22, 18, 'enemy');
  spawnUnit(UnitType.LIGHT_INFANTRY, FactionId.FRENCH, 23, 18, 'enemy');
  spawnUnit(UnitType.TANK, FactionId.FRENCH, 24, 20, 'enemy');

  // Center camera on player base
  centerOnTile(5, 35);

  // Game logic ticks (10/s)
  onTick('units', (dt) => updateUnits(dt));
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
  });

  // Render callbacks (60fps)
  onDraw('clear', () => clearScreen());
  onDraw('tiles', () => drawTiles());
  onDraw('grid', () => drawGrid());
  onDraw('fog', () => drawFog());
  onDraw('units', () => drawUnits());
  onDraw('hover', () => drawHoverTile());
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
