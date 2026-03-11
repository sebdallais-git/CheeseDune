// Game/public/dune/js/main.js
import { createTestMap, initMap } from './map.js';
import { initCamera, centerOnTile } from './camera.js';
import {
  initRenderer, clearScreen, drawTiles, drawGrid, drawFog,
  drawHoverTile, drawSidebar, drawBottomBar, drawMinimap,
  drawDebugInfo, updateFps, getCanvas
} from './renderer.js';
import { startEngine, onDraw, onTick } from './engine.js';
import { initInput } from './input.js';
import { initFog, resetVisibility, revealArea } from './fog.js';
import { initMinimap } from './minimap.js';
import { getUnits } from './units.js';
import { TILE_SIZE } from './constants.js';

function init() {
  const testMap = createTestMap();
  initMap(testMap.width, testMap.height, testMap.data);

  initRenderer();
  initCamera();
  centerOnTile(20, 20);
  initInput(getCanvas());
  initFog();
  initMinimap();

  onTick('fog', () => {
    resetVisibility();
    // Reveal around all player units
    const allUnits = getUnits();
    for (const unit of allUnits) {
      if (unit.owner === 'player') {
        const tileX = Math.floor(unit.x / TILE_SIZE);
        const tileY = Math.floor(unit.y / TILE_SIZE);
        revealArea(tileX, tileY, unit.visionRadius);
      }
    }
  });

  onDraw('clear', () => clearScreen());
  onDraw('tiles', () => drawTiles());
  onDraw('grid', () => drawGrid());
  onDraw('fog', () => drawFog());
  onDraw('hover', () => drawHoverTile());
  onDraw('topBar', (dt) => { updateFps(dt); drawDebugInfo(); });
  onDraw('bottomBar', () => drawBottomBar());
  onDraw('sidebar', () => drawSidebar());
  onDraw('minimap', () => drawMinimap());

  startEngine();
}

init();
