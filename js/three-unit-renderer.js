// Game/public/dune/js/three-unit-renderer.js — 3D unit meshes
import * as THREE from 'three';
import { getUnits } from './units.js';
import { isSelected } from './selection.js';
import { TILE_SIZE, FogState, UnitType, SuperUnitType } from './constants.js';
import { getFogState } from './fog.js';
import { getOwnerFaction } from './game-states.js';
import { Factions } from './factions.js';

// Scene reference
let sceneRef = null;

// Active unit meshes: Map<unitId, { group, type, factionId, hasDrunkOverlay }>
const unitMeshes = new Map();

// --- Cached geometries (shared across all units) ---
const geoCache = {};

function geo(key, factory) {
  if (!geoCache[key]) geoCache[key] = factory();
  return geoCache[key];
}

// Infantry geometries
function bodyGeo()    { return geo('body',    () => new THREE.CapsuleGeometry(1.5, 3, 4, 8)); }
function headGeo()    { return geo('head',    () => new THREE.SphereGeometry(1.2, 6, 6)); }
function shadowGeoInf() { return geo('shadowInf', () => new THREE.CircleGeometry(2, 8)); }

// Infantry weapon geometries
function rifleGeo()   { return geo('rifle',   () => new THREE.CylinderGeometry(0.2, 0.2, 4, 6)); }
function heavyWepGeo(){ return geo('heavyWep',() => new THREE.CylinderGeometry(0.4, 0.4, 3.5, 6)); }
function rocketTubeGeo(){ return geo('rocketTube', () => new THREE.CylinderGeometry(0.5, 0.3, 4, 6)); }
function warheadGeo() { return geo('warhead', () => new THREE.ConeGeometry(0.5, 1, 6)); }

// Vehicle geometries (keyed by hull size)
function hullGeo(w, d)  { return geo(`hull_${w}_${d}`, () => new THREE.BoxGeometry(w, 3, d)); }
function trackGeo(d)    { return geo(`track_${d}`,      () => new THREE.BoxGeometry(1, 2, d + 1)); }
function turretBaseGeo(){ return geo('turretBase',       () => new THREE.CylinderGeometry(2.5, 2.5, 2, 8)); }
function barrelGeo()    { return geo('barrel',           () => new THREE.CylinderGeometry(0.4, 0.4, 5, 6)); }
function scoopGeo()     { return geo('scoop',            () => new THREE.BoxGeometry(8, 2, 2)); }
function rocketRackGeo(){ return geo('rocketRack',       () => new THREE.CylinderGeometry(0.5, 0.5, 5, 6)); }
function shadowGeoVeh() { return geo('shadowVeh',        () => new THREE.CircleGeometry(5, 8)); }

// Selection ring
function selectionRingGeo() { return geo('selRing', () => new THREE.TorusGeometry(3, 0.3, 4, 16)); }

// Drunk overlay
function drunkSphereGeo()   { return geo('drunkSphere', () => new THREE.SphereGeometry(4, 6, 6)); }

// --- Cached materials ---
// Key: `${factionId}_${part}` for faction-specific, or shared name for globals
const matCache = {};

function mat(key, factory) {
  if (!matCache[key]) matCache[key] = factory();
  return matCache[key];
}

function factionBodyMat(factionId, primary) {
  return mat(`${factionId}_body`, () => new THREE.MeshStandardMaterial({
    color: new THREE.Color(primary),
    roughness: 0.7,
    metalness: 0.1,
  }));
}

function factionHeadMat(factionId, primary) {
  // Slightly lighter version of primary
  return mat(`${factionId}_head`, () => {
    const c = new THREE.Color(primary);
    c.offsetHSL(0, -0.05, 0.15);
    return new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, metalness: 0.1 });
  });
}

function factionHullMat(factionId, primary) {
  return mat(`${factionId}_hull`, () => new THREE.MeshStandardMaterial({
    color: new THREE.Color(primary),
    roughness: 0.4,
    metalness: 0.6,
  }));
}

function trackMat() {
  return mat('track', () => new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.95,
    metalness: 0.3,
  }));
}

function barrelMat() {
  return mat('barrel', () => new THREE.MeshStandardMaterial({
    color: 0x555555,
    roughness: 0.3,
    metalness: 0.7,
  }));
}

function shadowMat() {
  return mat('shadow', () => new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
  }));
}

function selectionMat() {
  return mat('selection', () => new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  }));
}

function drunkMat() {
  return mat('drunk', () => new THREE.MeshBasicMaterial({
    color: 0x9900cc,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
  }));
}

function factionWeaponMat(factionId, secondary) {
  return mat(`${factionId}_weapon`, () => new THREE.MeshStandardMaterial({
    color: new THREE.Color(secondary),
    roughness: 0.5,
    metalness: 0.4,
  }));
}

function factionTurretMat(factionId, primary) {
  // Slightly different shade for turret base
  return mat(`${factionId}_turret`, () => {
    const c = new THREE.Color(primary);
    c.offsetHSL(0, 0, -0.1);
    return new THREE.MeshStandardMaterial({ color: c, roughness: 0.4, metalness: 0.6 });
  });
}

// --- Vehicle hull sizes ---
const VEHICLE_SIZES = {
  [UnitType.HARVESTER]:           { w: 10, d: 12 },
  [UnitType.LIGHT_VEHICLE]:       { w: 6,  d: 8  },
  [UnitType.MEDIUM_VEHICLE]:      { w: 7,  d: 9  },
  [UnitType.TANK]:                { w: 8,  d: 10 },
  [UnitType.SIEGE_TANK]:          { w: 9,  d: 11 },
  [UnitType.ROCKET_LAUNCHER]:     { w: 8,  d: 10 },
  [UnitType.MCV]:                 { w: 12, d: 14 },
  [SuperUnitType.CHEESE_CANNON]:  { w: 10, d: 12 },
  [SuperUnitType.WINE_CATAPULT]:  { w: 10, d: 12 },
  [SuperUnitType.BRATWURST_BLITZ]:{ w: 10, d: 12 },
};

// Types that get a turret
const TURRET_TYPES = new Set([
  UnitType.TANK, UnitType.SIEGE_TANK,
  SuperUnitType.CHEESE_CANNON, SuperUnitType.BRATWURST_BLITZ,
]);

// Infantry types
const INFANTRY_TYPES = new Set([
  UnitType.LIGHT_INFANTRY, UnitType.HEAVY_INFANTRY, UnitType.ROCKET_INFANTRY,
]);

// --- Mesh creation ---

function getFactionColors(unit) {
  const factionId = getOwnerFaction(unit.owner);
  const faction = Factions[factionId];
  if (!faction) return { factionId: 'swiss', primary: '#cc0000', secondary: '#ffffff', accent: '#ff3333' };
  return { factionId, ...faction.colors };
}

function createInfantryMesh(unit) {
  const { factionId, primary, secondary } = getFactionColors(unit);
  const group = new THREE.Group();
  group.name = `unit_${unit.id}`;

  // Body (capsule)
  const body = new THREE.Mesh(bodyGeo(), factionBodyMat(factionId, primary));
  body.position.y = 0; // center of capsule at y=0 relative to group; group offset handles height
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Head
  const head = new THREE.Mesh(headGeo(), factionHeadMat(factionId, primary));
  head.position.y = 4;
  head.castShadow = true;
  group.add(head);

  // Weapon
  let weapon;
  if (unit.type === UnitType.LIGHT_INFANTRY) {
    weapon = new THREE.Mesh(rifleGeo(), factionWeaponMat(factionId, secondary));
    weapon.position.set(2, 0.5, 0);
    weapon.rotation.z = Math.PI / 6; // slight tilt
  } else if (unit.type === UnitType.HEAVY_INFANTRY) {
    weapon = new THREE.Mesh(heavyWepGeo(), factionWeaponMat(factionId, secondary));
    weapon.position.set(2.2, 0.3, 0);
    weapon.rotation.z = Math.PI / 8;
  } else if (unit.type === UnitType.ROCKET_INFANTRY) {
    const wepGroup = new THREE.Group();
    const tube = new THREE.Mesh(rocketTubeGeo(), factionWeaponMat(factionId, secondary));
    tube.rotation.z = Math.PI / 5; // angled
    wepGroup.add(tube);
    // Warhead tip
    const tip = new THREE.Mesh(warheadGeo(), barrelMat());
    tip.position.y = 2.5;
    tip.rotation.z = Math.PI / 5;
    wepGroup.add(tip);
    wepGroup.position.set(2.5, 1, 0);
    weapon = wepGroup;
  }
  if (weapon) {
    group.add(weapon);
  }

  // Shadow on ground
  const shadow = new THREE.Mesh(shadowGeoInf(), shadowMat());
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -2.8; // on ground relative to group position (group at y=3)
  group.add(shadow);

  // Selection ring (initially hidden)
  const ring = new THREE.Mesh(selectionRingGeo(), selectionMat());
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -2.6;
  ring.visible = false;
  ring.name = 'selectionRing';
  group.add(ring);

  // Drunk overlay (initially hidden)
  const drunkOverlay = new THREE.Mesh(drunkSphereGeo(), drunkMat());
  drunkOverlay.visible = false;
  drunkOverlay.name = 'drunkOverlay';
  group.add(drunkOverlay);

  return { group, factionId };
}

function createVehicleMesh(unit) {
  const { factionId, primary, secondary } = getFactionColors(unit);
  const group = new THREE.Group();
  group.name = `unit_${unit.id}`;

  const size = VEHICLE_SIZES[unit.type] || { w: 8, d: 10 };
  const { w, d } = size;

  // Hull
  const hull = new THREE.Mesh(hullGeo(w, d), factionHullMat(factionId, primary));
  hull.position.y = 0; // group offset handles height
  hull.castShadow = true;
  hull.receiveShadow = true;
  group.add(hull);

  // Tracks (left and right)
  const tMat = trackMat();
  const leftTrack = new THREE.Mesh(trackGeo(d), tMat);
  leftTrack.position.set(-(w / 2 + 0.5), -0.5, 0);
  leftTrack.castShadow = true;
  group.add(leftTrack);

  const rightTrack = new THREE.Mesh(trackGeo(d), tMat);
  rightTrack.position.set(w / 2 + 0.5, -0.5, 0);
  rightTrack.castShadow = true;
  group.add(rightTrack);

  // Turret (for tanks, siege tanks, and some super units)
  if (TURRET_TYPES.has(unit.type)) {
    const turretGroup = new THREE.Group();
    turretGroup.name = 'turret';

    const tBase = new THREE.Mesh(turretBaseGeo(), factionTurretMat(factionId, primary));
    tBase.position.y = 1;
    tBase.castShadow = true;
    turretGroup.add(tBase);

    const brl = new THREE.Mesh(barrelGeo(), barrelMat());
    brl.position.set(0, 1.5, -3.5);
    brl.rotation.x = Math.PI / 2; // horizontal
    brl.castShadow = true;
    turretGroup.add(brl);

    turretGroup.position.y = 1.5;
    group.add(turretGroup);
  }

  // Harvester scoop
  if (unit.type === UnitType.HARVESTER) {
    const scoop = new THREE.Mesh(scoopGeo(), barrelMat());
    scoop.position.set(0, -0.5, -(d / 2 + 1));
    scoop.castShadow = true;
    group.add(scoop);
  }

  // Rocket launcher triple tube rack
  if (unit.type === UnitType.ROCKET_LAUNCHER || unit.type === SuperUnitType.WINE_CATAPULT) {
    const rMat = barrelMat();
    const offsets = [[-1.5, 0], [0, 0], [1.5, 0]];
    for (const [ox] of offsets) {
      const tube = new THREE.Mesh(rocketRackGeo(), rMat);
      tube.position.set(ox, 2.5, -1);
      tube.rotation.x = Math.PI / 3; // angled upward
      tube.castShadow = true;
      group.add(tube);
    }
  }

  // Shadow on ground
  const shadow = new THREE.Mesh(shadowGeoVeh(), shadowMat());
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -2.3; // on ground relative to group (group at y=2.5)
  group.add(shadow);

  // Selection ring (initially hidden)
  const ring = new THREE.Mesh(selectionRingGeo(), selectionMat());
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -2.3;
  ring.visible = false;
  ring.name = 'selectionRing';
  group.add(ring);

  // Drunk overlay (initially hidden)
  const drunkOverlay = new THREE.Mesh(drunkSphereGeo(), drunkMat());
  drunkOverlay.visible = false;
  drunkOverlay.name = 'drunkOverlay';
  group.add(drunkOverlay);

  return { group, factionId };
}

function createUnitMesh(unit) {
  if (INFANTRY_TYPES.has(unit.type)) {
    return createInfantryMesh(unit);
  }
  return createVehicleMesh(unit);
}

// --- Height offsets ---
function getHeightOffset(unitType) {
  if (INFANTRY_TYPES.has(unitType)) return 3;
  return 2.5;
}

// --- Public API ---

export function init(scene) {
  sceneRef = scene;
}

export function sync(dt) {
  if (!sceneRef) return;

  const units = getUnits();

  // Track alive unit IDs
  const aliveIds = new Set();

  for (const unit of units) {
    if (!unit.alive) continue;
    aliveIds.add(unit.id);

    // Create mesh for new units
    if (!unitMeshes.has(unit.id)) {
      const entry = createUnitMesh(unit);
      sceneRef.add(entry.group);
      unitMeshes.set(unit.id, entry);
    }

    const entry = unitMeshes.get(unit.id);
    const group = entry.group;

    // Update position: unit.x → Three.js X, unit.y → Three.js Z
    const heightOffset = getHeightOffset(unit.type);
    group.position.set(unit.x, heightOffset, unit.y);

    // Update rotation
    group.rotation.y = -unit.facing;

    // Fog visibility: only show in VISIBLE tiles
    const tileX = Math.floor(unit.x / TILE_SIZE);
    const tileY = Math.floor(unit.y / TILE_SIZE);
    const fogState = getFogState(tileX, tileY);
    group.visible = (fogState === FogState.VISIBLE);

    // Selection indicator
    const ring = group.getObjectByName('selectionRing');
    if (ring) {
      ring.visible = isSelected(unit);
    }

    // Drunk overlay
    const drunkOverlay = group.getObjectByName('drunkOverlay');
    if (drunkOverlay) {
      drunkOverlay.visible = (unit.drunkTimer > 0);
    }
  }

  // Remove meshes for dead/missing units
  const toRemove = [];
  for (const [id] of unitMeshes) {
    if (!aliveIds.has(id)) {
      toRemove.push(id);
    }
  }
  for (const id of toRemove) {
    const entry = unitMeshes.get(id);
    sceneRef.remove(entry.group);
    unitMeshes.delete(id);
  }
}
