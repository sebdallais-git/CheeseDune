// Game/public/dune/js/three-projectiles.js — 3D projectile rendering
import * as THREE from 'three';
import { getProjectiles } from './projectiles.js';

// Scene reference
let sceneRef = null;

// Map<projectile, { group, trail }> for active visual representations
const projectileMeshes = new Map();

// --- Shared geometries ---
const projectileGeo = new THREE.SphereGeometry(1, 6, 6);
const trailGeo = new THREE.SphereGeometry(0.5, 4, 4);

// --- Material cache (keyed by color string) ---
const materialCache = new Map();

function getProjectileMaterial(colorStr) {
  if (materialCache.has(colorStr)) return materialCache.get(colorStr);
  const color = new THREE.Color(colorStr);
  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 2.0,
    roughness: 0.3,
    metalness: 0.1,
  });
  materialCache.set(colorStr, mat);
  return mat;
}

function getTrailMaterial(colorStr) {
  const key = colorStr + '_trail';
  if (materialCache.has(key)) return materialCache.get(key);
  const color = new THREE.Color(colorStr);
  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0.6,
    roughness: 0.5,
    metalness: 0,
    depthWrite: false,
  });
  materialCache.set(key, mat);
  return mat;
}

// --- Point light pool (max 4 lights) ---
const MAX_LIGHTS = 4;
const lightPool = [];
const lightAssignments = new Map(); // projectile -> light index

function initLightPool() {
  for (let i = 0; i < MAX_LIGHTS; i++) {
    const light = new THREE.PointLight(0xffffff, 1.5, 30);
    light.visible = false;
    sceneRef.add(light);
    lightPool.push({ light, inUse: false });
  }
}

function acquireLight(projectile, colorStr) {
  // Already assigned
  if (lightAssignments.has(projectile)) return;

  for (let i = 0; i < lightPool.length; i++) {
    if (!lightPool[i].inUse) {
      lightPool[i].inUse = true;
      lightPool[i].light.color.set(colorStr);
      lightPool[i].light.visible = true;
      lightAssignments.set(projectile, i);
      return;
    }
  }
  // No free light available
}

function releaseLight(projectile) {
  const idx = lightAssignments.get(projectile);
  if (idx !== undefined) {
    lightPool[idx].inUse = false;
    lightPool[idx].light.visible = false;
    lightAssignments.delete(projectile);
  }
}

function updateLightPosition(projectile, x, y, z) {
  const idx = lightAssignments.get(projectile);
  if (idx !== undefined) {
    lightPool[idx].light.position.set(x, y, z);
  }
}

// --- Trail management ---
const TRAIL_COUNT = 4;

function createTrail(colorStr) {
  const trailMat = getTrailMaterial(colorStr);
  const spheres = [];
  for (let i = 0; i < TRAIL_COUNT; i++) {
    // Clone material for individual opacity control
    const mat = trailMat.clone();
    mat.opacity = 0.6 * (1 - i / TRAIL_COUNT);
    const mesh = new THREE.Mesh(trailGeo, mat);
    mesh.scale.setScalar(1 - i * 0.15);
    mesh.visible = false;
    sceneRef.add(mesh);
    spheres.push({ mesh, mat, x: 0, y: 0, z: 0 });
  }
  return spheres;
}

function updateTrail(trail, headX, headY, headZ) {
  // Shift trail positions: last takes previous position, etc.
  for (let i = trail.length - 1; i > 0; i--) {
    trail[i].x = trail[i - 1].x;
    trail[i].y = trail[i - 1].y;
    trail[i].z = trail[i - 1].z;
  }
  // First trail sphere follows the projectile head
  trail[0].x = headX;
  trail[0].y = headY;
  trail[0].z = headZ;

  // Position meshes
  for (let i = 0; i < trail.length; i++) {
    const t = trail[i];
    t.mesh.position.set(t.x, t.y, t.z);
    // Only show if position has been set (non-zero after first frame)
    t.mesh.visible = (t.x !== 0 || t.y !== 0 || t.z !== 0);
  }
}

function removeTrail(trail) {
  for (const t of trail) {
    sceneRef.remove(t.mesh);
    t.mat.dispose();
  }
}

// --- Public API ---

export function init(scene) {
  sceneRef = scene;
  initLightPool();
}

export function sync(dt) {
  if (!sceneRef) return;

  const projectiles = getProjectiles();
  const activeSet = new Set();

  for (const p of projectiles) {
    if (!p.alive) continue;
    activeSet.add(p);

    // Convert world position to Three.js coordinates
    const threeX = p.x;
    const threeY = 3; // projectile flight height above ground
    const threeZ = p.y;

    if (!projectileMeshes.has(p)) {
      // Create new visual representation
      const mat = getProjectileMaterial(p.color);
      const mesh = new THREE.Mesh(projectileGeo, mat);
      mesh.position.set(threeX, threeY, threeZ);
      sceneRef.add(mesh);

      const trail = createTrail(p.color);

      projectileMeshes.set(p, { mesh, trail });

      // Try to acquire a point light for this projectile
      acquireLight(p, p.color);
    }

    const entry = projectileMeshes.get(p);
    entry.mesh.position.set(threeX, threeY, threeZ);

    // Update trail
    updateTrail(entry.trail, threeX, threeY, threeZ);

    // Update point light position if assigned
    updateLightPosition(p, threeX, threeY + 1, threeZ);
  }

  // Remove meshes for dead/missing projectiles
  const toRemove = [];
  for (const [p] of projectileMeshes) {
    if (!activeSet.has(p)) {
      toRemove.push(p);
    }
  }
  for (const p of toRemove) {
    const entry = projectileMeshes.get(p);
    sceneRef.remove(entry.mesh);
    removeTrail(entry.trail);
    releaseLight(p);
    projectileMeshes.delete(p);
  }
}
