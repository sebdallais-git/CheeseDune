// Game/public/dune/js/three-particles.js — 3D particle effects with object pool
import * as THREE from 'three';
import { getParticles } from './particles.js';

// Scene reference
let sceneRef = null;

// Object pool size
const POOL_SIZE = 200;

// Pool of mesh objects
const pool = [];

// Map<particle, poolIndex> to track which pool mesh is assigned to which particle
const assignments = new Map();

// --- Shared geometries ---
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const sphereGeo = new THREE.SphereGeometry(0.5, 4, 4);

// --- Pool initialization ---
function initPool() {
  for (let i = 0; i < POOL_SIZE; i++) {
    // Alternate between box and sphere debris shapes
    const geo = (i % 2 === 0) ? boxGeo : sphereGeo;
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.7,
      metalness: 0.1,
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.visible = false;
    mesh.castShadow = false;
    mesh.receiveShadow = false;

    // Random initial tumble axes (fixed per pool mesh for consistent rotation)
    const tumbleAxis = new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    ).normalize();
    const tumbleSpeed = 2 + Math.random() * 6; // radians per second

    sceneRef.add(mesh);
    pool.push({ mesh, mat, inUse: false, tumbleAxis, tumbleSpeed });
  }
}

// Acquire a pool mesh, returns pool index or -1 if pool exhausted
function acquirePoolMesh() {
  for (let i = 0; i < pool.length; i++) {
    if (!pool[i].inUse) {
      pool[i].inUse = true;
      pool[i].mesh.visible = true;
      return i;
    }
  }
  return -1; // pool exhausted
}

// Release a pool mesh back
function releasePoolMesh(idx) {
  if (idx < 0 || idx >= pool.length) return;
  pool[idx].inUse = false;
  pool[idx].mesh.visible = false;
}

// --- Public API ---

export function init(scene) {
  sceneRef = scene;
  initPool();
}

export function sync(dt) {
  if (!sceneRef) return;

  const particles = getParticles();
  const activeSet = new Set();

  for (const p of particles) {
    if (p.life <= 0) continue;
    activeSet.add(p);

    // Assign a pool mesh if not already assigned
    if (!assignments.has(p)) {
      const idx = acquirePoolMesh();
      if (idx === -1) continue; // pool exhausted, skip this particle
      assignments.set(p, idx);
    }

    const idx = assignments.get(p);
    const entry = pool[idx];
    const mesh = entry.mesh;
    const mat = entry.mat;

    // Position: particle.x -> Three.js X, particle.y -> Three.js Z
    // Height above ground based on particle size
    const threeX = p.x;
    const threeY = p.size * 0.5 + 0.5; // slightly above ground
    const threeZ = p.y;
    mesh.position.set(threeX, threeY, threeZ);

    // Scale based on particle size, fade with life
    const lifeRatio = Math.max(0, p.life / p.maxLife);
    const scale = p.size * lifeRatio * 0.8;
    mesh.scale.setScalar(Math.max(0.1, scale));

    // Color from particle
    mat.color.set(p.color);
    mat.opacity = lifeRatio;
    mat.needsUpdate = true;

    // Tumble rotation for debris effect
    mesh.rotateOnAxis(entry.tumbleAxis, entry.tumbleSpeed * dt);

    mesh.visible = true;
  }

  // Release pool meshes for dead/missing particles
  const toRelease = [];
  for (const [p, idx] of assignments) {
    if (!activeSet.has(p)) {
      toRelease.push(p);
    }
  }
  for (const p of toRelease) {
    const idx = assignments.get(p);
    releasePoolMesh(idx);
    assignments.delete(p);
  }
}
