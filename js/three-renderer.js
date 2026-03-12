// Game/public/dune/js/three-renderer.js — Scene, lights, post-processing, terrain, render loop
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';

import { TILE_SIZE, Terrain } from './constants.js';
import { getTile, getMapWidth, getMapHeight } from './map.js';
import { initCamera, setRendererDom, handleResize as cameraResize, updateCameraUniforms } from './three-camera.js';

let renderer = null;
let scene = null;
let composer = null;
let sunLight = null;
let fxaaPass = null;

// Terrain group for easy clearing
let terrainGroup = null;

// Sub-renderer sync callbacks
const syncCallbacks = new Map();

// --- Terrain config per type ---
const TERRAIN_CONFIG = {
  [Terrain.MEADOW]:    { color: 0x4a9c3f, height: 0.4, roughness: 0.85, metalness: 0, flatShading: false },
  [Terrain.FOREST]:    { color: 0x2d6b1e, height: 0.4, roughness: 0.85, metalness: 0, flatShading: false },
  [Terrain.MOUNTAIN]:  { color: 0x7a7a7a, height: 2.5, roughness: 0.95, metalness: 0, flatShading: true },
  [Terrain.SNOW]:      { color: 0xe8e8f4, height: 1.0, roughness: 0.3,  metalness: 0.1, flatShading: false },
  [Terrain.PASTURE]:   { color: 0x6abf4b, height: 0.4, roughness: 0.85, metalness: 0, flatShading: false },
  [Terrain.RIVER]:     { color: 0x3366cc, height: -0.3, roughness: 0.1, metalness: 0.2, flatShading: false },
  [Terrain.BRIDGE]:    { color: 0x8b7355, height: 0.2, roughness: 0.9,  metalness: 0, flatShading: false },
  [Terrain.CONCRETE]:  { color: 0x999999, height: 0.4, roughness: 0.8,  metalness: 0.05, flatShading: false },
  [Terrain.BARE]:      { color: 0xa08860, height: 0.4, roughness: 0.9,  metalness: 0, flatShading: false },
};

// Material cache (keyed by terrain type)
const materialCache = new Map();

function getTerrainMaterial(terrainType) {
  if (materialCache.has(terrainType)) return materialCache.get(terrainType);

  const cfg = TERRAIN_CONFIG[terrainType];
  if (!cfg) {
    // Fallback magenta material for unknown terrain
    const mat = new THREE.MeshStandardMaterial({ color: 0xff00ff });
    materialCache.set(terrainType, mat);
    return mat;
  }

  const mat = new THREE.MeshStandardMaterial({
    color: cfg.color,
    roughness: cfg.roughness,
    metalness: cfg.metalness,
    flatShading: cfg.flatShading,
  });
  materialCache.set(terrainType, mat);
  return mat;
}

// Geometry cache (keyed by height value)
const geometryCache = new Map();

function getTerrainGeometry(height) {
  const key = height.toFixed(2);
  if (geometryCache.has(key)) return geometryCache.get(key);
  const geom = new THREE.BoxGeometry(TILE_SIZE, Math.abs(height), TILE_SIZE);
  geometryCache.set(key, geom);
  return geom;
}

// --- Sky dome ---
function createSky() {
  const skyGeo = new THREE.SphereGeometry(400, 32, 16);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x87ceeb) },
      bottomColor: { value: new THREE.Color(0xffffff) },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y;
        float t = clamp(h * 0.5 + 0.5, 0.0, 1.0);
        gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0);
      }
    `,
  });
  return new THREE.Mesh(skyGeo, skyMat);
}

// --- Public API ---

export function initThreeRenderer() {
  // Create renderer
  renderer = new THREE.WebGLRenderer({
    antialias: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  // Insert canvas before #ui-overlay
  const overlay = document.getElementById('ui-overlay');
  if (overlay && overlay.parentNode) {
    overlay.parentNode.insertBefore(renderer.domElement, overlay);
  } else {
    document.body.appendChild(renderer.domElement);
  }

  // Create scene
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x87ceeb, 0.008);

  // Sky
  scene.add(createSky());

  // Lighting
  const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x4a8c3f, 0.6);
  scene.add(hemiLight);

  const ambientLight = new THREE.AmbientLight(0x8ec5f0, 0.4);
  scene.add(ambientLight);

  sunLight = new THREE.DirectionalLight(0xfff4e0, 2.0);
  sunLight.position.set(50, 80, 50);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.radius = 3;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 300;
  const shadowRange = 60;
  sunLight.shadow.camera.left = -shadowRange;
  sunLight.shadow.camera.right = shadowRange;
  sunLight.shadow.camera.top = shadowRange;
  sunLight.shadow.camera.bottom = -shadowRange;
  scene.add(sunLight);
  scene.add(sunLight.target);

  // Terrain container
  terrainGroup = new THREE.Group();
  terrainGroup.name = 'terrain';
  scene.add(terrainGroup);

  // Camera
  const camera = initCamera(0, 0);
  setRendererDom(renderer.domElement);

  // Post-processing
  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.3,   // strength
    0.4,   // radius
    0.85   // threshold
  );
  composer.addPass(bloomPass);

  fxaaPass = new ShaderPass(FXAAShader);
  const pixelRatio = renderer.getPixelRatio();
  fxaaPass.material.uniforms['resolution'].value.set(
    1 / (window.innerWidth * pixelRatio),
    1 / (window.innerHeight * pixelRatio)
  );
  composer.addPass(fxaaPass);

  // Resize handler
  window.addEventListener('resize', _onResize);

  // WebGL context loss/restore
  renderer.domElement.addEventListener('webglcontextlost', _onContextLost);
  renderer.domElement.addEventListener('webglcontextrestored', _onContextRestored);
}

/**
 * Build terrain tiles from current map data.
 * Call after map generation.
 */
export function rebuildScene() {
  if (!terrainGroup) return;

  // Clear existing terrain
  while (terrainGroup.children.length > 0) {
    const child = terrainGroup.children[0];
    terrainGroup.remove(child);
    // Don't dispose shared geometries/materials
  }

  const mapW = getMapWidth();
  const mapH = getMapHeight();

  for (let y = 0; y < mapH; y++) {
    for (let x = 0; x < mapW; x++) {
      const terrainType = getTile(x, y);
      const cfg = TERRAIN_CONFIG[terrainType];
      if (!cfg) continue;

      const h = cfg.height;
      const geom = getTerrainGeometry(h);
      const mat = getTerrainMaterial(terrainType);
      const mesh = new THREE.Mesh(geom, mat);

      // Position: center of tile in XZ, half-height in Y
      // For positive heights, top at y=h, bottom at y=0 → center at h/2
      // For negative (river), top at y=0, bottom at y=h → center at h/2 (negative)
      mesh.position.set(
        (x + 0.5) * TILE_SIZE,
        h / 2,
        (y + 0.5) * TILE_SIZE
      );

      mesh.receiveShadow = true;
      if (terrainType === Terrain.MOUNTAIN) {
        mesh.castShadow = true;
      }

      terrainGroup.add(mesh);
    }
  }
}

/**
 * Main draw function — sync all sub-renderers, then composite render.
 */
export function draw(dt) {
  // Sync sub-renderers
  for (const [, fn] of syncCallbacks) {
    fn(dt);
  }

  // Update shadow camera to follow view
  updateCameraUniforms(sunLight);

  // Render via post-processing composer
  if (composer) {
    composer.render();
  }
}

/**
 * Register a sub-renderer sync callback.
 */
export function registerSync(name, fn) {
  syncCallbacks.set(name, fn);
}

/**
 * Get the Three.js scene for adding meshes.
 */
export function getScene() {
  return scene;
}

/**
 * Get the renderer canvas element.
 */
export function getThreeCanvas() {
  return renderer ? renderer.domElement : null;
}

/**
 * Get the directional sun light.
 */
export function getSunLight() {
  return sunLight;
}

/**
 * Dispose all Three.js resources.
 */
export function disposeThreeRenderer() {
  window.removeEventListener('resize', _onResize);
  if (renderer) {
    renderer.domElement.removeEventListener('webglcontextlost', _onContextLost);
    renderer.domElement.removeEventListener('webglcontextrestored', _onContextRestored);
    renderer.dispose();
  }
  if (composer) {
    composer.dispose();
  }
  // Dispose cached materials and geometries
  for (const mat of materialCache.values()) mat.dispose();
  materialCache.clear();
  for (const geom of geometryCache.values()) geom.dispose();
  geometryCache.clear();
}

// --- Internal handlers ---

function _onResize() {
  if (!renderer || !composer) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  composer.setSize(w, h);

  const pixelRatio = renderer.getPixelRatio();
  if (fxaaPass) {
    fxaaPass.material.uniforms['resolution'].value.set(
      1 / (w * pixelRatio),
      1 / (h * pixelRatio)
    );
  }

  cameraResize();
}

function _onContextLost(event) {
  event.preventDefault();
  console.warn('[three-renderer] WebGL context lost');
}

function _onContextRestored() {
  console.log('[three-renderer] WebGL context restored');
  // Re-initialize if needed
}
