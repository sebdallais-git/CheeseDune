// Game/public/dune/js/input.js
import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT, TOP_BAR_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE } from './constants.js';
import { moveCamera, getZoom, setZoom, screenToTile, getCamX, getCamY } from './camera.js';
import { handleMinimapClick } from './minimap.js';
import { selectAtPosition, deselectAll, hasSelection, getSelectedUnits, selectInRect } from './selection.js';
import { moveUnitTo } from './units.js';

const DRAG_THRESHOLD = 8;

const GestureState = {
  IDLE: 'IDLE',
  PENDING: 'PENDING',
  DRAGGING: 'DRAGGING',
  PINCHING: 'PINCHING',
  BOX_SELECTING: 'BOX_SELECTING',
};

let state = GestureState.IDLE;
let pointers = new Map();

let hoverTileX = -1;
let hoverTileY = -1;

let pinchStartDist = 0;
let pinchStartZoom = 1;

let canvasEl = null;
let canvasRect = null;

let longPressTimer = null;
const LONG_PRESS_MS = 300;

// Box select world coordinates
let boxStartWorldX = 0;
let boxStartWorldY = 0;
let boxEndWorldX = 0;
let boxEndWorldY = 0;
let isBoxSelecting = false;

export function initInput(canvas) {
  canvasEl = canvas;
  canvasRect = canvas.getBoundingClientRect();

  window.addEventListener('resize', () => {
    canvasRect = canvas.getBoundingClientRect();
  });

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

function getPinchData() {
  const pts = Array.from(pointers.values());
  if (pts.length < 2) return null;
  const dx = pts[1].x - pts[0].x;
  const dy = pts[1].y - pts[0].y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const midX = (pts[0].x + pts[1].x) / 2;
  const midY = (pts[0].y + pts[1].y) / 2 - TOP_BAR_HEIGHT; // viewport-relative
  return { dist, midX, midY };
}

function canvasCoords(e) {
  canvasRect = canvasEl.getBoundingClientRect();
  const scaleX = CANVAS_WIDTH / canvasRect.width;
  const scaleY = CANVAS_HEIGHT / canvasRect.height;
  return {
    x: (e.clientX - canvasRect.left) * scaleX,
    y: (e.clientY - canvasRect.top) * scaleY,
  };
}

function inViewport(x, y) {
  return x >= 0 && x < VIEWPORT_WIDTH && y >= TOP_BAR_HEIGHT && y < TOP_BAR_HEIGHT + VIEWPORT_HEIGHT;
}

function onPointerDown(e) {
  e.preventDefault();
  canvasEl.setPointerCapture(e.pointerId);
  const pos = canvasCoords(e);
  pointers.set(e.pointerId, {
    x: pos.x, y: pos.y,
    startX: pos.x, startY: pos.y,
  });

  if (pointers.size === 1 && inViewport(pos.x, pos.y)) {
    state = GestureState.PENDING;
    // Start long-press timer for box select
    const startPos = { ...pos };
    longPressTimer = setTimeout(() => {
      if (state === GestureState.PENDING) {
        state = GestureState.BOX_SELECTING;
        isBoxSelecting = true;
        // Convert screen to world for box start
        const vx = startPos.x;
        const vy = startPos.y - TOP_BAR_HEIGHT;
        boxStartWorldX = getCamX() + vx / getZoom();
        boxStartWorldY = getCamY() + vy / getZoom();
        boxEndWorldX = boxStartWorldX;
        boxEndWorldY = boxStartWorldY;
      }
    }, LONG_PRESS_MS);
  } else if (pointers.size >= 2) {
    // Cancel any box-select in progress
    clearTimeout(longPressTimer);
    longPressTimer = null;
    isBoxSelecting = false;
    state = GestureState.PINCHING;
    const pinch = getPinchData();
    if (pinch) {
      pinchStartDist = pinch.dist;
      pinchStartZoom = getZoom();
    }
  }
}

function onPointerMove(e) {
  e.preventDefault();
  const pos = canvasCoords(e);
  const ptr = pointers.get(e.pointerId);
  if (!ptr) return;

  const prevX = ptr.x;
  const prevY = ptr.y;
  ptr.x = pos.x;
  ptr.y = pos.y;

  if (pointers.size === 1) {
    const tile = screenToTile(pos.x, pos.y);
    if (tile) {
      hoverTileX = tile.tileX;
      hoverTileY = tile.tileY;
    } else {
      hoverTileX = -1;
      hoverTileY = -1;
    }
  }

  if (state === GestureState.PENDING) {
    const dx = pos.x - ptr.startX;
    const dy = pos.y - ptr.startY;
    if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
      state = GestureState.DRAGGING;
    }
  }

  if (state === GestureState.DRAGGING && pointers.size === 1) {
    const z = getZoom();
    moveCamera((pos.x - prevX) / z, (pos.y - prevY) / z);
  }

  if (state === GestureState.PINCHING && pointers.size === 2) {
    const pinch = getPinchData();
    if (pinch && pinchStartDist > 0) {
      const scale = pinch.dist / pinchStartDist;
      const newZoom = pinchStartZoom * scale;
      setZoom(newZoom, pinch.midX, pinch.midY);
    }
  }

  if (state === GestureState.BOX_SELECTING && pointers.size === 1) {
    const vx = pos.x;
    const vy = pos.y - TOP_BAR_HEIGHT;
    boxEndWorldX = getCamX() + vx / getZoom();
    boxEndWorldY = getCamY() + vy / getZoom();
  }
}

function onPointerUp(e) {
  e.preventDefault();
  const ptr = pointers.get(e.pointerId);
  pointers.delete(e.pointerId);

  if (pointers.size === 0) {
    clearTimeout(longPressTimer);
    longPressTimer = null;

    if (state === GestureState.BOX_SELECTING) {
      // Finalize box selection
      selectInRect(boxStartWorldX, boxStartWorldY, boxEndWorldX, boxEndWorldY);
      isBoxSelecting = false;
    } else if (state === GestureState.PENDING && ptr) {
      // Check minimap first
      if (!handleMinimapClick(ptr.startX, ptr.startY)) {
        // Convert screen tap to world coordinates
        const tile = screenToTile(ptr.startX, ptr.startY);
        if (tile) {
          const worldX = tile.tileX * TILE_SIZE + TILE_SIZE / 2;
          const worldY = tile.tileY * TILE_SIZE + TILE_SIZE / 2;

          // Try to select a unit at tap position
          const tapped = selectAtPosition(worldX, worldY);

          if (!tapped) {
            // No unit tapped
            if (hasSelection()) {
              // Move selected units to tapped tile
              const selected = getSelectedUnits();
              for (const u of selected) {
                moveUnitTo(u, tile.tileX, tile.tileY);
              }
            } else {
              deselectAll();
            }
          }
        }
      }
    }
    hoverTileX = -1;
    hoverTileY = -1;
    state = GestureState.IDLE;
  } else if (pointers.size === 1) {
    state = GestureState.DRAGGING;
  }
}

export function getGestureState() { return state; }
export function getHoverTile() { return { x: hoverTileX, y: hoverTileY }; }

export function getBoxSelectState() {
  if (!isBoxSelecting) return null;
  return {
    x1: boxStartWorldX, y1: boxStartWorldY,
    x2: boxEndWorldX, y2: boxEndWorldY,
  };
}
