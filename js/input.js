// Game/public/dune/js/input.js
import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT, TOP_BAR_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';
import { moveCamera, getZoom, setZoom } from './camera.js';
import { handleMinimapClick } from './minimap.js';

const DRAG_THRESHOLD = 8;

const GestureState = {
  IDLE: 'IDLE',
  PENDING: 'PENDING',
  DRAGGING: 'DRAGGING',
  PINCHING: 'PINCHING',
};

let state = GestureState.IDLE;
let pointers = new Map();

let pinchStartDist = 0;
let pinchStartZoom = 1;

let canvasEl = null;
let canvasRect = null;

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
  const pos = canvasCoords(e);
  pointers.set(e.pointerId, {
    x: pos.x, y: pos.y,
    startX: pos.x, startY: pos.y,
  });

  if (pointers.size === 1 && inViewport(pos.x, pos.y)) {
    state = GestureState.PENDING;
  } else if (pointers.size === 2) {
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

  if (state === GestureState.PENDING) {
    const dx = pos.x - ptr.startX;
    const dy = pos.y - ptr.startY;
    if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
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
}

function onPointerUp(e) {
  e.preventDefault();
  const ptr = pointers.get(e.pointerId);
  pointers.delete(e.pointerId);

  if (pointers.size === 0) {
    if (state === GestureState.PENDING && ptr) {
      // Check minimap first
      if (!handleMinimapClick(ptr.startX, ptr.startY)) {
        // Not on minimap — handle as map tap (unit selection etc. in later phases)
      }
    }
    state = GestureState.IDLE;
  } else if (pointers.size === 1) {
    state = GestureState.DRAGGING;
  }
}

export function getGestureState() { return state; }
