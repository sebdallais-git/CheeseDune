// Game/public/dune/js/three-fog.js — Fog of war 3D overlay
import * as THREE from 'three';
import { TILE_SIZE, FogState } from './constants.js';
import { getFogState } from './fog.js';
import { getMapWidth, getMapHeight } from './map.js';
import { getScene } from './three-renderer.js';

// Shared materials (created once)
const fogHiddenMat = new THREE.MeshBasicMaterial({
  color: 0x000000,
  transparent: true,
  opacity: 1.0,
  depthWrite: false,
});

const fogRevealedMat = new THREE.MeshBasicMaterial({
  color: 0x000000,
  transparent: true,
  opacity: 0.5,
  depthWrite: false,
});

// Fog grid state
let fogGroup = null;
let fogMeshes = null; // flat array [y * mapW + x]
let lastMapW = 0;
let lastMapH = 0;

/**
 * Build the fog tile grid. One flat PlaneGeometry per map tile,
 * positioned just above terrain.
 */
function buildFogGrid() {
  const scene = getScene();
  if (!scene) return;

  const mapW = getMapWidth();
  const mapH = getMapHeight();
  if (mapW === 0 || mapH === 0) return;

  // Remove old group if rebuilding
  if (fogGroup) {
    scene.remove(fogGroup);
    // Dispose old meshes (geometries are shared so just remove refs)
    fogGroup = null;
    fogMeshes = null;
  }

  fogGroup = new THREE.Group();
  fogGroup.name = 'fogOfWar';
  fogGroup.renderOrder = 10;

  const planeGeom = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
  fogMeshes = new Array(mapW * mapH);

  for (let y = 0; y < mapH; y++) {
    for (let x = 0; x < mapW; x++) {
      const mesh = new THREE.Mesh(planeGeom, fogHiddenMat);
      // Position at center of tile, just above terrain
      mesh.position.set(
        (x + 0.5) * TILE_SIZE,
        5,
        (y + 0.5) * TILE_SIZE
      );
      // Rotate flat (face upward)
      mesh.rotation.x = -Math.PI / 2;
      fogGroup.add(mesh);
      fogMeshes[y * mapW + x] = mesh;
    }
  }

  scene.add(fogGroup);
  lastMapW = mapW;
  lastMapH = mapH;
}

/**
 * init — no-op; grid is built lazily in sync.
 */
export function init(/* scene */) {
  // Grid built lazily in sync()
}

/**
 * sync — update fog tile visibility each frame.
 */
export function sync(/* dt */) {
  const mapW = getMapWidth();
  const mapH = getMapHeight();

  // Build grid lazily, or rebuild if map size changed
  if (!fogMeshes || mapW !== lastMapW || mapH !== lastMapH) {
    if (mapW > 0 && mapH > 0) {
      buildFogGrid();
    }
    if (!fogMeshes) return;
  }

  // Update each fog tile based on fog state
  for (let y = 0; y < mapH; y++) {
    for (let x = 0; x < mapW; x++) {
      const mesh = fogMeshes[y * mapW + x];
      const state = getFogState(x, y);

      if (state === FogState.VISIBLE) {
        mesh.visible = false;
      } else if (state === FogState.REVEALED) {
        mesh.visible = true;
        mesh.material = fogRevealedMat;
      } else {
        // HIDDEN
        mesh.visible = true;
        mesh.material = fogHiddenMat;
      }
    }
  }
}
