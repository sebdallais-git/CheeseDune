// Game/public/dune/js/three-building-renderer.js — 3D building meshes
import * as THREE from 'three';
import { getBuildings } from './buildings.js';
import { BuildingStats, BuildingType, TILE_SIZE, FogState } from './constants.js';
// NOTE: BuildingType.LAB ('lab') will be added to constants.js separately
import { getFogState } from './fog.js';
import { getOwnerFaction } from './game-states.js';

// Scene reference
let sceneRef = null;

// Active building meshes: Map<buildingId, THREE.Group>
const buildingMeshes = new Map();

// Cached materials per faction
const factionMaterials = {};

// Shared geometries (created once)
const sharedGeometries = {};

// Animated flag objects: { mesh, phase }
const animatedFlags = [];

// --- Faction style definitions ---
const FACTION_STYLES = {
  swiss: {
    wallColor: 0xd4a46a,
    wallRoughness: 0.8,
    roofColor: 0x8b3a3a,
    windowColor: 0x446688,
    windowEmissiveIntensity: 0.5,
    chimneyColor: 0x888888,
    doorColor: 0x3a2a1a,
    roofSteepness: 1.6,  // steep A-frame
  },
  french: {
    wallColor: 0xc8b8a0,
    wallRoughness: 0.7,
    roofColor: 0x2a3a5a,
    windowColor: 0x886644,
    windowEmissiveIntensity: 0.5,
    chimneyColor: 0x888888,
    doorColor: 0x4a3a2a,
    roofSteepness: 1.2,  // elegant slope
  },
  german: {
    wallColor: 0xe8e0d0,
    wallRoughness: 0.75,
    roofColor: 0x2a2a2a,
    windowColor: 0x886644,
    windowEmissiveIntensity: 0.5,
    chimneyColor: 0x884444,
    doorColor: 0x3a2a1a,
    roofSteepness: 1.5,  // steep
  },
};

// --- Material creation and caching ---

function getFactionMaterials(faction) {
  if (factionMaterials[faction]) return factionMaterials[faction];

  const style = FACTION_STYLES[faction] || FACTION_STYLES.swiss;

  const mats = {
    wall: new THREE.MeshStandardMaterial({
      color: style.wallColor,
      roughness: style.wallRoughness,
      metalness: 0,
    }),
    roof: new THREE.MeshStandardMaterial({
      color: style.roofColor,
      roughness: 0.7,
      metalness: 0,
    }),
    window: new THREE.MeshStandardMaterial({
      color: style.windowColor,
      emissive: style.windowColor,
      emissiveIntensity: style.windowEmissiveIntensity,
      roughness: 0.3,
      metalness: 0.1,
    }),
    door: new THREE.MeshStandardMaterial({
      color: style.doorColor,
      roughness: 0.9,
      metalness: 0,
    }),
    chimney: new THREE.MeshStandardMaterial({
      color: style.chimneyColor,
      roughness: 0.9,
      metalness: 0,
    }),
  };

  // Half-timber beams for German faction
  if (faction === 'german') {
    mats.timber = new THREE.MeshStandardMaterial({
      color: 0x3a2a1a,
      roughness: 0.85,
      metalness: 0,
    });
  }

  factionMaterials[faction] = mats;
  return mats;
}

// --- Shared detail materials (faction-independent) ---
const detailMaterials = {};

function getDetailMaterial(color) {
  const key = color;
  if (detailMaterials[key]) return detailMaterials[key];
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.6,
    metalness: 0.1,
  });
  detailMaterials[key] = mat;
  return mat;
}

// --- Geometry helpers ---

function getOrCreateGeometry(key, factory) {
  if (!sharedGeometries[key]) {
    sharedGeometries[key] = factory();
  }
  return sharedGeometries[key];
}

// --- Building mesh creation ---

function computeBuildingDimensions(footprint) {
  const [fw, fh] = footprint;
  const width = fw * TILE_SIZE;
  const depth = fh * TILE_SIZE;
  const height = 8 + fw * 2;
  return { width, depth, height };
}

function createBuildingMesh(building) {
  const faction = getOwnerFaction(building.owner);
  const style = FACTION_STYLES[faction] || FACTION_STYLES.swiss;
  const mats = getFactionMaterials(faction);
  const stats = BuildingStats[building.type];
  const footprint = stats ? stats.footprint : building.footprint;
  const [fw, fh] = footprint;
  const { width, depth, height } = computeBuildingDimensions(footprint);

  const group = new THREE.Group();
  group.name = `building_${building.id}`;

  // --- Walls ---
  const wallGeomKey = `wall_${fw}_${fh}`;
  const wallGeom = getOrCreateGeometry(wallGeomKey, () =>
    new THREE.BoxGeometry(width * 0.9, height, depth * 0.9)
  );
  const walls = new THREE.Mesh(wallGeom, mats.wall);
  walls.position.y = height / 2;
  walls.castShadow = true;
  walls.receiveShadow = true;
  group.add(walls);

  // --- Half-timber beams for German faction ---
  if (faction === 'german') {
    addHalfTimberBeams(group, width, depth, height, mats.timber);
  }

  // --- Faction-specific visual enhancements ---
  if (faction === 'swiss') {
    addSwissEnhancements(group, width, depth, height, fw, fh);
  } else if (faction === 'french') {
    addFrenchEnhancements(group, width, depth, height, fw, fh, style);
  } else if (faction === 'german') {
    addGermanEnhancements(group, width, depth, height, building.type, mats.timber);
  }

  // --- Roof ---
  addRoof(group, width, depth, height, style, mats.roof, fw, fh);

  // --- Windows ---
  addWindows(group, width, depth, height, mats.window, fw, fh);

  // --- Door ---
  addDoor(group, width, depth, height, mats.door, fw);

  // --- Chimney ---
  addChimney(group, width, depth, height, mats.chimney, faction);

  // --- Type-specific detail ---
  addTypeDetail(group, building.type, width, depth, height, fw, faction);

  // --- Flag (for animation) ---
  addFlag(group, width, depth, height, faction);

  // Position the group at the building's world location
  // Building tileX/tileY is the top-left corner; center the group on the footprint
  group.position.set(
    (building.tileX + fw / 2) * TILE_SIZE,
    0,
    (building.tileY + fh / 2) * TILE_SIZE
  );

  return group;
}

function addRoof(group, width, depth, height, style, roofMat, fw, fh) {
  const roofHeight = height * 0.5 * style.roofSteepness;

  if (fw <= 1 && fh <= 1) {
    // Small building: simple cone roof
    const roofGeomKey = `roofCone_${fw}_${fh}`;
    const roofGeom = getOrCreateGeometry(roofGeomKey, () =>
      new THREE.ConeGeometry(Math.max(width, depth) * 0.55, roofHeight, 4)
    );
    const roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.y = height + roofHeight / 2;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);
  } else {
    // Larger building: A-frame roof using a scaled box rotated, or use a custom shape
    // Use a simple triangular prism approximation via a cone with 4 sides stretched
    const roofGeomKey = `roofBox_${fw}_${fh}`;
    const roofGeom = getOrCreateGeometry(roofGeomKey, () => {
      // Create a custom roof shape using BufferGeometry
      // A simple pitched roof (triangular prism)
      const rw = width * 0.95;
      const rd = depth * 0.95;
      const rh = roofHeight;

      const vertices = new Float32Array([
        // Front triangle
        -rw / 2, 0, -rd / 2,
         rw / 2, 0, -rd / 2,
         0, rh, -rd / 2,
        // Back triangle
        -rw / 2, 0,  rd / 2,
         rw / 2, 0,  rd / 2,
         0, rh,  rd / 2,
        // Left slope
        -rw / 2, 0, -rd / 2,
         0, rh, -rd / 2,
         0, rh,  rd / 2,
        -rw / 2, 0,  rd / 2,
        // Right slope
         rw / 2, 0, -rd / 2,
         rw / 2, 0,  rd / 2,
         0, rh,  rd / 2,
         0, rh, -rd / 2,
        // Bottom
        -rw / 2, 0, -rd / 2,
        -rw / 2, 0,  rd / 2,
         rw / 2, 0,  rd / 2,
         rw / 2, 0, -rd / 2,
      ]);

      const indices = [
        // Front triangle
        0, 1, 2,
        // Back triangle
        3, 5, 4,
        // Left slope
        6, 7, 8,  6, 8, 9,
        // Right slope
        10, 11, 12,  10, 12, 13,
        // Bottom
        14, 15, 16,  14, 16, 17,
      ];

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geom.setIndex(indices);
      geom.computeVertexNormals();
      return geom;
    });

    const roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.y = height;
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);
  }
}

function addWindows(group, width, depth, height, windowMat, fw, fh) {
  const windowSize = Math.min(2.5, height * 0.2);
  const windowGeomKey = `window_${windowSize.toFixed(1)}`;
  const windowGeom = getOrCreateGeometry(windowGeomKey, () =>
    new THREE.PlaneGeometry(windowSize, windowSize)
  );

  // Number of windows per side based on building width
  const windowsPerSide = Math.max(1, fw);
  const windowSpacing = (width * 0.7) / windowsPerSide;
  const windowY = height * 0.6;

  // Front windows (negative Z face)
  for (let i = 0; i < windowsPerSide; i++) {
    const win = new THREE.Mesh(windowGeom, windowMat);
    const offsetX = -width * 0.35 + windowSpacing * (i + 0.5);
    win.position.set(offsetX, windowY, -depth * 0.451);
    group.add(win);
  }

  // Back windows (positive Z face)
  for (let i = 0; i < windowsPerSide; i++) {
    const win = new THREE.Mesh(windowGeom, windowMat);
    const offsetX = -width * 0.35 + windowSpacing * (i + 0.5);
    win.position.set(offsetX, windowY, depth * 0.451);
    win.rotation.y = Math.PI;
    group.add(win);
  }

  // Side windows for wider buildings
  if (fh >= 2) {
    const sideWindowCount = Math.max(1, fh - 1);
    const sideSpacing = (depth * 0.7) / sideWindowCount;
    for (let i = 0; i < sideWindowCount; i++) {
      // Left side
      const winL = new THREE.Mesh(windowGeom, windowMat);
      const offsetZ = -depth * 0.35 + sideSpacing * (i + 0.5);
      winL.position.set(-width * 0.451, windowY, offsetZ);
      winL.rotation.y = -Math.PI / 2;
      group.add(winL);

      // Right side
      const winR = new THREE.Mesh(windowGeom, windowMat);
      winR.position.set(width * 0.451, windowY, offsetZ);
      winR.rotation.y = Math.PI / 2;
      group.add(winR);
    }
  }
}

function addDoor(group, width, depth, height, doorMat, fw) {
  const doorWidth = Math.min(3, width * 0.15);
  const doorHeight = Math.min(4, height * 0.35);
  const doorGeomKey = `door_${doorWidth.toFixed(1)}_${doorHeight.toFixed(1)}`;
  const doorGeom = getOrCreateGeometry(doorGeomKey, () =>
    new THREE.PlaneGeometry(doorWidth, doorHeight)
  );

  const door = new THREE.Mesh(doorGeom, doorMat);
  door.position.set(0, doorHeight / 2, -depth * 0.451);
  group.add(door);
}

function addChimney(group, width, depth, height, chimneyMat, faction) {
  const chimneyWidth = 1.5;
  const chimneyHeight = faction === 'french' ? height * 0.5 : height * 0.35;
  const chimneyGeomKey = `chimney_${chimneyHeight.toFixed(1)}`;
  const chimneyGeom = getOrCreateGeometry(chimneyGeomKey, () =>
    new THREE.BoxGeometry(chimneyWidth, chimneyHeight, chimneyWidth)
  );

  const chimney = new THREE.Mesh(chimneyGeom, chimneyMat);
  chimney.position.set(
    width * 0.3,
    height + chimneyHeight / 2,
    -depth * 0.25
  );
  chimney.castShadow = true;
  chimney.receiveShadow = true;
  group.add(chimney);
}

function addHalfTimberBeams(group, width, depth, height, timberMat) {
  const beamThickness = 0.5;

  // Horizontal beams at 1/3 and 2/3 height
  for (let i = 1; i <= 2; i++) {
    const beamY = height * (i / 3);
    const hBeamGeomKey = `hbeam_${width.toFixed(0)}_${beamThickness}`;
    const hBeamGeom = getOrCreateGeometry(hBeamGeomKey, () =>
      new THREE.BoxGeometry(width * 0.92, beamThickness, beamThickness)
    );

    // Front beam
    const beamF = new THREE.Mesh(hBeamGeom, timberMat);
    beamF.position.set(0, beamY, -depth * 0.46);
    group.add(beamF);

    // Back beam
    const beamB = new THREE.Mesh(hBeamGeom, timberMat);
    beamB.position.set(0, beamY, depth * 0.46);
    group.add(beamB);
  }

  // Vertical corner beams
  const vBeamGeomKey = `vbeam_${height.toFixed(0)}`;
  const vBeamGeom = getOrCreateGeometry(vBeamGeomKey, () =>
    new THREE.BoxGeometry(beamThickness, height, beamThickness)
  );

  const corners = [
    [-width * 0.45, -depth * 0.45],
    [ width * 0.45, -depth * 0.45],
    [-width * 0.45,  depth * 0.45],
    [ width * 0.45,  depth * 0.45],
  ];

  for (const [cx, cz] of corners) {
    const beam = new THREE.Mesh(vBeamGeom, timberMat);
    beam.position.set(cx, height / 2, cz);
    group.add(beam);
  }
}

// --- Swiss faction enhancements: flower boxes, shutters, balcony railing ---

function addSwissEnhancements(group, width, depth, height, fw, fh) {
  const windowSize = Math.min(2.5, height * 0.2);
  const windowsPerSide = Math.max(1, fw);
  const windowSpacing = (width * 0.7) / windowsPerSide;
  const windowY = height * 0.6;

  // --- Flower boxes under front & back windows ---
  const flowerBoxGeomKey = `flowerBox_${windowSize.toFixed(1)}`;
  const flowerBoxGeom = getOrCreateGeometry(flowerBoxGeomKey, () =>
    new THREE.BoxGeometry(windowSize * 1.1, 0.6, 0.8)
  );
  const flowerColors = [0xcc3344, 0xff6699]; // red and pink

  for (let i = 0; i < windowsPerSide; i++) {
    const offsetX = -width * 0.35 + windowSpacing * (i + 0.5);
    const flowerColor = flowerColors[i % flowerColors.length];
    const flowerMat = getDetailMaterial(flowerColor);

    // Front flower box
    const fbFront = new THREE.Mesh(flowerBoxGeom, flowerMat);
    fbFront.position.set(offsetX, windowY - windowSize * 0.6, -depth * 0.451 + 0.4);
    group.add(fbFront);

    // Back flower box
    const fbBack = new THREE.Mesh(flowerBoxGeom, flowerMat);
    fbBack.position.set(offsetX, windowY - windowSize * 0.6, depth * 0.451 - 0.4);
    group.add(fbBack);
  }

  // --- Window shutters (thin brown boxes on either side of front windows) ---
  const shutterGeomKey = `shutter_${windowSize.toFixed(1)}`;
  const shutterGeom = getOrCreateGeometry(shutterGeomKey, () =>
    new THREE.BoxGeometry(windowSize * 0.25, windowSize * 1.1, 0.2)
  );
  const shutterMat = getDetailMaterial(0x5a3a1a);

  for (let i = 0; i < windowsPerSide; i++) {
    const offsetX = -width * 0.35 + windowSpacing * (i + 0.5);

    // Left shutter (front)
    const sL = new THREE.Mesh(shutterGeom, shutterMat);
    sL.position.set(offsetX - windowSize * 0.65, windowY, -depth * 0.455);
    group.add(sL);

    // Right shutter (front)
    const sR = new THREE.Mesh(shutterGeom, shutterMat);
    sR.position.set(offsetX + windowSize * 0.65, windowY, -depth * 0.455);
    group.add(sR);

    // Left shutter (back)
    const sLb = new THREE.Mesh(shutterGeom, shutterMat);
    sLb.position.set(offsetX - windowSize * 0.65, windowY, depth * 0.455);
    group.add(sLb);

    // Right shutter (back)
    const sRb = new THREE.Mesh(shutterGeom, shutterMat);
    sRb.position.set(offsetX + windowSize * 0.65, windowY, depth * 0.455);
    group.add(sRb);
  }

  // --- Balcony railing on front face ---
  const railHeight = 1.5;
  const railY = height * 0.35;
  const railMat = getDetailMaterial(0x5a3a1a);

  // Top rail (horizontal bar)
  const topRailGeomKey = `swissTopRail_${width.toFixed(0)}`;
  const topRailGeom = getOrCreateGeometry(topRailGeomKey, () =>
    new THREE.BoxGeometry(width * 0.7, 0.2, 0.2)
  );
  const topRail = new THREE.Mesh(topRailGeom, railMat);
  topRail.position.set(0, railY + railHeight, -depth * 0.46 - 1.0);
  group.add(topRail);

  // Bottom rail
  const bottomRail = new THREE.Mesh(topRailGeom, railMat);
  bottomRail.position.set(0, railY, -depth * 0.46 - 1.0);
  group.add(bottomRail);

  // Vertical posts for the railing
  const postGeomKey = `swissRailPost_${railHeight.toFixed(1)}`;
  const postGeom = getOrCreateGeometry(postGeomKey, () =>
    new THREE.BoxGeometry(0.2, railHeight, 0.2)
  );
  const postCount = Math.max(3, fw + 2);
  const postSpacing = (width * 0.7) / (postCount - 1);
  for (let i = 0; i < postCount; i++) {
    const px = -width * 0.35 + postSpacing * i;
    const post = new THREE.Mesh(postGeom, railMat);
    post.position.set(px, railY + railHeight / 2, -depth * 0.46 - 1.0);
    group.add(post);
  }

  // Balcony floor
  const balconyFloorGeomKey = `swissBalconyFloor_${width.toFixed(0)}`;
  const balconyFloorGeom = getOrCreateGeometry(balconyFloorGeomKey, () =>
    new THREE.BoxGeometry(width * 0.7, 0.15, 1.2)
  );
  const balconyFloor = new THREE.Mesh(balconyFloorGeom, railMat);
  balconyFloor.position.set(0, railY - 0.1, -depth * 0.46 - 0.5);
  group.add(balconyFloor);
}

// --- French faction enhancements: mansard caps, awnings, corner trim ---

function addFrenchEnhancements(group, width, depth, height, fw, fh, style) {
  const windowSize = Math.min(2.5, height * 0.2);
  const windowsPerSide = Math.max(1, fw);
  const windowSpacing = (width * 0.7) / windowsPerSide;
  const windowY = height * 0.6;

  // --- Mansard-style roof caps (decorative horizontal band at roof base) ---
  const mansardBandGeomKey = `mansardBand_${width.toFixed(0)}_${depth.toFixed(0)}`;
  const mansardBandGeom = getOrCreateGeometry(mansardBandGeomKey, () =>
    new THREE.BoxGeometry(width * 0.97, 1.0, depth * 0.97)
  );
  const mansardMat = getDetailMaterial(0x1a2a4a); // darker blue/slate trim
  const mansardBand = new THREE.Mesh(mansardBandGeom, mansardMat);
  mansardBand.position.set(0, height + 0.5, 0);
  group.add(mansardBand);

  // Secondary thinner band slightly above (decorative molding)
  const mansardMoldingGeomKey = `mansardMolding_${width.toFixed(0)}_${depth.toFixed(0)}`;
  const mansardMoldingGeom = getOrCreateGeometry(mansardMoldingGeomKey, () =>
    new THREE.BoxGeometry(width * 0.93, 0.4, depth * 0.93)
  );
  const moldingMat = getDetailMaterial(0xd8c8a8); // cream-colored trim
  const molding = new THREE.Mesh(mansardMoldingGeom, moldingMat);
  molding.position.set(0, height + 1.2, 0);
  group.add(molding);

  // --- Awnings over front windows (angled thin planes) ---
  const awningGeomKey = `awning_${windowSize.toFixed(1)}`;
  const awningGeom = getOrCreateGeometry(awningGeomKey, () =>
    new THREE.PlaneGeometry(windowSize * 1.3, windowSize * 0.6)
  );
  const awningMat = getDetailMaterial(0x884422); // dark canvas brown

  for (let i = 0; i < windowsPerSide; i++) {
    const offsetX = -width * 0.35 + windowSpacing * (i + 0.5);

    // Front awning
    const awF = new THREE.Mesh(awningGeom, awningMat);
    awF.position.set(offsetX, windowY + windowSize * 0.55, -depth * 0.46 - 0.3);
    awF.rotation.x = Math.PI * 0.2; // tilted outward
    group.add(awF);

    // Back awning
    const awB = new THREE.Mesh(awningGeom, awningMat);
    awB.position.set(offsetX, windowY + windowSize * 0.55, depth * 0.46 + 0.3);
    awB.rotation.x = -Math.PI * 0.2;
    awB.rotation.y = Math.PI;
    group.add(awB);
  }

  // --- Decorative corner trim (thin vertical boxes at building corners) ---
  const cornerTrimGeomKey = `frenchCornerTrim_${height.toFixed(0)}`;
  const cornerTrimGeom = getOrCreateGeometry(cornerTrimGeomKey, () =>
    new THREE.BoxGeometry(0.6, height * 1.02, 0.6)
  );
  const trimMat = getDetailMaterial(0xc0b090); // light stone trim

  const corners = [
    [-width * 0.45, -depth * 0.45],
    [ width * 0.45, -depth * 0.45],
    [-width * 0.45,  depth * 0.45],
    [ width * 0.45,  depth * 0.45],
  ];

  for (const [cx, cz] of corners) {
    const trim = new THREE.Mesh(cornerTrimGeom, trimMat);
    trim.position.set(cx, height / 2, cz);
    group.add(trim);
  }
}

// --- German faction enhancements: diagonal cross-beams, bench, iron trim ---

function addGermanEnhancements(group, width, depth, height, buildingType, timberMat) {
  // --- Diagonal cross-beams (X pattern) on front and back walls ---
  // Place X patterns between the horizontal beams (at 1/3 and 2/3 height)
  const sectionHeight = height / 3;
  const wallHalfWidth = width * 0.45;
  const diagonalLen = Math.sqrt(
    (wallHalfWidth * 2) * (wallHalfWidth * 2) + sectionHeight * sectionHeight
  ) * 0.5;
  const diagonalAngle = Math.atan2(sectionHeight, wallHalfWidth * 2);

  const crossBeamGeomKey = `germanCrossBeam_${diagonalLen.toFixed(1)}`;
  const crossBeamGeom = getOrCreateGeometry(crossBeamGeomKey, () =>
    new THREE.BoxGeometry(diagonalLen, 0.4, 0.4)
  );

  // Place X beams in the lower and middle third of the front & back faces
  for (let section = 0; section < 2; section++) {
    const sectionBaseY = height * (section / 3) + sectionHeight / 2;
    const faces = [-depth * 0.465, depth * 0.465]; // front and back

    for (const faceZ of faces) {
      // Diagonal going up-right (\)
      const beamA = new THREE.Mesh(crossBeamGeom, timberMat);
      beamA.position.set(0, sectionBaseY, faceZ);
      beamA.rotation.z = diagonalAngle;
      group.add(beamA);

      // Diagonal going up-left (/)
      const beamB = new THREE.Mesh(crossBeamGeom, timberMat);
      beamB.position.set(0, sectionBaseY, faceZ);
      beamB.rotation.z = -diagonalAngle;
      group.add(beamB);
    }
  }

  // --- Iron/dark trim elements at the top and bottom of walls ---
  const ironTrimGeomKey = `germanIronTrim_${width.toFixed(0)}`;
  const ironTrimGeom = getOrCreateGeometry(ironTrimGeomKey, () =>
    new THREE.BoxGeometry(width * 0.92, 0.35, 0.35)
  );
  const ironMat = getDetailMaterial(0x2a2a2a); // dark iron

  // Bottom iron trim (front and back)
  const ironBF = new THREE.Mesh(ironTrimGeom, ironMat);
  ironBF.position.set(0, 0.2, -depth * 0.46);
  group.add(ironBF);
  const ironBB = new THREE.Mesh(ironTrimGeom, ironMat);
  ironBB.position.set(0, 0.2, depth * 0.46);
  group.add(ironBB);

  // Top iron trim (front and back)
  const ironTF = new THREE.Mesh(ironTrimGeom, ironMat);
  ironTF.position.set(0, height - 0.2, -depth * 0.46);
  group.add(ironTF);
  const ironTB = new THREE.Mesh(ironTrimGeom, ironMat);
  ironTB.position.set(0, height - 0.2, depth * 0.46);
  group.add(ironTB);

  // Iron corner brackets (small dark cubes at the base of each corner)
  const bracketGeom = getOrCreateGeometry('germanIronBracket', () =>
    new THREE.BoxGeometry(0.8, 0.8, 0.8)
  );
  const bracketCorners = [
    [-width * 0.45, -depth * 0.45],
    [ width * 0.45, -depth * 0.45],
    [-width * 0.45,  depth * 0.45],
    [ width * 0.45,  depth * 0.45],
  ];
  for (const [bx, bz] of bracketCorners) {
    const bracket = new THREE.Mesh(bracketGeom, ironMat);
    bracket.position.set(bx, 0.4, bz);
    group.add(bracket);
  }

  // --- Biergarten bench for barracks and palace ---
  if (buildingType === BuildingType.BARRACKS || buildingType === BuildingType.PALACE) {
    const benchGeomKey = 'germanBench';
    const benchGeom = getOrCreateGeometry(benchGeomKey, () =>
      new THREE.BoxGeometry(3.5, 0.8, 1.2)
    );
    const benchMat = getDetailMaterial(0x6a4a2a); // brown wood
    const bench = new THREE.Mesh(benchGeom, benchMat);
    bench.position.set(width * 0.5 + 2.0, 0.4, 0);
    bench.receiveShadow = true;
    group.add(bench);
  }
}

function addFlag(group, width, depth, height, faction) {
  // Small flag on a pole at the top corner
  const poleHeight = 4;
  const poleGeomKey = 'flagPole';
  const poleGeom = getOrCreateGeometry(poleGeomKey, () =>
    new THREE.CylinderGeometry(0.15, 0.15, poleHeight, 4)
  );

  const factionColors = {
    swiss: 0xcc0000,
    french: 0x0055a4,
    german: 0xffcc00,
  };

  const poleMat = getDetailMaterial(0x666666);
  const pole = new THREE.Mesh(poleGeom, poleMat);
  pole.position.set(-width * 0.35, height + poleHeight / 2, -depth * 0.35);
  pole.castShadow = true;
  group.add(pole);

  const flagGeomKey = 'flag';
  const flagGeom = getOrCreateGeometry(flagGeomKey, () =>
    new THREE.PlaneGeometry(3, 2)
  );

  const flagColor = factionColors[faction] || 0xcc0000;
  const flagMat = getDetailMaterial(flagColor);
  const flag = new THREE.Mesh(flagGeom, flagMat);
  flag.position.set(-width * 0.35 + 1.5, height + poleHeight - 1, -depth * 0.35);
  flag.castShadow = true;
  group.add(flag);

  // Track for animation
  animatedFlags.push({ mesh: flag, phase: Math.random() * Math.PI * 2 });
}

// --- Type-specific detail meshes ---

function addTypeDetail(group, type, width, depth, height, fw, faction) {
  switch (type) {
    case BuildingType.POWER_PLANT:
      addPowerPlantDetail(group, height);
      break;
    case BuildingType.REFINERY:
      addRefineryDetail(group, width, depth, height);
      break;
    case BuildingType.BARRACKS:
      addBarracksDetail(group, height, depth);
      break;
    case BuildingType.RADAR:
      addRadarDetail(group, height);
      break;
    case BuildingType.TURRET:
      addTurretDetail(group, height);
      break;
    case BuildingType.ROCKET_TURRET:
      addRocketTurretDetail(group, height);
      break;
    case BuildingType.CONSTRUCTION_YARD:
      addConstructionYardDetail(group, height);
      break;
    case BuildingType.REPAIR_PAD:
      addRepairPadDetail(group, width, depth);
      break;
    case BuildingType.PALACE:
      addPalaceDetail(group, width, depth, height);
      break;
    case BuildingType.SILO:
      addSiloDetail(group, height);
      break;
    case BuildingType.STARPORT:
      addStarportDetail(group, width, depth);
      break;
    case BuildingType.HEAVY_FACTORY:
    case BuildingType.LIGHT_FACTORY:
      addFactoryDetail(group, width, depth, height);
      break;
    case BuildingType.LAB:
      addLabDetail(group, width, depth, height, faction);
      break;
  }
}

function addPowerPlantDetail(group, height) {
  // Yellow cylinder (lightning rod) on top
  const rodGeom = getOrCreateGeometry('powerRod', () =>
    new THREE.CylinderGeometry(0.5, 0.5, 6, 6)
  );
  const rod = new THREE.Mesh(rodGeom, getDetailMaterial(0xccaa00));
  rod.position.set(0, height + 3, 0);
  rod.castShadow = true;
  group.add(rod);

  // Small sphere on top
  const sphereGeom = getOrCreateGeometry('powerSphere', () =>
    new THREE.SphereGeometry(1, 8, 6)
  );
  const sphere = new THREE.Mesh(sphereGeom, getDetailMaterial(0xffdd00));
  sphere.position.set(0, height + 6.5, 0);
  sphere.castShadow = true;
  group.add(sphere);
}

function addRefineryDetail(group, width, depth, height) {
  // Brown cylinder (vat/tank) on top
  const vatGeom = getOrCreateGeometry('refineryVat', () =>
    new THREE.CylinderGeometry(4, 4, 5, 8)
  );
  const vat = new THREE.Mesh(vatGeom, getDetailMaterial(0x8b6914));
  vat.position.set(width * 0.15, height + 2.5, depth * 0.1);
  vat.castShadow = true;
  vat.receiveShadow = true;
  group.add(vat);
}

function addBarracksDetail(group, height, depth) {
  // Red cross/target marker on front wall
  const crossArmGeom = getOrCreateGeometry('barracksArm', () =>
    new THREE.BoxGeometry(4, 0.8, 0.2)
  );
  const crossUpGeom = getOrCreateGeometry('barracksUp', () =>
    new THREE.BoxGeometry(0.8, 4, 0.2)
  );
  const crossMat = getDetailMaterial(0xcc2222);

  const crossZ = -depth * 0.451 - 0.1;

  const armH = new THREE.Mesh(crossArmGeom, crossMat);
  armH.position.set(0, height * 0.75, crossZ);
  group.add(armH);

  const armV = new THREE.Mesh(crossUpGeom, crossMat);
  armV.position.set(0, height * 0.75, crossZ);
  group.add(armV);
}

function addRadarDetail(group, height) {
  // Gray cylinder with cone on top (dish)
  const baseGeom = getOrCreateGeometry('radarBase', () =>
    new THREE.CylinderGeometry(1, 1, 4, 8)
  );
  const base = new THREE.Mesh(baseGeom, getDetailMaterial(0x777777));
  base.position.set(0, height + 2, 0);
  base.castShadow = true;
  group.add(base);

  const dishGeom = getOrCreateGeometry('radarDish', () =>
    new THREE.ConeGeometry(3, 2, 8)
  );
  const dish = new THREE.Mesh(dishGeom, getDetailMaterial(0xaaaaaa));
  dish.position.set(0, height + 5, 0);
  dish.rotation.x = -Math.PI / 6;
  dish.castShadow = true;
  group.add(dish);
}

function addTurretDetail(group, height) {
  // Short cylinder base + long barrel (horizontal cylinder)
  const turretBaseGeom = getOrCreateGeometry('turretBase', () =>
    new THREE.CylinderGeometry(2.5, 3, 3, 8)
  );
  const turretBase = new THREE.Mesh(turretBaseGeom, getDetailMaterial(0x555555));
  turretBase.position.set(0, height + 1.5, 0);
  turretBase.castShadow = true;
  group.add(turretBase);

  const barrelGeom = getOrCreateGeometry('turretBarrel', () =>
    new THREE.CylinderGeometry(0.6, 0.6, 8, 6)
  );
  const barrel = new THREE.Mesh(barrelGeom, getDetailMaterial(0x444444));
  barrel.position.set(0, height + 2.5, -5);
  barrel.rotation.x = Math.PI / 2;
  barrel.castShadow = true;
  group.add(barrel);
}

function addRocketTurretDetail(group, height) {
  // Multiple small cylinders (tubes)
  const tubeGeom = getOrCreateGeometry('rocketTube', () =>
    new THREE.CylinderGeometry(0.4, 0.4, 5, 6)
  );
  const tubeMat = getDetailMaterial(0x555555);

  const offsets = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
  ];

  for (const [ox, oz] of offsets) {
    const tube = new THREE.Mesh(tubeGeom, tubeMat);
    tube.position.set(ox, height + 2.5, oz - 2);
    tube.rotation.x = Math.PI / 2;
    tube.castShadow = true;
    group.add(tube);
  }
}

function addConstructionYardDetail(group, height) {
  // Gear shape (use torus)
  const torusGeom = getOrCreateGeometry('cyGear', () =>
    new THREE.TorusGeometry(4, 1, 8, 12)
  );
  const gear = new THREE.Mesh(torusGeom, getDetailMaterial(0x888833));
  gear.position.set(0, height + 5, 0);
  gear.rotation.x = Math.PI / 2;
  gear.castShadow = true;
  group.add(gear);
}

function addRepairPadDetail(group, width, depth) {
  // Flat top with cross marking
  const padGeom = getOrCreateGeometry(`repairPad_${width}_${depth}`, () =>
    new THREE.BoxGeometry(width * 0.8, 0.3, depth * 0.8)
  );
  const pad = new THREE.Mesh(padGeom, getDetailMaterial(0x555555));
  pad.position.set(0, 0.3, 0);
  pad.receiveShadow = true;
  group.add(pad);

  // Cross on the pad
  const crossW = Math.min(width, depth) * 0.5;
  const crossArmGeom = getOrCreateGeometry(`repairCrossH_${crossW}`, () =>
    new THREE.BoxGeometry(crossW, 0.2, crossW * 0.2)
  );
  const crossUpGeom = getOrCreateGeometry(`repairCrossV_${crossW}`, () =>
    new THREE.BoxGeometry(crossW * 0.2, 0.2, crossW)
  );
  const crossMat = getDetailMaterial(0x44cc44);

  const armH = new THREE.Mesh(crossArmGeom, crossMat);
  armH.position.set(0, 0.5, 0);
  group.add(armH);

  const armV = new THREE.Mesh(crossUpGeom, crossMat);
  armV.position.set(0, 0.5, 0);
  group.add(armV);
}

function addPalaceDetail(group, width, depth, height) {
  // Taller central tower
  const towerGeom = getOrCreateGeometry(`palaceTower_${width}_${depth}_${height}`, () =>
    new THREE.BoxGeometry(width * 0.3, height * 0.6, depth * 0.3)
  );
  const tower = new THREE.Mesh(towerGeom, getDetailMaterial(0x999988));
  tower.position.set(0, height + height * 0.3, 0);
  tower.castShadow = true;
  tower.receiveShadow = true;
  group.add(tower);

  // Spire on top
  const spireGeom = getOrCreateGeometry('palaceSpire', () =>
    new THREE.ConeGeometry(3, 6, 6)
  );
  const spire = new THREE.Mesh(spireGeom, getDetailMaterial(0xccaa33));
  spire.position.set(0, height + height * 0.6 + 3, 0);
  spire.castShadow = true;
  group.add(spire);
}

function addSiloDetail(group, height) {
  // Small vertical cylinder
  const siloGeom = getOrCreateGeometry('siloTank', () =>
    new THREE.CylinderGeometry(2, 2, 6, 8)
  );
  const silo = new THREE.Mesh(siloGeom, getDetailMaterial(0xaaaa66));
  silo.position.set(0, height + 3, 0);
  silo.castShadow = true;
  group.add(silo);

  // Dome cap
  const domeGeom = getOrCreateGeometry('siloDome', () =>
    new THREE.SphereGeometry(2, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2)
  );
  const dome = new THREE.Mesh(domeGeom, getDetailMaterial(0xaaaa66));
  dome.position.set(0, height + 6, 0);
  dome.castShadow = true;
  group.add(dome);
}

function addStarportDetail(group, width, depth) {
  // Flat landing pad with edge markers
  const padGeom = getOrCreateGeometry(`starportPad_${width}_${depth}`, () =>
    new THREE.BoxGeometry(width * 0.7, 0.4, depth * 0.7)
  );
  const pad = new THREE.Mesh(padGeom, getDetailMaterial(0x666666));
  pad.position.set(0, 0.4, 0);
  pad.receiveShadow = true;
  group.add(pad);

  // Corner markers
  const markerGeom = getOrCreateGeometry('starportMarker', () =>
    new THREE.BoxGeometry(1.5, 2, 1.5)
  );
  const markerMat = getDetailMaterial(0xffaa00);
  const mw = width * 0.3;
  const md = depth * 0.3;
  const markerPositions = [
    [-mw, 1, -md], [mw, 1, -md],
    [-mw, 1,  md], [mw, 1,  md],
  ];
  for (const [mx, my, mz] of markerPositions) {
    const marker = new THREE.Mesh(markerGeom, markerMat);
    marker.position.set(mx, my, mz);
    marker.castShadow = true;
    group.add(marker);
  }
}

function addFactoryDetail(group, width, depth, height) {
  // Smokestack cylinder
  const stackGeom = getOrCreateGeometry('factoryStack', () =>
    new THREE.CylinderGeometry(1.5, 2, 8, 8)
  );
  const stack = new THREE.Mesh(stackGeom, getDetailMaterial(0x555555));
  stack.position.set(-width * 0.25, height + 4, depth * 0.2);
  stack.castShadow = true;
  group.add(stack);

  // Second smaller stack
  const stack2Geom = getOrCreateGeometry('factoryStack2', () =>
    new THREE.CylinderGeometry(1, 1.5, 6, 8)
  );
  const stack2 = new THREE.Mesh(stack2Geom, getDetailMaterial(0x555555));
  stack2.position.set(-width * 0.15, height + 3, -depth * 0.15);
  stack2.castShadow = true;
  group.add(stack2);
}

function addLabDetail(group, width, depth, height, faction) {
  const style = FACTION_STYLES[faction] || FACTION_STYLES.swiss;

  // --- Dome / hemisphere on top of the building ---
  const domeRadius = Math.min(width, depth) * 0.3;
  const domeGeomKey = `labDome_${domeRadius.toFixed(1)}`;
  const domeGeom = getOrCreateGeometry(domeGeomKey, () =>
    new THREE.SphereGeometry(domeRadius, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2)
  );
  const domeMat = new THREE.MeshStandardMaterial({
    color: style.windowColor,
    roughness: 0.3,
    metalness: 0.2,
    transparent: true,
    opacity: 0.85,
  });
  const dome = new THREE.Mesh(domeGeom, domeMat);
  dome.position.set(0, height, 0);
  dome.castShadow = true;
  dome.receiveShadow = true;
  group.add(dome);

  // --- Emissive research orb floating above the dome ---
  const orbRadius = domeRadius * 0.3;
  const orbGeomKey = `labOrb_${orbRadius.toFixed(1)}`;
  const orbGeom = getOrCreateGeometry(orbGeomKey, () =>
    new THREE.SphereGeometry(orbRadius, 12, 10)
  );
  const orbMat = new THREE.MeshStandardMaterial({
    color: 0x66ffcc,
    emissive: 0x66ffcc,
    emissiveIntensity: 0.8,
    roughness: 0.1,
    metalness: 0.3,
  });
  const orb = new THREE.Mesh(orbGeom, orbMat);
  orb.position.set(0, height + domeRadius + orbRadius * 2, 0);
  group.add(orb);
}

// --- Fog visibility check ---

function isBuildingVisible(building) {
  const [fw, fh] = building.footprint;
  for (let dy = 0; dy < fh; dy++) {
    for (let dx = 0; dx < fw; dx++) {
      const state = getFogState(building.tileX + dx, building.tileY + dy);
      if (state === FogState.VISIBLE || state === FogState.REVEALED) {
        return true;
      }
    }
  }
  return false;
}

// --- Public API ---

export function init(scene) {
  sceneRef = scene;
}

export function sync(dt) {
  if (!sceneRef) return;

  const buildings = getBuildings();

  // Track which building IDs are currently alive
  const aliveIds = new Set();

  for (const building of buildings) {
    if (!building.alive) continue;
    aliveIds.add(building.id);

    // Create mesh for new buildings
    if (!buildingMeshes.has(building.id)) {
      const mesh = createBuildingMesh(building);
      sceneRef.add(mesh);
      buildingMeshes.set(building.id, mesh);
    }

    // Update visibility based on fog
    const mesh = buildingMeshes.get(building.id);
    if (mesh) {
      mesh.visible = isBuildingVisible(building);
    }
  }

  // Remove meshes for dead/missing buildings
  const toRemove = [];
  for (const [id, mesh] of buildingMeshes) {
    if (!aliveIds.has(id)) {
      toRemove.push(id);
    }
  }
  for (const id of toRemove) {
    const mesh = buildingMeshes.get(id);
    sceneRef.remove(mesh);
    buildingMeshes.delete(id);
    // Clean up animated flags associated with this building
    for (let i = animatedFlags.length - 1; i >= 0; i--) {
      if (isChildOf(animatedFlags[i].mesh, mesh)) {
        animatedFlags.splice(i, 1);
      }
    }
  }

  // Animate flags
  const time = performance.now() * 0.001;
  for (const flagObj of animatedFlags) {
    const flag = flagObj.mesh;
    // Wave effect using sine
    flag.rotation.y = Math.sin(time * 3 + flagObj.phase) * 0.3;
    flag.rotation.z = Math.sin(time * 2 + flagObj.phase + 1) * 0.1;
  }
}

/**
 * Check if a mesh is a descendant of a given parent group.
 */
function isChildOf(mesh, parent) {
  let current = mesh.parent;
  while (current) {
    if (current === parent) return true;
    current = current.parent;
  }
  return false;
}
