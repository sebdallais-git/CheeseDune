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

// Shared vehicle geometries
function shadowGeoVeh() { return geo('shadowVeh', () => new THREE.CircleGeometry(5, 8)); }
function shadowGeoLarge() { return geo('shadowLarge', () => new THREE.CircleGeometry(7, 8)); }

// Selection ring
function selectionRingGeo() { return geo('selRing', () => new THREE.TorusGeometry(3, 0.3, 4, 16)); }
function selectionRingLargeGeo() { return geo('selRingLg', () => new THREE.TorusGeometry(5, 0.35, 4, 16)); }

// Drunk overlay
function drunkSphereGeo()   { return geo('drunkSphere', () => new THREE.SphereGeometry(4, 6, 6)); }
function drunkSphereLargeGeo() { return geo('drunkSphereLg', () => new THREE.SphereGeometry(6, 6, 6)); }

// Parametric geometry helpers (all cached)
function boxGeo(w, h, d) { return geo(`box_${w}_${h}_${d}`, () => new THREE.BoxGeometry(w, h, d)); }
function cylGeo(rt, rb, h, seg) {
  seg = seg || 8;
  return geo(`cyl_${rt}_${rb}_${h}_${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg));
}
function sphereGeo(r, ws, hs) {
  ws = ws || 8; hs = hs || 6;
  return geo(`sph_${r}_${ws}_${hs}`, () => new THREE.SphereGeometry(r, ws, hs));
}
function coneGeo(r, h, seg) {
  seg = seg || 8;
  return geo(`cone_${r}_${h}_${seg}`, () => new THREE.ConeGeometry(r, h, seg));
}
function torusGeo(r, tube, rs, ts) {
  rs = rs || 6; ts = ts || 12;
  return geo(`torus_${r}_${tube}_${rs}_${ts}`, () => new THREE.TorusGeometry(r, tube, rs, ts));
}
function planeGeo(w, h) {
  return geo(`plane_${w}_${h}`, () => new THREE.PlaneGeometry(w, h));
}

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

function factionHullLightMat(factionId, primary) {
  return mat(`${factionId}_hullLight`, () => {
    const c = new THREE.Color(primary);
    c.offsetHSL(0, -0.05, 0.1);
    return new THREE.MeshStandardMaterial({ color: c, roughness: 0.4, metalness: 0.5 });
  });
}

function trackMat() {
  return mat('track', () => new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.95,
    metalness: 0.3,
  }));
}

function wheelMat() {
  return mat('wheel', () => new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.9,
    metalness: 0.2,
  }));
}

function barrelMat() {
  return mat('barrel', () => new THREE.MeshStandardMaterial({
    color: 0x555555,
    roughness: 0.3,
    metalness: 0.7,
  }));
}

function darkMetalMat() {
  return mat('darkMetal', () => new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.3,
    metalness: 0.8,
  }));
}

function frameMat() {
  return mat('frame', () => new THREE.MeshStandardMaterial({
    color: 0x444444,
    roughness: 0.5,
    metalness: 0.6,
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
  return mat(`${factionId}_turret`, () => {
    const c = new THREE.Color(primary);
    c.offsetHSL(0, 0, -0.1);
    return new THREE.MeshStandardMaterial({ color: c, roughness: 0.4, metalness: 0.6 });
  });
}

function factionAccentMat(factionId, accent) {
  return mat(`${factionId}_accent`, () => new THREE.MeshStandardMaterial({
    color: new THREE.Color(accent),
    roughness: 0.5,
    metalness: 0.3,
  }));
}

// Special colors for harvester containers and super units
function cheeseYellowMat() {
  return mat('cheeseYellow', () => new THREE.MeshStandardMaterial({
    color: 0xf0c030,
    roughness: 0.6,
    metalness: 0.2,
  }));
}

function winePurpleMat() {
  return mat('winePurple', () => new THREE.MeshStandardMaterial({
    color: 0x6a1b4d,
    roughness: 0.5,
    metalness: 0.3,
  }));
}

function amberBrownMat() {
  return mat('amberBrown', () => new THREE.MeshStandardMaterial({
    color: 0x8b5e3c,
    roughness: 0.6,
    metalness: 0.2,
  }));
}

function goldenMat() {
  return mat('golden', () => new THREE.MeshStandardMaterial({
    color: 0xffd700,
    roughness: 0.3,
    metalness: 0.7,
  }));
}

function wineRedMat() {
  return mat('wineRed', () => new THREE.MeshStandardMaterial({
    color: 0x8b0000,
    roughness: 0.5,
    metalness: 0.3,
  }));
}

function bratwurstMat() {
  return mat('bratwurst', () => new THREE.MeshStandardMaterial({
    color: 0xb5651d,
    roughness: 0.7,
    metalness: 0.1,
  }));
}

function pipeMat() {
  return mat('pipe', () => new THREE.MeshStandardMaterial({
    color: 0x777777,
    roughness: 0.4,
    metalness: 0.5,
  }));
}

function scaffoldMat() {
  return mat('scaffold', () => new THREE.MeshStandardMaterial({
    color: 0x888844,
    roughness: 0.6,
    metalness: 0.4,
  }));
}

// Faction insignia colors
function swissRedMat() {
  return mat('swissRed', () => new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.5, metalness: 0.2 }));
}
function frenchBlueMat() {
  return mat('frenchBlue', () => new THREE.MeshStandardMaterial({ color: 0x0055a4, roughness: 0.5, metalness: 0.2 }));
}
function frenchWhiteMat() {
  return mat('frenchWhite', () => new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.2 }));
}
function frenchRedMat() {
  return mat('frenchRed', () => new THREE.MeshStandardMaterial({ color: 0xef4135, roughness: 0.5, metalness: 0.2 }));
}
function germanDarkMat() {
  return mat('germanDark', () => new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4, metalness: 0.5 }));
}

// Infantry types
const INFANTRY_TYPES = new Set([
  UnitType.LIGHT_INFANTRY, UnitType.HEAVY_INFANTRY, UnitType.ROCKET_INFANTRY,
]);

// --- Faction insignia helpers ---

// Swiss: small red cross (two crossed thin red boxes)
function addSwissInsignia(group, x, y, z) {
  const hBar = new THREE.Mesh(boxGeo(1.6, 0.5, 0.15), swissRedMat());
  hBar.position.set(x, y, z);
  group.add(hBar);
  const vBar = new THREE.Mesh(boxGeo(0.5, 1.6, 0.15), swissRedMat());
  vBar.position.set(x, y, z);
  group.add(vBar);
}

// French: thin tricolor stripe (3 thin boxes: blue, white, red stacked vertically)
function addFrenchInsignia(group, x, y, z) {
  const stripe = boxGeo(1.2, 0.4, 0.15);
  const blue = new THREE.Mesh(stripe, frenchBlueMat());
  blue.position.set(x, y + 0.5, z);
  group.add(blue);
  const white = new THREE.Mesh(stripe, frenchWhiteMat());
  white.position.set(x, y, z);
  group.add(white);
  const red = new THREE.Mesh(stripe, frenchRedMat());
  red.position.set(x, y - 0.5, z);
  group.add(red);
}

// German: iron cross outline (4 thin boxes forming a cross shape)
function addGermanInsignia(group, x, y, z) {
  const crossMat = germanDarkMat();
  // Horizontal bar
  const hBar = new THREE.Mesh(boxGeo(2.0, 0.3, 0.15), crossMat);
  hBar.position.set(x, y, z);
  group.add(hBar);
  // Vertical bar
  const vBar = new THREE.Mesh(boxGeo(0.3, 2.0, 0.15), crossMat);
  vBar.position.set(x, y, z);
  group.add(vBar);
  // Wider tips (top, bottom, left, right)
  const tipH = boxGeo(0.6, 0.5, 0.15);
  const tipV = boxGeo(0.5, 0.6, 0.15);
  const t1 = new THREE.Mesh(tipH, crossMat);
  t1.position.set(x - 0.9, y, z);
  group.add(t1);
  const t2 = new THREE.Mesh(tipH, crossMat);
  t2.position.set(x + 0.9, y, z);
  group.add(t2);
  const t3 = new THREE.Mesh(tipV, crossMat);
  t3.position.set(x, y + 0.9, z);
  group.add(t3);
  const t4 = new THREE.Mesh(tipV, crossMat);
  t4.position.set(x, y - 0.9, z);
  group.add(t4);
}

function addFactionInsignia(group, factionId, x, y, z) {
  if (factionId === 'swiss') addSwissInsignia(group, x, y, z);
  else if (factionId === 'french') addFrenchInsignia(group, x, y, z);
  else if (factionId === 'german') addGermanInsignia(group, x, y, z);
}

// --- Vehicle common helpers ---

function addTracks(group, w, d) {
  const tMat = trackMat();
  const leftTrack = new THREE.Mesh(boxGeo(1, 2, d + 1), tMat);
  leftTrack.position.set(-(w / 2 + 0.5), -0.5, 0);
  leftTrack.castShadow = true;
  group.add(leftTrack);
  const rightTrack = new THREE.Mesh(boxGeo(1, 2, d + 1), tMat);
  rightTrack.position.set(w / 2 + 0.5, -0.5, 0);
  rightTrack.castShadow = true;
  group.add(rightTrack);
}

function addWheels(group, w, d) {
  // 4 wheels as cylinders rotated on their side
  const wMat = wheelMat();
  const wheelR = 1.0;
  const wheelH = 0.6;
  const wGeo = cylGeo(wheelR, wheelR, wheelH, 8);
  const positions = [
    [-(w / 2 + 0.3), -1.0, -(d / 2 - 1.5)],
    [ (w / 2 + 0.3), -1.0, -(d / 2 - 1.5)],
    [-(w / 2 + 0.3), -1.0,  (d / 2 - 1.5)],
    [ (w / 2 + 0.3), -1.0,  (d / 2 - 1.5)],
  ];
  for (const [px, py, pz] of positions) {
    const wheel = new THREE.Mesh(wGeo, wMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(px, py, pz);
    wheel.castShadow = true;
    group.add(wheel);
  }
}

function addVehicleShadow(group, large) {
  const shadow = new THREE.Mesh(large ? shadowGeoLarge() : shadowGeoVeh(), shadowMat());
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -2.3;
  group.add(shadow);
}

function addSelectionRing(group, large) {
  const ring = new THREE.Mesh(
    large ? selectionRingLargeGeo() : selectionRingGeo(),
    selectionMat()
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -2.3;
  ring.visible = false;
  ring.name = 'selectionRing';
  group.add(ring);
}

function addDrunkOverlay(group, large) {
  const drunkOverlay = new THREE.Mesh(
    large ? drunkSphereLargeGeo() : drunkSphereGeo(),
    drunkMat()
  );
  drunkOverlay.visible = false;
  drunkOverlay.name = 'drunkOverlay';
  group.add(drunkOverlay);
}

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
  body.position.y = 0;
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
    weapon.rotation.z = Math.PI / 6;
  } else if (unit.type === UnitType.HEAVY_INFANTRY) {
    weapon = new THREE.Mesh(heavyWepGeo(), factionWeaponMat(factionId, secondary));
    weapon.position.set(2.2, 0.3, 0);
    weapon.rotation.z = Math.PI / 8;
  } else if (unit.type === UnitType.ROCKET_INFANTRY) {
    const wepGroup = new THREE.Group();
    const tube = new THREE.Mesh(rocketTubeGeo(), factionWeaponMat(factionId, secondary));
    tube.rotation.z = Math.PI / 5;
    wepGroup.add(tube);
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
  shadow.position.y = -2.8;
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

// =====================================================================
// LIGHT VEHICLE (Scout) — Small, fast, open-top, 4 wheels, side gun
// =====================================================================
function createLightVehicleMesh(unit) {
  const { factionId, primary, secondary } = getFactionColors(unit);
  const group = new THREE.Group();
  group.name = `unit_${unit.id}`;

  const hullMat = factionHullMat(factionId, primary);
  const w = 5, d = 7;

  // Low-profile hull (tapered slightly)
  const hull = new THREE.Mesh(boxGeo(w, 1.8, d), hullMat);
  hull.position.y = 0;
  hull.castShadow = true;
  hull.receiveShadow = true;
  group.add(hull);

  // Front wedge (sloped hood) — thinner box angled forward
  const frontWedge = new THREE.Mesh(boxGeo(w - 0.5, 1.0, 2), hullMat);
  frontWedge.position.set(0, 0.6, -(d / 2 - 0.5));
  frontWedge.rotation.x = -0.3;
  frontWedge.castShadow = true;
  group.add(frontWedge);

  // 4 wheels instead of tracks
  addWheels(group, w, d);

  // Side-mounted gun (small barrel on right side)
  const gunMount = new THREE.Mesh(boxGeo(0.6, 0.6, 1.0), darkMetalMat());
  gunMount.position.set(w / 2 + 0.1, 1.0, -1);
  group.add(gunMount);
  const gunBarrel = new THREE.Mesh(cylGeo(0.2, 0.2, 3, 6), barrelMat());
  gunBarrel.rotation.x = Math.PI / 2;
  gunBarrel.position.set(w / 2 + 0.1, 1.0, -3.5);
  gunBarrel.castShadow = true;
  group.add(gunBarrel);

  // Faction-specific details
  if (factionId === 'swiss') {
    // Roll cage — torus ring over the top
    const cage = new THREE.Mesh(torusGeo(2.5, 0.15, 6, 12), frameMat());
    cage.position.y = 2.0;
    cage.rotation.x = Math.PI / 2;
    group.add(cage);
    // Cross bar
    const crossBar = new THREE.Mesh(cylGeo(0.12, 0.12, 5, 6), frameMat());
    crossBar.position.y = 2.0;
    crossBar.rotation.z = Math.PI / 2;
    group.add(crossBar);
  } else if (factionId === 'french') {
    // Sleek angled windshield (plane)
    const windshield = new THREE.Mesh(planeGeo(w - 1.5, 1.8), mat('windshield', () =>
      new THREE.MeshStandardMaterial({ color: 0x88bbff, transparent: true, opacity: 0.5, metalness: 0.8, roughness: 0.1, side: THREE.DoubleSide })
    ));
    windshield.position.set(0, 1.6, -(d / 2 - 2.5));
    windshield.rotation.x = -0.7;
    group.add(windshield);
    // Streamlined rear fin
    const fin = new THREE.Mesh(boxGeo(0.15, 1.0, 2.5), hullMat);
    fin.position.set(0, 1.2, d / 2 - 1.5);
    group.add(fin);
  } else if (factionId === 'german') {
    // Angular reinforced frame — extra bars
    const fMat = frameMat();
    // Front bumper reinforcement
    const bumper = new THREE.Mesh(boxGeo(w + 0.8, 0.8, 0.5), fMat);
    bumper.position.set(0, -0.2, -(d / 2 + 0.3));
    group.add(bumper);
    // Side reinforcement bars
    const sideBarL = new THREE.Mesh(boxGeo(0.3, 1.5, d - 1), fMat);
    sideBarL.position.set(-(w / 2 - 0.3), 1.2, 0);
    group.add(sideBarL);
    const sideBarR = new THREE.Mesh(boxGeo(0.3, 1.5, d - 1), fMat);
    sideBarR.position.set(w / 2 - 0.3, 1.2, 0);
    group.add(sideBarR);
    // Top cross beam
    const crossBeam = new THREE.Mesh(boxGeo(w - 0.6, 0.3, 0.3), fMat);
    crossBeam.position.set(0, 2.0, 0);
    group.add(crossBeam);
  }

  // Faction insignia on right hull side
  addFactionInsignia(group, factionId, w / 2 + 0.1, 0.5, 1.5);

  addVehicleShadow(group, false);
  addSelectionRing(group, false);
  addDrunkOverlay(group, false);

  return { group, factionId };
}

// =====================================================================
// MEDIUM VEHICLE (APC) — Wider, boxy, sloped front, tracks, autocannon
// =====================================================================
function createMediumVehicleMesh(unit) {
  const { factionId, primary, secondary } = getFactionColors(unit);
  const group = new THREE.Group();
  group.name = `unit_${unit.id}`;

  const hullMat = factionHullMat(factionId, primary);
  const w = 7, d = 9;

  // Main hull
  const hull = new THREE.Mesh(boxGeo(w, 2.8, d), hullMat);
  hull.position.y = 0;
  hull.castShadow = true;
  hull.receiveShadow = true;
  group.add(hull);

  // Sloped front armor
  const frontSlope = new THREE.Mesh(boxGeo(w, 2.0, 2.5), hullMat);
  frontSlope.position.set(0, 0.8, -(d / 2 - 0.5));
  frontSlope.rotation.x = -0.4;
  frontSlope.castShadow = true;
  group.add(frontSlope);

  // Tracks
  addTracks(group, w, d);

  // Side armor panels (thin boxes along hull)
  const sidePanelMat = factionHullLightMat(factionId, primary);
  const panelL = new THREE.Mesh(boxGeo(0.3, 2.2, d - 2), sidePanelMat);
  panelL.position.set(-(w / 2 + 0.15), 0.3, 0);
  panelL.castShadow = true;
  group.add(panelL);
  const panelR = new THREE.Mesh(boxGeo(0.3, 2.2, d - 2), sidePanelMat);
  panelR.position.set(w / 2 + 0.15, 0.3, 0);
  panelR.castShadow = true;
  group.add(panelR);

  // Top hatch with autocannon
  const hatch = new THREE.Mesh(cylGeo(1.2, 1.2, 0.6, 8), darkMetalMat());
  hatch.position.set(0, 2.0, -0.5);
  hatch.castShadow = true;
  group.add(hatch);
  // Autocannon barrel
  const cannon = new THREE.Mesh(cylGeo(0.25, 0.25, 4, 6), barrelMat());
  cannon.rotation.x = Math.PI / 2;
  cannon.position.set(0, 2.3, -3.5);
  cannon.castShadow = true;
  group.add(cannon);

  // Faction-specific details
  if (factionId === 'swiss') {
    // Blocky practical: top storage box
    const storageBox = new THREE.Mesh(boxGeo(3, 0.8, 2), frameMat());
    storageBox.position.set(0, 2.0, 2.5);
    group.add(storageBox);
  } else if (factionId === 'french') {
    // Rounded edges: add sphere bumps at corners to suggest rounded hull
    const roundMat = hullMat;
    const corners = [
      [-(w / 2), 0.5, -(d / 2)],
      [ (w / 2), 0.5, -(d / 2)],
    ];
    for (const [cx, cy, cz] of corners) {
      const rnd = new THREE.Mesh(sphereGeo(0.8, 6, 4), roundMat);
      rnd.position.set(cx, cy, cz);
      group.add(rnd);
    }
    // Streamlined rear deck
    const rearDeck = new THREE.Mesh(boxGeo(w - 1, 0.5, 2), hullMat);
    rearDeck.position.set(0, 1.6, d / 2 - 1.2);
    rearDeck.rotation.x = 0.25;
    group.add(rearDeck);
  } else if (factionId === 'german') {
    // Extra riveted armor plates — additional overlapping boxes
    const armorMat = darkMetalMat();
    // Front extra plate
    const frontPlate = new THREE.Mesh(boxGeo(w + 0.5, 1.8, 0.4), armorMat);
    frontPlate.position.set(0, 0.2, -(d / 2 - 0.2));
    group.add(frontPlate);
    // Side skirt armor
    const skirtL = new THREE.Mesh(boxGeo(0.25, 1.5, d - 1), armorMat);
    skirtL.position.set(-(w / 2 + 0.65), -0.2, 0);
    group.add(skirtL);
    const skirtR = new THREE.Mesh(boxGeo(0.25, 1.5, d - 1), armorMat);
    skirtR.position.set(w / 2 + 0.65, -0.2, 0);
    group.add(skirtR);
  }

  // Faction insignia on right hull
  addFactionInsignia(group, factionId, w / 2 + 0.35, 0.8, 1.5);

  addVehicleShadow(group, false);
  addSelectionRing(group, false);
  addDrunkOverlay(group, false);

  return { group, factionId };
}

// =====================================================================
// TANK — Tracked + turret + barrel, turret shape differs by faction
// =====================================================================
function createTankMesh(unit) {
  const { factionId, primary, secondary } = getFactionColors(unit);
  const group = new THREE.Group();
  group.name = `unit_${unit.id}`;

  const hullMat = factionHullMat(factionId, primary);
  const w = 8, d = 10;

  // Hull
  const hull = new THREE.Mesh(boxGeo(w, 3, d), hullMat);
  hull.position.y = 0;
  hull.castShadow = true;
  hull.receiveShadow = true;
  group.add(hull);

  // Front glacis (sloped armor plate)
  const glacis = new THREE.Mesh(boxGeo(w - 0.5, 1.5, 2.5), hullMat);
  glacis.position.set(0, 1.0, -(d / 2 - 0.3));
  glacis.rotation.x = -0.5;
  glacis.castShadow = true;
  group.add(glacis);

  // Tracks
  addTracks(group, w, d);

  // Engine deck on rear
  const engineDeck = new THREE.Mesh(boxGeo(w - 1, 0.6, 3), darkMetalMat());
  engineDeck.position.set(0, 1.8, d / 2 - 1.8);
  group.add(engineDeck);

  // Turret — faction-specific shape
  const turretGroup = new THREE.Group();
  turretGroup.name = 'turret';
  const turretMat = factionTurretMat(factionId, primary);

  if (factionId === 'swiss') {
    // Round turret (cylinder)
    const turretBase = new THREE.Mesh(cylGeo(2.8, 2.8, 2.0, 10), turretMat);
    turretBase.position.y = 1.0;
    turretBase.castShadow = true;
    turretGroup.add(turretBase);
    // Cupola
    const cupola = new THREE.Mesh(cylGeo(0.8, 0.8, 0.6, 8), darkMetalMat());
    cupola.position.set(0.8, 2.2, 0.8);
    turretGroup.add(cupola);
  } else if (factionId === 'french') {
    // Low-profile flat turret (wide, short cylinder)
    const turretBase = new THREE.Mesh(cylGeo(3.2, 3.0, 1.2, 10), turretMat);
    turretBase.position.y = 0.6;
    turretBase.castShadow = true;
    turretGroup.add(turretBase);
    // Slight dome on top
    const dome = new THREE.Mesh(sphereGeo(1.5, 8, 4), turretMat);
    dome.position.y = 1.2;
    dome.scale.set(1, 0.3, 1);
    turretGroup.add(dome);
  } else if (factionId === 'german') {
    // Angular turret (box shape with angled front)
    const turretBase = new THREE.Mesh(boxGeo(5.5, 2.0, 5), turretMat);
    turretBase.position.y = 1.0;
    turretBase.castShadow = true;
    turretGroup.add(turretBase);
    // Angled front face
    const angledFront = new THREE.Mesh(boxGeo(5.0, 1.6, 1.5), turretMat);
    angledFront.position.set(0, 0.8, -2.8);
    angledFront.rotation.x = -0.4;
    turretGroup.add(angledFront);
    // Bustle at rear
    const bustle = new THREE.Mesh(boxGeo(4.5, 1.2, 1.5), darkMetalMat());
    bustle.position.set(0, 0.8, 2.5);
    turretGroup.add(bustle);
  }

  // Main gun barrel
  const barrel = new THREE.Mesh(cylGeo(0.4, 0.35, 6, 6), barrelMat());
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 1.2, -5.5);
  barrel.castShadow = true;
  turretGroup.add(barrel);

  // Muzzle brake
  const muzzle = new THREE.Mesh(cylGeo(0.6, 0.6, 0.5, 6), barrelMat());
  muzzle.rotation.x = Math.PI / 2;
  muzzle.position.set(0, 1.2, -8.3);
  turretGroup.add(muzzle);

  turretGroup.position.y = 1.5;
  group.add(turretGroup);

  // Faction insignia on right hull
  addFactionInsignia(group, factionId, w / 2 + 0.1, 0.8, 1.5);

  addVehicleShadow(group, false);
  addSelectionRing(group, false);
  addDrunkOverlay(group, false);

  return { group, factionId };
}

// =====================================================================
// SIEGE TANK — Heavier hull, dual barrels, side armor skirts
// =====================================================================
function createSiegeTankMesh(unit) {
  const { factionId, primary, secondary } = getFactionColors(unit);
  const group = new THREE.Group();
  group.name = `unit_${unit.id}`;

  const hullMat = factionHullMat(factionId, primary);
  const w = 9, d = 11;

  // Heavy hull
  const hull = new THREE.Mesh(boxGeo(w, 3.5, d), hullMat);
  hull.position.y = 0;
  hull.castShadow = true;
  hull.receiveShadow = true;
  group.add(hull);

  // Front glacis
  const glacis = new THREE.Mesh(boxGeo(w - 0.5, 2.0, 3), hullMat);
  glacis.position.set(0, 1.2, -(d / 2 - 0.5));
  glacis.rotation.x = -0.45;
  glacis.castShadow = true;
  group.add(glacis);

  // Tracks
  addTracks(group, w, d);

  // Side armor skirts (thin boxes along tracks)
  const skirtMat = factionHullLightMat(factionId, primary);
  const skirtL = new THREE.Mesh(boxGeo(0.3, 2.5, d + 0.5), skirtMat);
  skirtL.position.set(-(w / 2 + 1.0), -0.3, 0);
  skirtL.castShadow = true;
  group.add(skirtL);
  const skirtR = new THREE.Mesh(boxGeo(0.3, 2.5, d + 0.5), skirtMat);
  skirtR.position.set(w / 2 + 1.0, -0.3, 0);
  skirtR.castShadow = true;
  group.add(skirtR);

  // Engine deck
  const engineDeck = new THREE.Mesh(boxGeo(w - 1.5, 0.8, 3.5), darkMetalMat());
  engineDeck.position.set(0, 2.0, d / 2 - 2);
  group.add(engineDeck);
  // Exhaust pipes
  const exhaustL = new THREE.Mesh(cylGeo(0.3, 0.3, 2, 6), pipeMat());
  exhaustL.position.set(-2, 2.5, d / 2 - 0.5);
  group.add(exhaustL);
  const exhaustR = new THREE.Mesh(cylGeo(0.3, 0.3, 2, 6), pipeMat());
  exhaustR.position.set(2, 2.5, d / 2 - 0.5);
  group.add(exhaustR);

  // Dual-barrel turret
  const turretGroup = new THREE.Group();
  turretGroup.name = 'turret';
  const turretMat = factionTurretMat(factionId, primary);

  // Turret base — larger
  const turretBase = new THREE.Mesh(boxGeo(6, 2.2, 5.5), turretMat);
  turretBase.position.y = 1.1;
  turretBase.castShadow = true;
  turretGroup.add(turretBase);

  // Turret front armor
  const turretFront = new THREE.Mesh(boxGeo(5.5, 1.8, 1.5), turretMat);
  turretFront.position.set(0, 0.9, -3.0);
  turretFront.rotation.x = -0.3;
  turretGroup.add(turretFront);

  // Dual barrels
  const brlMat = barrelMat();
  const barrel1 = new THREE.Mesh(cylGeo(0.4, 0.35, 7, 6), brlMat);
  barrel1.rotation.x = Math.PI / 2;
  barrel1.position.set(-1.0, 1.3, -6.5);
  barrel1.castShadow = true;
  turretGroup.add(barrel1);
  const barrel2 = new THREE.Mesh(cylGeo(0.4, 0.35, 7, 6), brlMat);
  barrel2.rotation.x = Math.PI / 2;
  barrel2.position.set(1.0, 1.3, -6.5);
  barrel2.castShadow = true;
  turretGroup.add(barrel2);

  // Muzzle brakes on both barrels
  const mb1 = new THREE.Mesh(cylGeo(0.6, 0.6, 0.5, 6), brlMat);
  mb1.rotation.x = Math.PI / 2;
  mb1.position.set(-1.0, 1.3, -9.8);
  turretGroup.add(mb1);
  const mb2 = new THREE.Mesh(cylGeo(0.6, 0.6, 0.5, 6), brlMat);
  mb2.rotation.x = Math.PI / 2;
  mb2.position.set(1.0, 1.3, -9.8);
  turretGroup.add(mb2);

  turretGroup.position.y = 1.7;
  group.add(turretGroup);

  // German faction: extra angled plates on turret sides
  if (factionId === 'german') {
    const apMat = darkMetalMat();
    // Angled plates on turret sides
    const apL = new THREE.Mesh(boxGeo(0.3, 2.0, 4), apMat);
    apL.position.set(-3.3, 2.8, -0.5);
    apL.rotation.z = 0.2;
    group.add(apL);
    const apR = new THREE.Mesh(boxGeo(0.3, 2.0, 4), apMat);
    apR.position.set(3.3, 2.8, -0.5);
    apR.rotation.z = -0.2;
    group.add(apR);
    // Additional hull reinforcement
    const hullPlate = new THREE.Mesh(boxGeo(w + 0.5, 1.0, 0.4), apMat);
    hullPlate.position.set(0, 0.0, -(d / 2 + 0.2));
    group.add(hullPlate);
  }

  // Faction insignia
  addFactionInsignia(group, factionId, w / 2 + 1.1, 0.8, 2.0);

  addVehicleShadow(group, true);
  addSelectionRing(group, false);
  addDrunkOverlay(group, false);

  return { group, factionId };
}

// =====================================================================
// ROCKET LAUNCHER (MLRS) — Elevated 6-tube rack on pivot, outriggers
// =====================================================================
function createRocketLauncherMesh(unit) {
  const { factionId, primary, secondary } = getFactionColors(unit);
  const group = new THREE.Group();
  group.name = `unit_${unit.id}`;

  const hullMat = factionHullMat(factionId, primary);
  const w = 8, d = 10;

  // Hull
  const hull = new THREE.Mesh(boxGeo(w, 2.5, d), hullMat);
  hull.position.y = 0;
  hull.castShadow = true;
  hull.receiveShadow = true;
  group.add(hull);

  // Tracks
  addTracks(group, w, d);

  // Cab at front (raised box)
  const cab = new THREE.Mesh(boxGeo(w - 1, 2.5, 3.5), hullMat);
  cab.position.set(0, 1.8, -(d / 2 - 2));
  cab.castShadow = true;
  group.add(cab);

  // Pivot base for the rack (cylinder on top of hull rear)
  const pivotBase = new THREE.Mesh(cylGeo(1.5, 1.5, 1.0, 8), darkMetalMat());
  pivotBase.position.set(0, 1.8, 1.0);
  pivotBase.castShadow = true;
  group.add(pivotBase);

  // 6-tube rocket rack (2 wide x 3 tall) — tilted upward
  const rackGroup = new THREE.Group();
  const tubeMat = barrelMat();
  const tubeR = 0.5;
  const tubeLen = 5.5;
  const tubeGeo = cylGeo(tubeR, tubeR, tubeLen, 6);

  // 2x3 grid
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 2; col++) {
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      tube.position.set(
        (col - 0.5) * 1.5,
        (row - 1) * 1.3,
        0
      );
      tube.castShadow = true;
      rackGroup.add(tube);
    }
  }

  // Rack frame (box around tubes)
  const rackFrame = new THREE.Mesh(boxGeo(4.0, 4.5, tubeLen + 0.5), mat('rackFrame', () =>
    new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, metalness: 0.5, wireframe: false })
  ));
  rackFrame.material.transparent = true;
  rackFrame.material.opacity = 0.3;
  rackGroup.add(rackFrame);

  // Tilt rack upward
  rackGroup.rotation.x = Math.PI / 3.5;
  rackGroup.position.set(0, 3.5, 1.5);
  group.add(rackGroup);

  // Stabilizer outriggers (thin boxes on sides, folded alongside hull)
  const outriggerMat = frameMat();
  // Left outrigger
  const outL = new THREE.Mesh(boxGeo(2.5, 0.3, 1.0), outriggerMat);
  outL.position.set(-(w / 2 + 1.2), -0.8, 1.5);
  group.add(outL);
  const outLfoot = new THREE.Mesh(boxGeo(0.8, 0.3, 1.5), outriggerMat);
  outLfoot.position.set(-(w / 2 + 2.2), -0.8, 1.5);
  group.add(outLfoot);
  // Right outrigger
  const outR = new THREE.Mesh(boxGeo(2.5, 0.3, 1.0), outriggerMat);
  outR.position.set(w / 2 + 1.2, -0.8, 1.5);
  group.add(outR);
  const outRfoot = new THREE.Mesh(boxGeo(0.8, 0.3, 1.5), outriggerMat);
  outRfoot.position.set(w / 2 + 2.2, -0.8, 1.5);
  group.add(outRfoot);

  // Faction insignia
  addFactionInsignia(group, factionId, w / 2 + 0.1, 0.5, -1.0);

  addVehicleShadow(group, false);
  addSelectionRing(group, false);
  addDrunkOverlay(group, false);

  return { group, factionId };
}

// =====================================================================
// HARVESTER — Big container on back, front scoop, visible pipes
// =====================================================================
function createHarvesterMesh(unit) {
  const { factionId, primary, secondary } = getFactionColors(unit);
  const group = new THREE.Group();
  group.name = `unit_${unit.id}`;

  const hullMat = factionHullMat(factionId, primary);
  const w = 10, d = 12;

  // Main hull (lower, wider)
  const hull = new THREE.Mesh(boxGeo(w, 2.5, d), hullMat);
  hull.position.y = 0;
  hull.castShadow = true;
  hull.receiveShadow = true;
  group.add(hull);

  // Tracks
  addTracks(group, w, d);

  // Front cab
  const cab = new THREE.Mesh(boxGeo(w - 2, 2.5, 3), hullMat);
  cab.position.set(0, 1.8, -(d / 2 - 2));
  cab.castShadow = true;
  group.add(cab);

  // Front scoop (wide shovel)
  const scoop = new THREE.Mesh(boxGeo(w + 1, 2.5, 2), barrelMat());
  scoop.position.set(0, -0.5, -(d / 2 + 1));
  scoop.rotation.x = -0.3;
  scoop.castShadow = true;
  group.add(scoop);
  // Scoop teeth
  const toothGeo = boxGeo(0.5, 1.5, 0.5);
  const toothMat = darkMetalMat();
  for (let i = -3; i <= 3; i += 1.5) {
    const tooth = new THREE.Mesh(toothGeo, toothMat);
    tooth.position.set(i, -1.5, -(d / 2 + 1.8));
    group.add(tooth);
  }

  // Big container on back — faction-specific color
  let containerMat;
  if (factionId === 'swiss') {
    containerMat = cheeseYellowMat();
  } else if (factionId === 'french') {
    containerMat = winePurpleMat();
  } else {
    containerMat = amberBrownMat();
  }

  // Container: horizontal cylinder
  const container = new THREE.Mesh(cylGeo(3.5, 3.5, 7, 10), containerMat);
  container.rotation.z = Math.PI / 2;
  container.position.set(0, 3.0, 1.5);
  container.castShadow = true;
  group.add(container);

  // Container end caps
  const capGeo = cylGeo(3.5, 3.5, 0.3, 10);
  const capMat = darkMetalMat();
  const capL = new THREE.Mesh(capGeo, capMat);
  capL.rotation.z = Math.PI / 2;
  capL.position.set(-3.5, 3.0, 1.5);
  group.add(capL);
  const capR = new THREE.Mesh(capGeo, capMat);
  capR.rotation.z = Math.PI / 2;
  capR.position.set(3.5, 3.0, 1.5);
  group.add(capR);

  // Visible pipes connecting cab to container
  const pMat = pipeMat();
  const pipe1 = new THREE.Mesh(cylGeo(0.25, 0.25, 4, 6), pMat);
  pipe1.position.set(-2.5, 2.5, -1.0);
  pipe1.rotation.x = Math.PI / 2;
  group.add(pipe1);
  const pipe2 = new THREE.Mesh(cylGeo(0.25, 0.25, 4, 6), pMat);
  pipe2.position.set(2.5, 2.5, -1.0);
  pipe2.rotation.x = Math.PI / 2;
  group.add(pipe2);
  // Vertical pipe on side
  const pipe3 = new THREE.Mesh(cylGeo(0.2, 0.2, 3, 6), pMat);
  pipe3.position.set(w / 2 - 0.5, 2.5, 0);
  group.add(pipe3);

  // Faction insignia
  addFactionInsignia(group, factionId, w / 2 + 0.1, 0.5, -2.0);

  addVehicleShadow(group, true);
  addSelectionRing(group, false);
  addDrunkOverlay(group, false);

  return { group, factionId };
}

// =====================================================================
// MCV — Huge vehicle, crane arm, scaffolding, much bigger
// =====================================================================
function createMCVMesh(unit) {
  const { factionId, primary, secondary } = getFactionColors(unit);
  const group = new THREE.Group();
  group.name = `unit_${unit.id}`;

  const hullMat = factionHullMat(factionId, primary);
  const w = 12, d = 14;

  // Massive hull
  const hull = new THREE.Mesh(boxGeo(w, 4, d), hullMat);
  hull.position.y = 0;
  hull.castShadow = true;
  hull.receiveShadow = true;
  group.add(hull);

  // Tracks (wider)
  const tMat = trackMat();
  const leftTrack = new THREE.Mesh(boxGeo(1.5, 2.5, d + 2), tMat);
  leftTrack.position.set(-(w / 2 + 0.8), -0.8, 0);
  leftTrack.castShadow = true;
  group.add(leftTrack);
  const rightTrack = new THREE.Mesh(boxGeo(1.5, 2.5, d + 2), tMat);
  rightTrack.position.set(w / 2 + 0.8, -0.8, 0);
  rightTrack.castShadow = true;
  group.add(rightTrack);

  // Elevated command cab at front
  const cab = new THREE.Mesh(boxGeo(w - 3, 3.5, 4), hullMat);
  cab.position.set(0, 3.0, -(d / 2 - 2.5));
  cab.castShadow = true;
  group.add(cab);

  // Windshield on cab
  const windshield = new THREE.Mesh(planeGeo(w - 4.5, 2.5), mat('mcvWindshield', () =>
    new THREE.MeshStandardMaterial({ color: 0x6699bb, transparent: true, opacity: 0.5, metalness: 0.7, roughness: 0.2, side: THREE.DoubleSide })
  ));
  windshield.position.set(0, 3.5, -(d / 2 - 0.3));
  windshield.rotation.x = -0.15;
  group.add(windshield);

  // Main structure/building block on rear
  const structure = new THREE.Mesh(boxGeo(w - 2, 5, 6), factionHullLightMat(factionId, primary));
  structure.position.set(0, 2.5, 2);
  structure.castShadow = true;
  group.add(structure);

  // Crane arm (cylinder rising up + horizontal boom)
  const craneMat = scaffoldMat();
  // Vertical mast
  const craneMast = new THREE.Mesh(cylGeo(0.4, 0.4, 6, 6), craneMat);
  craneMast.position.set(3, 6, 2);
  craneMast.castShadow = true;
  group.add(craneMast);
  // Horizontal boom
  const craneBoom = new THREE.Mesh(cylGeo(0.3, 0.3, 7, 6), craneMat);
  craneBoom.rotation.z = Math.PI / 2;
  craneBoom.position.set(0, 8.8, 2);
  craneBoom.castShadow = true;
  group.add(craneBoom);
  // Hook block (small box hanging from boom tip)
  const hookBlock = new THREE.Mesh(boxGeo(0.8, 0.8, 0.8), darkMetalMat());
  hookBlock.position.set(-3.2, 7.5, 2);
  group.add(hookBlock);
  // Cable (thin cylinder from boom to hook)
  const cable = new THREE.Mesh(cylGeo(0.08, 0.08, 1.5, 4), darkMetalMat());
  cable.position.set(-3.2, 8.2, 2);
  group.add(cable);

  // Scaffolding detail (lattice bars on sides)
  const sMat = scaffoldMat();
  // Vertical struts
  for (const xOff of [-(w / 2 - 0.5), w / 2 - 0.5]) {
    const strut = new THREE.Mesh(cylGeo(0.15, 0.15, 5, 4), sMat);
    strut.position.set(xOff, 4.5, 2);
    group.add(strut);
  }
  // Diagonal braces
  const braceL = new THREE.Mesh(cylGeo(0.1, 0.1, 6, 4), sMat);
  braceL.position.set(-(w / 2 - 0.5), 4.5, 2);
  braceL.rotation.z = 0.4;
  group.add(braceL);
  const braceR = new THREE.Mesh(cylGeo(0.1, 0.1, 6, 4), sMat);
  braceR.position.set(w / 2 - 0.5, 4.5, 2);
  braceR.rotation.z = -0.4;
  group.add(braceR);
  // Horizontal cross members
  const crossMember = new THREE.Mesh(boxGeo(w - 1, 0.2, 0.2), sMat);
  crossMember.position.set(0, 5.5, 2);
  group.add(crossMember);
  const crossMember2 = new THREE.Mesh(boxGeo(w - 1, 0.2, 0.2), sMat);
  crossMember2.position.set(0, 3.5, 2);
  group.add(crossMember2);

  // Faction insignia on right hull
  addFactionInsignia(group, factionId, w / 2 + 0.1, 1.0, -3.0);

  addVehicleShadow(group, true);
  addSelectionRing(group, true);
  addDrunkOverlay(group, true);

  return { group, factionId };
}

// =====================================================================
// CHEESE CANNON (Swiss Super Unit) — Cheese wheel turret, golden barrel
// =====================================================================
function createCheeseCannonMesh(unit) {
  const { factionId, primary, secondary } = getFactionColors(unit);
  const group = new THREE.Group();
  group.name = `unit_${unit.id}`;

  const hullMat = factionHullMat(factionId, primary);
  const w = 10, d = 12;

  // Hull
  const hull = new THREE.Mesh(boxGeo(w, 3, d), hullMat);
  hull.position.y = 0;
  hull.castShadow = true;
  hull.receiveShadow = true;
  group.add(hull);

  // Front glacis
  const glacis = new THREE.Mesh(boxGeo(w - 1, 2, 3), hullMat);
  glacis.position.set(0, 1.0, -(d / 2 - 0.5));
  glacis.rotation.x = -0.4;
  glacis.castShadow = true;
  group.add(glacis);

  // Tracks
  addTracks(group, w, d);

  // Turret: a big wheel of cheese (yellow cylinder, short and wide)
  const turretGroup = new THREE.Group();
  turretGroup.name = 'turret';

  // Cheese wheel
  const cheeseWheel = new THREE.Mesh(cylGeo(4.0, 4.0, 2.5, 12), cheeseYellowMat());
  cheeseWheel.position.y = 1.2;
  cheeseWheel.castShadow = true;
  turretGroup.add(cheeseWheel);

  // Cheese holes (small dark indentations — dark spheres slightly embedded)
  const holeMat = mat('cheeseHole', () => new THREE.MeshStandardMaterial({
    color: 0xc09820, roughness: 0.8, metalness: 0.1,
  }));
  const holePositions = [
    [1.5, 1.8, 1.2], [-1.0, 0.8, 2.0], [0.5, 1.5, -1.5],
    [-1.8, 1.5, -0.8], [2.0, 1.0, -0.5],
  ];
  for (const [hx, hy, hz] of holePositions) {
    const hole = new THREE.Mesh(sphereGeo(0.4, 5, 4), holeMat);
    hole.position.set(hx, hy, hz);
    turretGroup.add(hole);
  }

  // Golden barrel (gleaming cannon)
  const goldenBarrel = new THREE.Mesh(cylGeo(0.5, 0.4, 7, 8), goldenMat());
  goldenBarrel.rotation.x = Math.PI / 2;
  goldenBarrel.position.set(0, 1.2, -6.5);
  goldenBarrel.castShadow = true;
  turretGroup.add(goldenBarrel);

  // Golden muzzle
  const goldenMuzzle = new THREE.Mesh(cylGeo(0.8, 0.8, 0.8, 8), goldenMat());
  goldenMuzzle.rotation.x = Math.PI / 2;
  goldenMuzzle.position.set(0, 1.2, -9.8);
  turretGroup.add(goldenMuzzle);

  turretGroup.position.y = 1.5;
  group.add(turretGroup);

  // Swiss insignia
  addSwissInsignia(group, w / 2 + 0.1, 0.8, 2.0);

  addVehicleShadow(group, true);
  addSelectionRing(group, false);
  addDrunkOverlay(group, false);

  return { group, factionId };
}

// =====================================================================
// WINE CATAPULT (French Super Unit) — Catapult arm + wine barrel
// =====================================================================
function createWineCatapultMesh(unit) {
  const { factionId, primary, secondary } = getFactionColors(unit);
  const group = new THREE.Group();
  group.name = `unit_${unit.id}`;

  const hullMat = factionHullMat(factionId, primary);
  const w = 10, d = 12;

  // Hull
  const hull = new THREE.Mesh(boxGeo(w, 2.8, d), hullMat);
  hull.position.y = 0;
  hull.castShadow = true;
  hull.receiveShadow = true;
  group.add(hull);

  // Tracks
  addTracks(group, w, d);

  // Cab at front
  const cab = new THREE.Mesh(boxGeo(w - 2, 2.5, 3.5), hullMat);
  cab.position.set(0, 1.8, -(d / 2 - 2));
  cab.castShadow = true;
  group.add(cab);

  // Catapult frame (two vertical posts + crossbar)
  const framM = frameMat();
  const postL = new THREE.Mesh(boxGeo(0.5, 5, 0.5), framM);
  postL.position.set(-2.5, 4, 0);
  postL.castShadow = true;
  group.add(postL);
  const postR = new THREE.Mesh(boxGeo(0.5, 5, 0.5), framM);
  postR.position.set(2.5, 4, 0);
  postR.castShadow = true;
  group.add(postR);
  const crossbar = new THREE.Mesh(cylGeo(0.3, 0.3, 5.5, 6), framM);
  crossbar.rotation.z = Math.PI / 2;
  crossbar.position.set(0, 6.2, 0);
  group.add(crossbar);

  // Catapult arm (cylinder angled up from pivot)
  const armGroup = new THREE.Group();
  const arm = new THREE.Mesh(cylGeo(0.35, 0.3, 8, 6), framM);
  arm.position.y = 4;
  arm.castShadow = true;
  armGroup.add(arm);

  // Wine barrel at the tip of the arm (red cylinder, horizontal)
  const wineBarrel = new THREE.Mesh(cylGeo(1.5, 1.2, 2.5, 8), wineRedMat());
  wineBarrel.rotation.z = Math.PI / 2;
  wineBarrel.position.set(0, 7.5, 0);
  wineBarrel.castShadow = true;
  armGroup.add(wineBarrel);

  // Barrel hoops
  const hoopMat = darkMetalMat();
  for (const xOff of [-0.8, 0, 0.8]) {
    const hoop = new THREE.Mesh(torusGeo(1.35, 0.08, 4, 10), hoopMat);
    hoop.rotation.y = Math.PI / 2;
    hoop.position.set(xOff, 7.5, 0);
    armGroup.add(hoop);
  }

  // Tilt the arm backward (ready to fire)
  armGroup.position.set(0, 0, 0.5);
  armGroup.rotation.x = 0.35;
  group.add(armGroup);

  // Counterweight (box at base of arm behind pivot)
  const counterweight = new THREE.Mesh(boxGeo(2, 1.5, 2), darkMetalMat());
  counterweight.position.set(0, 2, 2.5);
  group.add(counterweight);

  // French insignia
  addFrenchInsignia(group, w / 2 + 0.1, 0.8, -2.0);

  addVehicleShadow(group, true);
  addSelectionRing(group, false);
  addDrunkOverlay(group, false);

  return { group, factionId };
}

// =====================================================================
// BRATWURST BLITZ (German Super Unit) — Fast angular hull, sausage missiles
// =====================================================================
function createBratwurstBlitzMesh(unit) {
  const { factionId, primary, secondary } = getFactionColors(unit);
  const group = new THREE.Group();
  group.name = `unit_${unit.id}`;

  const hullMat = factionHullMat(factionId, primary);
  const w = 10, d = 12;

  // Angular hull (wedge-shaped for speed)
  const hull = new THREE.Mesh(boxGeo(w, 2.8, d), hullMat);
  hull.position.y = 0;
  hull.castShadow = true;
  hull.receiveShadow = true;
  group.add(hull);

  // Aggressive front wedge (sharper angle)
  const frontWedge = new THREE.Mesh(boxGeo(w - 1, 2.0, 4), hullMat);
  frontWedge.position.set(0, 1.0, -(d / 2 - 0.5));
  frontWedge.rotation.x = -0.55;
  frontWedge.castShadow = true;
  group.add(frontWedge);

  // Side angular plates (speed lines)
  const angPlate = factionHullLightMat(factionId, primary);
  const plateL = new THREE.Mesh(boxGeo(0.3, 2.0, d - 2), angPlate);
  plateL.position.set(-(w / 2 + 0.15), 0.5, 0);
  plateL.rotation.z = -0.15;
  group.add(plateL);
  const plateR = new THREE.Mesh(boxGeo(0.3, 2.0, d - 2), angPlate);
  plateR.position.set(w / 2 + 0.15, 0.5, 0);
  plateR.rotation.z = 0.15;
  group.add(plateR);

  // Tracks
  addTracks(group, w, d);

  // Turret base (angular box)
  const turretGroup = new THREE.Group();
  turretGroup.name = 'turret';
  const turretMat = factionTurretMat(factionId, primary);

  const turretBase = new THREE.Mesh(boxGeo(6, 1.8, 5), turretMat);
  turretBase.position.y = 0.9;
  turretBase.castShadow = true;
  turretGroup.add(turretBase);

  // Angled turret front
  const tFront = new THREE.Mesh(boxGeo(5.5, 1.5, 1.5), turretMat);
  tFront.position.set(0, 0.7, -2.8);
  tFront.rotation.x = -0.4;
  turretGroup.add(tFront);

  // Bratwurst missile tubes (4 sausage-shaped cylinders in a row, brownish)
  const bMat = bratwurstMat();
  const tubeLen = 5.5;
  for (let i = 0; i < 4; i++) {
    const xOff = (i - 1.5) * 1.3;
    // Sausage body (cylinder with rounded ends via hemispheres)
    const sausage = new THREE.Mesh(cylGeo(0.5, 0.5, tubeLen, 8), bMat);
    sausage.rotation.x = Math.PI / 2;
    sausage.position.set(xOff, 2.2, -2);
    sausage.castShadow = true;
    turretGroup.add(sausage);
    // Front tip (cone)
    const tip = new THREE.Mesh(coneGeo(0.5, 1.0, 8), bMat);
    tip.rotation.x = -Math.PI / 2;
    tip.position.set(xOff, 2.2, -(2 + tubeLen / 2 + 0.4));
    turretGroup.add(tip);
    // Rear cap (sphere)
    const rear = new THREE.Mesh(sphereGeo(0.5, 6, 4), bMat);
    rear.position.set(xOff, 2.2, -(2 - tubeLen / 2));
    turretGroup.add(rear);
  }

  turretGroup.position.y = 1.4;
  group.add(turretGroup);

  // Extra angular side armor (German trait amplified)
  const apMat = darkMetalMat();
  const skirtL = new THREE.Mesh(boxGeo(0.3, 2.2, d), apMat);
  skirtL.position.set(-(w / 2 + 0.8), -0.2, 0);
  group.add(skirtL);
  const skirtR = new THREE.Mesh(boxGeo(0.3, 2.2, d), apMat);
  skirtR.position.set(w / 2 + 0.8, -0.2, 0);
  group.add(skirtR);

  // German insignia
  addGermanInsignia(group, w / 2 + 1.0, 0.8, 2.0);

  addVehicleShadow(group, true);
  addSelectionRing(group, false);
  addDrunkOverlay(group, false);

  return { group, factionId };
}

// =====================================================================
// Vehicle creation dispatcher
// =====================================================================
function createVehicleMesh(unit) {
  switch (unit.type) {
    case UnitType.LIGHT_VEHICLE:
      return createLightVehicleMesh(unit);
    case UnitType.MEDIUM_VEHICLE:
      return createMediumVehicleMesh(unit);
    case UnitType.TANK:
      return createTankMesh(unit);
    case UnitType.SIEGE_TANK:
      return createSiegeTankMesh(unit);
    case UnitType.ROCKET_LAUNCHER:
      return createRocketLauncherMesh(unit);
    case UnitType.HARVESTER:
      return createHarvesterMesh(unit);
    case UnitType.MCV:
      return createMCVMesh(unit);
    case SuperUnitType.CHEESE_CANNON:
      return createCheeseCannonMesh(unit);
    case SuperUnitType.WINE_CATAPULT:
      return createWineCatapultMesh(unit);
    case SuperUnitType.BRATWURST_BLITZ:
      return createBratwurstBlitzMesh(unit);
    default:
      return createFallbackVehicleMesh(unit);
  }
}

// Fallback for any unknown vehicle type
function createFallbackVehicleMesh(unit) {
  const { factionId, primary } = getFactionColors(unit);
  const group = new THREE.Group();
  group.name = `unit_${unit.id}`;

  const hull = new THREE.Mesh(boxGeo(8, 3, 10), factionHullMat(factionId, primary));
  hull.position.y = 0;
  hull.castShadow = true;
  hull.receiveShadow = true;
  group.add(hull);
  addTracks(group, 8, 10);

  addFactionInsignia(group, factionId, 4.1, 0.5, 1.5);
  addVehicleShadow(group, false);
  addSelectionRing(group, false);
  addDrunkOverlay(group, false);

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
  if (unitType === UnitType.MCV) return 3;
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

    // Update position: unit.x -> Three.js X, unit.y -> Three.js Z
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
