// Game/public/dune/js/main.js
import { createTestMap, initMap } from './map.js';
import { initCamera, centerOnTile } from './camera.js';
import { initRenderer, clearScreen, drawTiles, drawSidebar, drawTopBar, drawBottomBar, getCanvas } from './renderer.js';
import { startEngine, onDraw } from './engine.js';
import { initInput } from './input.js';

function init() {
  const testMap = createTestMap();
  initMap(testMap.width, testMap.height, testMap.data);

  initRenderer();
  initCamera();
  centerOnTile(20, 20);
  initInput(getCanvas());

  // Register draw phase
  onDraw('clear', () => clearScreen());
  onDraw('tiles', () => drawTiles());
  onDraw('topBar', () => drawTopBar());
  onDraw('bottomBar', () => drawBottomBar());
  onDraw('sidebar', () => drawSidebar());

  startEngine();
}

init();
