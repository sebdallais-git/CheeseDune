// Game/public/dune/js/three-camera.js — Orthographic isometric camera for Three.js
import * as THREE from 'three';
import { TILE_SIZE } from './constants.js';
import { getMapWidth, getMapHeight } from './map.js';

const DEFAULT_FRUSTUM = 20; // half-size in world units
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;

let camera = null;
let raycaster = null;
let groundPlane = null;
let rendererDom = null;
let resizeListenerAdded = false;

// Camera state
let frustumHalf = DEFAULT_FRUSTUM;
let zoomLevel = 1.0;
let camTargetX = 0;
let camTargetZ = 0;

export function initCamera(mapWidth, mapHeight) {
  // Reuse existing camera to preserve RenderPass reference
  if (!camera) {
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.OrthographicCamera(
      -frustumHalf * aspect, frustumHalf * aspect,
      frustumHalf, -frustumHalf,
      0.1, 500
    );
  }

  // Reset zoom and position state
  zoomLevel = 1.0;
  frustumHalf = DEFAULT_FRUSTUM;

  // Classic isometric direction: (1, 1, 1) normalized
  const dir = new THREE.Vector3(1, 1, 1).normalize();
  const dist = 100;
  camera.position.set(dir.x * dist, dir.y * dist, dir.z * dist);
  camera.lookAt(0, 0, 0);

  // Center on map if dimensions provided
  if (mapWidth > 0 && mapHeight > 0) {
    camTargetX = (mapWidth * TILE_SIZE) / 2;
    camTargetZ = (mapHeight * TILE_SIZE) / 2;
    _applyPosition();
  }

  if (!raycaster) {
    raycaster = new THREE.Raycaster();
    groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  }

  _updateProjection();

  // Only add resize listener once
  if (!resizeListenerAdded) {
    window.addEventListener('resize', handleResize);
    resizeListenerAdded = true;
  }

  return camera;
}

export function getCamera() {
  return camera;
}

export function setRendererDom(dom) {
  rendererDom = dom;
}

/**
 * Convert screen (client) coordinates to a world point on the y=0 ground plane.
 * Returns { x, y, z } in Three.js world space.
 */
export function screenToWorld(clientX, clientY) {
  if (!camera || !rendererDom) return { x: 0, y: 0, z: 0 };

  const rect = rendererDom.getBoundingClientRect();
  const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
  const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
  const target = new THREE.Vector3();
  const hit = raycaster.ray.intersectPlane(groundPlane, target);
  if (!hit) return { x: 0, y: 0, z: 0 };
  return { x: target.x, y: target.y, z: target.z };
}

/**
 * Convert screen (client) coordinates to tile coordinates.
 * Game tiles: world X -> tileX, world Z -> tileY.
 */
export function screenToTile(clientX, clientY) {
  const w = screenToWorld(clientX, clientY);
  return {
    tileX: Math.floor(w.x / TILE_SIZE),
    tileY: Math.floor(w.z / TILE_SIZE),
  };
}

/**
 * Convert world XZ position to screen (client) coordinates.
 */
export function worldToScreen(worldX, worldZ) {
  if (!camera || !rendererDom) return { x: 0, y: 0 };

  const v = new THREE.Vector3(worldX, 0, worldZ);
  v.project(camera);

  const rect = rendererDom.getBoundingClientRect();
  return {
    x: (v.x * 0.5 + 0.5) * rect.width + rect.left,
    y: (-v.y * 0.5 + 0.5) * rect.height + rect.top,
  };
}

/**
 * Pan the camera in world XZ space.
 */
export function moveCamera(dx, dz) {
  camTargetX += dx;
  camTargetZ += dz;
  _applyPosition();
}

/**
 * Set zoom level, zooming toward the cursor point (cx, cy in client coords).
 */
export function setZoom(level, cx, cy) {
  const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, level));
  if (clamped === zoomLevel) return;

  // Get world point under cursor before zoom
  const beforeWorld = screenToWorld(cx, cy);

  zoomLevel = clamped;
  frustumHalf = DEFAULT_FRUSTUM / zoomLevel;
  _updateProjection();

  // Get world point under cursor after zoom
  const afterWorld = screenToWorld(cx, cy);

  // Shift camera so the point under cursor stays put
  camTargetX += beforeWorld.x - afterWorld.x;
  camTargetZ += beforeWorld.z - afterWorld.z;
  _applyPosition();
}

export function getZoom() {
  return zoomLevel;
}

/**
 * Snap camera to center on a tile (game tile coordinates).
 */
export function centerOnTile(tx, ty) {
  camTargetX = (tx + 0.5) * TILE_SIZE;
  camTargetZ = (ty + 0.5) * TILE_SIZE;
  _applyPosition();
}

/**
 * Get the range of visible tiles (for culling).
 */
export function getVisibleTileRange() {
  if (!rendererDom) return { startX: 0, startY: 0, endX: 0, endY: 0 };

  const rect = rendererDom.getBoundingClientRect();
  const corners = [
    screenToWorld(rect.left, rect.top),
    screenToWorld(rect.right, rect.top),
    screenToWorld(rect.left, rect.bottom),
    screenToWorld(rect.right, rect.bottom),
  ];

  let minTX = Infinity, maxTX = -Infinity;
  let minTZ = Infinity, maxTZ = -Infinity;
  for (const c of corners) {
    const tx = c.x / TILE_SIZE;
    const tz = c.z / TILE_SIZE;
    minTX = Math.min(minTX, tx);
    maxTX = Math.max(maxTX, tx);
    minTZ = Math.min(minTZ, tz);
    maxTZ = Math.max(maxTZ, tz);
  }

  const mw = getMapWidth();
  const mh = getMapHeight();
  return {
    startX: Math.max(0, Math.floor(minTX) - 1),
    startY: Math.max(0, Math.floor(minTZ) - 1),
    endX: Math.min(mw - 1, Math.ceil(maxTX) + 1),
    endY: Math.min(mh - 1, Math.ceil(maxTZ) + 1),
  };
}

/**
 * Update frustum on window resize.
 */
export function handleResize() {
  if (!camera) return;
  _updateProjection();
}

/**
 * Move shadow camera to follow the main camera view.
 */
export function updateCameraUniforms(sunLight) {
  if (!sunLight || !sunLight.shadow || !camera) return;
  const shadowCam = sunLight.shadow.camera;
  const range = frustumHalf * 1.5;
  shadowCam.left = -range;
  shadowCam.right = range;
  shadowCam.top = range;
  shadowCam.bottom = -range;
  shadowCam.near = 0.5;
  shadowCam.far = 300;

  // Move sun light and shadow camera to follow the view center
  sunLight.position.set(camTargetX + 50, 80, camTargetZ + 50);
  const lightDir = sunLight.position.clone().normalize();
  shadowCam.position.copy(
    new THREE.Vector3(camTargetX, 0, camTargetZ).add(lightDir.multiplyScalar(100))
  );
  sunLight.target.position.set(camTargetX, 0, camTargetZ);
  sunLight.target.updateMatrixWorld();
  shadowCam.updateProjectionMatrix();
}

// --- Internal helpers ---

function _updateProjection() {
  if (!camera) return;
  const aspect = window.innerWidth / window.innerHeight;
  camera.left = -frustumHalf * aspect;
  camera.right = frustumHalf * aspect;
  camera.top = frustumHalf;
  camera.bottom = -frustumHalf;
  camera.updateProjectionMatrix();
}

function _applyPosition() {
  if (!camera) return;
  const dir = new THREE.Vector3(1, 1, 1).normalize();
  const dist = 100;
  camera.position.set(
    camTargetX + dir.x * dist,
    dir.y * dist,
    camTargetZ + dir.z * dist
  );
  camera.lookAt(camTargetX, 0, camTargetZ);
}
