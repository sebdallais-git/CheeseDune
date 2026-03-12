// Game/public/dune/js/engine.js

let tickRate = 10;
let tickAccumulator = 0;
let tickInterval = 1 / 10;
let playing = false;

const updateCallbacks = [];
const drawCallbacks = [];

// Single draw callback (Three.js renderer) — takes priority over drawCallbacks
let drawCallback = null;

export function setDrawCallback(fn) { drawCallback = fn; }

export function onTick(name, fn) {
  updateCallbacks.push({ name, fn });
}

export function onDraw(name, fn) {
  drawCallbacks.push({ name, fn });
}

export function clearCallbacks() {
  updateCallbacks.length = 0;
  drawCallbacks.length = 0;
  // NOTE: drawCallback is NOT cleared — it persists across games
}

export function setPlaying(value) { playing = value; }
export function isPlaying() { return playing; }

let lastTime = 0;
let running = false;

export function startEngine() {
  running = true;
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function loop(now) {
  if (!running) return;

  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  // Only run game ticks when playing
  if (playing) {
    tickAccumulator += dt;
    while (tickAccumulator >= tickInterval) {
      tickAccumulator -= tickInterval;
      for (const cb of updateCallbacks) {
        cb.fn(tickInterval);
      }
    }
  }

  // Draw: use single drawCallback if set, otherwise fallback to drawCallbacks
  if (drawCallback) {
    drawCallback(dt);
  } else {
    for (const cb of drawCallbacks) {
      cb.fn(dt);
    }
  }

  requestAnimationFrame(loop);
}
