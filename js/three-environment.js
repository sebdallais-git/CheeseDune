// Game/public/dune/js/three-environment.js — Environmental details: trees, rocks, cheese wheels
import * as THREE from 'three';
import { TILE_SIZE, Terrain } from './constants.js';
import { getTile, getMapWidth, getMapHeight } from './map.js';

// Scene reference
let sceneRef = null;

// Environment group (removed and rebuilt on each buildEnvironment call)
let envGroup = null;

// Animated objects: { mesh, type, phase }
const animatedObjects = [];

// --- Seeded PRNG (mulberry32) ---
function mulberry32(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- Shared geometries (created once in init) ---
let trunkGeom = null;
let foliageGeom1 = null;
let foliageGeom2 = null;
let foliageGeom3 = null;
let snowCapGeom = null;
let rockGeom = null;
let snowPatchGeom = null;
let cheeseGeom = null;

// --- Shared materials (created once in init) ---
let trunkMat = null;
let foliageMat1 = null;
let foliageMat2 = null;
let foliageMat3 = null;
let snowMat = null;
let rockMat = null;
let cheeseMat = null;

function createSharedResources() {
  // Tree geometries
  trunkGeom = new THREE.CylinderGeometry(0.8, 1.2, 6, 6);
  foliageGeom1 = new THREE.ConeGeometry(4, 5, 6);
  foliageGeom2 = new THREE.ConeGeometry(3.2, 4, 6);
  foliageGeom3 = new THREE.ConeGeometry(2.4, 3, 6);
  snowCapGeom = new THREE.ConeGeometry(1.5, 1.5, 6);

  // Mountain geometries
  rockGeom = new THREE.ConeGeometry(5, 8, 5);
  snowPatchGeom = new THREE.CylinderGeometry(3, 4, 0.5, 6);

  // Cheese geometry
  cheeseGeom = new THREE.CylinderGeometry(2, 2, 1.5, 8);

  // Tree materials
  trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3020 });
  foliageMat1 = new THREE.MeshStandardMaterial({ color: 0x1a5c10, flatShading: true });
  foliageMat2 = new THREE.MeshStandardMaterial({ color: 0x2a7a1a, flatShading: true });
  foliageMat3 = new THREE.MeshStandardMaterial({ color: 0x3a8a2a, flatShading: true });
  snowMat = new THREE.MeshStandardMaterial({ color: 0xffffff });

  // Mountain material
  rockMat = new THREE.MeshStandardMaterial({ color: 0x888888, flatShading: true });

  // Cheese material
  cheeseMat = new THREE.MeshStandardMaterial({ color: 0xffdd44 });
}

/**
 * Create a single tree group at the given world position with a scale multiplier.
 */
function createTree(worldX, worldZ, scale, phase) {
  const tree = new THREE.Group();

  // Trunk
  const trunk = new THREE.Mesh(trunkGeom, trunkMat);
  trunk.position.y = 3; // half of trunk height (6/2)
  trunk.castShadow = true;
  tree.add(trunk);

  // Foliage layer 1
  const f1 = new THREE.Mesh(foliageGeom1, foliageMat1);
  f1.position.y = 7;
  f1.castShadow = true;
  tree.add(f1);

  // Foliage layer 2
  const f2 = new THREE.Mesh(foliageGeom2, foliageMat2);
  f2.position.y = 10;
  f2.castShadow = true;
  tree.add(f2);

  // Foliage layer 3
  const f3 = new THREE.Mesh(foliageGeom3, foliageMat3);
  f3.position.y = 12.5;
  f3.castShadow = true;
  tree.add(f3);

  // Snow cap
  const cap = new THREE.Mesh(snowCapGeom, snowMat);
  cap.position.y = 14;
  cap.castShadow = true;
  tree.add(cap);

  tree.position.set(worldX, 0, worldZ);
  tree.scale.setScalar(scale);

  // Track for animation
  animatedObjects.push({ mesh: tree, type: 'tree', phase });

  return tree;
}

/**
 * Create a mountain rock at the given world position.
 */
function createMountainRock(worldX, worldZ, scale, rotY) {
  const group = new THREE.Group();

  // Main rock cone
  const rock = new THREE.Mesh(rockGeom, rockMat);
  // Height varies 2.5 - 4.5, controlled by scale
  rock.position.y = 4;
  rock.castShadow = true;
  group.add(rock);

  // Snow patch on top
  const snow = new THREE.Mesh(snowPatchGeom, snowMat);
  snow.position.y = 8;
  snow.castShadow = true;
  group.add(snow);

  group.position.set(worldX, 0, worldZ);
  group.scale.setScalar(scale);
  group.rotation.y = rotY;

  return group;
}

/**
 * Create a cheese wheel at the given world position.
 */
function createCheeseWheel(worldX, worldZ) {
  const cheese = new THREE.Mesh(cheeseGeom, cheeseMat);
  cheese.position.set(worldX, 1.0, worldZ);
  cheese.rotation.z = 0.3;
  cheese.castShadow = true;
  return cheese;
}

// --- Public API ---

/**
 * init — store scene reference and create shared geometries/materials.
 */
export function init(scene) {
  sceneRef = scene;
  createSharedResources();
}

/**
 * buildEnvironment — iterate map tiles and add trees, rocks, cheese to scene.
 * Removes old environment group if rebuilding.
 */
export function buildEnvironment() {
  if (!sceneRef) return;

  // Clear previous environment
  if (envGroup) {
    sceneRef.remove(envGroup);
    envGroup = null;
  }
  animatedObjects.length = 0;

  // Reset the RNG so results are deterministic across rebuilds
  const rand = mulberry32(42);

  envGroup = new THREE.Group();
  envGroup.name = 'environment';

  const mapW = getMapWidth();
  const mapH = getMapHeight();

  for (let y = 0; y < mapH; y++) {
    for (let x = 0; x < mapW; x++) {
      const tile = getTile(x, y);
      const baseCX = (x + 0.5) * TILE_SIZE;
      const baseCZ = (y + 0.5) * TILE_SIZE;

      if (tile === Terrain.FOREST) {
        // 1-2 trees per forest tile
        const treeCount = rand() < 0.5 ? 1 : 2;
        for (let t = 0; t < treeCount; t++) {
          const offsetX = (rand() - 0.5) * TILE_SIZE * 0.6;
          const offsetZ = (rand() - 0.5) * TILE_SIZE * 0.6;
          const scale = 0.7 + rand() * 0.6; // 0.7 - 1.3
          const phase = rand() * Math.PI * 2;
          const tree = createTree(baseCX + offsetX, baseCZ + offsetZ, scale, phase);
          envGroup.add(tree);
        }
      } else if (tile === Terrain.MOUNTAIN) {
        // Rock on mountain tile
        const offsetX = (rand() - 0.5) * TILE_SIZE * 0.3;
        const offsetZ = (rand() - 0.5) * TILE_SIZE * 0.3;
        const scale = 0.5 + rand() * 0.4; // 0.5 - 0.9 (height varies ~2.5-4.5 effective)
        const rotY = rand() * Math.PI * 2;
        const rock = createMountainRock(baseCX + offsetX, baseCZ + offsetZ, scale, rotY);
        envGroup.add(rock);
      } else if (tile === Terrain.PASTURE) {
        // Cheese wheel (only some pasture tiles get one, ~60% chance)
        if (rand() < 0.6) {
          const offsetX = (rand() - 0.5) * TILE_SIZE * 0.4;
          const offsetZ = (rand() - 0.5) * TILE_SIZE * 0.4;
          const cheese = createCheeseWheel(baseCX + offsetX, baseCZ + offsetZ);
          envGroup.add(cheese);
        } else {
          // Consume random values to keep RNG stream consistent
          rand();
          rand();
        }
      }
    }
  }

  sceneRef.add(envGroup);
}

/**
 * sync — animate tree sway using performance.now().
 */
export function sync(/* dt */) {
  if (animatedObjects.length === 0) return;

  const time = performance.now() * 0.001; // seconds

  for (let i = 0; i < animatedObjects.length; i++) {
    const obj = animatedObjects[i];
    if (obj.type === 'tree') {
      obj.mesh.rotation.z = Math.sin(time + obj.phase) * 0.02;
      obj.mesh.rotation.x = Math.cos(time * 0.7 + obj.phase) * 0.02;
    }
  }
}
