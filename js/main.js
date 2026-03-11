import { createTestMap, initMap } from './map.js';
import { initCamera, centerOnTile } from './camera.js';
import { initRenderer, clearScreen, drawTiles, drawSidebar, drawTopBar, drawBottomBar } from './renderer.js';

const testMap = createTestMap();
initMap(testMap.width, testMap.height, testMap.data);

initRenderer();
initCamera();
centerOnTile(20, 20);

function frame() {
  clearScreen();
  drawTiles();
  drawTopBar();
  drawBottomBar();
  drawSidebar();
  requestAnimationFrame(frame);
}

frame();
