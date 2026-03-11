// Game/public/dune/js/engine.js
export const State = {
  LOADING: 'LOADING',
  MAIN_MENU: 'MAIN_MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
};

export const game = {
  state: State.LOADING,
  tickRate: 10,
  tickAccumulator: 0,
  tickInterval: 1 / 10,
};

const updateCallbacks = [];
const drawCallbacks = [];

export function onTick(name, fn) {
  updateCallbacks.push({ name, fn });
}

export function onDraw(name, fn) {
  drawCallbacks.push({ name, fn });
}

let lastTime = 0;
let running = false;

export function startEngine() {
  game.state = State.PLAYING;
  running = true;
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function loop(now) {
  if (!running) return;

  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  game.tickAccumulator += dt;
  while (game.tickAccumulator >= game.tickInterval) {
    game.tickAccumulator -= game.tickInterval;
    for (const cb of updateCallbacks) {
      cb.fn(game.tickInterval);
    }
  }

  for (const cb of drawCallbacks) {
    cb.fn(dt);
  }

  requestAnimationFrame(loop);
}
