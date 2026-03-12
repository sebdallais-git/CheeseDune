// Game/public/dune/js/particles.js
import { TOP_BAR_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from './constants.js';
import { worldToScreen, getZoom } from './camera.js';

let particles = [];

/**
 * Spawn a death explosion burst at world position.
 * @param {number} worldX
 * @param {number} worldY
 * @param {string} color - base color of explosion
 * @param {number} count - number of particles
 */
export function spawnDeathEffect(worldX, worldY, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 30 + Math.random() * 60;
    const lifetime = 0.5 + Math.random() * 0.3;
    particles.push({
      x: worldX,
      y: worldY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: lifetime,
      maxLife: lifetime,
      color,
      size: 2 + Math.random() * 3,
    });
  }
}

/**
 * Update all particles.
 */
export function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.95; // friction
    p.vy *= 0.95;
    p.life -= dt;

    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

/**
 * Draw all particles.
 */
export function drawParticles(ctx) {
  const z = getZoom();

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, TOP_BAR_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
  ctx.clip();

  for (const p of particles) {
    const s = worldToScreen(p.x, p.y);
    const sx = s.x;
    const sy = s.y;
    const alpha = Math.max(0, p.life / p.maxLife);
    const size = p.size * z * alpha;

    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.fillRect(sx - size / 2, sy - size / 2, size, size);
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

export function getParticles() {
  return particles;
}

export function clearParticles() {
  particles = [];
}
