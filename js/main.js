// Game/public/dune/js/main.js
import { createTestMap, initMap } from './map.js';
import { initCamera, centerOnTile } from './camera.js';
import { initRenderer, clearScreen, drawTiles, drawFog, drawSidebar, drawTopBar, drawBottomBar, getCanvas } from './renderer.js';
import { startEngine, onDraw, onTick } from './engine.js';
import { initInput } from './input.js';
import { initFog, resetVisibility, revealArea } from './fog.js';

function init() {
  const testMap = createTestMap();
  initMap(testMap.width, testMap.height, testMap.data);

  initRenderer();
  initCamera();
  centerOnTile(20, 20);
  initInput(getCanvas());
  initFog();

  // Test reveals
  revealArea(5, 35, 5);
  revealArea(20, 20, 4);

  onTick('fog', () => {
    resetVisibility();
    revealArea(5, 35, 5);
    revealArea(20, 20, 4);
  });

  onDraw('clear', () => clearScreen());
  onDraw('tiles', () => drawTiles());
  onDraw('fog', () => drawFog());
  onDraw('topBar', () => drawTopBar());
  onDraw('bottomBar', () => drawBottomBar());
  onDraw('sidebar', () => drawSidebar());

  startEngine();
}

init();
